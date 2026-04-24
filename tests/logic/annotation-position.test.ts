import {describe, expect, it} from "vitest";

function getAnnotationPosition(
    transcriptCreationTime: string | null,
    annotationStartTime: number,
    projectStartTime: number,
    pixelsPerSecond: number
) {
    return transcriptCreationTime ? (((new Date(transcriptCreationTime).getTime() + (annotationStartTime * 1000)) - projectStartTime) / 1000) * pixelsPerSecond
        : annotationStartTime * pixelsPerSecond;
}

describe("Annotation placement logic", () => {
    it ("Positions annotations relative to the transcript file's start time", () => {
        const position = getAnnotationPosition(
            "2026-04-24T15:28:42.000Z",
            5,
            new Date("2026-04-24T15:28:00.000Z").getTime(),
            20);

        expect(position).toBe((42 + 5) * 20);
    })

    it ("Annotation is shifted right when the timeline changes to begin at an earlier timestamp", () => {
        const originalPosition = getAnnotationPosition("2026-04-24T15:28:42.000Z",
            5,
            new Date("2026-04-24T15:28:00.000Z").getTime(),
            20);

        const newPosition = getAnnotationPosition("2026-04-24T15:28:42.000Z",
            5,
            new Date("2026-04-24T15:27:30.000Z").getTime(),
            20);

        expect(newPosition).toBeGreaterThan(originalPosition);
    });

    it ("Annotation uses relative placement if the transcript is removed from the project", () => {
        const position = getAnnotationPosition(null, 8, 0, 20);
        expect(position).toBe(160);
    })
})