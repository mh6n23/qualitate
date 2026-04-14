'use client';

import {useRef, useState} from 'react';
import {useRouter} from 'next/navigation';

export default function FileUploader({projectId}: { projectId: number }) {
    const [uploading, setUploading] = useState(false);
    const [currentFileName, setCurrentFileName] = useState("");
    const [totalFiles, setTotalFiles] = useState(0);
    const [currentFileIndex, setCurrentFileIndex] = useState(0);
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const progressPercentage = totalFiles > 0 ? (currentFileIndex / totalFiles) * 100 : 0;

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    }

    // Grabs the duration of a video
    const getDuration = (file: File, elementType: "video" | "audio"): Promise<number> => {
        // Wait for the resolve to complete before returning a value
        return new Promise(resolve => {

            // Create an invisible video and get the header information
            const media = document.createElement(elementType);
            media.preload = "metadata";

            // Once the metadata has been read delete the URL
            media.onloadedmetadata = () => {
                window.URL.revokeObjectURL(media.src);
                resolve(media.duration);
            };

            // Default to 0 if there's a problem
            media.onerror = () => {
                resolve(0);
            }

            // Load the video
            media.src = URL.createObjectURL(file);
        })
    }

    async function getTranscriptDuration(file: File): Promise<number> {
        try {
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
        } catch (error) {
            console.error("Error parsing transcript to determine duration", error);
            return 0;
        }
    }

    function convertTimeToSeconds(timeString: string): number {
        const components = timeString.trim().split(':');
        let seconds = 0;

        // Convert differently depending on if hours are included in the time
        if (components.length === 3) {
            seconds = (parseInt(components[0]) * 3600) + (parseInt(components[1]) * 60) + parseFloat(components[2]);
        } else if (components.length === 2) {
            seconds = (parseInt(components[0]) * 60) + parseFloat(components[1])
        }
        return seconds;
    }

    async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        const files = event.target.files;
        if (!files || files.length === 0) {
            return;
        }

        setTotalFiles(files.length);
        setCurrentFileIndex(0);
        setUploading(true);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const timestamp = new Date(file.lastModified).toISOString();
            setCurrentFileIndex(i + 1);
            setCurrentFileName(file.name);

            try {
                let duration = 0;

                if (file.type.startsWith("video/")) {
                    // Video
                    duration = await getDuration(file, "video");
                } else if (file.type.startsWith("audio/")) {
                    // Transcript
                    duration = await getDuration(file, "audio");
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

                // Remove to speedup upload process
                //await new Promise(resolve => setTimeout(resolve, 5000));
            } catch (error) {
                console.error(error);
                alert(`File Upload Error for ${file.name}`);
            }
        }

        setUploading(false);
        setCurrentFileName("");
        setCurrentFileIndex(0);
        setTotalFiles(0);
        router.refresh();

        if (event.target) {
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
                accept="video/*, audio/*, image/*, .vtt, .docx, .txt"/>

            {uploading && (

                <div className="modal-overlay">
                    <div className="modal-content max-w-wd">
                        <div className="space-y-4">
                            {/* Popup Title */}
                            <div className="text-center">
                                <h2 className="text-xl font-bold">Uploading Files</h2>
                            </div>

                            {/* Current file info and progress text */}
                            <div>
                                <p className="text-sm font-semibold text-gray-800 truncate">{currentFileName}</p>
                                <p className="text-sm font-semibold text-gray-600">File {currentFileIndex} of {totalFiles}</p>
                            </div>

                            {/* Progress Bar */}
                            <div>
                                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                                        style={{width: `${progressPercentage}%`}}
                                    />
                                </div>
                            </div>


                        </div>
                    </div>


                </div>


            )}
        </>
    )
}