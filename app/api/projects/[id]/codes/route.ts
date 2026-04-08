import {NextResponse} from "next/server";
import {prisma} from '@/lib/prisma';
import {Prisma} from '@prisma/client'

// Take in the projectID
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    const {id} = await context.params;
    const projectID = parseInt(id);

    const codes = await prisma.code.findMany({
        where: {projectID},
        orderBy: {name: "asc"},
        include: {
            _count: {
                select: {annotations: true}
            }
        }
    });

    return NextResponse.json(codes);
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    const {id} = await context.params;
    const projectID = parseInt(id);
    const body = await request.json();

    if (!body.name) {
        return NextResponse.json(
            {error: "Code name missing"},
            {status: 400}
        );
    } else if (!body.colour) {
        return NextResponse.json(
            {error: "Code colour missing"},
            {status: 400}
        );
    }

    const project = await prisma.project.findUnique({
        where: {id: projectID}
    });

    if (!project) {
        return NextResponse.json(
            {error: "Couldn't find project to add code to"},
            {status: 404}
        );
    }

    try {
        const code = await prisma.code.create({
            data: {
                name: body.name,
                description: body.description || null,
                colour: body.colour,
                projectID
            }
        })
        return NextResponse.json(code, {status: 201})

    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
            //P2002 checks for a problem with a non-unique code name
        ) {
            return NextResponse.json({
                    error: "A code already exists with this name"
                },
                {status: 400}
            );
        }

        return NextResponse.json({
                error: "Problem creating code"
            },
            {status: 500}
        );

    }


}