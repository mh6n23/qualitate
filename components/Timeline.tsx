'use client';

import {useRef, useEffect} from 'react';
import {useAtom} from 'jotai';
import {currTimeAtom, pixelsPerSecondAtom} from "@/app/atoms";
import {MediaFile} from "@prisma/client";


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
    <div className="absolute top-1/2 -translate-y-1/2 h-10 bg-blue-600 rounded text-white text-[10px] truncate px-1 flex items-center"
    style={{
        left: `${position}px`,
        width: `${width}px`
    }}>
        {file.fileName}
    </div>
    )
}

function Track({files, projectStartTime, pixelsPerSecond} : {files: MediaFile[], projectStartTime: number, pixelsPerSecond: number})
{
    return (
        <div className="relative h-16 border-b border-gray-500 w-full">
            {files.map((file, i) => (
                <FileBlock
                    key={file.id}
                    file={file}
                    projectStartTime={projectStartTime}
                    pixelsPerSecond={pixelsPerSecond}/>))}
        </div>
    )
}

export default function Timeline({files, projectStartTime}:TimelineProps)
{
    // Default for now but i'll allow it to be changed later
    const [pixelsPerSecond] = useAtom(pixelsPerSecondAtom);

    const [currTime, setCurrTime] = useAtom(currTimeAtom);
    const containerRef = useRef<HTMLDivElement>(null);

    const videoFiles = files.filter(f => f.filePath.includes("/Videos/"));
    const imageFiles = files.filter(f => f.filePath.includes("/Images/"));
    const transcriptFiles = files.filter(f => f.filePath.includes("/Transcripts/"));

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const location = target.getBoundingClientRect();
        const relativeDistance = (e.clientX - location.left) + target.scrollLeft;

        // Only change the time if the track contents were clicked, not the labels
        if (relativeDistance >= 0)
        {
            const newTime = relativeDistance / pixelsPerSecond;
            setCurrTime(newTime);
        }
    }

    // Handle the needle approaching the end of the viewable timeline
    useEffect(() => {
        const container = containerRef.current;

        if (!container)
        {
            return;
        }

        const needleXPosition = currTime * pixelsPerSecond;
        const left = container.scrollLeft;
        const right = container.scrollLeft + container.clientWidth;
        const scrollFromEndDist = 500;
        const scrollFromBeginningDist = 100;

        // Handle playing
        if (needleXPosition > right - scrollFromEndDist)
        {
            container.scrollLeft = needleXPosition - container.clientWidth + scrollFromEndDist;
        }

        // Handle rewinding
        if (needleXPosition < left + scrollFromBeginningDist)
        {
            container.scrollLeft = Math.max(0, needleXPosition - scrollFromBeginningDist);
        }

    }, [currTime, pixelsPerSecond]);

    return(
        <div className="flex border-2 border-gray-800 bg-gray-400 min-h-[100px]">
            <div className="w-24 shrink-0 bg-gray-900 text-white flex flex-col border-r border-gray-500 z-40">
                <div className="h-16 flex items-center justify-center font-bold text-[10px] border-b border-gray-700">VIDEOS</div>
                <div className="h-16 flex items-center justify-center font-bold text-[10px] border-b border-gray-700">IMAGES</div>
                <div className="h-16 flex items-center justify-center font-bold text-[10px] border-b border-gray-700">TRANSCRIPTS</div>
            </div>

            <div className="flex-1 overflow-x-auto relative cursor-pointer [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                 onClick={handleClick}
                 ref={containerRef}>

                {/* The needle */}
                <div className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-red-600 z-50 shadow-md"
                     style={{left:`${currTime * pixelsPerSecond}px`}}>
                </div>

                <div className="flex flex-col min-w-full"
                     style={{minWidth: `calc(100vw + ${(currTime * pixelsPerSecond) + 800}px)`}}>
                    <Track files={videoFiles} projectStartTime={projectStartTime} pixelsPerSecond={pixelsPerSecond}/>
                    <Track files={imageFiles} projectStartTime={projectStartTime} pixelsPerSecond={pixelsPerSecond}/>
                    <Track files={transcriptFiles} projectStartTime={projectStartTime} pixelsPerSecond={pixelsPerSecond}/>
                </div>

            </div>
        </div>
    )

}