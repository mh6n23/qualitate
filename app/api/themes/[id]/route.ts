import {NextResponse} from "next/server";
import {prisma} from '@/lib/prisma';

export async function PATCH(request: Request, {params}: {params: Promise<{id: string}>})
{
    try
    {
        const {id} = await params;
        const body = await request.json();

        const theme = await prisma.theme.update({
            where: {id: parseInt(id)},
            data: {
                ...(body.name !== undefined && {name: body.name}),
            },
            include: {
                codes: true,
            },
        });

        return NextResponse.json(theme);
    }
    catch (error)
    {
        console.error("API PATCH THEME ERROR:", error);
        return NextResponse.json(
            {error: "Error updating theme"},
            {status: 500}
        );
    }
}

export async function DELETE(request: Request, {params}: {params: Promise<{id: string}>})
{
    try
    {
        const {id} = await params;

        // Unlink codes from this theme (don't delete them)
        await prisma.code.updateMany({
            where: {themeId: parseInt(id)},
            data: {themeId: null},
        });

        await prisma.theme.delete({
            where: {id: parseInt(id)},
        });

        return NextResponse.json({success: true});
    }
    catch (error)
    {
        console.error("API DELETE THEME ERROR:", error);
        return NextResponse.json(
            {error: "Error deleting theme"},
            {status: 500}
        );
    }
}
