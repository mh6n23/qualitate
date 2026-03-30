import {NextResponse} from "next/server";
import {prisma} from '@/lib/prisma';

export async function PATCH(request: Request, {params}: {params: Promise<{id: string}>})
{
    try
    {
        const {id} = await params;
        const body = await request.json();

        const code = await prisma.code.update({
            where: {id: parseInt(id)},
            data: {
                ...(body.name !== undefined && {name: body.name}),
                ...(body.colour !== undefined && {colour: body.colour}),
                ...(body.themeId !== undefined && {themeId: body.themeId}),
            },
        });

        return NextResponse.json(code);
    }
    catch (error)
    {
        console.error("API PATCH CODE ERROR:", error);
        return NextResponse.json(
            {error: "Error updating code"},
            {status: 500}
        );
    }
}

export async function DELETE(request: Request, {params}: {params: Promise<{id: string}>})
{
    try
    {
        const {id} = await params;

        await prisma.annotation.deleteMany({
            where: {codeId: parseInt(id)},
        });

        await prisma.code.delete({
            where: {id: parseInt(id)},
        });

        return NextResponse.json({success: true});
    }
    catch (error)
    {
        console.error("API DELETE CODE ERROR:", error);
        return NextResponse.json(
            {error: "Error deleting code"},
            {status: 500}
        );
    }
}
