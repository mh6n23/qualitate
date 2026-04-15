import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {Prisma} from "@prisma/client";

export async function PATCH(
    req: Request,
    context: {params: Promise<{id: string}>}
) {
    const {id} = await context.params;
    const themeID = parseInt(id);
    const body = await req.json();

    if (Number.isNaN(themeID)) {
        return NextResponse.json(
            {error: "ThemeID is invalid"},
            {status: 400}
        );
    }

    if (!body.name?.trim()) {
        return NextResponse.json(
            {error: "No theme name provided"},
            {status: 400}
        );
    }

    const theme = await prisma.theme.findUnique({where: {id: themeID}});

    if (!theme) {
        return NextResponse.json(
            {error: "Couldn't locate theme"},
            {status: 404}
        );
    }

    try {
        const updatedTheme = await prisma.theme.update({
            where: {id: themeID},
            data: {
                name: body.name.trim(),
                description: body.description?.trim() || null
            },
            include: {
                _count: {
                    select: {codeLinks: true}
                }
            }
        });

        return NextResponse.json(updatedTheme);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code == "P2002") {
            return NextResponse.json({error: "Theme name already in use"}, {status: 400});
        }

        console.error(error);

        return NextResponse.json({error: "Couldn't update theme"}, {status: 500});
    }
}

export async function DELETE(
    req: Request,
    context: {params: Promise<{id: string}>}
) {
    const {id} = await context.params;
    const themeID = parseInt(id);

    if (Number.isNaN(themeID)) {
        return NextResponse.json(
            {error: "ThemeID is invalid"},
            {status: 400}
        );
    }

    const theme = await prisma.theme.findUnique({where: {id: themeID}});

    if (!theme) {
        return NextResponse.json(
            {error: "Couldn't locate theme"},
            {status: 404}
        );
    }

    await prisma.$transaction(async (tx) => {
        await tx.themeCode.deleteMany({
            where: {themeID}
        });

        await tx.theme.delete({
            where: {id: themeID}
        });
    });

    return NextResponse.json({success: true});
}

