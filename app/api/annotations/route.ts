import {NextResponse} from "next/server";
import {prisma} from '@/lib/prisma';

export async function GET(request: Request)
{
    try
    {
        const {searchParams} = new URL(request.url);
        const projectId = searchParams.get('projectId');
        const codeId = searchParams.get('codeId');

        if (!projectId)
        {
            return NextResponse.json(
                {error: "projectId is required"},
                {status: 400}
            );
        }

        const where: {projectId: number; codeId?: number} = {
            projectId: parseInt(projectId),
        };

        if (codeId)
        {
            where.codeId = parseInt(codeId);
        }

        const annotations = await prisma.annotation.findMany({
            where,
            include: {
                code: true,
                file: true,
            },
            orderBy: {startTime: 'asc'},
        });

        return NextResponse.json(annotations);
    }
    catch (error)
    {
        console.error("API GET ANNOTATIONS ERROR:", error);
        return NextResponse.json(
            {error: "Error fetching annotations"},
            {status: 500}
        );
    }
}

export async function POST(request: Request)
{
    try
    {
        const body = await request.json();

        const annotation = await prisma.annotation.create({
            data: {
                codeId: body.codeId,
                projectId: body.projectId,
                fileId: body.fileId,
                transcriptText: body.transcriptText,
                startTime: body.startTime,
                endTime: body.endTime,
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
        console.error("API POST ANNOTATION ERROR:", error);
        return NextResponse.json(
            {error: "Error creating annotation"},
            {status: 500}
        );
    }
}
