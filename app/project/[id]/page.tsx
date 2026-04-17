import {prisma} from "@/lib/prisma";
import {notFound} from "next/navigation";
import ProjectWorkspace from "@/components/ProjectWorkspace";


interface PageProps
{
    params: Promise<{id:string}>;
}

export default async function ProjectPage({params}: PageProps)
{

    const{id} = await params;
    const projectId = parseInt(id);

    const project = await prisma.project.findUnique({
        where: {id:projectId},
        include: {
            files: true,
            annotations: {
                include: {
                    code: true,
                    mediaLinks: {
                        include: {
                            mediaFile: true
                        }
                    }
                },
                orderBy: {
                    startTime: "asc"
                }
            }
        }
    });

    if (!project)
    {
        notFound();
    }

    // Collect all the video files via filtering then sort them by their creation time
    const videoFiles = project.files
        .filter(f => f.filePath.includes("/Videos"))
        .sort((a, b) => new Date(a.creationTime).getTime() - new Date(b.creationTime).getTime());

    // Set the start time of the project to be the time of the earliest video, else fall back to the project's creation time
    const startTime = videoFiles.length > 0
        ? new Date(videoFiles[0].creationTime).getTime()
        : new Date(project.creationTime).getTime();

    return (
        <main className="p-6 flex flex-col h-screen">
            <ProjectWorkspace
                projectId={projectId}
                projectStartTime={startTime}
                files={project.files}
                annotations={project.annotations}/>
        </main>
    );
}