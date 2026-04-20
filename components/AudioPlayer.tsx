'use client';

import {useEffect, useRef} from "react";
import {useAtomValue} from "jotai";
import {currTimeAtom, playingAtom} from "@/app/atoms";
import {MediaFile} from "@prisma/client";

interface AudioPlayerProps {
    file: MediaFile;
    projectStartTime: number;
}

export default function AudioPlayer({file, projectStartTime}: AudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const currTime = useAtomValue(currTimeAtom);
    const playing = useAtomValue(playingAtom);
    const fileStartTime = new Date(file.creationTime).getTime();
    const offsetSecs = (fileStartTime - projectStartTime) / 1000;
    const targetTime = currTime - offsetSecs;

    useEffect(() => {
        const audio = audioRef.current;

        if (!audio)
        {
            return;
        }

        if (!playing) {
            audio.pause();
            return;
        }

        if (targetTime < 0 || targetTime > file.duration)
        {
            audio.pause();
            return;
        }

        const drift = Math.abs(audio.currentTime - targetTime);

        if (drift > 0.4)
        {
            audio.currentTime = Math.max(0, targetTime);
        }

        const playPromise = audio.play();

        if (playPromise) {
            playPromise.catch((error) => {
                console.error("Error playing audio: ", error);
            });
        }

    }, [targetTime, file.duration, playing]);

    return (
        <audio
            ref={audioRef}
            src={file.filePath}
            preload="auto"
            muted={false}
            hidden
        />
    )
}