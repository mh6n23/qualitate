'use client';

import {useRef, useState} from 'react';
import {useRouter} from 'next/navigation';

export default function FileUploader({projectId}:{projectId:number})
{
    const [uploading, setUploading] = useState(false);
    const [currentFileName, setCurrentFileName] = useState("");
    const [progressText, setProgressText] = useState("");
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    }

    async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>)
    {
        const files = event.target.files;
        if (!files || files.length === 0)
        {
            return;
        }

        const file = files[0];
        setUploading(true);

        for (let i = 0; i < files.length; i++)
        {
            const file = files[i];
            setCurrentFileName(file.name);
            setProgressText("Uploading file ${file.name} (${i+1} of ${files.length}");
        }

        try
        {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("projectID", projectId.toString())

            const response = await fetch ("/api/upload", {
                method: "POST",
                body: formData,
            })

            if (!response.ok)
            {
                throw new Error("File upload failed.");
            }


        }
        catch (error)
        {
            console.error(error);
            alert(`File Upload Error for ${file.name}`);
        }

        setUploading(false);
        router.refresh();

        if (event.target)
        {
            event.target.value = "";
        }

    }

    return (
        <>
            <button className="regular-button" onClick={handleButtonClick}>
                <span>Upload File</span>
            </button>

            <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            multiple
            accept="video/*, image/*, .vtt, .docx"/>

            {uploading && (<div>
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <h3>Uploading...</h3>
                        <span>{progressText}</span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div className="bg-blue-600 h-2 rounded-full w-full animate-pulse"></div>

                    </div>

                </div>
            </div>)}
        </>
    )
}