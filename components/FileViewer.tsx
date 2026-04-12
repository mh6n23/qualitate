'use client';

import {useState} from 'react';
import {MediaFile} from '@prisma/client';
import {useRouter} from 'next/navigation';

export default function FileViewer({files} : {files: MediaFile[]})
{
    const [isModalOpen, setIsModalOpen] = useState(false);

    const videos = files.filter(f => f.filePath.includes("/Videos"));
    const images = files.filter(f => f.filePath.includes("/Images"));
    const transcripts = files.filter(f => f.filePath.includes("/Transcripts"));

    const router = useRouter();

    function formatDate(timestamp: Date | string) {
        return new Date(timestamp).toLocaleString("en-GB", {
            year: "numeric",
            month: "short",
            day: "2-digit",
        })
    }

    function formatTime(timestamp: Date | string) {
        return new Date(timestamp).toLocaleString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        })
    }

    function formatDuration(durationSeconds: number) {
        const hours = Math.floor(durationSeconds / 3600);
        const minutes = Math.floor((durationSeconds % 3600) / 60);
        const seconds = Math.floor(durationSeconds % 60);

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        }

        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }

    async function deleteFile(fileID: number, fileName: string) {
        const confirmation = window.confirm(`Delete ${fileName}?`);

        if (!confirmation) {
            return;
        }

        try {
            const response = await fetch(`api/files/${fileID}`, {
                method: "DELETE"
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Couldn't delete the file");
                return;
            }

            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Couldn't delete the file");
        }
    }


    return(
        <>
            <button
                className="regular-button"
            onClick={() => setIsModalOpen(true)}
            >View Files ({files.length})</button>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content w-full max-w-2xl">

                        <div className="grid grid-cols-3 items-center border-b border-gray-300 pb-2 mb-4">
                            {/* Empty first column */}
                            <div></div>

                            <div className="text-center">
                                <h2 className="text-xl font-bold">Project File</h2>
                                <p className="text-sm text-gray-600">{files.length} files in total</p>
                            </div>


                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-7 h-7 px-2 py-1 border border-gray-300 rounded hover:bg-gray-100"
                                >X
                                </button>
                            </div>
                            {/* Close Annotation Window Button */}

                        </div>

                        <div className="space-y-4">

                            <FileCategory title="Videos" files={videos} formatTimestamp={formatTime} formatDuration={formatDuration}/>
                            <FileCategory title="Images" files={images} formatTimestamp={formatTime} formatDuration={formatDuration}/>
                            <FileCategory title="Transcripts" files={transcripts} formatTimestamp={formatTime} formatDuration={formatDuration}/>

                        </div>

                    </div>
                </div>
                    )}


        </>


    )

}

function FileCategory({title, files, formatTimestamp, formatDuration}: {title: string, files: MediaFile[], formatTimestamp: (timestamp: Date | string) => string, formatDuration: (seconds: number) => string}) {
    if (files.length === 0) {
        return null;
    }

    return (
        <div className="border-t border-gray-300 pt-3">
            <h3 className="font-bold mb-3">{title} ({files.length})</h3>

            <div className="space-y-2">
                {files.map((file) => (
                        <div key={file.id} className="border border-gray-300 rounded p-3 bg-gray-50">
                            <p className="font-semibold text-sm wrap-break-word">
                                {file.fileName}
                            </p>

                            <p className="text-xs text-gray-600 mt-1">
                                Timestamp: {formatTimestamp((file.creationTime))}
                                {file.duration > 0 && ` | Duration: ${formatDuration(file.duration)}`}
                            </p>
                        </div>
                ))}
            </div>

        </div>
    )
}