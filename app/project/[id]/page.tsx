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
            files: {
                include: {
                    event: true,
                    group: true
                }
            },
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
            },
            events: {
                orderBy: {
                    name: "asc"
                }
            },
            groups: {
                orderBy: {
                    name: "asc"
                }
            }
        }
    });

    if (!project)
    {
        notFound();
    }

    const datedFiles = project.files
        .filter(f => f.creationTime != null)
        .sort((a, b) => new Date(a.creationTime).getTime() - new Date(b.creationTime).getTime());

    // Set the start time of the project to be the time of the earliest video, else fall back to the project's creation time
    const startTime = datedFiles.length > 0
        ? new Date(datedFiles[0].creationTime).getTime()
        : new Date(project.creationTime).getTime();

    return (
        <main className="p-6 flex flex-col h-screen">
            <ProjectWorkspace
                projectId={projectId}
                projectStartTime={startTime}
                files={project.files}
                annotations={project.annotations}
                events={project.events}
                groups={project.groups}/>
        </main>
    );
}