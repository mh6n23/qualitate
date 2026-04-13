'use client';

import {useState, useMemo, useCallback} from "react";
import {project} from "effect/Layer";

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

export default function Themes({ projectID }: ThemeProps) {
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

    async function getThemeCodes (themeID: number) {
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

            setThemes((prev) => [...prev, {...data, _count: {codeLinks: 0}}].sort((a,b) => a.name.localeCompare(b.name)));
            setSelectedThemeID(data.id);
            setNewThemeName("");
            setNewThemeDesc("");
        }
        catch (error) {
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




}