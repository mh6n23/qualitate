import {NextResponse} from "next/server"; // Sends answers to user
import {prisma} from '@/lib/prisma'; // Connects to database
import {writeFile, mkdir} from "fs/promises"; // For accessing user's drive
import {join, extname} from 'path';

function getFileCategory(file: File) : string
{
    const fileType = file.type;

    if (fileType.startsWith("video/"))
    {
        return "Videos";
    }
    else if (fileType.startsWith("image/"))
    {
        return "Images";
    }
    else if (fileType.startsWith("audio/"))
    {
        return "Audio";
    }

    const fileExtension = extname(file.name).toLowerCase();
    const transcriptExtensions = [".vtt", ".txt"]

    if (transcriptExtensions.includes(fileExtension))
    {
        return "Transcripts";
    }

    return "Unknown Files";
}

// async runs in background
export async function POST(request: Request)
{
    try
    {
        // Open package from user containing the file
        const data = await request.formData();
        const file: File | null = data.get('file') as unknown as File;
        const projectID = data.get('projectID') as string;
        const duration = parseFloat(data.get('duration') as string) || 0;

        if (!file || !projectID)
        {
            let errorMsg = "";
            if (!file)
            {
                errorMsg = "Missing File";
            }
            else if (!projectID)
            {
                errorMsg = "Missing Project ID";
            }

            return NextResponse.json(
                {error: errorMsg},
                {status: 400}
            )
        }

        // Look in database for a project with that id
        const project = await prisma.project.findUnique({
            where: {id: parseInt(projectID)}
        });

        if (!project)
        {
            return NextResponse.json({error: "Project not found"}, {status: 404})
        }

        const catFolder = getFileCategory(file);

        const relFolder = `uploads/project-${project.id}/${catFolder}`

        // Check for the directory, create a new folder if it doesn't exist
        const projectDirectory = join(process.cwd(), 'public', relFolder);
        await mkdir(projectDirectory, {recursive: true});

        // Turn file into binary data and then format so Node.js can write it
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(join(projectDirectory, file.name), buffer);

        // Create an entry in the database for the uploaded file
        const databaseFilePath = `/${relFolder}/${file.name}`;
        const timestamp = data.get('creationTime') as string;
        const newFile = await prisma.mediaFile.create({
            data: {
                fileName: file.name,
                filePath: databaseFilePath,
                fileType: file.type,
                projectID: project.id,
                duration: duration,
                creationTime: new Date(timestamp)
            },
        });

        return NextResponse.json({success: true, file: newFile});
    }
    catch (error)
    {
        console.error(error);
        return NextResponse.json({error: "Upload failed"}, {status: 500});
    }
}