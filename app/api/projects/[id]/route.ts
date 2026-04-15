import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {rm} from "fs/promises";
import {join} from "path";

export async function PATCH(
    request: Request,
    context: {params: Promise<{id: string}>}
) {
    const {id} = await context.params;
    const projectID = parseInt(id);
    const body = await request.json();

    if (Number.isNaN(projectID)) {
        return NextResponse.json(
            {error: "Project ID is invalid"},
            {status: 400}
        );
    }

    if (!body.name?.trim()) {
        return NextResponse.json(
            {error: "Project name is missing"},
            {status: 404}
        );
    }

    const project = await prisma.project.findUnique({
        where: {id: projectID}
    });

    if (!project) {
        return NextResponse.json(
            {error: "Project couldn't be found"},
            {status: 404}
        );
    }

    const editedProject = await prisma.project.update({
        where: {id: projectID},
        data: {
            name: body.name.trim(),
            description: body.description?.trim() || ""
        }
    });

    return NextResponse.json(editedProject);
}

export async function DELETE(request: Request, context: {params: Promise<{id: string}>}) {
    const {id} = await context.params;
    const projectID = parseInt(id);

    if (Number.isNaN(projectID)) {
        return NextResponse.json(
            {error: "Project ID is invalid"},
            {status: 400}
        );
    }

    const project = await prisma.project.findUnique({
        where: {id: projectID},
        include: {
            files: true,
            annotations: true,
            themes: true,
            codes: true
        }
    });

    if (!project) {
        return NextResponse.json(
            {error: "Project couldn't be found"},
            {status: 404}
        );
    }

    const fileIDs = project.files.map((file) => file.id);
    const annotationIDs = project.annotations.map((annotation) => annotation.id);
    const themeIDs = project.themes.map((theme) => theme.id);
    const codeIDs = project.codes.map((code) => code.id);

    await prisma.$transaction(async (tx) => {
        if (annotationIDs.length > 0) {
            await tx.annotationMediaLink.deleteMany({
                where: {
                    annotationID: {in: annotationIDs}
                }
            })
        }

        if (fileIDs.length > 0) {
            await tx.annotationMediaLink.deleteMany({
                where: {
                    mediaFileID: {in: fileIDs}
                }
            });
        }

        if (themeIDs.length > 0) {
            await tx.themeCode.deleteMany({
                where: {
                    themeID: {in: themeIDs}
                }
            });
        }

        if (codeIDs.length > 0) {
            await tx.themeCode.deleteMany({
                where: {
                    codeID: {in: codeIDs}
                }
            });
        }

        await tx.annotation.deleteMany({
            where: {projectID: projectID}
        });

        await tx.theme.deleteMany({
            where: {projectID: projectID}
        });

        await tx.code.deleteMany({
            where: {projectID: projectID}
        });

        await tx.mediaFile.deleteMany({
            where: {projectID: projectID}
        });

        await tx.project.delete({
            where: {id: projectID}
        });
    });

    const projectFolder = join(
        process.cwd(),
        "public",
        "uploads",
        `project-${projectID}`
    );

    try {
        await rm(projectFolder, {recursive: true, force: true});
    } catch (error) {
        console.error("Couldn't remove project folder", error);
    }

    return NextResponse.json({success: true});
}