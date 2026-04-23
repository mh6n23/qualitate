'use client';

import {useAtomValue} from 'jotai';
import {currTimeAtom} from '@/app/atoms';
import {MediaFile, Code, Annotation, AnnotationMediaLink} from '@prisma/client'
import VideoPlayer from '@/components/VideoPlayer';
import TranscriptPlayer from '@/components/TranscriptPlayer';
import AudioPlayer from '@/components/AudioPlayer';
import Timeline from '@/components/Timeline';
import PlaybackRemote from "@/components/PlaybackRemote";
import {forwardRef, useCallback, useEffect, useImperativeHandle, useState} from "react";
import {useRouter} from "next/navigation";

interface PlaybackControllerProps {
    files: (MediaFile & {
        eventID: number | null;
        groupID: number | null;
    })[];
    annotations: (Annotation & {
        code: Code;
        transcriptFile: MediaFile | null;
        mediaLinks: (AnnotationMediaLink & {
            mediaFile: MediaFile;
        })[];
    })[];
    projectStartTime: number;
    projectId: number;
    events: EventType[];
    groups: GroupType[];
}

export interface PlaybackControllerHandle {
    openAnnotationModal: () => void;
}

interface EventType {
    id: number,
    name: string;
}

interface GroupType {
    id: number;
    name: string;
}

