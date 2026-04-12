import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {Prisma} from "@prisma/client";

export async function GET(
    req: Request,
    context: {params: Promise<{id: string}>}
) {
    const {id} = await context.params;
    const projectID = parseInt(id);

    if (Number.isNaN(projectID)) {
        return NextResponse.json(
            {error: "Invalid Project ID"},
            {status: 400}
        );
    }

    try {
        const themes = await prisma.theme.findMany({
            where: {projectID},
            orderBy: {name: "asc"},
            include: {
                _count: {
                    select: {codeLinks: true}
                }
            }
        });

        return NextResponse.json(themes);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            {error: "Couldn't GET themes"},
            {status: 500}
        );
    }
}

export async function POST(
    req: Request,
    context: {params: Promise<{id: string}>}
) {
    const {id} = await context.params;
    const projectID = parseInt(id);
    const body = await req.json();

    if (Number.isNaN(projectID)) {
        return NextResponse.json(
            {error: "Invalid Project ID"},
            {status: 400}
        );
    }

    if (!body.name.trim()) {
        return NextResponse.json(
            {error: "No Theme Name"},
            {status: 400}
        );
    }

    const project = await prisma.project.findUnique({
        where: {id: projectID}
    });

    if (!project) {
        return NextResponse.json(
            {error: "Project missing"},
            {status: 404}
        )
    }

    try {
        const theme = await prisma.theme.create({
            data: {
                name: body.name.trim(),
                description: body.description?.trim() || null,
                projectID
            }
        });

        return NextResponse.json(theme, {status: 201});
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return NextResponse.json(
                {error: "Theme name already exists", status: 400},
                {status: 400}
            );
        }

        console.error(error);
        return NextResponse.json(
            {error: "Couldn't POST theme"},
            {status: 500}
        );
    }
}
