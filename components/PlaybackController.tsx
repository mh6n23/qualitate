'use client';

import {useAtomValue} from 'jotai';
import {currTimeAtom} from '@/app/atoms';
import {MediaFile} from '@prisma/client'
import VideoPlayer from '@/components/VideoPlayer';
import TranscriptPlayer from '@/components/TranscriptPlayer';
import Timeline from '@/components/Timeline';
import PlaybackRemote from "@/components/PlaybackRemote";

interface PlaybackControllerProps {
    files: MediaFile[];
    projectStartTime: number;
}

export default function PlaybackController({files, projectStartTime}: PlaybackControllerProps) {
    const currentTime = useAtomValue(currTimeAtom);
    const playNeedle = projectStartTime + (currentTime * 1000);

    const getCurrentFile = (folder: string) => {
        return files.find(file => {
            if (!file.filePath.includes(folder)) {
                return false;
            }

            const startTime = new Date(file.creationTime).getTime();
            const duration = file.duration > 0 ? (file.duration * 1000) : 10000;
            const endTime = startTime + duration;

            return playNeedle >= startTime && playNeedle <= endTime;
        })
    }

    const currentVideo = getCurrentFile("/Videos");
    const currentImage = getCurrentFile("/Images");
    const currentTranscript = getCurrentFile("/Transcripts");

    return (
        <div className = "flex flex-col w-full mt-4">

            {/* Divide page into 3 columns */}
            <div className="grid grid-cols-3 gap-4 h-100">

                {/* Video Player */}
                <div className = "flex flex-col gap-2 h-full">
                    <div className="text-sm font-semibold text-gray-600 text-center truncate px-2">
                        {currentVideo ? currentVideo.fileName : "Video Stream"}
                    </div>
                    <div className="bg-black flex flex-1 flex-col items-center justify-center rounded border border-gray-700 relative overflow-hidden">
                        {currentVideo ?
                            (<VideoPlayer key={currentVideo.id} videoSource={currentVideo.filePath}/>)
                            : (<div className="text-gray-500">No Video Exists at this Timestamp</div>)
                        }
                    </div>
                </div>

                {/* Image Viewer */}
                <div className = "flex flex-col gap-2 h-full">
                    <div className="text-sm font-semibold text-gray-600 text-center truncate px-2">
                        {currentImage ? currentImage.fileName : "Image Stream"}
                    </div>
                    <div className="bg-gray-200 flex flex-1 flex-col items-center justify-center rounded border border-gray-400 relative overflow-hidden p-2">
                        {currentImage ? (<img src={currentImage.filePath} className="max-w-full max-h-full object-contain"/>)
                            : (<div className="text-gray-500">No Image Exists at this Timestamp</div>)
                        }
                    </div>
                </div>

                {/* Transcript Viewer */}
                <div className = "flex flex-col gap-2 h-full">
                    <div className="text-sm font-semibold text-gray-600 text-center truncate px-2">
                        {currentTranscript ? currentTranscript.fileName : "Transcript Stream"}
                    </div>
                    <div className="bg-gray-50 flex flex-1 flex-col items-center justify-center rounded border border-gray-300 overflow-y-auto">
                        <TranscriptPlayer/>
                    </div>
                </div>
            </div>

            <div className="mt-4">
                <PlaybackRemote projectStartTime={projectStartTime}/>
            </div>

            <div className="w-full border-t border-gray-300">
                <Timeline files={files} projectStartTime={projectStartTime}/>
            </div>
        </div>
    )
}