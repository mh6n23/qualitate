'use client';

import {useRef, useState} from 'react';
import {useRouter} from 'next/navigation';

interface EventType {
    id: number;
    name: string;
}

interface GroupType {
    id: number;
    name: string;
}

export default function FileUploader({projectId, events, groups}: {
    projectId: number;
    events: EventType[];
    groups: GroupType[];
}) {
    const [uploading, setUploading] = useState(false);
    const [currentFileName, setCurrentFileName] = useState("");
    const [totalFiles, setTotalFiles] = useState(0);
    const [currentFileIndex, setCurrentFileIndex] = useState(0);
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const progressPercentage = totalFiles > 0 ? (currentFileIndex / totalFiles) * 100 : 0;

    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [availableEvents, setAvailableEvents] = useState<EventType[]>(events);
    const [availableGroups, setAvailableGroups] = useState<GroupType[]>(groups);
    const [selectedEventID, setSelectedEventID] = useState<number | null>(null);
    const [selectedGroupID, setSelectedGroupID] = useState<number | null>(null);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [eventName, setEventName] = useState("");
    const [groupName, setGroupName] = useState("");

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    }

    // Grabs the duration of a video
    const getDuration = (file: File, elementType: "video" | "audio"): Promise<number> => {
        // Wait for the resolve to complete before returning a value
        return new Promise(resolve => {

            // Create an invisible video and get the header information
            const media = document.createElement(elementType);
            media.preload = "metadata";

            // Once the metadata has been read delete the URL
            media.onloadedmetadata = () => {
                window.URL.revokeObjectURL(media.src);
                resolve(media.duration);
            };

            // Default to 0 if there's a problem
            media.onerror = () => {
                resolve(0);
            }

            // Load the video
            media.src = URL.createObjectURL(file);
        })
    }

    async function getTranscriptDuration(file: File): Promise<number> {
        try {
            const text = await file.text();
            const regex = /\[([\d:]+)[ \-]+([\d:]+)]\s*([^\[]+)/g;
            let acceptedLine;
            let transcriptEnd = 0;

            while ((acceptedLine = regex.exec(text)) !== null) {
                const lineEnd = acceptedLine[2];
                const endInSeconds = convertTimeToSeconds(lineEnd);

                if (endInSeconds > transcriptEnd) {
                    transcriptEnd = endInSeconds;
                }

            }
            return transcriptEnd;
        } catch (error) {
            console.error("Error parsing transcript to determine duration", error);
            return 0;
        }
    }

    async function getVTTduration(file: File): Promise<number> {
        try {
            const text = await file.text();
            const lines = text.split(/\r?\n/);
            let maxEnd = 0;

            for (const line of lines) {
                if (!line.includes("-->")) {
                    continue;
                }
                const [start, end] = line.split("-->").map((part) => part.trim());

                if (!end) {
                    continue;
                }

                const newEnd = end.split(" ")[0].replace(",", ".");
                const endSeconds = convertTimeToSeconds(newEnd);

                if (endSeconds > maxEnd) {
                    maxEnd = endSeconds;
                }
            }

            return maxEnd

        } catch (error) {
            console.error("Error parsing VTT transcript to determine duration", error);
            return 0;
        }
    }

    function convertTimeToSeconds(timeString: string): number {
        const components = timeString.trim().split(':');
        let seconds = 0;

        // Convert differently depending on if hours are included in the time
        if (components.length === 3) {
            seconds = (parseInt(components[0]) * 3600) + (parseInt(components[1]) * 60) + parseFloat(components[2]);
        } else if (components.length === 2) {
            seconds = (parseInt(components[0]) * 60) + parseFloat(components[1])
        }
        return seconds;
    }

    async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        const files = event.target.files;
        if (!files || files.length === 0) {
            return;
        }

        setSelectedFiles(Array.from(files));

        try {
            const eventResponse = await fetch(`/api/projects/${projectId}/events`);
            const groupResponse = await fetch(`/api/projects/${projectId}/groups`);
            const eventData = await eventResponse.json();
            const groupData = await groupResponse.json();

            if (!eventResponse.ok) {
                alert(eventData.error || "Error retrieving events");
                return;
            }

            if (!groupResponse.ok) {
                alert(groupData.error || "Error retrieving groups");
                return;
            }

            setAvailableEvents(eventData);
            setAvailableGroups(groupData);
            setSelectedEventID(eventData[0]?.id ?? null);
            setSelectedGroupID(groupData[0]?.id ?? null);
            setIsUploadModalOpen(true);
        } catch (error) {
            console.error(error);
            alert("Error with upload process");
        }

        event.target.value = "";
    }

    async function uploadFiles() {
        if (selectedFiles.length === 0) {
            alert("No files to upload");
            return;
        }

        if (selectedEventID == null) {
            alert("Event field is empty");
            return;
        }

        if (selectedGroupID == null) {
            alert("Group field is empty");
            return;
        }

        setTotalFiles(selectedFiles.length);
        setCurrentFileIndex(0);
        setUploading(true);

        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const timestamp = new Date(file.lastModified).toISOString();
            setCurrentFileIndex(i + 1);
            setCurrentFileName(file.name);
            const name = file.name.toLowerCase();

            try {
                let duration = 0;

                if (file.type.startsWith("video/")) {
                    // Video
                    duration = await getDuration(file, "video");
                } else if (file.type.startsWith("audio/")) {
                    // Audio
                    duration = await getDuration(file, "audio");
                } else if (name.endsWith(".txt")) {
                    // Transcript
                    duration = await getTranscriptDuration(file);
                } else if (name.endsWith(".vtt")) {
                    // Transcript
                    duration = await getVTTduration(file);
                } else {
                    // Set default duration for image files
                    duration = 10;
                }

                const formData = new FormData();
                formData.append("file", file);
                formData.append("projectID", projectId.toString())
                formData.append("eventID", selectedEventID.toString());
                formData.append("groupID", selectedGroupID.toString());
                formData.append("duration", duration.toString())
                formData.append("creationTime", timestamp)

                const response = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error(`File upload failed for ${file.name}.`);
                }

                // Remove to speedup upload process
                //await new Promise(resolve => setTimeout(resolve, 5000));
            } catch (error) {
                console.error(error);
                alert(`File Upload Error for ${file.name}`);
            }
        }

        setUploading(false);
        setCurrentFileName("");
        setCurrentFileIndex(0);
        setTotalFiles(0);
        setSelectedFiles([]);
        setIsUploadModalOpen(false);
        router.refresh();
    }

    async function getEvents() {
        try {
            const response = await fetch(`/api/projects/${projectId}/events`);
            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Couldn't get events");
                return;
            }

            setAvailableEvents(data);
        } catch (error) {
            console.error(error);
            alert("Error getting events")
        }
    }

    async function createEvent() {
        if (!eventName.trim()) {
            alert("You haven't provided an event name");
            return;
        }

        try {
            const response = await fetch(`/api/projects/${projectId}/events`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: eventName
                })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Error creating event");
                return;
            }

            await getEvents();
            setSelectedEventID(data.id);
            setEventName("");
            setIsEventModalOpen(false);
        } catch (error) {
            console.error(error);
            alert("Error creating event");
        }

    }

    async function getGroups() {
        try {
            const response = await fetch(`/api/projects/${projectId}/groups`);
            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Couldn't get groups");
                return;
            }

            setAvailableGroups(data);
        } catch (error) {
            console.error(error);
            alert("Error getting groups")
        }
    }

    async function createGroup() {
        if (!groupName.trim()) {
            alert("You haven't provided a group name");
            return;
        }

        try {
            const response = await fetch(`/api/projects/${projectId}/groups`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: groupName
                })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Error creating group");
                return;
            }

            await getGroups();
            setSelectedGroupID(data.id);
            setGroupName("");
            setIsGroupModalOpen(false);
        } catch (error) {
            console.error(error);
            alert("Error creating group");
        }

    }

    return (
        <>
            <button className="regular-button" onClick={handleButtonClick}>
                <span>Upload File</span>
            </button>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                multiple
                accept="video/*, audio/*, image/*, .vtt, .txt"/>

            {isUploadModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content w-full max-w-lg">
                        <div className="grid grid-cols-3 items-center border-b border-gray-300 pb-2 mb-4">
                            <div></div>

                            <div className="text-center">
                                <h2>Upload Assignment</h2>
                                <p className="text-sm text-gray-600">
                                    {selectedFiles.length} file{selectedFiles.length === 1 ? "" : "s"} selected
                                </p>
                            </div>

                            <div className="flex justify-end">
                                <button type="button" onClick={() => {
                                    setIsUploadModalOpen(false);
                                    setSelectedFiles([]);
                                    setSelectedEventID(null);
                                    setSelectedGroupID(null);
                                }}
                                        className="w-7 h-7 border border-gray-300 rounded hover:bg-gray-100 flex items-center justify-center text-sm">
                                    X
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block font-bold mb-1">Event</label>
                                <div className="flex gap-2">
                                    <select value={selectedEventID ?? ""}
                                            onChange={(e) => setSelectedEventID(e.target.value ? parseInt(e.target.value) : null)}
                                            className="w-full border border-gray-300 rounded px-2 py-1 bg-white">
                                        <option value="">Select Event</option>
                                        {availableEvents.map((event) => (
                                            <option key={event.id} value={event.id}>{event.name}</option>
                                        ))}
                                    </select>

                                    <button type="button" className="regular-button"
                                            onClick={() => setIsEventModalOpen(true)}>New Event
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold mb-1">Group</label>
                                <div className="flex gap-2">
                                    <select value={selectedGroupID ?? ""}
                                            onChange={(e) => setSelectedGroupID(e.target.value ? parseInt(e.target.value) : null)}
                                            className="w-full border border-gray-300 rounded px-2 py-1 bg-white">
                                        <option value="">Select Group</option>
                                        {availableGroups.map((group) => (
                                            <option key={group.id} value={group.id}>{group.name}</option>
                                        ))}
                                    </select>

                                    <button type="button" className="regular-button"
                                            onClick={() => setIsGroupModalOpen(true)}>New Group
                                    </button>
                                </div>
                            </div>

                            <div className="border border-gray-300 rounded p-2 max-h-40 overflow-y-auto">
                                <div className="font-semibold mb-2">Selected Files</div>
                                <div className="space-y-1 text-sm">
                                    {selectedFiles.map((file) => (
                                        <div key={file.name + file.lastModified}
                                             className="wrap-break-word">{file.name}</div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-center gap-3">
                                <button type="button" className="regular-button" onClick={() => {
                                    uploadFiles()
                                }}>Upload
                                </button>
                            </div>


                        </div>

                        {isEventModalOpen && (
                            <div className="modal-overlay">
                                <div className="modal-content w-full max-w-md">
                                    <div className="grid grid-cols-3 items-center border-b border-gray-300 pb-2 mb-4">
                                        <div></div>
                                        <div className="text-center">
                                            <h2 className="text-lg font-bold">Create New Event</h2>
                                        </div>

                                        <div className="flex justify-end">
                                            <button type="button" onClick={() => {
                                                setIsEventModalOpen(false);
                                            }}
                                                    className="w-7 h-7 border border-gray-300 rounded hover:bg-gray-100 flex items-center justify-center text-sm">
                                                X
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block font-bold mb-1">Name</label>
                                            <input
                                                value={eventName}
                                                onChange={(e) => setEventName(e.target.value)}
                                                className="w-full border border-gray-300 rounded px-2 py-1"/>
                                        </div>

                                        <div className="flex justify-center">
                                            <button type="button" className="regular-button" onClick={createEvent}>
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isGroupModalOpen && (
                            <div className="modal-overlay">
                                <div className="modal-content w-full max-w-md">
                                    <div className="grid grid-cols-3 items-center border-b border-gray-300 pb-2 mb-4">
                                        <div></div>
                                        <div className="text-center">
                                            <h2 className="text-lg font-bold">Create New Group</h2>
                                        </div>

                                        <div className="flex justify-end">
                                            <button type="button" onClick={() => {
                                                setIsGroupModalOpen(false)
                                            }}
                                                    className="w-7 h-7 border border-gray-300 rounded hover:bg-gray-100 flex items-center justify-center text-sm">
                                                X
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block font-bold mb-1">Name</label>
                                            <input
                                                value={groupName}
                                                onChange={(e) => setGroupName(e.target.value)}
                                                className="w-full border border-gray-300 rounded px-2 py-1"/>
                                        </div>

                                        <div className="flex justify-center">
                                            <button type="button" className="regular-button" onClick={createGroup}>
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}


                        {uploading && (

                            <div className="modal-overlay">
                                <div className="modal-content w-full max-w-md">
                                    <div className="space-y-4">
                                        {/* Popup Title */}
                                        <div className="text-center">
                                            <h2 className="text-xl font-bold">Uploading Files</h2>
                                        </div>

                                        {/* Current file info and progress text */}
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800 truncate">{currentFileName}</p>
                                            <p className="text-sm font-semibold text-gray-600">File {currentFileIndex} of {totalFiles}</p>
                                        </div>

                                        {/* Progress Bar */}
                                        <div>
                                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                                <div
                                                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                                                    style={{width: `${progressPercentage}%`}}
                                                />
                                            </div>
                                        </div>


                                    </div>
                                </div>


                            </div>


                        )}
                    </div>
                </div>
            )}
        </>
    );
}