import {NextResponse} from "next/server";
import {prisma} from '@/lib/prisma';

export async function GET(request: Request, context: {params: Promise<{id: string}>})
{
    const {id} = await context.params;
    const projectID = parseInt(id);

    const annotations = await prisma.annotation.findMany({
        where: {projectID},
        include: {
            code: true,
            transcriptFile: true,
            mediaLinks: {
                include: {
                    mediaFile: true
                }
            }
        },
        orderBy: {startTime: "asc"}
    });

    return NextResponse.json(annotations);
}

export async function POST(request: Request, context: {params: Promise<{id: string}>})
{
    const {id} = await context.params;
    const projectID = parseInt(id);
    const body = await request.json();

    if (body.codeID == null) {
        return NextResponse.json(
            {error: "Couldn't find code to assign to annotation"},
            {status: 404}
        );
    }
    else if (body.startTime == null || body.endTime == null) {
        return NextResponse.json(
            {error: "Couldn't find times to assign to annotation"},
            {status: 404}
        )
    }

    if (body.startTime > body.endTime) {
        return NextResponse.json(
            {error: "End Time can't be before Start Time"},
            {status: 400}
        )
    }

    const code = await prisma.code.findFirst({
        where: {
            id: body.codeID,
            projectID
        }
    });

    if (!code) {
        return NextResponse.json(
            {error: "Couldn't find the code for the annotation within the project"},
            {status: 400}
        )
    }

    const linkedFiles = Array.isArray(body.linkedMediaFileIDs)
    ? await prisma.mediaFile.findMany({
            where: {
                id: {in: body.linkedMediaFileIDs},
                projectID
            }
        })
        : [];

    if (linkedFiles.length !== (body.linkedMediaFileIDs?.length ?? 0))
    {
        return NextResponse.json(
            {error: "A file associated with the annotation couldn't be found"},
            {status: 400}
        )
    }

    let transcriptFile = null;

    if (body.transcriptFileID != null) {
        transcriptFile = await prisma.mediaFile.findFirst({
            where: {
                id: body.transcriptFileID,
                projectID
            }
        });

        if (!transcriptFile) {
            return NextResponse.json(
                {error: "The transcript file being annotated couldn't be found"},
                {status: 400}
            )
        }
    }

    const annotation = await prisma.annotation.create({
        data: {
            projectID,
            codeID: body.codeID,
            startTime: body.startTime,
            endTime: body.endTime,
            transcriptFileID: body.transcriptFileID ?? null,
            transcriptStartLine: body.transcriptStartLine ?? null,
            transcriptEndLine: body.transcriptEndLine ?? null,
            selectedText: body.selectedText || null,
            mediaLinks: {
                create: linkedFiles.map((file) => ({
                    mediaFileID: file.id
                }))
            }
        },
        include: {
            code: true,
            transcriptFile: true,
            mediaLinks: {
                include: {
                    mediaFile: true
                }
            }
        }
    });

    return NextResponse.json(annotation, {status: 201});
}

