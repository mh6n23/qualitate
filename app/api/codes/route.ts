import {NextResponse} from "next/server";
import {prisma} from '@/lib/prisma';

export async function GET(request: Request)
{
    try
    {
        const {searchParams} = new URL(request.url);
        const projectId = searchParams.get('projectId');

        if (!projectId)
        {
            return NextResponse.json(
                {error: "projectId is required"},
                {status: 400}
            );
        }

        const codes = await prisma.code.findMany({
            where: {projectId: parseInt(projectId)},
            include: {
                annotations: true,
                theme: true,
            },
        });

        return NextResponse.json(codes);
    }
    catch (error)
    {
        console.error("API GET CODES ERROR:", error);
        return NextResponse.json(
            {error: "Error fetching codes"},
            {status: 500}
        );
    }
}

export async function POST(request: Request)
{
    try
    {
        const body = await request.json();

        const code = await prisma.code.create({
            data: {
                name: body.name,
                colour: body.colour || '#FFFF00',
                projectId: body.projectId,
                themeId: body.themeId || null,
            },
        });

        return NextResponse.json(code);
    }
    catch (error)
    {
        console.error("API POST CODE ERROR:", error);
        return NextResponse.json(
            {error: "Error creating code"},
            {status: 500}
        );
    }
}
