'use client';

import {useAtomValue} from 'jotai';
import {currTimeAtom} from "@/app/atoms";
import {returns} from "valibot";
import {MediaFile} from "@prisma/client";

const pixelsPerSecond = 10;

interface TimelineProps
{
    files: MediaFile[];
}

function FileBlock({file, index} : {file: MediaFile, index: number})
{
    return (
    <div className="absolute h-8 text-[10px] truncate px-1"
    style={{
        left: `${index * 110} px`,
        width: "100px"
    }}>
        {file.fileName}
    </div>
    )
}

function Track({label, files} : {label: string, files: MediaFile[]})
{
    return (<div className="flex border-b h-10 items-center">
        <div className="w-24 shrink-0 font-bold text-[10px] border-r h-full flex items-center px-2">
            {label}
        </div>

        <div className="relative flex-1 h-full overflow-hidden">
            {files.map((file, i) => (
                <FileBlock key={file.id} file={file} index={i}></FileBlock>
            ))}
        </div>
    </div>)

}

export default function Timeline({files}:TimelineProps)
{
    const currTime = useAtomValue(currTimeAtom);

    const videoFiles = files.filter(f => f.filePath.includes("/Videos"));
    const imageFiles = files.filter(f => f.filePath.includes("/Images"));
    const transcriptFiles = files.filter(f => f.filePath.includes("/Transcripts"));

    return(
        <div className="bg-gray-400 border-t border-gray-800 p-4 h-64 overflow-x-auto relative">
            <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-50"
            style={{left:`calc(50px + ${currTime * pixelsPerSecond})`}}></div>

            <div className="space-y-4 min-w-max ml-[50px]">
                <Track label="VIDEOS" files={videoFiles}/>
                <Track label="IMAGES" files={videoFiles}/>
                <Track label="TEXT" files={videoFiles}/>
            </div>
        </div>


    )

}