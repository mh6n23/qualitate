import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {Prisma} from "@prisma/client";

export async function PATCH(
    req: Request,
    context: {params: Promise<{id: string}>}
) {
    const {id} = await context.params;
    const codeID = parseInt(id);
    const body = await req.json();

    if (Number.isNaN(codeID)) {
        return NextResponse.json(
            {error: "CodeID not valid"},
            {status: 400}
        );
    }

    if (!body.name.trim()) {
        return NextResponse.json(
            {error: "No code name provided"},
            {status: 400}
        );
    }

    const code = await prisma.code.findUnique({
        where: {id: codeID}
    });

    if (!code) {
        return NextResponse.json(
            {error: "Couldn't find code"},
            {status: 404}
        );
    }

    try {
        const updatedCode = await prisma.code.update({
            where: {id: codeID},
            data: {
                name: body.name.trim(),
                description: body.description?.trim() || null
            },
            include: {
                annotations: {
                    include: {
                        transcriptFile: true
                    },
                    orderBy: {startTime: "asc"}
                }
            }
        });

        return NextResponse.json(updatedCode);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code == "P2002") {
            return NextResponse.json({error: "Code name already in use"}, {status: 400});
        }

        console.error(error);

        return NextResponse.json({error: "Code update failed"}, {status: 500});


    }
}
