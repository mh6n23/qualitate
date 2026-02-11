import {prisma} from "@/lib/prisma";
import {notFound} from "next/navigation";
import VideoPlayer from "@/components/VideoPlayer";
import TranscriptPlayer from "@/components/TranscriptPlayer";
import FileUploader from "@/components/FileUploadForm";
import Timeline from "@/components/Timeline";

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
            files: true
        }
    });

    if (!project)
    {
        notFound();
    }

    return (
        <main>
            <div className="grid grid-cols-3 items-center mb-10">
                <div className="flex justify-start">
                    <FileUploader projectId={1}/>
                </div>

                <div className="text-center">
                    <h1 className="text-4xl font-bold">Workspace</h1>
                </div>

                <div className = "flex justify-end">
                    <button className="regular-button">+ Annotation</button>
                </div>

            </div>
            <div className="text-center">
                {/*<p>Project ID: {params.id}</p>*/}
                <p className="text-xl">Project ID: 1</p>
            </div>
            {/*Main Grid */}
            <div className="grid grid-cols-3 gap-6 flex-1">
                <div className="col-span-2">
                    <div>
                        <VideoPlayer videoSource="/BigBuckBunny.mp4"/>
                        <div className="mt-4">
                            <Timeline files={project.files}/>
                        </div>
                    </div>
                    <div className="flex items-center justify-center">
                        <div className="flex items-center">Image Stream</div>
                    </div>
                </div>

                <div className="col-span-1">
                    <TranscriptPlayer/>
                </div>

            </div>

        </main>
    );
}