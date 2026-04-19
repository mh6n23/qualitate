'use client';

import {useRef, useEffect, useState} from 'react';
import {useAtom} from 'jotai';
import {currTimeAtom, pixelsPerSecondAtom} from "@/app/atoms";
import {Annotation, AnnotationMediaLink, Code, MediaFile} from "@prisma/client";
import {useRouter} from "next/navigation";


interface TimelineProps {
    files: MediaFile[];
    annotations: (Annotation & {
        code: Code;
        mediaLinks: (AnnotationMediaLink & {
            mediaFile: MediaFile;
        })[];
    })[];
    projectStartTime: number;
    onEditAnnotation: (annotationID : number) => void;
    projectDuration: number;
}

function AnnotationBlock({annotation, pixelsPerSecond, onEdit}: {
    annotation: Annotation & { code: Code };
    pixelsPerSecond: number;
    onEdit: (annotationID : number) => void;
}) {
    const position = annotation.startTime * pixelsPerSecond;
    const width = Math.max((annotation.endTime - annotation.startTime) * pixelsPerSecond, 6)

    return (
        <div onDoubleClick={(e) => {
            e.stopPropagation();
            onEdit(annotation.id);
        }}
             className="absolute top-1/2 -translate-y-1/2 h-10 rounded text-white text-[10px] truncate px-1 flex items-center"
             style={{
                 left: `${position}px`,
                 width: `${width}px`,
                 backgroundColor: annotation.code.colour
             }}
             title={`${annotation.code.name}: ${annotation.selectedText ?? "Annotation"}`}>
            {annotation.code.name}
        </div>
    )
}

function getDuration(file: MediaFile) {
    if (file.duration > 0) {
        return file.duration;
    }

    if (file.filePath.includes("/Images/")) {
        return 30;
    }

    return 0;
}

function FileBlock({file, projectStartTime, pixelsPerSecond, onEdit}: {


    file: MediaFile,
    projectStartTime: number,
    pixelsPerSecond: number,
    onEdit: (file: MediaFile) => void
}) {
    const fileStartTime = new Date(file.creationTime).getTime();
    const offsetSeconds = (fileStartTime - projectStartTime) / 1000;
    const position = offsetSeconds * pixelsPerSecond;

    // Set duration to 30 seconds if the file didn't previously have a duration
    const shownDuration = getDuration(file);
    const width = shownDuration * pixelsPerSecond;


    return (
        <div onDoubleClick={(e) => {
            e.stopPropagation();
            onEdit(file);
        }}
             className="absolute top-1/2 -translate-y-1/2 h-10 bg-blue-600 rounded text-white text-[10px] truncate px-1 flex items-center"
             style={{
                 left: `${position}px`,
                 width: `${width}px`
             }}>
            {file.fileName}
        </div>
    )
}

function AnnotationTrack({annotations, pixelsPerSecond, onEdit} : {
    annotations: (Annotation & {code:Code})[];
    pixelsPerSecond: number;
    onEdit: (annotationID: number) => void;
}) {
    return (
        <div className="relative h-16 border-b border-gray-500 w-full">
            {annotations.map((annotation) => (
                <AnnotationBlock
                    key={annotation.id}
                    annotation={annotation}
                    pixelsPerSecond={pixelsPerSecond}
                    onEdit={onEdit}
        />
    ))}
        </div>
    );
}

function Track({files, projectStartTime, pixelsPerSecond, onEdit}: {
    files: MediaFile[],
    projectStartTime: number,
    pixelsPerSecond: number,
    onEdit: (file: MediaFile) => void
}) {
    return (
        <div className="relative h-16 border-b border-gray-500 w-full">
            {files.map((file) => (
                <FileBlock
                    key={file.id}
                    file={file}
                    projectStartTime={projectStartTime}
                    pixelsPerSecond={pixelsPerSecond}
                    onEdit={onEdit}/>))}
        </div>
    )
}

