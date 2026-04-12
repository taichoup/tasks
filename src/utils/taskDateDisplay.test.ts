import { describe, expect, it } from "vitest";
import type { Task, TagList } from "../types/derived";
import { formatTaskDate, getCheckedTaskDateSummary } from "./taskDateDisplay";

const BASE_TASK: Task = {
  id: "1",
  title: "Test",
  frequency: { unit: "day", value: 1 },
  checkedAt: "",
  tags: [] as TagList,
};

describe("formatTaskDate", () => {
  it("omits the year for dates in the current year", () => {
    const now = new Date("2026-04-12T12:00:00.000Z");

    expect(formatTaskDate("2026-04-10T12:00:00.000Z", now)).toBe("10 avril");
  });

  it("includes the year for dates outside the current year", () => {
    const now = new Date("2026-04-12T12:00:00.000Z");

    expect(formatTaskDate("2027-01-05T12:00:00.000Z", now)).toBe(
      "5 janvier 2027",
    );
  });

  it("returns null for missing dates", () => {
    expect(formatTaskDate(null)).toBeNull();
  });
});

describe("getCheckedTaskDateSummary", () => {
  it("builds the checked-task summary with both dates", () => {
    const now = new Date("2026-04-12T12:00:00.000Z");
    const task: Task = {
      ...BASE_TASK,
      frequency: { unit: "week", value: 1 },
      checkedAt: "2026-04-10T12:00:00.000Z",
    };

    expect(getCheckedTaskDateSummary(task, now)).toBe(
      "Fait le 10 avril, prochaine échéance le 17 avril",
    );
  });

  it("includes the year in the summary when the uncheck date crosses into another year", () => {
    const now = new Date("2026-12-30T12:00:00.000Z");
    const task: Task = {
      ...BASE_TASK,
      frequency: { unit: "day", value: 3 },
      checkedAt: "2026-12-30T12:00:00.000Z",
    };

    expect(getCheckedTaskDateSummary(task, now)).toBe(
      "Fait le 30 décembre, prochaine échéance le 2 janvier 2027",
    );
  });

  it("returns null for unchecked tasks", () => {
    expect(getCheckedTaskDateSummary(BASE_TASK)).toBeNull();
  });
});
