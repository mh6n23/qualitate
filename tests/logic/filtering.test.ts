import {describe, expect, it} from "vitest";

interface groupedFile {
    id: number;
    eventID: number | null;
    groupID: number | null;
}

interface groupedAnnotation {
    id: number;
    eventID: number | null;
    groupID: number | null;
}

function getViewableFiles(files: groupedFile[], selectedEventID: number | null, selectedGroupID: number | null) {
    return files.filter((file) => {
        if (selectedEventID == null || selectedGroupID == null) {
            return false;
        }

        return file.eventID === selectedEventID && file.groupID === selectedGroupID;
    });
}

function getViewableAnnotations(annotations: groupedAnnotation[], selectedEventID: number | null, selectedGroupID: number | null) {
    return annotations.filter((annotation) => {
        if (selectedEventID == null || selectedGroupID == null) {
            return false;
        }

        return annotation.eventID === selectedEventID && annotation.groupID === selectedGroupID;
    });
}

describe("Event/Group filtering logic", () => {
    it ("Only returns files in the selected event and group", () => {
        const files = [
            {id: 1, eventID: 1, groupID: 1},
            {id: 2, eventID: 2, groupID: 2},
            {id: 3, eventID: 2, groupID: 1},
        ];

        expect(getViewableFiles(files, 1, 1)).toEqual([
            {id: 1, eventID: 1, groupID: 1},
            ]);
    });

    it ("Only returns annotations in the selected event and group", () => {
        const annotations = [
            {id: 4, eventID: 1, groupID: 1},
            {id: 5, eventID: 1, groupID: 2},
            {id: 6, eventID: 2, groupID: 1},
        ];

        expect(getViewableFiles(annotations, 1, 2)).toEqual([
            {id: 5, eventID: 1, groupID: 2},
        ]);
    });

    it ("Doesn't return files if the event or group isn't selected", () => {
        const files = [{id: 1, eventID: 1, groupID: 1}];
        const annotations = [{id: 10, eventID: 1, groupID: 1}];

        expect(getViewableFiles(files, null, 1)).toEqual([]);
        expect(getViewableFiles(files, null, 1)).toEqual([]);
        expect(getViewableAnnotations(annotations, null, 1)).toEqual([]);
        expect(getViewableAnnotations(annotations, 1, null)).toEqual([]);
    });
});