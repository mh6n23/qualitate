'use client';

import {useState, useMemo} from "react";

interface Theme {
    id: number;
    name: string;
    description: string | null;
    _count?: {
        codeLinks: number;
    };
}

interface Annotation {
    id: number;
    startTime: number;
    endTime: number;
    selectedText: string | null;
    transcriptFile: {
        fileName: string;
    } | null;
    event: {
        name: string;
    } | null;
    group: {
        name: string;
    } | null;
}

interface Code {
    id: number;
    name: string;
    colour: string;
    description: string | null;
    annotations: Annotation[];
}

interface ThemeProps {
    projectID: number;
}

export default function Themes({projectID}: ThemeProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [themes, setThemes] = useState<Theme[]>([]);
    const [selectedThemeID, setSelectedThemeID] = useState<number | null>(null);
    const [selectedCodeID, setSelectedCodeID] = useState<number | null>(null);
    const [themeCodes, setThemeCodes] = useState<Code[]>([]);
    const [projectCodes, setProjectCodes] = useState<Code[]>([]);

    const [isThemeEditorOpen, setIsThemeEditorOpen] = useState(false);
    const [themeEditorMode, setThemeEditorMode] = useState<"create" | "edit">("create");
    const [editingThemeID, setEditingThemeID] = useState<number | null>(null);
    const [themeFormName, setThemeFormName] = useState("");
    const [themeFormDescription, setThemeFormDescription] = useState("");

    const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false);
    const [editingCodeID, setEditingCodeID] = useState<number | null>(null);
    const [codeFormName, setCodeFormName] = useState("");
    const [codeFormDescription, setCodeFormDescription] = useState("");


    async function getThemes() {
        try {
            const response = await fetch(`/api/projects/${projectID}/themes`);
            const data = await response.json();

            if (!response.ok) {
                alert("Failed to get themes");
                return;
            }

            setThemes(data);
        } catch (error) {
            console.error(error);
            alert("Failed to get themes");
        }
    }

    async function getProjectCodes() {
        try {
            const response = await fetch(`/api/projects/${projectID}/codes`);
            const data = await response.json();

            if (!response.ok) {
                alert("Failed to get codes");
                return;
            }

            setProjectCodes(data);
        } catch (error) {
            console.error(error);
            alert("Failed to get codes");
        }
    }

    async function getThemeCodes(themeID: number) {
        try {
            const response = await fetch(`/api/themes/${themeID}/codes`);
            const data = await response.json();

            if (!response.ok) {
                alert("Failed to get codes for theme");
                return;
            }

            setThemeCodes(data);
            setSelectedCodeID(null);
        } catch (error) {
            console.error(error);
            alert("Failed to get codes for theme");
        }
    }


    function formatTime(totalSeconds: number) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    async function openModal() {
        setIsModalOpen(true);
        await getThemes();
        await getProjectCodes();
    }

    async function selectTheme(themeID: number) {
        setSelectedThemeID(themeID);
        setSelectedCodeID(null);
        await getThemeCodes(themeID);
    }

    function closeThemeEditor() {
        setIsThemeEditorOpen(false);
        setThemeEditorMode("create");
        setEditingThemeID(null);
        setThemeFormName("");
        setThemeFormDescription("");
    }

    function openCreateThemeEditor() {
        setThemeEditorMode("create");
        setEditingThemeID(null);
        setThemeFormName("");
        setThemeFormDescription("");
        setIsThemeEditorOpen(true);
    }

    function openEditThemeEditor(theme: Theme) {
        setThemeEditorMode("edit");
        setEditingThemeID(theme.id);
        setThemeFormName(theme.name);
        setThemeFormDescription(theme.description || "");
        setIsThemeEditorOpen(true);
    }

    async function closeThemesModal() {
        setIsModalOpen(false);

        setSelectedThemeID(null);
        setSelectedCodeID(null);
        setThemeCodes([]);

        setIsThemeEditorOpen(false);
        setThemeEditorMode("create");
        setEditingThemeID(null);
        setThemeFormName("");
        setThemeFormDescription("");

        setIsCodeEditorOpen(false);
        setEditingCodeID(null);
        setCodeFormName("");
        setCodeFormDescription("");
    }

    async function saveTheme() {
        if (!themeFormName.trim()) {
            alert("Theme name is missing");
            return;
        }

        try {
            const response = await fetch(themeEditorMode === "edit" ?
                    `/api/themes/${editingThemeID}` : `/api/projects/${projectID}/themes`,
                {
                    method: themeEditorMode === "edit" ? "PATCH" : "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({
                        name: themeFormName,
                        description: themeFormDescription
                    })
                });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Failed to save theme");
                return;
            }

            await getThemes();

            if (selectedThemeID != null) {
                await getThemeCodes(selectedThemeID);
            }

            if (themeEditorMode === "create") {
                setSelectedThemeID(data.id);
                await getThemeCodes(data.id);
            }

            closeThemeEditor();
        } catch (error) {
            console.error(error);
            alert("Failed to save theme");
        }
    }

    async function deleteTheme() {
        if (editingThemeID == null) {
            alert("No theme selected for deletion");
            return;
        }

        const confirmation = window.confirm("Delete this theme?");

        if (!confirmation) {
            return;
        }

        try {
            const response = await fetch(`/api/themes/${editingThemeID}`, {
                method: "DELETE"
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Failed to delete theme");
                return;
            }

            const themeID = editingThemeID;

            await getThemes();

            if (selectedThemeID === themeID) {
                setSelectedThemeID(null);
                setSelectedCodeID(null);
                setThemeCodes([]);
            } else if (selectedThemeID != null) {
                await getThemeCodes(selectedThemeID);
            }

            closeThemeEditor();
        } catch (error) {
            console.error(error);
            alert("Failed to delete theme");
        }
    }

    function closeCodeEditor() {
        setIsCodeEditorOpen(false);
        setEditingCodeID(null);
        setCodeFormName("");
        setCodeFormDescription("");
    }

    function openCodeEditor(code: Code) {
        setEditingCodeID(code.id);
        setCodeFormName(code.name);
        setCodeFormDescription(code.description || "");
        setIsCodeEditorOpen(true);
    }

    async function saveCodeEdit() {
        if (editingCodeID == null) {
            alert("No code selected for editing");
            return;
        }

        if (!codeFormName.trim()) {
            alert("No code name provided");
            return;
        }

        try {
            const response = await fetch(`/api/codes/${editingCodeID}`, {
                method: "PATCH",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    name: codeFormName,
                    description: codeFormDescription
                })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Failed to update code");
                return;
            }

            await getProjectCodes();

            if (selectedThemeID != null) {
                await getThemeCodes(selectedThemeID);
            }

            closeCodeEditor();
        } catch (error) {
            console.error(error);
            alert("Failed to update code");
        }
    }

    async function addCodeToTheme(codeID: number) {
        if (selectedThemeID == null) {
            alert("No theme selected for adding");
            return;
        }

        try {
            const response = await fetch(`/api/themes/${selectedThemeID}/codes`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({codeID})
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Failed to add code to theme");
                return;
            }

            await getThemes();
            await getProjectCodes();
            await getThemeCodes(selectedThemeID);
        } catch (error) {
            console.error(error);
            alert("Failed to add code to theme");
        }
    }

    async function removeCodeFromTheme(codeID: number) {
        if (selectedThemeID == null) {
            alert("No theme selected for removal");
            return;
        }

        try {
            const response = await fetch(`/api/themes/${selectedThemeID}/codes`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({codeID})
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Failed to remove code from theme");
                return;
            }

            await getThemes();
            await getProjectCodes();
            await getThemeCodes(selectedThemeID);
        } catch (error) {
            console.error(error);
            alert("Failed to remove code from theme");
        }
    }

    const selectedCode = useMemo(() => {
        return projectCodes.find((code) => code.id === selectedCodeID) || null;
    }, [projectCodes, selectedCodeID]);

    const themeCodeIDs = useMemo(() => {
        return new Set(themeCodes.map((code) => code.id));
    }, [themeCodes]);

    return (
        <>
            <button type="button" className="regular-button" onClick={openModal}>Themes</button>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content w-full max-w-6xl">

                        {/* Top Layer */}
                        <div className="grid grid-cols-3 items-center border-b border-gray-300 pb-2 mb-4">
                            <div></div>

                            <div className="text-center">
                                <h2 className="text-xl font-bold">Themes</h2>
                                <p className="text-sm text-gray-600">Assign Codes to Themes</p>
                            </div>

                            <div className="flex justify-end">
                                <button type="button" onClick={() => closeThemesModal()}
                                        className="w-7 h-7 border border-gray-300 rounded hover:bg-gray-100 flex items-center justify-center text-sm">X
                                </button>
                            </div>

                        </div>

                        {/* Main View */}
                        <div
                            className="grid grid-cols-[1fr_1fr_2fr] border border-gray-300 rounded overflow-hidden min-h-[520px]">

                            {/* Themes Panel */}
                            <div className="border-r border-gray-300 p-4 flex flex-col min-h-0">

                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold">Themes</h3>

                                    <button type="button" className="small-button"
                                            onClick={openCreateThemeEditor}>Add Theme
                                    </button>
                                </div>


                                <div className="flex-1 overflow-y-auto space-y-2">
                                    {themes.length === 0 ? (
                                        <p className="text-sm text-gray-500">No themes have been created yet.</p>
                                    ) : (
                                        themes.map((theme) => (
                                            <div
                                                key={theme.id}
                                                className={`border rounded p-3 ${
                                                    selectedThemeID === theme.id
                                                        ? "border-blue-500 bg-blue-50"
                                                        : "border-gray-300 bg-white"
                                                }`}>

                                                <div className="flex items-start justify-between gap-2">
                                                    <button type="button"
                                                            onClick={() => selectTheme(theme.id)}
                                                            className="flex-1 text-left">

                                                        <div className="font-semibold">{theme.name}</div>

                                                        <div className="text-xs text-gray-600 mt-1">
                                                            {theme._count?.codeLinks ?? 0} codes
                                                        </div>

                                                        {theme.description && (
                                                            <div
                                                                className="text-xs text-gray-500 mt-1 wrap-break-word">{theme.description}</div>
                                                        )}

                                                    </button>

                                                    <button type="button"
                                                            className="small-button flex items-center justify-center"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openEditThemeEditor(theme);
                                                            }}>
                                                        Edit
                                                    </button>
                                                </div>

                                            </div>
                                        ))

                                    )}
                                </div>
                            </div>

                            {/* Codes Panel */}
                            <div className="border-r border-gray-300 p-4 flex flex-col min-h-0">
                                <h3 className="font-bold mb-3">Codes</h3>

                                {selectedThemeID == null ? (
                                    <div className="text-sm text-gray-500">Select a theme to view codes.</div>
                                ) : (
                                    projectCodes.length === 0 ? (
                                        <p className="text-sm text-gray-500">No codes have been created yet.</p>
                                    ) : (
                                        [...projectCodes].sort((a, b) => {
                                            const aInTheme = themeCodeIDs.has(a.id);
                                            const bInTheme = themeCodeIDs.has(b.id);

                                            if (aInTheme === bInTheme) {
                                                return a.name.localeCompare(b.name);
                                            }

                                            return aInTheme ? -1 : 1;
                                        })
                                            .map((code) => {
                                                const inTheme = themeCodeIDs.has(code.id);

                                                return (
                                                    <div
                                                        key={code.id}
                                                        className={`border rounded p-3 transition-shadow ${
                                                            inTheme
                                                                ? "border-green-500 bg-green-50"
                                                                : "border-red-400 bg-red-50"
                                                        } ${
                                                        selectedCodeID === code.id
                                                            ? "ring-2 ring-blue-500 shadow-md"
                                                            : ""
                                                        }`}>

                                                        <div className="flex items-start justify-between gap-2">
                                                            <button type="button"
                                                                    onClick={() => setSelectedCodeID(code.id)}
                                                                    className="flex-1 text-left">
                                                                <div className="flex items-center gap-2">
                                                                    <span
                                                                        className="inline-block w-3 h-3 rounded-full border border-gray-300"
                                                                        style={{backgroundColor: code.colour}}></span>

                                                                    <span className="font-semibold">{code.name}</span>
                                                                </div>

                                                                <div
                                                                    className="text-xs text-gray-600 mt-1">{code.annotations.length} annotations
                                                                </div>

                                                                {code.description && (
                                                                    <div
                                                                        className="text-xs text-gray-500 mt-1 wrap-break-word">{code.description}</div>
                                                                )}
                                                            </button>

                                                            <div className="flex items-center gap-2">
                                                                <button type="button"
                                                                        className="small-button flex items-center justify-center"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openCodeEditor(code);
                                                                        }}>
                                                                    Edit
                                                                </button>

                                                                <button type="button"
                                                                        className="small-button flex items-center justify-center w-4 h-4 p-0"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (inTheme) {
                                                                                removeCodeFromTheme(code.id);
                                                                            } else {
                                                                                addCodeToTheme(code.id);
                                                                            }
                                                                        }}>
                                                                    {inTheme ? "-" : "+"}
                                                                </button>
                                                            </div>
                                                        </div>

                                                    </div>
                                                );

                                            })


                                    )
                                )}
                            </div>

                            {/* Annotations Panel */}
                            <div className="p-4 flex flex-col min-h-0">
                                <h3 className="font-bold mb-3">Annotations</h3>

                                {selectedCode == null ? (
                                    <div className="text-sm text-gray-500">
                                        Select a code to view annotations.
                                    </div>
                                ) : (
                                    <div className="flex-1 overflow-y-auto space-y-3">
                                        {selectedCode.annotations.length === 0 ? (
                                            <div className="text-sm text-gray-500">No annotations assigned to
                                                code.</div>
                                        ) : (
                                            selectedCode.annotations.map((annotation) => (
                                                <div key={annotation.id}
                                                     className="border border-gray-300 rounded p-3 bg-gray-50">
                                                    <div className="text-sm font-medium wrap-break-word">
                                                        {annotation.selectedText || "No text associated with annotation"}
                                                    </div>

                                                    <div className="text-xs text-gray-600 mt-2">
                                                        {formatTime(annotation.startTime)} - {formatTime(annotation.endTime)}
                                                    </div>

                                                    {annotation.transcriptFile && (
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {annotation.transcriptFile.fileName}
                                                        </div>
                                                    )}

                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Event: {annotation.event?.name ?? "Unassigned"} | Group: {annotation.group?.name ?? "Group"}
                                                    </div>

                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {isThemeEditorOpen && (
                            <div className="modal-overlay">
                                <div className="modal-content w-full max-w-md">
                                    <div className="grid grid-cols-3 items-center border-b border-gray-300 pb-2 mb-4">
                                        <div></div>

                                        <div className="text-center">
                                            <h2 className="text-lg font-bold">{themeEditorMode === "edit" ? "Edit Theme" : "Add Theme"}</h2>
                                        </div>

                                        <div className="flex justify-end">
                                            <button type="button" onClick={closeThemeEditor}
                                                    className="w-7 h-7 border border-gray-300 rounded hover:bg-gray-100 flex items-center justify-center text-sm">X
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Name</label>
                                            <input
                                                value={themeFormName}
                                                onChange={(e) => setThemeFormName(e.target.value)}
                                                className="w-full border border-gray-300 rounded px-2 py-1"/>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1">Description</label>
                                            <input
                                                value={themeFormDescription}
                                                onChange={(e) => setThemeFormDescription(e.target.value)}
                                                className="w-full border border-gray-300 rounded px-2 py-1"/>
                                        </div>

                                        <div className="flex justify-center gap-3">
                                            {themeEditorMode === "edit" && (
                                                <button type="button" className="regular-button" onClick={deleteTheme}>
                                                    Delete Theme
                                                </button>
                                            )}

                                            <button type="button" className="regular-button" onClick={saveTheme}>Save
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isCodeEditorOpen && (
                            <div className="modal-overlay">
                                <div className="modal-content w-full max-w-md">
                                    <div className="grid grid-cols-3 items-center border-b border-gray-300 pb-2 mb-4">
                                        <div></div>

                                        <div className="text-center">
                                            <h2 className="text-lg font-bold">Edit Code</h2>
                                        </div>

                                        <div className="flex justify-end">
                                            <button type="button" onClick={closeCodeEditor}
                                                    className="w-7 h-7 border border-gray-300 rounded hover:bg-gray-100 flex items-center justify-center text-sm">X
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Name</label>
                                            <input
                                                value={codeFormName}
                                                onChange={(e) => setCodeFormName(e.target.value)}
                                                className="w-full border border-gray-300 rounded px-2 py-1"/>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1">Description</label>
                                            <input
                                                value={codeFormDescription}
                                                onChange={(e) => setCodeFormDescription(e.target.value)}
                                                className="w-full border border-gray-300 rounded px-2 py-1"/>
                                        </div>

                                        <div className="flex justify-center">
                                            <button type="button" className="regular-button"
                                                    onClick={saveCodeEdit}>Save
                                            </button>
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

