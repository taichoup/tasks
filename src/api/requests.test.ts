import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addTask, deleteTask, fetchTasks, toggleTask } from "./requests";
import type { Task } from "../types/derived";

const baseTask: Task = {
  id: "task-1",
  title: "Test task",
  checkedAt: "",
  frequency: {
    unit: "day",
    value: 1,
  },
  tags: [],
};

describe("requests API helpers", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("fetchTasks returns parsed tasks", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify([baseTask]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(fetchTasks()).resolves.toEqual([baseTask]);
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/tasks$/), {
      method: "GET",
    });
  });

  it("addTask validates inputs before sending a request", async () => {
    await expect(addTask("   ", 1, "day", [])).rejects.toThrow(
      "New title cannot be empty",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("addTask posts the expected payload", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 201 }));

    await addTask("Arroser", 2, "week", ["jardin"]);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/tasks$/),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Arroser",
          frequency: { value: 2, unit: "week" },
          tags: ["jardin"],
        }),
      }),
    );
  });

  it("toggleTask checks an unchecked task by sending a timestamp", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-29T18:00:00.000Z"));
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));

    await toggleTask(baseTask);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/tasks$/),
      expect.objectContaining({
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "task-1",
          checkedAt: "2026-03-29T18:00:00.000Z",
        }),
      }),
    );

    vi.useRealTimers();
  });

  it("toggleTask unchecks a checked task by clearing checkedAt", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));

    await toggleTask({
      ...baseTask,
      checkedAt: "2026-03-29T10:00:00.000Z",
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/tasks$/),
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          id: "task-1",
          checkedAt: "",
        }),
      }),
    );
  });

  it("deleteTask targets the item URL and throws on failure", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, {
        status: 500,
        statusText: "Server Error",
      }),
    );

    await expect(deleteTask("task-1")).rejects.toThrow(
      "Failed to delete task. Server Error",
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/tasks\/task-1$/),
      expect.objectContaining({
        method: "DELETE",
      }),
    );
  });
});
