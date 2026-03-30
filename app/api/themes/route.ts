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

        const themes = await prisma.theme.findMany({
            where: {projectId: parseInt(projectId)},
            include: {
                codes: {
                    include: {
                        annotations: true,
                    },
                },
            },
        });

        return NextResponse.json(themes);
    }
    catch (error)
    {
        console.error("API GET THEMES ERROR:", error);
        return NextResponse.json(
            {error: "Error fetching themes"},
            {status: 500}
        );
    }
}

export async function POST(request: Request)
{
    try
    {
        const body = await request.json();

        const theme = await prisma.theme.create({
            data: {
                name: body.name,
                projectId: body.projectId,
            },
        });

        return NextResponse.json(theme);
    }
    catch (error)
    {
        console.error("API POST THEME ERROR:", error);
        return NextResponse.json(
            {error: "Error creating theme"},
            {status: 500}
        );
    }
}
