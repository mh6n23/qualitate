import {NextResponse} from "next/server"; // Sends answers to user
import {prisma} from '@/lib/prisma'; // Connects to database
import {writeFile, mkdir} from "fs/promises"; // For accessing user's drive
import {join} from 'path'; // For using file systems on different operating systems

// async runs in background
export async function POST(request: Request)
{
    try
    {
        // Open package from user containing the file
        const data = await request.formData();
        const file: File | null = data.get('file') as unknown as File;
        const projectID = data.get('projectID') as string;

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

        const relFolder = project.folderPath || `uploads/project-${project.id}`

        // Check for the directory, create a new folder if it doesn't exist
        const projectDirectory = join(process.cwd(), 'public', relFolder);
        await mkdir(projectDirectory, {recursive: true});

        // Turn file into binary data and then format so Node.js can write it
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(join(projectDirectory, file.name), buffer);

        // Create an entry in the database for the uploaded file

        const newFile = await prisma.mediaFile.create({
            data: {
                fileName: file.name,
                filePath: `${project.folderPath}/${file.name}`,
                fileType: 'Video',
                projectID: project.id,
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