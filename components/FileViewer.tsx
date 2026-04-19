'use client';

import {useMemo, useState, useEffect} from 'react';
import {MediaFile} from '@prisma/client';
import {useRouter} from 'next/navigation';

interface EventType {
    id: number;
    name: string;
}

interface GroupType {
    id: number;
    name: string;
}

function buildRowEdits(files: (MediaFile & { eventID: number | null; groupID: number | null })[]) {
    const edits: Record<number, {
        date: string;
        time: string;
        duration: string;
        eventID: string;
        groupID: string;
    }> = {};

    for (const file of files) {
        const date = new Date(file.creationTime);

        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, "0");
        const day = String(date.getUTCDate()).padStart(2, "0");
        const hour = String(date.getUTCHours()).padStart(2, "0");
        const minutes = String(date.getUTCMinutes()).padStart(2, "0");
        const seconds = String(date.getUTCSeconds()).padStart(2, "0");

        edits[file.id] = {
            date: `${year}-${month}-${day}`,
            time: `${hour}:${minutes}:${seconds}`,
            duration: String(file.duration > 0 ? file.duration : 30),
            eventID: file.eventID != null ? String(file.eventID) : "",
            groupID: file.groupID != null ? String(file.groupID) : ""
        };
    }

    return edits;
}

export default function FileViewer({files, events, groups}: {
    files: (MediaFile & {
        eventID: number | null;
        groupID: number | null;
    })[];
    events: EventType[];
    groups: GroupType[];
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [rowEdits, setRowEdits] = useState<Record<number, {
        date: string;
        time: string;
        duration: string;
        eventID: string;
        groupID: string;
    }>>(
        () => buildRowEdits(files)
    );

    useEffect(() => {
        setRowEdits(buildRowEdits(files));
    }, [files]);

    const router = useRouter();
    const sortedFiles = useMemo(() => {
        return [...files].sort(
            (a, b) => new Date(a.creationTime).getTime() - new Date(b.creationTime).getTime());
    }, [files]);
    const videos = sortedFiles.filter(f => f.filePath.includes("/Videos"));
    const images = sortedFiles.filter(f => f.filePath.includes("/Images"));
    const transcripts = sortedFiles.filter(f => f.filePath.includes("/Transcripts"));
    const audio = sortedFiles.filter(f => f.filePath.includes("/Audio"));

    function formatDuration(durationSeconds: number) {
        const hours = Math.floor(durationSeconds / 3600);
        const minutes = Math.floor((durationSeconds % 3600) / 60);
        const seconds = Math.floor(durationSeconds % 60);

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        }

        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }

    function updateRowEdit(
        fileId: number,
        field: "date" | "time" | "duration" | "eventID" | "groupID",
        value: string) {
        setRowEdits((prev) => ({
            ...prev,
            [fileId]: {
                ...prev[fileId],
                [field]: value
            }
        }));

    }

    function buildTime(date: string, time: string) {
        const [year, month, day] = date.split("-").map(Number);
        const [hour, minute, second] = time.split(":").map(Number);

        const timestamp = new Date(Date.UTC(
            year,
            month - 1,
            day,
            hour,
            minute,
            second || 0
        ));

        return timestamp.toISOString();
    }

    async function saveTimestamp(file: MediaFile & {eventID: number | null; groupID: number | null}) {
        const edit = rowEdits[file.id];

        if (!edit?.date) {
            alert("No date was provided.");
            return;
        } else if (!edit?.time) {
            alert("No time was provided.");
            return;
        }

        const body: {
            creationTime: string;
            duration?: number;
            eventID?: number | null;
            groupID?: number | null;
        } = {
            creationTime: buildTime(edit.date, edit.time),
            eventID: edit.eventID ? parseInt(edit.eventID) : null,
            groupID: edit.groupID ? parseInt(edit.groupID) : null
        };

        if (file.filePath.includes("/Images")) {
            const parsedDuration = Number(edit.duration);

            if (Number.isNaN(parsedDuration) || parsedDuration < 0) {
                alert("Invalid duration provided.");
                return;
            }

            body.duration = parsedDuration;
        }


        try {
            const response = await fetch(`/api/files/${file.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Could not update timestamp");
                return;
            }

            router.refresh();

        } catch (error) {
            console.error(error);
            alert("Couldn't update file timestamp.")
        }

    }

    async function deleteFile(fileID: number, fileName: string) {
        const confirmation = window.confirm(`Delete ${fileName}?`);

        if (!confirmation) {
            return;
        }

        try {
            const response = await fetch(`/api/files/${fileID}`, {
                method: "DELETE"
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Couldn't delete the file");
                return;
            }

            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Couldn't delete the file");
        }
    }


    return (
        <>
            <button
                className="regular-button"
                onClick={() => setIsModalOpen(true)}
            >
                View Files ({files.length})
            </button>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content w-full max-w-5xl">
                        <div className="grid grid-cols-3 items-center border-b border-gray-300 pb-2 mb-4">
                            <div></div>

                            <div className="text-center">
                                <h2 className="text-xl font-bold">Project Files</h2>
                                <p className="text-sm text-gray-600">{files.length} files in this project</p>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-7 h-7 border border-gray-300 rounded hover:bg-gray-100 flex items-center justify-center text-sm"
                                >
                                    X
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <FileCategory
                                title="Videos"
                                files={videos}
                                rowEdits={rowEdits}
                                onEditChange={updateRowEdit}
                                onSaveTimestamp={saveTimestamp}
                                onDeleteFile={deleteFile}
                                formatDuration={formatDuration}
                                events={events}
                                groups={groups}
                            />

                            <FileCategory
                                title="Images"
                                files={images}
                                rowEdits={rowEdits}
                                onEditChange={updateRowEdit}
                                onSaveTimestamp={saveTimestamp}
                                onDeleteFile={deleteFile}
                                formatDuration={formatDuration}
                                events={events}
                                groups={groups}
                            />

                            <FileCategory
                                title="Transcripts"
                                files={transcripts}
                                rowEdits={rowEdits}
                                onEditChange={updateRowEdit}
                                onSaveTimestamp={saveTimestamp}
                                onDeleteFile={deleteFile}
                                formatDuration={formatDuration}
                                events={events}
                                groups={groups}
                            />

                            <FileCategory
                                title="Audio"
                                files={audio}
                                rowEdits={rowEdits}
                                onEditChange={updateRowEdit}
                                onSaveTimestamp={saveTimestamp}
                                onDeleteFile={deleteFile}
                                formatDuration={formatDuration}
                                events={events}
                                groups={groups}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );

}

function FileCategory({
                          title,
                          files,
                          rowEdits,
                          onEditChange,
                          onSaveTimestamp,
                          onDeleteFile,
                          formatDuration,
                          events,
                          groups
                      }: {
    title: string,
    files: (MediaFile & {
        eventID: number | null;
        groupID: number | null;
    })[];
    rowEdits: Record<number, {
        date: string;
        time: string;
        duration: string;
        eventID: string;
        groupID: string;
    }>;
    onEditChange: (fileId: number, field: "date" | "time" | "duration" | "eventID" | "groupID", value: string) => void;
    onSaveTimestamp: (file: MediaFile & {eventID: number | null; groupID: number | null}) => void;
    onDeleteFile: (fileId: number, fileName: string) => void;
    formatDuration: (seconds: number) => string;
    events: EventType[];
    groups: GroupType[];
}) {
    if (files.length === 0) {
        return null;
    }

    return (
        <div className="border-t border-gray-300 pt-3">
            <h3 className="font-bold mb-3">{title} ({files.length})</h3>

            <div
                className="grid grid-cols-[2.5fr_1.2fr_1.1fr_1fr_1.2fr_1.2fr_80px_56px] gap-3 px-3 py-2 border border-gray-300 bg-gray-100 rounded-t text-sm font-semibold">
                <div>File Name</div>
                <div>Date</div>
                <div>Time</div>
                <div>Duration</div>
                <div>Event</div>
                <div>Group</div>
                <div className="text-center"></div>
                <div className="text-center"></div>
            </div>

            <div className="border-x border-b border-gray-300 rounded-b overflow-hidden">
                {files.map((file, index) => (
                    <div
                        key={file.id}
                        className={`grid grid-cols-[2.5fr_1.2fr_1.1fr_1fr_1.2fr_1.2fr_80px_56px] gap-3 px-3 py-3 items-center text-sm ${
                            index !== files.length - 1 ? "border-b border-gray-200" : ""
                        }`}
                    >
                        <div className="break-words font-medium">
                            {file.fileName}
                        </div>

                        <div>
                            <input
                                type="date"
                                value={rowEdits[file.id]?.date ?? ""}
                                onChange={(e) => onEditChange(file.id, "date", e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1"
                            />
                        </div>

                        <div>
                            <input
                                type="time"
                                step="1"
                                value={rowEdits[file.id]?.time ?? ""}
                                onChange={(e) => onEditChange(file.id, "time", e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1"
                            />
                        </div>

                        <div>
                            {file.filePath.includes("/Images") ? (
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={rowEdits[file.id]?.duration ?? ""}
                                    onChange={(e) => onEditChange(file.id, "duration", e.target.value)}
                                    className="w-full border border-gray-300 rounded px-2 py-1"/>
                            ) : (
                                file.duration > 0 ? formatDuration(file.duration) : "-"
                            )}
                        </div>

                        <div>
                            <select
                                value={rowEdits[file.id]?.eventID ?? ""}
                                onChange={(e) => onEditChange(file.id, "eventID", e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 bg-white">
                                <option value="">Select Event</option>
                                {events.map((event) => (
                                    <option key={event.id} value={event.id}>{event.name}</option>
                                ))}

                            </select>
                        </div>

                        <div>
                            <select
                                value={rowEdits[file.id]?.groupID ?? ""}
                                onChange={(e) => onEditChange(file.id, "groupID", e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 bg-white">
                                <option value="">Select Group</option>
                                {groups.map((group) => (
                                    <option key={group.id} value={group.id}>{group.name}</option>
                                ))}

                            </select>
                        </div>

                        <div className="flex justify-center">
                            <button
                                type="button"
                                onClick={() => onSaveTimestamp(file)}
                                className="px-2 py-1 border border-blue-300 text-blue-700 rounded hover:bg-blue-50 text-xs font-semibold"
                            >
                                Save
                            </button>
                        </div>

                        <div className="flex justify-center">
                            <button
                                type="button"
                                onClick={() => onDeleteFile(file.id, file.fileName)}
                                className="w-7 h-7 border border-red-300 text-red-600 rounded hover:bg-red-50 flex items-center justify-center text-sm"
                            >
                                X
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}