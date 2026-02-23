'use client';

import {useState} from 'react';
import {MediaFile} from '@prisma/client';

export default function FileViewer({files} : {files: MediaFile[]})
{
    const [isModalOpen, setIsModalOpen] = useState(false);

    const videos = files.filter(f => f.filePath.includes("/Videos"));
    const images = files.filter(f => f.filePath.includes("/Images"));
    const transcripts = files.filter(f => f.filePath.includes("/Transcripts"));



    return(
        <>
            <button
                className="regular-button"
            onClick={() => setIsModalOpen(true)}
            >View Files ({files.length})</button>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="flex items-center justify-between p-4 border-b border-gray-700">
                            <h2 style={{textAlign: 'center'}}>Project Files</h2>
                            <button
                            onClick={() => setIsModalOpen(false)}
                            >x</button>
                        </div>

                        <div className="overflow-y-auto p-2 space-y-6">
                            <FileCategory title="Videos" files={videos}/>
                            <FileCategory title="Images" files={images}/>
                            <FileCategory title="Transcripts" files={transcripts}/>
                        </div>
                    </div>
                </div>
                    )}


        </>


    )

}

function FileCategory({title, files}: {title: string, files: MediaFile[]}) {
    if (files.length === 0) {
        return null;
    }

    return (
        <div className="border-b border-black">
            <h3>{title}</h3>
            <ul className="ml-4 space-y-1">
                {files.map(file => (
                    <li key={file.id}
                    className="text-sm">
                        {file.fileName}
                    </li>
                ))}
            </ul>
        </div>
    )
}