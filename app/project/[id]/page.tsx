import {prisma} from "@/lib/prisma";
import FileUploadForm from "@/components/FileUploadForm";
import Link from "next/link";
import {notFound} from "next/navigation";
import {Property} from "csstype";
import Page = Property.Page;

interface PageProps
{
    params: {id:string};
}

export default async function ProjectPage({params}: PageProps)
{
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

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-5xl mx-auto">
                <Link href="/" className = "text-gray-500 hover:text-blue-600 mb-6 block transition-colors">Dashboard</Link>


            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{project.name}</h1>
                <p className="text-gray-600 text-lg">{project.description}</p>
            </div>

            <FileUploadForm projectID={project.id}/>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">Project Files ({project.files.length})</h2>
                </div>

                <div className="divide-y divide-gray-100">
                    {project.files.length === 0 ?
                        (
                        <p className="p-8 text-center text-gray-400">No files yet.</p>
                        )
                        :
                        (
                            project.files.map((file) => (
                                <div key={file.id} className={"p-4 flex items-center justify-between hover:bg-gray-50"}>
                                    <div>
                                        <p className="font-medium text-gray-900">{file.fileName}</p>
                                        <p className="text-xs text-gray-500">{new Date(file.creationTime).toLocaleString()}</p>
                                    </div>

                                    <a href={file.filePath}
                                        target="_blank"
                                    className="text-blue-600 text-sm font-semibold hover:underline bg-blue-50 px-3 py-1 rounded">
                                        View
                                    </a>
                                </div>
                            )
                        )
                    )}
                </div>
            </div>

            </div>
        </div>
    );
}