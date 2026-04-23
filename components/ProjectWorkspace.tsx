'use client';

import {useRef} from "react";
import Link from "next/link";
import {Annotation, AnnotationMediaLink, Code, MediaFile} from "@prisma/client";
import FileUploader from "@/components/FileUploadForm";
import FileViewer from "@/components/FileViewer";
import Themes from "@/components/Themes";
import PlaybackController, {PlaybackControllerHandle} from "@/components/PlaybackController";

interface EventType {
    id: number,
    name: string,
}

interface GroupType {
    id: number,
    name: string,
}

interface ProjectWorkspaceProps {
    projectId: number;
    projectStartTime: number;
    files: (MediaFile & {
        eventID: number | null;
        groupID: number | null;
        event: EventType | null;
        group: GroupType | null;
    })[];
    annotations: (Annotation & {
        code: Code;
        transcriptFile: MediaFile | null;
        mediaLinks: (AnnotationMediaLink & {
            mediaFile: MediaFile;
        })[];
    })[];
    events: EventType[];
    groups: GroupType[];
}

export default function ProjectWorkspace({projectId, projectStartTime, files, annotations, events, groups}: ProjectWorkspaceProps) {
    const playbackControllerRef = useRef<PlaybackControllerHandle>(null);

    return (
        <>
        <div className="grid grid-cols-3 items-center">
            <div className="flex justify-start gap-4">
                <Link href="/" className="regular-button">Projects</Link>
                <FileUploader projectId = {projectId} events={events} groups={groups}/>
                <FileViewer files={files} events={events} groups={groups}/>
            </div>

            <div className="text-center">
                <h1 className="text-4xl font-bold">Workspace</h1>
            </div>

            <div className="flex justify-end gap-3">
                <Themes projectID={projectId}/>

                <button type="button" className="regular-button"
                onClick={() => playbackControllerRef.current?.openAnnotationModal()}>+ Annotation</button>
            </div>
        </div>

            <div className="text-center">
                <p className="text-xl">Project ID: {projectId}</p>
            </div>

            <PlaybackController
                ref={playbackControllerRef}
                files={files}
                annotations={annotations}
                projectStartTime={projectStartTime}
                projectId={projectId}
                events={events}
                groups={groups}/>
        </>
    )
}