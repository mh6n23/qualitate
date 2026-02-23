'use client'

import {useAtom} from 'jotai';
import {currTimeAtom, playingAtom, playSpeedAtom} from "@/app/atoms";
import {useEffect, useRef} from "react";
import {apply} from "effect/Function";

export default function PlaybackRemote({projectStartTime}:{projectStartTime:number}) {
    const [currTime, setCurrTime] = useAtom(currTimeAtom);
    const [isPlaying, setIsPlaying] = useAtom(playingAtom);
    const [playSpeed, setPlaySpeed] = useAtom(playSpeedAtom);

    const reqRef = useRef<number>(null);
    const prevTimeRef = useRef<number>(null);
    const speedChange = 5;

    const date = new Date(projectStartTime + currTime * 1000);
    const displayTime = date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    const animate = (time: number) => {
        if (prevTimeRef.current !== null) {
            // Find difference in time from last frame
            const changeInTime = (time - prevTimeRef.current) / 1000;

            // Update Jotai Atom
            setCurrTime(previousTime => previousTime + (changeInTime * playSpeed));
        }
        // Store the current time for the next time this function is run
        prevTimeRef.current = time;

        // Schedule next frame
        reqRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        if (currTime === 0)
        {
            setCurrTime(0)
        }
    }, [projectStartTime]);

    useEffect(() => {
        if (isPlaying)
        {
            // Begin frame
            reqRef.current = requestAnimationFrame(animate);
        }
        else
        {
            if (reqRef.current)
            {
                // Stop calling animation function
                cancelAnimationFrame(reqRef.current);
                prevTimeRef.current = null;
            }
        }

        return () => {
            if (reqRef.current)
            {
                cancelAnimationFrame(reqRef.current);
            }
        }

    }, [isPlaying, playSpeed]);

    const changeSpeed = (newSpeed: number) => {
        if (playSpeed === newSpeed) {
            // Reset if the same button is pressed again
            setPlaySpeed(1);
        }
        else
        {
            setPlaySpeed(newSpeed);

            if (!isPlaying)
            {
                setIsPlaying(true);
            }
        }
    }

    return (
        <div className={"flex flex-col w-full bg-gray-700 p-1 border-2 border-gray-800"}>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    {/* Rewind Button */}
                    <button
                        onClick={() => changeSpeed(-speedChange)}
                        className={`text-white w-12 h-12 flex items-center justify-center bg-blue-600  hover:bg-blue-500  transition-all active:scale-95 shadow-lg ${
                        playSpeed === -speedChange ? 'scale-85' : 'scale-100'}`}>
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/>
                        </svg>
                    </button>

                    {/* Pause Button */}
                    <button
                        onClick={() => {
                            if (!isPlaying) {
                                setPlaySpeed(1);
                            }
                            setIsPlaying(!isPlaying)}}
                        className="w-12 h-12 flex items-center justify-center bg-blue-600  hover:bg-blue-500  transition-all active:scale-95 shadow-lg">
                        {isPlaying ?
                            (<div className="flex gap-1.5">
                                <div className="w-1.5 h-5 bg-white rounded-full"></div>
                                <div className="w-1.5 h-5 bg-white rounded-full"></div></div>)
                            : (<div className="ml-1 w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-white border-b-[10px] border-b-transparent"></div>)}
                    </button>

                    {/* Fast Fprward Button */}
                    <button
                        onClick={() => changeSpeed(speedChange)}
                        className={`text-white w-12 h-12 flex items-center justify-center bg-blue-600  hover:bg-blue-500  transition-all active:scale-95 shadow-lg ${
                            playSpeed === speedChange ? 'scale-85' : 'scale-100'}`}>
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M13 6v12l8.5-6L13 6zM4.5 18l8.5-6-8.5-6v12z"/>
                        </svg>
                    </button>
                </div>

                <div className="text-white">
                    {displayTime}
                </div>

                <input
                    type="range"
                    min="0"
                    max="300"
                    step="0.01"
                    value={currTime}
                    onChange={(e) => setCurrTime(parseFloat(e.target.value))}
                    className="flex-1 h-1.5 bg-black rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
                    />


            </div>
        </div>
    );
}