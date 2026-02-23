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

    // Grabs the duration of a video
    const getDuration = (file: File): Promise<number> => {
        // Wait for the resolve to complete before returning a value
        return new Promise(resolve => {
            // Set the duration to 0 if the file isn't a video
            if (!file.type.startsWith("video/")) {
                resolve(0);
                return;
            }

            // Create an invisible video and get the header information
            const video = document.createElement("video");
            video.preload = "metadata";

            // Once the metadata has been read delete the URL
            video.onloadedmetadata = () => {
                window.URL.revokeObjectURL(video.src);
                resolve(video.duration);
            };

            // Default to 0 if there's a problem
            video.onerror = () => {
                resolve(0);
            }

            // Load the video
            video.src = URL.createObjectURL(file);
        })
    }

    async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>)
    {
        const files = event.target.files;
        if (!files || files.length === 0)
        {
            return;
        }

        setUploading(true);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const timestamp = new Date(file.lastModified).toISOString();
            setCurrentFileName(file.name);
            setProgressText(`Uploading file ${file.name} (${i + 1} of ${files.length}`);

            try {
                const duration = await getDuration(file);
                const formData = new FormData();
                formData.append("file", file);
                formData.append("projectID", projectId.toString())
                formData.append("duration", duration.toString())
                formData.append("creationTime", timestamp)

                const response = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error(`File upload failed for ${file.name}.`);
                }

                // Remove to speedup
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error(error);
                alert(`File Upload Error for ${file.name}`);
            }
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