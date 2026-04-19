import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {Prisma} from "@prisma/client";

export async function GET (req: Request, context: {params: Promise<{id: string}>}) {
    const {id} = await context.params;
    const projectID = parseInt(id);

    if (Number.isNaN(projectID)) {
        return NextResponse.json(
            {error: "ProjectID is invalid"},
            {status: 400}
        );
    }

    const events = await prisma.event.findMany({
        where: {projectID},
        orderBy: {name: "asc"}
    });

    return NextResponse.json(events);
}

export async function POST (req: Request, context: {params: Promise<{id: string}>}) {
    const {id} = await context.params;
    const projectID = parseInt(id);
    const body = await req.json();

    if (Number.isNaN(projectID)) {
        return NextResponse.json(
            {error: "ProjectID is invalid"},
            {status: 400}
        );
    }

    if (!body.name?.trim()) {
        return NextResponse.json(
            {error: "Name is required"},
            {status: 400}
        );
    }

    const project = await prisma.project.findUnique({
        where: {id: projectID}
    })

    if (!project) {
        return NextResponse.json(
            {error: "Project couldn't be found"},
            {status: 404}
        );
    }

    try {
        const event = await prisma.event.create({
            data: {
                name: body.name.trim(),
                projectID
            }
        });

        return NextResponse.json(event, {status: 201});
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return NextResponse.json(
                {error: "Event name already in use"},
                {status: 400}
            );
        }

        console.error(error);

        return NextResponse.json(
            {error: "Error creating event"},
            {status: 500}
        );
    }
}