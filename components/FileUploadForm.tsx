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

    async function getTranscriptDuration(file: File): Promise<number> {
        try{
            const text = await file.text();
            const regex = /\[([\d:]+)[ \-]+([\d:]+)]\s*([^\[]+)/g;
            let acceptedLine;
            let transcriptEnd = 0;

            while ((acceptedLine = regex.exec(text)) !== null) {
                const lineEnd = acceptedLine[2];
                const endInSeconds = convertTimeToSeconds(lineEnd);

                if (endInSeconds > transcriptEnd) {
                    transcriptEnd = endInSeconds;
                }

            }
            return transcriptEnd;
        } catch (error)
        {
            console.error("Error parsing transcript to determine duration", error);
            return 0;
        }
    }

    function convertTimeToSeconds (timeString: string) : number {
        const components = timeString.trim().split(':');
        let seconds = 0;

        // Convert differently depending on if hours are included in the time
        if (components.length === 3)
        {
            seconds = (parseInt(components[0]) * 3600) + (parseInt(components[1]) * 60) + parseFloat(components[2]);
        }
        else if (components.length === 2)
        {
            seconds = (parseInt(components[0]) * 60) + parseFloat(components[1])
        }
        return seconds;
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
                let duration = 0;

                if (file.type.startsWith("video/")) {
                    // Video
                    duration = await getDuration(file);
                } else if (file.name.endsWith(".txt")) {
                    // Transcript
                    duration = await getTranscriptDuration(file);
                } else {
                    // Set default duration for image files
                    duration = 30;
                }

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
            accept="video/*, image/*, .vtt, .docx, .txt"/>

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