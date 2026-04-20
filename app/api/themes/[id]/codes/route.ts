import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {Prisma} from "@prisma/client";

export async function GET(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    const {id} = await context.params;
    const themeID = parseInt(id);

    if (Number.isNaN(themeID)) {
        return NextResponse.json(
            {error: "Invalid theme ID"},
            {status: 400}
        );
    }

    try {
        const theme = await prisma.theme.findUnique({
            where: {id: themeID},
            include: {
                codeLinks: {
                    include: {
                        code: {
                            include: {
                                annotations: {
                                    include: {
                                        transcriptFile: true,
                                        event: true,
                                        group: true
                                    },
                                    orderBy: {startTime: "asc"}
                                }
                            }
                        }
                    },
                    orderBy: {
                        code: {
                            name: "asc"
                        }
                    }
                }
            }
        });

        if (!theme) {
            return NextResponse.json(
                {error: "Theme not found"},
                {status: 404}
            );
        }

        const codes = theme.codeLinks.map((link) => link.code);
        return NextResponse.json(codes);
    }
    catch (error)
    {
        console.error(error);
        return NextResponse.json(
            {error: "Failed to GET theme codes"},
            {status: 500}
        );
    }
}

export async function POST(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    const {id} = await context.params;
    const themeID = parseInt(id);
    const body = await req.json();

    if (Number.isNaN(themeID)) {
        return NextResponse.json(
            {error: "Invalid theme ID"},
            {status: 400}
        );
    }

    if (body.codeID == null) {
        return NextResponse.json(
            {error: "Missing CodeID"},
            {status: 400}
        );
    }

    const theme = await prisma.theme.findUnique({
        where: {id: themeID}
    });

    if (!theme) {
        return NextResponse.json(
            {error: "Couldn't find theme"},
            {status: 404}
        );
    }

    const code = await prisma.code.findFirst({
        where: {
            id: body.codeID,
            projectID: theme.projectID
        }
    });

    if (!code) {
        return NextResponse.json(
            {error: "Code not in project"},
            {status: 400}
        );
    }

    try {
        const link = await prisma.themeCode.create({
            data: {
                themeID,
                codeID: body.codeID
            }
        });

        return NextResponse.json(link, {status: 201})
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return NextResponse.json(
                {error: "Code already in theme", status: 400},
                {status: 400}
            );
        }

        console.error(error);
        return NextResponse.json(
            {error: "Couldn't POST code to theme"},
            {status: 500}
        );
    }

}

export async function DELETE(
    req: Request,
    context: { params: Promise<{ id: string }> }) {
        const{id} = await context.params;
        const themeID = parseInt(id);
        const body = await req.json();

        if (Number.isNaN(themeID)) {
            return NextResponse.json(
                {error: "Invalid theme ID"},
                {status: 400}
            );
        }

        if (body.codeID == null) {
            return NextResponse.json({error: "No CodeID provided"}, {status: 400});
        }

        const link = await prisma.themeCode.findFirst({
            where: {
                themeID,
                codeID: body.codeID
            }
        });

        if (!link) {
            return NextResponse.json({error: "Code isn't linked to theme"}, {status: 404});
        }

        await prisma.themeCode.delete({
            where: {id: link.id}
        });

        return NextResponse.json({success: true});
}
