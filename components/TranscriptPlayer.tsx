'use client';

import {useAtomValue, useSetAtom} from 'jotai';
import {currTimeAtom} from "@/app/atoms";
import {useEffect, useMemo, useRef, useState} from "react";
import {Annotation, Code, MediaFile} from '@prisma/client';

interface Props {
    file: MediaFile;
    projectStartTime: number;
    onSelectionChange: (selection: TranscriptAnnotationSelection | null) => void;
    annotations: (Annotation & {
        code: Code;
    })[];
}

interface Line {
    id: number;
    startTime: number;
    endTime: number;
    text: string;
}

interface TranscriptAnnotationSelection {
    transcriptFileID: number;
    transcriptStartLine: number;
    transcriptEndLine: number;
    startTime: number;
    endTime: number;
    selectedText: string;
    startOffset: number;
    endOffset: number;
}

export default function TranscriptPlayer({file, projectStartTime, onSelectionChange, annotations}: Props) {
    const [lines, setLines] = useState<Line[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const currTime = useAtomValue(currTimeAtom);
    const setTime = useSetAtom(currTimeAtom);
    const activeRef = useRef<HTMLDivElement>(null);
    const [annotationMode, setAnnotationMode] = useState(false);
    const transcriptAnnotations = annotations.filter(
        (annotation) => annotation.transcriptFileID === file.id
    );


    function getLine(node: Node | null): HTMLElement | null {
        if (!node) {
            return null;
        }

        let current: HTMLElement | null = node instanceof HTMLElement ? node : node.parentElement;

        while (current) {
            if (current.dataset.lineId) {
                return current;
            }
            current = current.parentElement;
        }

        return null;
    }

    function handleTextSelection() {
        if (!annotationMode) {
            return;
        }

        const selection = window.getSelection();

        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
            onSelectionChange(null);
            return;
        }

        const selectedText = selection.toString().trim();

        if (!selectedText) {
            onSelectionChange(null);
            return;
        }

        const anchor = getLine(selection.anchorNode);
        const focus = getLine(selection.focusNode);

        if (!anchor || !focus) {
            onSelectionChange(null);
            return;
        }

        const anchorID = parseInt(anchor.dataset.lineId || "");
        const focusID = parseInt(focus.dataset.lineId || "");

        if (Number.isNaN(anchorID) || Number.isNaN(focusID)) {
            onSelectionChange(null);
            return;
        }

        const startID = Math.min(anchorID, focusID);
        const endID = Math.max(anchorID, focusID);

        const start = lines.find((line) => line.id === startID);
        const end = lines.find((line) => line.id === endID);

        if (!start || !end) {
            onSelectionChange(null);
            return;
        }

        const forwardSelect = anchorID < focusID || (anchorID === focusID && selection.anchorOffset <= selection.focusOffset);
        const startOffset = forwardSelect ? selection.anchorOffset : selection.focusOffset;
        const endOffset = forwardSelect ? selection.focusOffset : selection.anchorOffset;

        const nextSelection: TranscriptAnnotationSelection = {
            transcriptFileID: file.id,
            transcriptStartLine: start.id,
            transcriptEndLine: end.id,
            startTime: start.startTime + offsetSeconds,
            endTime: end.endTime + offsetSeconds,
            selectedText,
            startOffset,
            endOffset
        };

        onSelectionChange(nextSelection);
    }

    function handleLineClick(line: Line) {
        if (!annotationMode) {
            setTime(line.startTime + offsetSeconds);
        }
    }

    function formatTime(totalSeconds: number) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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

    function parseTranscript(text: string): Line[] {
        const lines: Line[] = [];
        const regex = /\[([\d:]+)[ \-]+([\d:]+)]\s*([^\[]+)/g;
        let match;
        let index = 0;

        while ((match = regex.exec(text)) !== null) {
            const startTime = match[1];
            const endTime = match[2];
            const content = match[3].trim();

            if (content) {
                lines.push(
                    {
                        id: index++,
                        startTime: convertTimeToSeconds(startTime),
                        endTime: convertTimeToSeconds(endTime),
                        text: content
                    }
                );
            }
        }
        return lines;
    }


    useEffect(() => {
        if (!file) {
            return;
        }

        let fileActive = true;

        const getTranscript = async () => {
            try {
                const transcriptFile = await fetch(file.filePath);
                const transcriptText = await transcriptFile.text();
                const parsedLines = parseTranscript(transcriptText);

                if (fileActive) {
                    setLines(parsedLines);
                }
            } catch (error) {
                console.error("Couldn't load transcript" + file.fileName + ":" + error);
            }
        }

        getTranscript();

        return () => {
            fileActive = false;
        }


    }, [file]); // Run whenever the active transcript file changes


    const fileStartTime = new Date(file.creationTime).getTime();
    const offsetSeconds = (fileStartTime - projectStartTime) / 1000;
    const filePositionTime = currTime - offsetSeconds;


    // UseMemo only runs during renders which will be when the transcript is updated or search changes
    const searchedLines = useMemo(() => {
        if (!searchTerm.trim()) return lines; // Return as normal if nothing has been searched
        return lines.filter(line => line.text.toLowerCase().includes(searchTerm.toLowerCase()))
    }, [lines, searchTerm])

    const activeLine = lines.find(line => filePositionTime >= line.startTime && filePositionTime < line.endTime);
    const activeLineId = activeLine ? activeLine.id : null;

    // Auto scrolling - Gets disabled if a term has been searched
    useEffect(() => {
        if (activeRef.current && searchTerm === "") {
            activeRef.current.scrollIntoView({behavior: "smooth", block: "center"});
        }
    }, [activeLineId]);

    function highlightedLine(line: Line, annotations: (Annotation & {code: Code})[]
    ) {
        const annotationMatch = annotations.filter((annotation) => {
            if (annotation.transcriptStartLine == null ||
            annotation.transcriptEndLine == null ||
            annotation.transcriptStartOffset == null ||
            annotation.transcriptEndOffset == null) {
                return false;
            }

            return (
                line.id >= annotation.transcriptStartLine &&
                    line.id <= annotation.transcriptEndLine
            );
        });

        if (annotationMatch.length === 0) {
            return line.text;
        }

        type substringHighlight = {
            start: number;
            end: number;
            colour: string;
        };

        const substringHighlights: substringHighlight[] = [];

        for (const annotation of annotationMatch) {
            const startLine = annotation.transcriptStartLine;
            const endLine = annotation.transcriptEndLine;
            const startOffset = annotation.transcriptStartOffset;
            const endOffset = annotation.transcriptEndOffset;

            if (startLine == null || endLine == null || startOffset == null || endOffset == null) {
                continue;
            }

            let start = 0;
            let end = line.text.length;

            if (startLine === endLine) {
                start = startOffset;
                end = endOffset;
            }
            else if (line.id === annotation.transcriptStartLine) {
                start = startOffset;
                end = line.text.length;
            }
            else if (line.id === endLine) {
                start = 0;
                end = endOffset;
            }

            start = Math.max(0, Math.min(start, line.text.length));
            end = Math.max(start, Math.min(end, line.text.length));

            substringHighlights.push({
                start,
                end,
                colour: annotation.code.colour
            });
        }

        substringHighlights.sort((a, b) => a.start - b.start);

        const parts: React.ReactNode[] = [];
        let cursor = 0;

        substringHighlights.forEach((substringHighlight, index) => {
            if (substringHighlight.start > cursor) {
                parts.push(
                    <span key={`plain-${index}-${cursor}`}>{line.text.slice(cursor, substringHighlight.start)}</span>
                );
            }

            parts.push(
                <span key={`highlight-${index}-${substringHighlight.start}`}
                style={{
                    backgroundColor: `${substringHighlight.colour}33`,
                    borderBottom: `2px solid ${substringHighlight.colour}`
                }}>
                    {line.text.slice(substringHighlight.start, substringHighlight.end)}
                </span>
            );

            cursor = Math.max(cursor, substringHighlight.end);
        });

        if (cursor < line.text.length) {
            parts.push(
                <span key={`plain-tail-${cursor}`}>{line.text.slice(cursor)}</span>
            );
        }
        
        return parts;
    }
    
    return (
        <div className="flex flex-col h-full w-full border">

            <div className="p-2 border-b border-gray-300 shrink-0 bg-gray-50">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="Search the current transcript..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border-gray-300 rounded"/>

                    <button type="button" onClick={() => {
                        setAnnotationMode((currentMode) => !currentMode);
                        onSelectionChange(null);
                        const selection = window.getSelection();
                        selection?.removeAllRanges();

                    }} className={`px-3 py-1.5 rounded border text-sm font-medium ${
                        annotationMode
                            ? "bg-yellow-200 border-yellow-500 text-yellow-900"
                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
                    }`}>{annotationMode ? "View Mode" : "Select Mode"}</button>
                </div>



            </div>

            <div className="flex-1 overflow-y-auto"
                onMouseUp={handleTextSelection}>
                {searchedLines.length > 0 ? (
                    searchedLines.map((line) => {
                        const isCurrLine = filePositionTime >= line.startTime && filePositionTime < line.endTime;

                        return (
                            <div
                                key={line.id}
                                data-line-id={line.id}
                                data-line-start={line.startTime}
                                data-line-end={line.endTime}
                                ref={isCurrLine ? activeRef : null}
                                onClick={() => handleLineClick(line)}
                                className={`flex cursor-pointer transition-colors duration-200 border-b border-b-gray-300 border-l-4 ${
                                    isCurrLine
                                        ? "bg-blue-100 border-l-blue-500"
                                            : "hover:bg-gray-50 text-gray-600 border-l-transparent"
                                }`}
                            >

                                {/* Time Column */}
                                <div className="shrink-0 py-2 border-r border-gray-400 flex justify-center select-none"
                                     style={{width: '50px'}}>
                                    <span className="text-xs">{formatTime(line.startTime)}</span>
                                </div>

                                {/* Line Contents Column */}
                                <div className="flex-1 py-2 pl-3 pr-2" data-line-text="true">
                                    <p className="text-xs">{highlightedLine(line, transcriptAnnotations)}</p>
                                </div>
                            </div>

                        );
                    })
                ) : (
                    <div className="flex h-full items-center justify-center text-gray-500">No results found.</div>
                )}


            </div>
        </div>
    )
}