const PlaybackController = forwardRef<PlaybackControllerHandle, PlaybackControllerProps>(
    function PlaybackController({files, annotations, projectStartTime, projectId, events, groups}, ref) {
        const currentTime = useAtomValue(currTimeAtom);

        const [isAnnotationModalOpen, setIsAnnotationModalOpen] = useState(false);
        const [modalMode, setModalMode] = useState<"create" | "edit">("create");
        const [editedAnnotationID, setEditedAnnotationID] = useState<number | null>(null);

        const [selectedEventID, setSelectedEventID] = useState<number | null>(events[0]?.id ?? null);
        const [selectedGroupID, setSelectedGroupID] = useState<number | null>(groups[0]?.id ?? null);

        useEffect(() => {
            if (selectedEventID == null && events.length > 0) {
                setSelectedEventID(events[0].id);
            }
        }, [events, selectedEventID]);

        useEffect(() => {
            if (selectedGroupID == null && groups.length > 0) {
                setSelectedGroupID(groups[0].id);
            }
        }, [groups, selectedGroupID]);

        //Used to handle just the transcript selection
        const [selectedTranscriptAnnotation, setSelectedTranscriptAnnotation] = useState<{
            transcriptFileID: number;
            transcriptStartLine: number;
            transcriptEndLine: number;
            startTime: number;
            endTime: number;
            selectedText: string;
            startOffset: number;
            endOffset: number;
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
            transcriptStartOffset: null as number | null,
            transcriptEndOffset: null as number | null,
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

        const handleTranscriptSelection = useCallback((selectedText: {
            transcriptFileID: number;
            transcriptStartLine: number;
            transcriptEndLine: number;
            startTime: number;
            endTime: number;
            selectedText: string;
            startOffset: number;
            endOffset: number;
        } | null) => {

            if (selectedText === null) {
                if (!isAnnotationModalOpen) {
                    setSelectedTranscriptAnnotation(null);
                }
                return;
            }

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
                transcriptStartOffset: selectedText.startOffset,
                transcriptEndOffset: selectedText.endOffset,
                linkedMediaFileIDs: []
            });
        }, [isAnnotationModalOpen]);

        function closeAnnotationModal() {
            setIsAnnotationModalOpen(false);
            setSelectedTranscriptAnnotation(null);
            setModalMode("create");
            setEditedAnnotationID(null);
        }

        useImperativeHandle(ref, () => ({
            openAnnotationModal: handleOpenAnnotationModal
        }));

        const viewableFiles = files.filter((file) => {
            if (selectedEventID == null || selectedGroupID == null) {
                return false;
            }

            return file.eventID === selectedEventID && file.groupID === selectedGroupID;
        })

        const viewableAnnotations = annotations.filter((annotation) => {
            if (selectedEventID == null || selectedGroupID == null) {
                return false;
            }

            return annotation.eventID === selectedEventID && annotation.groupID === selectedGroupID;
        })

        function getFileStartTime(file: MediaFile) {
            return new Date(file.creationTime).getTime();
        }

        function getFileDuration(file: MediaFile) {
            if (file.duration > 0) {
                return file.duration * 1000;
            }

            if (file.filePath.includes("/Images")) {
                // Default value
                return 10000;
            }

            return 0;
        }

        function getFileEndTime(file: MediaFile) {
            return getFileStartTime(file) + getFileDuration(file);
        }

        const durationFiles = viewableFiles.filter((file) => getFileDuration(file) > 0);

        const viewableStartTime = viewableFiles.length > 0
            ? Math.min(...viewableFiles.map((file) => getFileStartTime(file)))
            : projectStartTime;
        let viewableEndTime = viewableStartTime + 10000;

        if (durationFiles.length > 0) {
            viewableEndTime = Math.max(...durationFiles.map((file) => getFileEndTime(file)))
        } else if (viewableFiles.length > 0) {
            viewableEndTime = Math.max(...viewableFiles.map((file) => getFileStartTime(file) + 10000));
        }

        const playNeedle = viewableStartTime + (currentTime * 1000);
        const projectDurationSecs = Math.max(0, (viewableEndTime - viewableStartTime) / 1000);

        const getCurrentFiles = (folder: string) => {
            return viewableFiles.filter((file) => {
                if (!file.filePath.includes(folder)) {
                    return false;
                }

                const startTime = getFileStartTime(file);
                const endTime = getFileEndTime(file);

                return playNeedle >= startTime && playNeedle <= endTime;
            })
        }

        const getCurrentFile = (folder: string) => {
            const activeFiles = viewableFiles.filter((file) => {
                if (!file.filePath.includes(folder)) {
                    return false;
                }

                const startTime = getFileStartTime(file);
                const endTime = getFileEndTime(file);

                return playNeedle >= startTime && playNeedle <= endTime;
            }).sort((a, b) => getFileStartTime(b) - getFileStartTime(a))

            return activeFiles[0];
        }

        const currentVideo = getCurrentFile("/Videos");
        const currentImage = getCurrentFile("/Images");
        const currentTranscript = getCurrentFile("/Transcripts");
        const currentAudioFiles = getCurrentFiles("/Audio");






        function handleOpenAnnotationModal() {
            if (!selectedTranscriptAnnotation) {
                alert("No transcript lines have been selected for an annotation.")
                return;
            }

            setModalMode("create");
            setEditedAnnotationID(null);

            setAnnotationInProgress({
                codeID: null,
                note: "",
                startTime: selectedTranscriptAnnotation.startTime,
                endTime: selectedTranscriptAnnotation.endTime,
                transcriptFileID: selectedTranscriptAnnotation.transcriptFileID,
                transcriptStartLine: selectedTranscriptAnnotation.transcriptStartLine,
                transcriptEndLine: selectedTranscriptAnnotation.transcriptEndLine,
                selectedText: selectedTranscriptAnnotation.selectedText,
                transcriptStartOffset: selectedTranscriptAnnotation.startOffset,
                transcriptEndOffset: selectedTranscriptAnnotation.endOffset,
                linkedMediaFileIDs: getDefaultLinkedMediaFiles()
            });

            setIsAnnotationModalOpen(true);
        }

        function handleEditExisting(annotationID: number) {
            const annotation = annotations.find((item) => item.id === annotationID);

            if (!annotation) {
                alert("Annotation not found");
                return;
            }

            setModalMode("edit");
            setEditedAnnotationID(annotation.id);

            setAnnotationInProgress({
                codeID: annotation.codeID,
                note: "",
                startTime: annotation.startTime,
                endTime: annotation.endTime,
                transcriptFileID: annotation.transcriptFileID,
                transcriptStartLine: annotation.transcriptStartLine,
                transcriptEndLine: annotation.transcriptEndLine,
                selectedText: annotation.selectedText ?? "",
                transcriptStartOffset: annotation.transcriptStartOffset,
                transcriptEndOffset: annotation.transcriptEndOffset,
                linkedMediaFileIDs: annotation.mediaLinks.map((link) => link.mediaFileID)
            });

            setIsAnnotationModalOpen(true);
        }

        function getDefaultLinkedMediaFiles() {
            return viewableFiles
                .filter((file) => {
                    const fileStart = getFileStartTime(file);
                    const fileEnd = getFileEndTime(file);
                    const absoluteCurrentTime = viewableStartTime + currentTime * 1000;
                    return absoluteCurrentTime >= fileStart && absoluteCurrentTime <= fileEnd;
                })
                .map((file) => file.id);
        }

        async function handleCodeCreation() {
            if (!newCode.name.trim()) {
                alert("You haven't entered a name for the code");
                return;
            }

            try {
                const response = await fetch(`/api/projects/${projectId}/codes`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(newCode)
                });

                const data = await response.json();

                if (!response.ok) {
                    alert("Problem occurred creating a new code: " + data.error)
                    return;
                }

                setCodes((previousCodes) => [...previousCodes, data]);
                setAnnotationInProgress((previousAnnotation) => ({
                    ...previousAnnotation,
                    codeID: data.id
                }))

                setNewCode({
                    name: "",
                    description: "",
                    colour: '#ffffff'
                })

            } catch (error) {
                console.error(error);
                alert("Problem occurred creating a new code")
            }
        }

        async function handleAnnotationCreation() {
            if (annotationInProgress.codeID == null) {
                alert("A code must be selected for an annotation to be created");
                return;
            }

            try {
                const response = await fetch(`/api/projects/${projectId}/annotations`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(annotationInProgress)
                });

                const data = await response.json();

                if (!response.ok) {
                    alert("Problem occurred creating a new annotation: " + data.error)
                    return;
                }

                closeAnnotationModal();
                setSelectedTranscriptAnnotation(null);

                setAnnotationInProgress({
                    codeID: null,
                    note: "",
                    startTime: 0,
                    endTime: 0,
                    transcriptFileID: null,
                    transcriptStartLine: null,
                    transcriptEndLine: null,
                    selectedText: "",
                    transcriptStartOffset: null,
                    transcriptEndOffset: null,
                    linkedMediaFileIDs: []
                });

                router.refresh();
            } catch (error) {
                console.error(error);
                alert("Problem occurred creating a new annotation");
            }

        }

        async function handleAnnotationUpdate() {
            if (editedAnnotationID == null) {
                alert("You haven't select an annotation to edit");
                return;
            }

            if (annotationInProgress.codeID == null) {
                alert("You haven't selected a code");
                return;
            }

            try {
                const response = await fetch(`/api/annotations/${editedAnnotationID}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        codeID: annotationInProgress.codeID,
                        linkedMediaFileIDs: annotationInProgress.linkedMediaFileIDs
                    })

                });

                const data = await response.json();

                if (!response.ok) {
                    alert("Problem occurred updating the annotation: " + data.error);
                    return;
                }

                closeAnnotationModal();

                setAnnotationInProgress({
                    codeID: null,
                    note: "",
                    startTime: 0,
                    endTime: 0,
                    transcriptFileID: null,
                    transcriptStartLine: null,
                    transcriptEndLine: null,
                    selectedText: "",
                    transcriptStartOffset: null,
                    transcriptEndOffset: null,
                    linkedMediaFileIDs: []
                });

                const selection = window.getSelection();
                selection?.removeAllRanges();

                router.refresh();
            } catch (error) {
                console.error(error);
                alert("Problem occurred updating the annotation")
            }
        }

        async function handleAnnotationDelete() {
            if (editedAnnotationID == null) {
                alert("You haven't select an annotation to delete");
                return;
            }

            const confirmation = window.confirm("Do you really want to delete this annotation?");

            if (!confirmation) {
                return;
            }

            try {
                const response = await fetch(`/api/annotations/${editedAnnotationID}`, {
                    method: "DELETE"
                });

                const data = await response.json();

                if (!response.ok) {
                    alert("Problem occurred deleting the annotation: " + data.error);
                    return;
                }

                closeAnnotationModal();

                setAnnotationInProgress({
                    codeID: null,
                    note: "",
                    startTime: 0,
                    endTime: 0,
                    transcriptFileID: null,
                    transcriptStartLine: null,
                    transcriptEndLine: null,
                    selectedText: "",
                    transcriptStartOffset: null,
                    transcriptEndOffset: null,
                    linkedMediaFileIDs: []
                });

                const selection = window.getSelection();
                selection?.removeAllRanges();

                router.refresh();
            } catch (error) {
                console.error(error);
                alert("Problem occurred deleting the annotation");
            }
        }

        useEffect(() => {
            setSelectedTranscriptAnnotation(null);
        }, [currentTranscript?.id]);

        const router = useRouter();


        return (
            <div className="flex flex-col w-full mt-4">

                {currentAudioFiles.map((audioFile) => (
                    <AudioPlayer key={audioFile.id} file={audioFile} projectStartTime={viewableStartTime}/>
                ))}

                {isAnnotationModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content w-full max-w-2xl">



                            {/* Top Row with title and exit button */}
                            <div className="grid grid-cols-3 items-center border-b border-gray-300 pb-2 mb-4">
                                {/* Empty first column */}
                                <div></div>

                                <h2 className="text-xl font-bold text-center flex-1">
                                    {modalMode === "edit" ? "Edit Annotation" : "Create Annotation"}
                                </h2>

                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => closeAnnotationModal()}
                                        className="w-7 h-7 px-2 py-1 border border-gray-300 rounded hover:bg-gray-100"
                                    >X
                                    </button>
                                </div>
                                {/* Close Annotation Window Button */}

                            </div>

                            {/* Main contents of the annotation window */}
                            <div className="space-y-4">
                                {/* Box showing the part of the transcript selected */}
                                <div>
                                    <label className="block font-bold mb-1">Transcript Selection</label>
                                    <div
                                        className="border border-gray-300 bg-gray-50 p-2 text-sm max-h-32 overflow-y-auto rounded">
                                        {annotationInProgress.selectedText || "No text from the transcript was selected"}
                                    </div>
                                </div>

                                {/* The start and end times of the annotation shown */}
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block font-bold mb-1">Start Time</label>
                                        <input
                                            value={annotationInProgress.startTime}
                                            readOnly
                                            className="w-full border border-gray-300 rounded px-2 py-1 bg-gray-50"/>
                                    </div>

                                    <div className="flex-1">
                                        <label className="block font-bold mb-1">End Time</label>
                                        <input
                                            value={annotationInProgress.endTime}
                                            readOnly
                                            className="w-full border border-gray-300 rounded px-2 py-1 bg-gray-50"/>
                                    </div>
                                </div>

                                {/* Code selection */}
                                <div className="border-t border-gray-300 pt-3">
                                    <h3 className="font-bold mb-3">Code Selection</h3>

                                    <div className="grid grid-cols-2 gap-6 items-start">
                                        <div>
                                            <h4 className="font-semibold mb-2">Select Existing Code</h4>

                                            <label className="block font-bold mb-1">Code</label>

                                            <select
                                                value={annotationInProgress.codeID ?? ""}
                                                onChange={(e) =>
                                                    setAnnotationInProgress((previousAnnotation) => ({
                                                        ...previousAnnotation,
                                                        codeID: e.target.value ? parseInt(e.target.value) : null
                                                    }))
                                                }
                                                className="w-full border border-gray-300 rounded px-2 py-1 bg-white"
                                            >
                                                <option value="">Select a code</option>
                                                {codes.map((code) => (
                                                    <option key={code.id} value={code.id}>
                                                        {code.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <h4 className="font-semibold mb-2">Create New Code</h4>

                                            <div className="mb-2">
                                                <label className="block font-bold mb-1">Name</label>
                                                <input
                                                    value={newCode.name}
                                                    onChange={(e) =>
                                                        setNewCode((previousCode) => ({
                                                            ...previousCode,
                                                            name: e.target.value
                                                        }))}
                                                    className="w-full border border-gray-300 rounded px-2 py-1"
                                                />
                                            </div>

                                            <div className="mb-2">
                                                <label className="block font-bold mb-1">Description</label>
                                                <input
                                                    value={newCode.description}
                                                    onChange={(e) =>
                                                        setNewCode((previousCode) => ({
                                                            ...previousCode,
                                                            description: e.target.value
                                                        }))}
                                                    className="w-full border border-gray-300 rounded px-2 py-1"
                                                />
                                            </div>

                                            <div className="mb-2">
                                                <label className="block font-bold mb-1">Colour</label>
                                                <input
                                                    type="color"
                                                    value={newCode.colour}
                                                    onChange={(e) =>
                                                        setNewCode((previousCode) => ({
                                                            ...previousCode,
                                                            colour: e.target.value
                                                        }))}
                                                    className="w-20 h-10 border border-gray-300 rounded bg-white"
                                                />
                                            </div>

                                            <div className="flex justify-center">
                                                <button
                                                    type="button"
                                                    className="regular-button"
                                                    onClick={handleCodeCreation}>
                                                    Save Code
                                                </button>
                                            </div>

                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-300 pt-3">
                                    <h3 className="block font-bold mb-3">Linked Files</h3>
                                    <div
                                        className="border border-gray-300 rounded p-2 max-h-40 overflow-y-auto space-y-2">
                                        {files.filter((file) => file.id !== annotationInProgress.transcriptFileID).map((file) => {
                                            const checked = annotationInProgress.linkedMediaFileIDs.includes(file.id);

                                            return (
                                                <label key={file.id} className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setAnnotationInProgress((previousAnnotation) => ({
                                                                    ...previousAnnotation,
                                                                    linkedMediaFileIDs: [
                                                                        ...previousAnnotation.linkedMediaFileIDs,
                                                                        file.id
                                                                    ]
                                                                }));
                                                            } else {
                                                                setAnnotationInProgress((previousAnnotation) => ({
                                                                    ...previousAnnotation,
                                                                    linkedMediaFileIDs: [
                                                                        ...previousAnnotation.linkedMediaFileIDs.filter((id) => id !== file.id)
                                                                    ]
                                                                }));
                                                            }
                                                        }}
                                                        className="w-4 h-4"/>
                                                    <span className="text-sm">{file.fileName}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex justify-center gap-3 pt-3">
                                    {modalMode === "edit" && (
                                        <button
                                            type="button"
                                            className="regular-button"
                                            onClick={handleAnnotationDelete}>
                                            Delete Annotation
                                        </button>
                                    )}


                                    <button
                                        type="button"
                                        className="regular-button"
                                        onClick={modalMode === "edit" ? handleAnnotationUpdate : handleAnnotationCreation}>
                                        Save Annotation
                                    </button>
                                </div>


                            </div>

                        </div>
                    </div>
                )}

                {/* Divide page into 3 columns */}
                <div className="grid grid-cols-3 gap-4 h-[52vh] min-h-[360px]">

                    {/* Video Player */}
                    <div className="flex flex-col gap-2 h-full min-h-0">
                        <div className="text-sm font-semibold text-gray-600 text-center truncate px-2">
                            {currentVideo ? currentVideo.fileName : "Video Stream"}
                        </div>
                        <div
                            className="bg-black flex flex-1 min-h-0 flex-col items-center justify-center rounded border border-gray-700 relative overflow-hidden">
                            {currentVideo ?
                                (<VideoPlayer key={currentVideo.id} file={currentVideo}
                                              projectStartTime={viewableStartTime}/>)
                                : (<div className="text-gray-500">No Video Exists at this Timestamp</div>)
                            }
                        </div>
                    </div>

                    {/* Image Viewer */}
                    <div className="flex flex-col gap-2 h-full min-h-0">
                        <div className="text-sm font-semibold text-gray-600 text-center truncate px-2">
                            {currentImage ? currentImage.fileName : "Image Stream"}
                        </div>
                        <div
                            className="bg-gray-200 flex flex-1 min-h-0 flex-col items-center justify-center rounded border border-gray-400 relative overflow-hidden p-2">
                            {currentImage ? (
                                    <img src={currentImage.filePath} className="max-w-full max-h-full object-contain"/>)
                                : (<div className="text-gray-500">No Image Exists at this Timestamp</div>)
                            }
                        </div>
                    </div>

                    {/* Transcript Viewer */}
                    <div className="flex flex-col gap-2 h-full min-h-0">
                        <div className="text-sm font-semibold text-gray-600 text-center truncate px-2">
                            {currentTranscript ? currentTranscript.fileName : "Transcript Stream"}
                        </div>
                        <div
                            className="bg-gray-50 flex flex-1 min-h-0 flex-col items-center justify-center rounded border border-gray-300 overflow-y-auto">
                            {currentTranscript ? (<TranscriptPlayer key={currentTranscript.id}
                                                                    file={currentTranscript}
                                                                    annotations={annotations}
                                                                    projectStartTime={viewableStartTime}
                                                                    onSelectionChange={handleTranscriptSelection}/>) :
                                (<div className="text-gray-500">No Transcript Exists at this Timestamp</div>)}
                        </div>
                    </div>
                </div>

                <div className="mt-4">
                    <PlaybackRemote
                        projectStartTime={viewableStartTime}
                        projectDuration={projectDurationSecs}
                        events={events}
                        groups={groups}
                        selectedEventID={selectedEventID}
                        selectedGroupID={selectedGroupID}
                        onEventChangeAction={setSelectedEventID}
                        onGroupChangeAction={setSelectedGroupID}/>
                </div>

                <div className="w-full border-t border-gray-300">
                    <Timeline files={viewableFiles} annotations={viewableAnnotations} projectStartTime={viewableStartTime}
                              onEditAnnotation={handleEditExisting} projectDuration={projectDurationSecs}/>
                </div>
            </div>
        );
    });

export default PlaybackController;