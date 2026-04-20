import {NextResponse} from 'next/server';
import {prisma} from "@/lib/prisma";
import {unlink} from "fs/promises";
import {join} from "path";

export async function DELETE(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    const {id} = await context.params;
    const fileID = parseInt(id);

    if (Number.isNaN(fileID)) {
        return NextResponse.json(
            {error: "File ID wasn't a number"},
            {status: 400}
        );
    }

    const file = await prisma.mediaFile.findUnique({
        where: {id: fileID}
    });

    if (!file) {
        return NextResponse.json(
            {error: "Couldn't locate file"},
            {status: 404}
        );
    }

    const annotationCount = await prisma.annotation.count({
        where: {
            transcriptFileID: fileID
        }
    });

    if (annotationCount > 0) {
        return NextResponse.json(
            {error: "Can't delete transcript as it has assigned annotations"},
            {status: 400}
        );
    }

    try {
        const relPath = file.filePath.startsWith("/") ?
            file.filePath.slice(1)
            : file.filePath;
        const absPath = join(process.cwd(), "public", relPath);

        await prisma.$transaction(async (tx) => {
            await tx.annotationMediaLink.deleteMany({
                where: {
                    mediaFileID: fileID
                }
            });

            await tx.mediaFile.delete({
                where: {id: fileID}
            });
        });

        try {
            await unlink(absPath);
        } catch (error) {
            console.error("Couldn't delete file locally", error);
        }

        return NextResponse.json({success: true});

    } catch (error) {
        console.error(error);
        return NextResponse.json(
            {error: "Couldn't delete file"},
            {status: 500}
        );
    }

}

export async function PATCH(
    req: Request,
    context: {params: Promise<{ id: string }> }
) {
    const {id} = await context.params;
    const fileID = parseInt(id);
    const body = await req.json();

    if (Number.isNaN(fileID)) {
        return NextResponse.json(
            {error: "File ID wasn't a number"},
            {status: 400}
        );
    }

    const file = await prisma.mediaFile.findUnique({
        where: {id: fileID}
    });

    if (!file) {
        return NextResponse.json(
            {error: "Couldn't find file"},
            {status: 404}
        );
    }

    const updateData: {
        creationTime?: Date;
        duration?: number;
        eventID?: number;
        groupID?: number;
    } = {};

    if (body.creationTime != null) {
        const newTime = new Date(body.creationTime);

        if (Number.isNaN(newTime.getTime())) {
            return NextResponse.json(
                {error: "Creation time invalid"},
                {status: 400}
            );
        }

        updateData.creationTime = newTime;
    }

    if (body.duration != null) {
        const parsedDuration = Number(body.duration);

        if (Number.isNaN(parsedDuration) || parsedDuration < 0) {
            return NextResponse.json(
                {error: "Duration invalid"},
                {status: 400}
            );
        }

        updateData.duration = parsedDuration;
    }

    if (body.eventID != null) {
        const event = await prisma.event.findFirst({
            where: {
                id: body.eventID,
                projectID: file.projectID
            }
        });

        if (!event) {
            return NextResponse.json(
                {error: "Couldn't find event in project"},
                {status: 400}
            );
        }

        updateData.eventID = body.eventID;
    }

    if (body.groupID != null) {
        const group = await prisma.group.findFirst({
            where: {
                id: body.groupID,
                projectID: file.projectID
            }
        });

        if (!group) {
            return NextResponse.json(
                {error: "Couldn't find group in project"},
                {status: 400}
            );
        }

        updateData.groupID = body.groupID;
    }

    if (Object.keys(updateData).length === 0) {
        return NextResponse.json(
            {error: "No updates were provided for file"},
            {status: 400}
        );
    }

    const updatedFile = await prisma.mediaFile.update({
        where: {id: fileID},
        data: updateData
    });

    return NextResponse.json(updatedFile);
}