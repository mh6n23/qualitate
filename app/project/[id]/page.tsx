import {prisma} from "@/lib/prisma";
import {notFound} from "next/navigation";
import VideoPlayer from "@/components/VideoPlayer";
import TranscriptPlayer from "@/components/TranscriptPlayer";
import FileUploader from "@/components/FileUploadForm";
import FileViewer from "@/components/FileViewer";
import Timeline from "@/components/Timeline";
import PlaybackController from "@/components/PlaybackController";
import Themes from '@/components/Themes';


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
            <div className="grid grid-cols-3 items-center">
                <div className="flex justify-start gap-4">
                    <FileUploader projectId={projectId}/>
                    <FileViewer files={project.files}/>
                </div>

                <div className="text-center">
                    <h1 className="text-4xl font-bold">Workspace</h1>
                </div>

                <div className="flex justify-end">
                    <Themes projectID={projectId}/>
                </div>


            </div>
            <div className="text-center">
                {/*<p>Project ID: {params.id}</p>*/}
                <p className="text-xl">Project ID: {projectId}</p>
            </div>

            {/* The 3 views and the timeline */}
            <PlaybackController files={project.files} annotations={project.annotations} projectStartTime={startTime} projectId={projectId}/>

        </main>
    );
}