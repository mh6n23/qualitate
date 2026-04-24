import {describe, expect, it} from "vitest";

interface MediaFile {
    id: number;
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

const getCurrentFile = (files: MediaFile[], folder: string, playNeedle: number) => {
    const activeFiles = files.filter((file) => {
        if (!file.filePath.includes(folder)) {
            return false;
        }

        const startTime = getFileStartTime(file);
        const endTime = getFileEndTime(file);

        return playNeedle >= startTime && playNeedle <= endTime;
    }).sort((a, b) => getFileStartTime(b) - getFileStartTime(a))

    return activeFiles[0];
}

describe("Actively shown file logic", () => {
    it("Selects image with later start time when two overlap", () => {
        const files = [
            {
                id: 1,
                creationTime: "2026-04-24T15:28:00.000Z",
                duration: 10,
                filePath: "/uploads/project-1/Images/image-1.png",
            },
            {
                id: 2,
                creationTime: "2026-04-24T15:28:05.000Z",
                duration: 10,
                filePath: "/uploads/project-1/Images/image-2.png",
            },
        ];

        const playNeedle = new Date("2026-04-24T15:28:06.000Z").getTime();
        const currentImage = getCurrentFile(files, "/Images", playNeedle);

        expect(currentImage?.id).toBe(2);
    });

    it("Returns undefined when no image file should be active", () => {
        const files = [
            {
                id: 1,
                creationTime: "2026-04-24T15:28:00.000Z",
                duration: 10,
                filePath: "/uploads/project-1/Images/image-1.png",
            },
        ];

        const playNeedle = new Date("2026-04-24T15:28:20.000Z").getTime();
        const currentImage = getCurrentFile(files, "/Images", playNeedle);

        expect(currentImage).toBeUndefined();
    });

    it("Ignores files from other folders", () => {
        const files = [
            {
                id: 1,
                creationTime: "2026-04-24T15:28:00.000Z",
                duration: 10,
                filePath: "/uploads/project-1/Videos/video.mp4",
            },
            {
                id: 2,
                creationTime: "2026-04-24T15:28:00.000Z",
                duration: 10,
                filePath: "/uploads/project-1/Images/image.png",
            },
        ];

        const playNeedle = new Date("2026-04-24T15:28:05.000Z").getTime();
        const currentImage = getCurrentFile(files, "/Images", playNeedle);

        expect(currentImage?.id).toBe(2);
    });
})