export default function Timeline({files, annotations, projectStartTime, onEditAnnotation, projectDuration}: TimelineProps) {
    // Default for now but i'll allow it to be changed later
    const [pixelsPerSecond] = useAtom(pixelsPerSecondAtom);

    const [currTime, setCurrTime] = useAtom(currTimeAtom);
    const containerRef = useRef<HTMLDivElement>(null);

    const videoFiles = files.filter(f => f.filePath.includes("/Videos/"));
    const imageFiles = files.filter(f => f.filePath.includes("/Images/"));
    const transcriptFiles = files.filter(f => f.filePath.includes("/Transcripts/"));
    const audioFiles = files.filter(f => f.filePath.includes("/Audio/"));

    const router = useRouter();
    const [editingFile, setEditingFile] = useState<MediaFile | null>(null);
    const [editDate, setEditDate] = useState("");
    const [editTime, setEditTime] = useState("");
    const [editDuration, setEditDuration] = useState("");

    function openEditor(file: MediaFile) {
        const date = new Date(file.creationTime)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hour = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");
        setEditingFile(file);
        setEditDate(`${year}-${month}-${day}`);
        setEditTime(`${hour}:${minutes}:${seconds}`);
        setEditDuration(String(file.duration > 0 ? file.duration : 30));
    }

    async function saveEdit() {
        if (!editingFile) {
            return;
        }

        if (!editDate || !editTime) {
            alert("You haven't provided a date and time.");
            return;
        }

        const body: {
            creationTime: string;
            duration?: number;
        } = {
            creationTime: new Date(`${editDate}T${editTime}`).toISOString()
        };

        if (editingFile.filePath.includes("/Images/")) {
            const parsedDuration = Number(editDuration);

            if (Number.isNaN(parsedDuration) || parsedDuration < 0) {
                alert("Invalid duration.");
                return;
            }

            body.duration = parsedDuration;
        }

        try {
            const response = await fetch(`/api/files/${editingFile.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) {
                alert("Couldn't save updates to file");
            }

            setEditingFile(null);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Couldn't save updates to file");
        }
    }

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const location = target.getBoundingClientRect();
        const relativeDistance = (e.clientX - location.left) + target.scrollLeft;

        // Only change the time if the track contents were clicked, not the labels
        if (relativeDistance >= 0) {
            const newTime = Math.min(projectDuration, relativeDistance / pixelsPerSecond);
            setCurrTime(Math.max(0, newTime));
        }
    }

    // Handle the needle approaching the end of the viewable timeline
    useEffect(() => {
        const container = containerRef.current;

        if (!container) {
            return;
        }

        const needleXPosition = currTime * pixelsPerSecond;
        const left = container.scrollLeft;
        const right = container.scrollLeft + container.clientWidth;
        const scrollFromEndDist = 500;
        const scrollFromBeginningDist = 100;

        // Handle playing
        if (needleXPosition > right - scrollFromEndDist) {
            container.scrollLeft = needleXPosition - container.clientWidth + scrollFromEndDist;
        }

        // Handle rewinding
        if (needleXPosition < left + scrollFromBeginningDist) {
            container.scrollLeft = Math.max(0, needleXPosition - scrollFromBeginningDist);
        }

    }, [currTime, pixelsPerSecond]);

    return (
        <>
            <div className="flex border-2 border-gray-800 bg-gray-400 min-h-[100px]">
                <div className="w-24 shrink-0 bg-gray-900 text-white flex flex-col border-r border-gray-500 z-40">
                    <div
                        className="h-16 flex items-center justify-center font-bold text-[10px] border-b border-gray-700">ANNOTATIONS
                    </div>
                    <div
                        className="h-16 flex items-center justify-center font-bold text-[10px] border-b border-gray-700">VIDEOS
                    </div>
                    <div
                        className="h-16 flex items-center justify-center font-bold text-[10px] border-b border-gray-700">IMAGES
                    </div>
                    <div
                        className="h-16 flex items-center justify-center font-bold text-[10px] border-b border-gray-700">TRANSCRIPTS
                    </div>
                    <div
                        className="h-16 flex items-center justify-center font-bold text-[10px] border-b border-gray-700">AUDIO
                    </div>
                </div>

                <div
                    className="flex-1 overflow-x-auto relative cursor-pointer [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                    onClick={handleClick}
                    ref={containerRef}>

                    {/* The needle */}
                    <div className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-red-600 z-50 shadow-md"
                         style={{left: `${currTime * pixelsPerSecond}px`}}>
                    </div>

                    <div className="flex flex-col min-w-full"
                         style={{minWidth: `calc(100vw + ${(projectDuration * pixelsPerSecond) + 200}px)`}}>
                        <AnnotationTrack annotations={annotations} pixelsPerSecond={pixelsPerSecond} onEdit={onEditAnnotation}/>
                        <Track files={videoFiles} projectStartTime={projectStartTime} pixelsPerSecond={pixelsPerSecond}
                               onEdit={openEditor}/>
                        <Track files={imageFiles} projectStartTime={projectStartTime} pixelsPerSecond={pixelsPerSecond}
                               onEdit={openEditor}/>
                        <Track files={transcriptFiles} projectStartTime={projectStartTime}
                               pixelsPerSecond={pixelsPerSecond}
                               onEdit={openEditor}/>
                        <Track files={audioFiles} projectStartTime={projectStartTime}
                               pixelsPerSecond={pixelsPerSecond}
                               onEdit={openEditor}/>
                    </div>

                </div>
            </div>

            {editingFile && (
                <div className="modal-overlay">
                    <div className="modal-content w-full max-w-md">

                        {/* Top Layer */}
                        <div className="grid grid-cols-3 items-center border-b border-gray-300 pb-2 mb-4">
                            <div></div>

                            <div className="text-center">
                                <h2 className="text-lg font-bold">Edit File</h2>
                                <p className="text-sm text-gray-600 break-words">{editingFile.fileName}</p>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setEditingFile(null)}
                                    className="w-7 h-7 border border-gray-300 rounded hover:bg-gray-100 flex items-center justify-center text-sm">
                                    X
                                </button>
                            </div>

                        </div>


                        {/* Edits Layer */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Date</label>
                                <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)}
                                       className="w-full border border-gray-300 rounded px-2 py-1"/>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Time</label>
                                <input type="time" step="1" value={editTime}
                                       onChange={(e) => setEditTime(e.target.value)}
                                       className="w-full border border-gray-300 rounded px-2 py-1"/>
                            </div>

                            {editingFile.filePath.includes("/Images/") && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Duration (Seconds)</label>
                                    <input type="number" min="0" step="1" value={editDuration}
                                           onChange={(e) => setEditDuration(e.target.value)}
                                           className="w-full border border-gray-300 rounded px-2 py-1"/>
                                </div>
                            )}

                            <div className="flex justify-center">
                                <button type="button" onClick={saveEdit}
                                        className="regular-button flex items-center justify-center">
                                    Save
                                </button>
                            </div>

                        </div>

                    </div>


                </div>
            )}

        </>
    )

}