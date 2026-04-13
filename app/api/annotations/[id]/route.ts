import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";

export async function PATCH(
    req: Request,
    context: {params: Promise<{id: string}>}
) {
    const {id} = await context.params;
    const annotationID = parseInt(id);
    const body = await req.json();

    if (Number.isNaN(annotationID)) {
        return NextResponse.json(
                {error: "Invalid annotation ID"},
                {status: 400}
        );
    }

    if (body.codeID == null) {
        return NextResponse.json(
            {error: "No code provided"},
            {status: 400}
        );
    }

    const existingAnnotation = await prisma.annotation.findUnique({
        where: {id: annotationID},
        include: {
            mediaLinks: true
        }
    });

    if (!existingAnnotation) {
        return NextResponse.json(
            {error: "Couldn't find annotation"},
            {status: 404}
        );
    }

    const code = await prisma.code.findFirst({
        where: {
            id: body.codeID,
            projectID: existingAnnotation.projectID
        }
    });

    if (!code) {
        return NextResponse.json(
            {error: "Couldn't find code in project"},
            {status: 400}
        );
    }

    const linkedMediaFileIDs = Array.isArray(body.linkedMediaFileIDs) ? body.linkedMediaFileIDs : [];

    const linkedFiles = await prisma.mediaFile.findMany({
        where: {
            id: {in: linkedMediaFileIDs},
            projectID: existingAnnotation.projectID
        }
    });

    if (linkedFiles.length !== linkedMediaFileIDs.length) {
        return NextResponse.json(
            {error: "A linked file couldn't be found in the project"},
            {status: 400}
        );
    }

    const updatedAnnotation = await prisma.annotation.update({
        where: {id: annotationID},
        data: {
            codeID: body.codeID,
            mediaLinks: {
                deleteMany: {},
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

    return NextResponse.json(updatedAnnotation);
}

export async function DELETE(
    req: Request,
    context: {params: Promise<{id: string}>}
) {
    const {id} = await context.params;
    const annotationID = parseInt(id);

    if (Number.isNaN(annotationID)) {
        return NextResponse.json(
            {error: "Invalid annotation ID"},
            {status: 400}
        );
    }

    const existingAnnotation = await prisma.annotation.findUnique({
        where: {id: annotationID},
    });

    if (!existingAnnotation) {
        return NextResponse.json(
            {error: "Couldn't find annotation"},
            {status: 404}
        );
    }

    await prisma.annotationMediaLink.deleteMany({
        where: {annotationID}
    });

    await prisma.annotation.delete({
        where: {id: annotationID}
    });

    return NextResponse.json({success: true});
}