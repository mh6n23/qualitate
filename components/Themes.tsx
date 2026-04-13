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
    const [assignableCodes, setAssignableCodes] = useState<Code[]>([]);
    const [newThemeName, setNewThemeName] = useState("");
    const [newThemeDesc, setNewThemeDesc] = useState("");
    const [addedCode, setAddedCode] = useState<number | null>(null);

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

    async function getAssignableCodes() {
        try {
            const response = await fetch(`/api/projects/${projectID}/codes`);
            const data = await response.json();

            if (!response.ok) {
                alert("Failed to get codes");
                return;
            }

            setAssignableCodes(data);
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

    async function createTheme() {
        if (!newThemeName.trim()) {
            alert("You haven't entered a theme name");
            return;
        }

        try {
            const response = await fetch(`/api/projects/${projectID}/themes`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: newThemeName,
                    description: newThemeDesc,
                })
            });

            const data = await response.json();

            if (!response.ok) {
                alert("Failed to create theme");
                return;
            }

            setThemes((prev) => [...prev, {
                ...data,
                _count: {codeLinks: 0}
            }].sort((a, b) => a.name.localeCompare(b.name)));
            setSelectedThemeID(data.id);
            setNewThemeName("");
            setNewThemeDesc("");
        } catch (error) {
            console.error(error);
            alert("Failed to create theme");
        }
    }

    async function assignCodeToTheme() {
        if (selectedThemeID == null) {
            alert("You haven't selected a theme");
            return;
        }

        if (addedCode == null) {
            alert("You haven't selected a code to add");
            return;
        }

        try {
            const response = await fetch(`/api/themes/${selectedThemeID}/codes`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    codeID: addedCode
                })
            });

            const data = await response.json();

            if (!response.ok) {
                alert("Failed to assign code to theme");
            }

            await getThemeCodes(selectedThemeID);
            await getThemes();
            setAddedCode(null);
        } catch (error) {
            console.error(error);
            alert("Failed to assign code to theme");
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
        await getAssignableCodes();
    }

    async function selectTheme(themeID: number) {
        setSelectedThemeID(themeID);
        setSelectedCodeID(null);
        await getThemeCodes(themeID);
    }

    const selectedCode = useMemo(() => {
        return themeCodes.find((code) => code.id === selectedCodeID) || null;
    }, [themeCodes, selectedCodeID]);

    const selectableCodes = useMemo(() => {
        const codeIDs = new Set(themeCodes.map((code) => code.id));
        return assignableCodes.filter((code) => !codeIDs.has(code.id));
    }, [assignableCodes, themeCodes]);

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
                                <button type="button" onClick={() => setIsModalOpen(false)}
                                        className="w-7 h-7 border border-gray-300 rounded hover:bg-gray-100 flex items-center justify-center text-sm">X
                                </button>
                            </div>

                        </div>

                        {/* Main View */}
                        <div
                            className="grid grid-cols-[1fr_1fr_2fr] border border-gray-300 rounded overflow-hidden min-h-[520px]">

                            {/* Themes Panel */}
                            <div className="border-r border-gray-300 p-4 flex flex-col min-h-0">
                                <h3 className="font-bold mb-3">Themes</h3>

                                <div className="space-y-2 mb-4">
                                    <input value={newThemeName}
                                           onChange={(e) => {
                                               setNewThemeName(e.target.value)
                                           }}
                                           placeholder="New theme name"
                                           className="w-full border border-gray-300 rounded px-2 py-1"/>

                                    <input value={newThemeDesc}
                                           onChange={(e) => {
                                               setNewThemeDesc(e.target.value)
                                           }}
                                           placeholder="New theme description"
                                           className="w-full border border-gray-300 rounded px-2 py-1"/>

                                    <div className="flex justify-center">
                                        <button type="button" className="regular-button" onClick={createTheme}>
                                            Add Theme
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-2">
                                    {themes.length === 0 ? (
                                        <p className="text-sm text-gray-500">No themes exist.</p>
                                    ) : (
                                        themes.map((theme) => (
                                            <button key={theme.id} type="button" onClick={() => selectTheme(theme.id)}
                                                    className={`w-full text-left border rounded p-3 ${
                                                        selectedThemeID === theme.id
                                                            ? "border-blue-500 bg-blue-50"
                                                            : "border-gray-300 bg-white hover:bg-gray-50"
                                                    }`}
                                            >
                                                <div className="font-semibold">{theme.name}</div>

                                                <div
                                                    className="text-xs text-gray-600 mt-1">{theme._count?.codeLinks ?? 0} codes
                                                </div>

                                                {theme.description && (
                                                    <div
                                                        className="text-xs text-gray-500 mt-1 wrap-break-word">{theme.description}</div>
                                                )}
                                            </button>
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
                                    <>
                                        <div className="space-y-2 mb-4">
                                            <select value={addedCode ?? ""}
                                                    onChange={(e) => setAddedCode(e.target.value ? parseInt(e.target.value) : null)}
                                                    className="w-full border border-gray-300 rounded px-2 py-1 bg-white">
                                                <option value="">Select code to add.</option>

                                                {selectableCodes.map((code) => (
                                                    <option key={code.id} value={code.id}>{code.name}</option>
                                                ))}
                                            </select>

                                            <div className="flex justify-center">
                                                <button type="button" className="regular-button"
                                                        onClick={assignCodeToTheme}>Add Code
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto space-y-2">
                                            {themeCodes.length === 0 ? (
                                                <p className="text-sm text-gray-500">No codes assigned to theme yet.</p>
                                            ) : (
                                                themeCodes.map((code) => (
                                                    <button key={code.id} type="button"
                                                            onClick={() => setSelectedCodeID(code.id)}
                                                            className={`w-full text-left border rounded p-3 ${
                                                                selectedCodeID === code.id ?
                                                                    "border-blue-500 bg-blue-50"
                                                                    : "border-gray-300 bg-white hover:bg-gray-50"}`}>

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
                                                ))
                                            )}
                                        </div>
                                    </>
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
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

