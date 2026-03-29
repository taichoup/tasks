import { describe, expect, it } from "vitest";
import type { Task, TagList } from "../types/derived";
import { ALL_TAGS_FILTER, filterTasksByTag, getAvailableTaskTags, UNTAGGED_FILTER } from "./taskFiltering";

const createTask = (overrides: Partial<Task>): Task => ({
    id: "task-1",
    title: "Test",
    checkedAt: "",
    frequency: { unit: "day", value: 1 },
    tags: [] as TagList,
    ...overrides,
});

describe("getAvailableTaskTags", () => {
    it("returns distinct sorted tags from the task list", () => {
        const tasks = [
            createTask({ id: "1", tags: ["jardin"] }),
            createTask({ id: "2", tags: ["maison"] }),
            createTask({ id: "3", tags: ["jardin", "voiture"] }),
            createTask({ id: "4", tags: [] }),
        ];

        expect(getAvailableTaskTags(tasks)).toEqual(["jardin", "maison", "voiture"]);
    });
});

describe("filterTasksByTag", () => {
    const tasks = [
        createTask({ id: "1", tags: ["jardin"] }),
        createTask({ id: "2", tags: ["maison"] }),
        createTask({ id: "3", tags: [] }),
    ];

    it("returns all tasks for the all filter", () => {
        expect(filterTasksByTag(tasks, ALL_TAGS_FILTER)).toEqual(tasks);
    });

    it("returns only untagged tasks for the untagged filter", () => {
        expect(filterTasksByTag(tasks, UNTAGGED_FILTER).map((task) => task.id)).toEqual(["3"]);
    });

    it("returns only tasks matching the selected tag", () => {
        expect(filterTasksByTag(tasks, "jardin").map((task) => task.id)).toEqual(["1"]);
    });
});
