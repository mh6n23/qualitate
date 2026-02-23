'use client';

import {useAtomValue} from 'jotai';
import {currTimeAtom} from "@/app/atoms";
import {returns} from "valibot";
import {MediaFile} from "@prisma/client";

const pixelsPerSecond = 10;

interface TimelineProps
{
    files: MediaFile[];
    projectStartTime: number;
}

function FileBlock({file, projectStartTime, pixelsPerSecond} : {file: MediaFile, projectStartTime: number, pixelsPerSecond: number})
{
    const fileStartTime = new Date(file.creationTime).getTime();
    const offsetSeconds = Math.max(0, (fileStartTime - projectStartTime) / 1000);
    const position = offsetSeconds * pixelsPerSecond;

    // 20 is placeholder now for images
    const shownDuration = file.duration > 0 ? file.duration : 10;
    const width = shownDuration * pixelsPerSecond;

    return (
    <div className="absolute h-8 bg-blue-600 rounded text-white text-[10px] truncate px-1 flex items-center"
    style={{
        left: `${position}px`,
        width: `${width}px`
    }}>
        {file.fileName}
    </div>
    )
}

function Track({label, files, projectStartTime, pixelsPerSecond} : {label: string, files: MediaFile[], projectStartTime: number, pixelsPerSecond: number})
{
    return (<div className="flex border-b h-16 items-center">
        <div className="w-24 shrink-0 font-bold text-[10px] border-r border-gray-500 h-full flex items-center px-2">
            {label}
        </div>

        <div className="relative flex-1 h-full overflow-hidden">
            {files.map((file, i) => (
                <FileBlock
                    key={file.id}
                    file={file}
                    projectStartTime={projectStartTime}
                    pixelsPerSecond={pixelsPerSecond}/>
            ))}
        </div>
    </div>)

}

export default function Timeline({files, projectStartTime}:TimelineProps)
{
    // Default for now but i'll allow it to be changed later
    const pixelsPerSecond = 20;

    const currTime = useAtomValue(currTimeAtom);

    const videoFiles = files.filter(f => f.filePath.includes("/Videos/"));
    const imageFiles = files.filter(f => f.filePath.includes("/Images/"));
    const transcriptFiles = files.filter(f => f.filePath.includes("/Transcripts/"));

    return(
        <div className="bg-gray-400 border-2 border-gray-800 overflow-x-auto relative min-h-[100px]">

            {/* The needle */}
            <div className="absolute top-0 bottom-0 w-0.5 bg-red-600 z-50 shadow-md"
            style={{left:`calc(96px + ${currTime * pixelsPerSecond}px)`}}></div>

            <div className="flex flex-col min-w-full">
                <Track label="VIDEOS" files={videoFiles} projectStartTime={projectStartTime} pixelsPerSecond={pixelsPerSecond}/>
                <Track label="IMAGES" files={imageFiles} projectStartTime={projectStartTime} pixelsPerSecond={pixelsPerSecond}/>
                <Track label="TRANSCRIPTS" files={transcriptFiles} projectStartTime={projectStartTime} pixelsPerSecond={pixelsPerSecond}/>
            </div>
        </div>


    )

}