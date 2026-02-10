import {prisma} from "@/lib/prisma";
import {notFound} from "next/navigation";
import VideoPlayer from "@/components/VideoPlayer";
import TranscriptPlayer from "@/components/TranscriptPlayer";
import FileUploader from "@/components/FileUploadForm";

interface PageProps
{
    params: {id:string};
}

export default async function ProjectPage({params}: PageProps)
{
    /*
    const project = await prisma.project.findUnique({
        where: {id:parseInt(params.id)},
        include: {
            files: {
                orderBy: {creationTime: 'desc'}
            }
        }
    });

    if (!project)
    {
        notFound();
    }
     */

    const project = {id:1, name:"Test Project"};

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
            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2">
                    <div>
                        <VideoPlayer videoSource="/BigBuckBunny.mp4"/>
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