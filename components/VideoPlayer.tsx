'use client';

import {useAtomValue, useSetAtom} from 'jotai';
import {currTimeAtom, playingAtom} from "@/app/atoms";
import {useEffect, useRef} from 'react';
import {MediaFile} from '@prisma/client';

interface Props {
    file: MediaFile;
    projectStartTime: number;
}

export default function VideoPlayer({file, projectStartTime}: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const playing = useAtomValue(playingAtom);
    const currTime = useAtomValue(currTimeAtom);

    useEffect(() => {
        const video = videoRef.current;

        if (!video)
        {
            return;
        }

        if (playing)
        {
            video.play();
        }
        else
        {
            video.pause();
        }
    }, [playing]);

    useEffect(() => {
        const video = videoRef.current;

        if (!video)
        {
            return;
        }

        const playPosition = projectStartTime + (currTime * 1000);
        const videoStartPosition = new Date(file.creationTime).getTime();
        const videoPlayPosition = (playPosition - videoStartPosition) / 1000;

        // Check video position if it is massively out of sync.
        if (Math.abs(video.currentTime - videoPlayPosition) > 0.25)
        {
            video.currentTime = videoPlayPosition;
        }
    }, [currTime, file.creationTime, projectStartTime]);

    return (
        <video
            ref={videoRef}
            src={file.filePath}
            className="w-full h-full object-contain"
        />
    );

}