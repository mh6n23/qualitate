'use client';

import {useAtomValue, useSetAtom} from 'jotai';
import {currTimeAtom} from "@/app/atoms";
import {useEffect, useRef} from "react";

const transcriptData = [
    {start: 0, end: 5, text: "Sample line 1"},
    {start: 5, end: 10, text: "Sample line 2"},
    {start: 10, end: 15, text: "Sample line 3" },
    {start: 20, end: 25, text: "Sample line 4"},
    {start: 25, end: 30, text: "Sample line 5"},
    {start: 35, end: 40, text: "Sample line 6" },
    {start: 40, end: 45, text: "Sample line 7"},
    {start: 45, end: 50, text: "Sample line 8" },

];

export default function TranscriptPlayer() {
    const currTime = useAtomValue(currTimeAtom);
    const setTime = useSetAtom(currTimeAtom);
    const scriptRef = useRef<HTMLDivElement>(null);

    function formatTime(seconds: number) {
        const minutes = Math.floor(seconds/60);
        const remSeconds = Math.floor(seconds%60);
        return `${minutes}:${remSeconds.toString().padStart(2, "0")}`;
    }

    useEffect(() => {
        if (scriptRef.current) {
            scriptRef.current.scrollIntoView({behavior: "smooth", block: "center"});
        }
    }, [currTime]);

    return (
        <div className="flex flex-col h-[500px] border">
            <div>
                Transcript
            </div>
            <div className="flex-1 overflow-y-auto">
                {
                    transcriptData.map((line, index) => {
                        const isCurrLine = currTime >= line.start && currTime <= line.end;

                        return (
                            <div
                            key={index}
                            ref={isCurrLine ? scriptRef : null}
                            onClick={() => setTime(line.start)}
                            className={`transition-colors duration-200 ${
                                isCurrLine
                                    ? "bg-blue-100 border-l-4 border-blue-500"
                                    : "hover:bg-gray-50 text-gray-600"
                            }`}
                            >

                                <span className="text-xs">{formatTime(line.start)}</span>
                                <p className="text-xs">{line.text}</p>
                            </div>
                        );
                    })
                }
            </div>

        </div>
    )
}