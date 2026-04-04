'use client';

import {useAtomValue} from 'jotai';
import {currTimeAtom} from '@/app/atoms';
import {MediaFile, Code} from '@prisma/client'
import VideoPlayer from '@/components/VideoPlayer';
import TranscriptPlayer from '@/components/TranscriptPlayer';
import Timeline from '@/components/Timeline';
import PlaybackRemote from "@/components/PlaybackRemote";
import {useEffect, useState} from "react";

interface PlaybackControllerProps {
    files: MediaFile[];
    projectStartTime: number;
    projectId: number;
}

export default function PlaybackController({files, projectStartTime, projectId}: PlaybackControllerProps) {
    const currentTime = useAtomValue(currTimeAtom);
    const playNeedle = projectStartTime + (currentTime * 1000);

    const [isAnnotationModalOpen, setIsAnnotationModalOpen] = useState(false);

    //Used to handle just the transcript selection
    const [selectedTranscriptAnnotation, setSelectedTranscriptAnnotation] = useState<{
        transcriptFileID: number;
        transcriptStartLine: number;
        transcriptEndLine: number;
        startTime: number;
        endTime: number;
        selectedText: string;
    } | null>(null);
    const [codes, setCodes] = useState<Code[]>([]);

    //Used to handle the full annotation which includes the transcript selection
    const [annotationInProgress, setAnnotationInProgress] = useState({
        codeID: null as number | null,
        note: "",
        startTime: 0,
        endTime: 0,
        transcriptFileID: null as number | null,
        transcriptStartLine: null as number | null,
        transcriptEndLine: null as number | null,
        selectedText: "",
        linkedMediaFileIDs: [] as number[]
    });

    const [newCode, setNewCode] = useState({
        name: "",
        description: "",
        colour: "#ffffff"
    });

    useEffect(() => {
        const retreiveCodes = async () => {
            try {
                const response = await fetch(`/api/projects/${projectId}/codes`)

                if (!response.ok) {
                    throw new Error("Couldn't fetch existing codes");
                }

                const codes = await response.json();
                setCodes(codes);
            } catch (error) {
                console.error(error);
            }
        };
        retreiveCodes();
    }, [projectId])

    function handleTranscriptSelection(selectedText:  {
        transcriptFileID: number;
        transcriptStartLine: number;
        transcriptEndLine: number;
        startTime: number;
        endTime: number;
        selectedText: string;
    }) {
        setSelectedTranscriptAnnotation(selectedText);
        setAnnotationInProgress({
            codeID: null,
            note: "",
            startTime: selectedText.startTime,
            endTime: selectedText.endTime,
            transcriptFileID: selectedText.transcriptFileID,
            transcriptStartLine: selectedText.transcriptStartLine,
            transcriptEndLine: selectedText.transcriptEndLine,
            selectedText: selectedText.selectedText,
            linkedMediaFileIDs: []
        });
        setIsAnnotationModalOpen(true);
    }



    const getCurrentFile = (folder: string) => {
        return files.find(file => {
            if (!file.filePath.includes(folder)) {
                return false;
            }

            const startTime = new Date(file.creationTime).getTime();
            let duration = file.duration > 0 ? (file.duration * 1000) : 10000;

            if (folder === "/Transcripts") {
                duration = 86400000;
            }

            const endTime = startTime + duration;

            return playNeedle >= startTime && playNeedle <= endTime;
        })
    }

    const currentVideo = getCurrentFile("/Videos");
    const currentImage = getCurrentFile("/Images");
    const currentTranscript = getCurrentFile("/Transcripts");

    const videoFiles = files.filter(f => f.filePath.includes("/Videos"));

    // Default until changed by end time of final video (for now)
    let projectDurationSecs = 10;
    if (videoFiles.length > 0) {
        // Sort videos in descending order
        const sortedVids = [...videoFiles].sort((a, b) =>
            new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime());

        // Grab last video
        const lastVideo = sortedVids[0];

        const lastVidStartTime = new Date(lastVideo.creationTime).getTime();
        const lastVidDuration = lastVideo.duration > 0 ?
            (lastVideo.duration * 1000) : 10000;

        const projectEndTime = lastVidStartTime + lastVidDuration;
        projectDurationSecs = (projectEndTime - projectStartTime) / 1000;
    }

    return (
        <div className="flex flex-col w-full mt-4">

            {/* Divide page into 3 columns */}
            <div className="grid grid-cols-3 gap-4 h-100">

                {/* Video Player */}
                <div className="flex flex-col gap-2 h-full">
                    <div className="text-sm font-semibold text-gray-600 text-center truncate px-2">
                        {currentVideo ? currentVideo.fileName : "Video Stream"}
                    </div>
                    <div
                        className="bg-black flex flex-1 flex-col items-center justify-center rounded border border-gray-700 relative overflow-hidden">
                        {currentVideo ?
                            (<VideoPlayer key={currentVideo.id} file={currentVideo}
                                          projectStartTime={projectStartTime}/>)
                            : (<div className="text-gray-500">No Video Exists at this Timestamp</div>)
                        }
                    </div>
                </div>

                {/* Image Viewer */}
                <div className="flex flex-col gap-2 h-full">
                    <div className="text-sm font-semibold text-gray-600 text-center truncate px-2">
                        {currentImage ? currentImage.fileName : "Image Stream"}
                    </div>
                    <div
                        className="bg-gray-200 flex flex-1 flex-col items-center justify-center rounded border border-gray-400 relative overflow-hidden p-2">
                        {currentImage ? (
                                <img src={currentImage.filePath} className="max-w-full max-h-full object-contain"/>)
                            : (<div className="text-gray-500">No Image Exists at this Timestamp</div>)
                        }
                    </div>
                </div>

                {/* Transcript Viewer */}
                <div className="flex flex-col gap-2 h-full">
                    <div className="text-sm font-semibold text-gray-600 text-center truncate px-2">
                        {currentTranscript ? currentTranscript.fileName : "Transcript Stream"}
                    </div>
                    <div
                        className="bg-gray-50 flex flex-1 flex-col items-center justify-center rounded border border-gray-300 overflow-y-auto">
                        {currentTranscript ? (<TranscriptPlayer key={currentTranscript.id}
                                                                file={currentTranscript}
                                                                projectStartTime={projectStartTime}
                                                                onCreateAnnotation={handleTranscriptSelection}/>) :
                            (<div className="text-gray-500">No Transcript Exists at this Timestamp</div>)}
                    </div>
                </div>
            </div>

            <div className="mt-4">
                <PlaybackRemote projectStartTime={projectStartTime} projectDuration={projectDurationSecs}/>
            </div>

            <div className="w-full border-t border-gray-300">
                <Timeline files={files} projectStartTime={projectStartTime}/>
            </div>
        </div>
    )
}