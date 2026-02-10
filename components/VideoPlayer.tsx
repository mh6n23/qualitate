'use client';

import {useAtomValue, useSetAtom} from 'jotai';
import {currTimeAtom, playingAtom} from "@/app/atoms";
import {useEffect, useRef} from 'react';

export default function VideoPlayer({videoSource}: {videoSource: string}) {
    const setTime = useSetAtom(currTimeAtom);
    const setPlaying = useSetAtom(playingAtom);
    const currTime = useAtomValue(currTimeAtom);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Runs whenever currTimeAtom changes
    useEffect(() => {
        if (videoRef.current)
        {
            if (Math.abs(videoRef.current.currentTime - currTime) > 0.5)
            {
                videoRef.current.currentTime = currTime
            }
        }
    }, [currTime]);

    return (
        <video
            className="w-full h-auto"
        ref={videoRef}
        src={videoSource}
        controls
        onTimeUpdate={() => {
            if (videoRef.current) {
                setTime(videoRef.current.currentTime);
            }
        }}
        // Update the states so that the other data streams will pause/play at the same time
        onPlay = {() => setPlaying(true)}
        onPause = {() => setPlaying(false)}/>
    );

}