import {describe, expect, it} from "vitest";
import {fallback} from "valibot";

interface MediaFile {
    creationTime: string;
    duration: number;
    filePath: string;
}

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

function getViewableTimelineRange(viewableFiles: MediaFile[], projectStartTime: number) {
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

    const projectDurationSecs = Math.max(0, (viewableEndTime - viewableStartTime) / 1000);

    return {viewableStartTime, viewableEndTime, projectDurationSecs};
}

describe("Timeline Logic", () => {
    it("Uses earliest viewable file as the viewable start time", () => {
        const files = [
            {
                creationTime: "2026-04-24T15:28:42.000Z",
                duration: 30,
                filePath: "/uploads/project-1/Videos/video.mp4",
            },
            {
                creationTime: "2026-04-24T15:28:00.000Z",
                duration: 35,
                filePath: "/uploads/project-1/Transcripts/transcript.txt",
            },
        ];

        const result = getViewableTimelineRange(files, new Date("2026-04-24T16:00:00.000Z").getTime());

        expect(result.viewableStartTime).toBe(new Date("2026-04-24T15:28:00.000Z").getTime());

    });

    it ("Uses the latest file end time as the viewable end time", () => {
        const files = [
            {
                creationTime: "2026-04-24T15:28:00.000Z",
                duration: 20,
                filePath: "/uploads/project-1/Videos/video.mp4",
            },
            {
                creationTime: "2026-04-24T15:28:10.000Z",
                duration: 30,
                filePath: "/uploads/project-1/Audio/audio.mp3",
            },
        ];

        const result = getViewableTimelineRange(files, new Date("2026-04-24T16:00:00.000Z").getTime());
        expect(result.viewableEndTime).toBe(new Date("2026-04-24T15:28:10.000Z").getTime() + 30000);
        expect(result.projectDurationSecs).toBe(40);
    })

    it ("Uses 10 second default duration for images with no assigned duration", () => {
        const image = {
            creationTime: "2026-04-24T15:28:00.000Z",
            duration: 0,
            filePath: "/uploads/project-1/Images/image.png",
        };

        expect(getFileDuration(image)).toBe(10000);

    });

    it ("Uses the provided project start time when no files are visible", () => {
        const providedTime = new Date("2026-04-24T16:00:00.000Z").getTime();
        const result = getViewableTimelineRange([], providedTime);

        expect(result.viewableStartTime).toBe(providedTime);
        expect(result.viewableEndTime).toBe(providedTime + 10000);
        expect(result.projectDurationSecs).toBe(10);
    });
})

