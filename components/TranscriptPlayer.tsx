'use client';

import {useAtomValue, useSetAtom} from 'jotai';
import {currTimeAtom} from "@/app/atoms";
import {useEffect, useMemo, useRef, useState} from "react";
import {MediaFile} from '@prisma/client';

interface Props {
    file: MediaFile;
    projectStartTime: number;
}

interface Line {
    id: number;
    startTime: number;
    endTime: number;
    text: string;
}

export default function TranscriptPlayer({file, projectStartTime}:Props) {
    const [lines, setLines] = useState<Line[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const currTime = useAtomValue(currTimeAtom);
    const setTime = useSetAtom(currTimeAtom);
    const activeRef = useRef<HTMLDivElement>(null);

    function formatTime(totalSeconds: number) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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

    function parseTranscript(text: string): Line[] {
        const lines: Line[] = [];
        const regex = /\[([\d:]+)[ \-]+([\d:]+)]\s*([^\[]+)/g;
        let match;
        let index = 0;

        while ((match = regex.exec(text)) !== null)
        {
            const startTime = match[1];
            const endTime = match[2];
            const content = match[3].trim();

            if (content)
            {
                lines.push(
                    {
                        id: index++,
                        startTime: convertTimeToSeconds(startTime),
                        endTime: convertTimeToSeconds(endTime),
                        text: content
                    }
                );
            }
        }
        return lines;
    }

    useEffect(() => {
        if (!file)
        {
            return;
        }

        let fileActive = true;

        const getTranscript = async () => {
            try
            {
                const transcriptFile = await fetch(file.filePath);
                const transcriptText = await transcriptFile.text();
                const parsedLines = parseTranscript(transcriptText);

                if (fileActive)
                {
                    setLines(parsedLines);
                }
            }
            catch (error)
            {
                console.error("Couldn't load transcript" + file.fileName + ":" + error);
            }
        }

        getTranscript();

        return() => {
            fileActive = false;
        }


    }, [file]); // Run whenever the active transcript file changes




    const fileStartTime = new Date(file.creationTime).getTime();
    const offsetSeconds = (fileStartTime - projectStartTime) / 1000;
    const filePositionTime = currTime - offsetSeconds;

    // UseMemo only runs during renders which will be when the transcript is updated or search changes
    const searchedLines = useMemo(() => {
        if (!searchTerm.trim()) return lines; // Return as normal if nothing has been searched
        return lines.filter(line => line.text.toLowerCase().includes(searchTerm.toLowerCase()))
    }, [lines, searchTerm])

    const activeLine = lines.find(line => filePositionTime >= line.startTime && filePositionTime < line.endTime);
    const activeLineId = activeLine ? activeLine.id : null;

    // Auto scrolling - Gets disabled if a term has been searched
    useEffect(() => {
        if (activeRef.current && searchTerm === "") {
            activeRef.current.scrollIntoView({behavior: "smooth", block: "center"});
        }
    }, [activeLineId]);





    return (
        <div className="flex flex-col h-full w-full border">

            <div className="p-2 border-b border-gray-300 shrink-0 bg-gray-50">
                <input
                type = "text"
                placeholder = "Search the current transcript..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border-gray-300 rounded"/>
            </div>

            <div className="flex-1 overflow-y-auto">
                {searchedLines.length > 0 ? (
                    searchedLines.map((line) => {
                        const isCurrLine = filePositionTime >= line.startTime && filePositionTime < line.endTime;

                        return (
                            <div
                                key={line.id}
                                ref={isCurrLine ? activeRef : null}
                                onClick={() => setTime(line.startTime + offsetSeconds)}
                                className={`flex cursor-pointer transition-colors duration-200 border-b border-b-gray-300 border-l-4 ${
                                    isCurrLine
                                        ? "bg-blue-100 border-l-blue-500"
                                        : "hover:bg-gray-50 text-gray-600 border-l-transparent"
                                }`}
                            >

                                {/* Time Column */}
                                <div className="shrink-0 py-2 border-r border-gray-400 flex justify-center"
                                     style={{width: '50px'}}>
                                    <span className="text-xs">{formatTime(line.startTime)}</span>
                                </div>

                                {/* Line Contents Column */}
                                <div className="flex-1 py-2 pl-3 pr-2">
                                    <p className="text-xs">{line.text}</p>
                                </div>
                            </div>

                        );
                        })
                ) : (
                    <div className="flex h-full items-center justify-center text-gray-500">No results found.</div>
                )}



            </div>
        </div>
    )
}