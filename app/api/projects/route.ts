import {NextResponse} from "next/server";
import {prisma} from '@/lib/prisma';

export async function GET()
{
    console.log("API: Fetching projects");
    try
    {
        const projects = await prisma.project.findMany({
            orderBy: {creationTime: 'desc'}
        });

        console.log(`API: Found ${projects.length} projects`);

        return NextResponse.json(projects);
    }
    catch (error)
    {
        console.error("API GET ERROR:", error)
        return NextResponse.json(
            {error: "Error fetching projects"},
            {status: 500}
        );
    }
}

export async function POST(request: Request)
{
    try
    {
        const body = await request.json()

        const newProject = await prisma.project.create({
            data: {
                name: body.name,
                description: body.description || '',
                folderPath: body.name
            },
        });
        return NextResponse.json(newProject);
    }
    catch (error)
    {
        return NextResponse.json(
            {error: "Error creating project"},
            {status:500}
        );
    }
}