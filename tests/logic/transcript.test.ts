import {describe, expect, it} from "vitest";

interface Line {
    id: number;
    startTime: number;
    endTime: number;
    text: string;
}

function convertTimeToSeconds(timeString: string): number {
    const commaCheck = timeString.trim().replace(",", ".");
    const components = commaCheck.trim().split(':');
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

function parseVTT(text: string): Line[] {
    const lines: Line[] = [];
    const rows = text.split(/\r?\n/);
    let index = 0;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i].trim();

        if (!row.includes("-->")) {
            continue;
        }

        const [start, end] = row.split("-->").map((part) => part.trim());

        if (!start || !end) {
            continue;
        }

        const startTime = convertTimeToSeconds(start.replace(",", "."));
        const endTime = convertTimeToSeconds(end.split(" ")[0].replace(",", "."));

        const textLines: string[] = []
        let j = i + 1;

        while (j < rows.length && rows[j].trim() !== "") {
            textLines.push(rows[j].trim());
            j++;
        }

        const content = textLines.join(" ").trim();

        if (content) {
            lines.push({
                id: index++,
                startTime,
                endTime,
                text: content
            });
        }

        i = j;
    }

    return lines;
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

describe("Transcript Parsing Logic", () => {
    it("Converts a full hh:mm:ss timestamp into seconds", () => {
        expect(convertTimeToSeconds("0:00:30")).toBe(30);
        expect(convertTimeToSeconds("1:30:30")).toBe(5430);
    });

    it("Converts a timestamp with milliseconds into seconds", () => {
        expect(convertTimeToSeconds("0:00:30.500")).toBe(30.5);
        expect(convertTimeToSeconds("0:00:30,500")).toBe(30.5);
    })

    it("Parses timestamped transcript lines in the txt format", () => {
        const text =
            `[0:00:00 - 0:00:05] Line 1 Contents
             [0:00:05 - 0:00:10] Line 2 Contents`.trim();

        const lines = parseTranscript(text);

        expect(lines).toHaveLength(2);
        expect(lines[0]).toEqual({
            id: 0,
            startTime: 0,
            endTime: 5,
            text: "Line 1 Contents",
        });
        expect(lines[1].text).toBe("Line 2 Contents");

    })

    it("Parses timestamped transcript lines in the VTT format", () => {
        const text =
            `WEBVTT
            
             00:00:00.000 --> 00:00:05.000 
             Line 1 Contents
             
             00:00:00.000 --> 00:00:05.000 
             Line 2 Contents`.trim();

        const lines = parseVTT(text);

        expect(lines).toHaveLength(2);
        expect(lines[0]).toEqual({
            id: 0,
            startTime: 0,
            endTime: 5,
            text: "Line 1 Contents",
        });
        expect(lines[1].text).toBe("Line 2 Contents");
    })

    it("Calculates transcript duration using the last line", () => {
        const file = new File(
            [`[0:00:00 - 0:00:05] Line 1 Contents
             [0:00:05 - 0:00:10] Line 2 Contents`],
            "transcript.txt",
            {type: "text/plain"}
        );

        expect(getTranscriptDuration(file)).resolves.toBe(10);
    })
})