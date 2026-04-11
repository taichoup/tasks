import { describe, expect, it } from "vitest";
import { newTaskSchema, updateTaskSchema } from "./schemas.js";

describe("newTaskSchema", () => {
  it("defaults tags to an empty array", () => {
    const result = newTaskSchema.parse({
      title: "Arroser les plantes",
      frequency: {
        unit: "day",
        value: 1,
      },
    });

    expect(result.tags).toEqual([]);
  });

  it("rejects an empty title", () => {
    const result = newTaskSchema.safeParse({
      title: "   ",
      frequency: {
        unit: "day",
        value: 1,
      },
      tags: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid frequency values", () => {
    const result = newTaskSchema.safeParse({
      title: "Sortir les poubelles",
      frequency: {
        unit: "week",
        value: 0,
      },
      tags: [],
    });

    expect(result.success).toBe(false);
  });
});

describe("updateTaskSchema", () => {
  it("accepts an ISO checkedAt timestamp", () => {
    const result = updateTaskSchema.safeParse({
      id: "task-1",
      checkedAt: "2026-03-29T10:15:00.000Z",
    });

    expect(result.success).toBe(true);
  });

  it("accepts clearing checkedAt with an empty string", () => {
    const result = updateTaskSchema.safeParse({
      id: "task-1",
      checkedAt: "",
    });

    expect(result.success).toBe(true);
  });

  it("rejects malformed timestamps", () => {
    const result = updateTaskSchema.safeParse({
      id: "task-1",
      checkedAt: "not-a-date",
    });

    expect(result.success).toBe(false);
  });
});
