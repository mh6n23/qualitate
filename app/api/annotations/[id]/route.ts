import {NextResponse} from "next/server";
import {prisma} from '@/lib/prisma';

export async function PATCH(request: Request, {params}: {params: Promise<{id: string}>})
{
    try
    {
        const {id} = await params;
        const body = await request.json();

        const annotation = await prisma.annotation.update({
            where: {id: parseInt(id)},
            data: {
                ...(body.codeId !== undefined && {codeId: body.codeId}),
                ...(body.transcriptText !== undefined && {transcriptText: body.transcriptText}),
                ...(body.startTime !== undefined && {startTime: body.startTime}),
                ...(body.endTime !== undefined && {endTime: body.endTime}),
            },
            include: {
                code: true,
                file: true,
            },
        });

        return NextResponse.json(annotation);
    }
    catch (error)
    {
        console.error("API PATCH ANNOTATION ERROR:", error);
        return NextResponse.json(
            {error: "Error updating annotation"},
            {status: 500}
        );
    }
}

export async function DELETE(request: Request, {params}: {params: Promise<{id: string}>})
{
    try
    {
        const {id} = await params;

        await prisma.annotation.delete({
            where: {id: parseInt(id)},
        });

        return NextResponse.json({success: true});
    }
    catch (error)
    {
        console.error("API DELETE ANNOTATION ERROR:", error);
        return NextResponse.json(
            {error: "Error deleting annotation"},
            {status: 500}
        );
    }
}
