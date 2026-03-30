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

        const groups = await prisma.group.findMany({
            where: {projectId: parseInt(projectId)},
            include: {files: true},
        });

        return NextResponse.json(groups);
    }
    catch (error)
    {
        console.error("API GET GROUPS ERROR:", error);
        return NextResponse.json(
            {error: "Error fetching groups"},
            {status: 500}
        );
    }
}

export async function POST(request: Request)
{
    try
    {
        const body = await request.json();

        const group = await prisma.group.create({
            data: {
                name: body.name,
                projectId: body.projectId,
            },
        });

        return NextResponse.json(group);
    }
    catch (error)
    {
        console.error("API POST GROUP ERROR:", error);
        return NextResponse.json(
            {error: "Error creating group"},
            {status: 500}
        );
    }
}
