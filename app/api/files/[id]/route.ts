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

    try {
        const relPath = file.filePath.startsWith("/") ?
            file.filePath.slice(1)
            : file.filePath;
        const absPath = join(process.cwd(), "public", relPath);

        await prisma.mediaFile.delete({
            where: {id: fileID}
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
    const newTime = new Date(body.creationTime);

    if (Number.isNaN(fileID)) {
        return NextResponse.json(
            {error: "File ID wasn't a number"},
            {status: 400}
        );
    }

    if (!body.creationTime) {
        return NextResponse.json(
            {error: "No creation time for patch"},
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

    const updatedFile = await prisma.mediaFile.update({
        where: {id: fileID},
        data: {
            creationTime: newTime
        }
    });

    return NextResponse.json(updatedFile);


}