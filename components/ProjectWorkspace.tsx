'use client';

import {useRef} from "react";
import {Annotation, AnnotationMediaLink, Code, MediaFile} from "@prisma/client";
import FileUploader from "@/components/FileUploadForm";
import FileViewer from "@/components/FileViewer";
import Themes from "@/components/Themes";
import PlaybackController, {PlaybackControllerHandle} from "@/components/PlaybackController";

interface ProjectWorkspaceProps {
    projectId: number;
    projectStartTime: number;
    files: MediaFile[];
    annotations: (Annotation & {
        code: Code;
        mediaLinks: (AnnotationMediaLink & {
            mediaFile: MediaFile;
        })[];
    })[];
}

export default function ProjectWorkspace({projectId, projectStartTime, files, annotations}: ProjectWorkspaceProps) {
    const playbackControllerRef = useRef<PlaybackControllerHandle>(null);

    return (
        <>
        <div className="grid grid-cols-3 items-center">
            <div className="flex justify-start gap-4">
                <FileUploader projectId = {projectId}/>
                <FileViewer files={files}/>
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

            <PlaybackController ref={playbackControllerRef} files={files} annotations={annotations} projectStartTime={projectStartTime} projectId={projectId}/>
        </>
    )
}