import { beforeEach, describe, it, expect, vi, afterEach } from "vitest";
import {
  convertTaskToDays,
  isSameFrequency,
  isSameUnit,
  isSameValue,
  unCheckedTasksSortFunction,
  CheckedTasksSortFunction,
  computeRemainingTimeUntilUncheck_ms,
} from "./taskSorting";
import type { Task, TagList } from "../types/derived";

const BASE_TASK: Task = {
  id: "1",
  title: "Test",
  frequency: { unit: "day", value: 1 },
  checkedAt: "",
  tags: [] as TagList,
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-04-12T12:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("convertTaskToDays", () => {
  it("converts days correctly", () => {
    expect(
      convertTaskToDays({ ...BASE_TASK, frequency: { unit: "day", value: 3 } }),
    ).toBe(3);
  });
  it("converts weeks correctly", () => {
    expect(
      convertTaskToDays({
        ...BASE_TASK,
        frequency: { unit: "week", value: 2 },
      }),
    ).toBe(14);
  });
  it("converts months correctly", () => {
    expect(
      convertTaskToDays({
        ...BASE_TASK,
        frequency: { unit: "month", value: 1 },
      }),
    ).toBe(30);
  });
  it("converts years correctly", () => {
    expect(
      convertTaskToDays({
        ...BASE_TASK,
        frequency: { unit: "year", value: 1 },
      }),
    ).toBe(365);
  });
  it("returns 0 for unknown unit", () => {
    expect(
      convertTaskToDays({
        ...BASE_TASK,
        frequency: { unit: "unknown" as any, value: 1 },
      }),
    ).toBe(0);
  });
});

describe("isSameFrequency", () => {
  it("returns true for same unit and value", () => {
    const a = { ...BASE_TASK, frequency: { unit: "day", value: 1 } } as Task;
    const b = { ...BASE_TASK, frequency: { unit: "day", value: 1 } } as Task;
    expect(isSameFrequency(a, b)).toBe(true);
  });
  it("returns false for different unit or value", () => {
    const a = { ...BASE_TASK, frequency: { unit: "day", value: 1 } } as Task;
    const b = { ...BASE_TASK, frequency: { unit: "week", value: 1 } } as Task;
    expect(isSameFrequency(a, b)).toBe(false);
    const c = { ...BASE_TASK, frequency: { unit: "day", value: 2 } } as Task;
    expect(isSameFrequency(a, c)).toBe(false);
  });
});

describe("isSameUnit", () => {
  it("returns true for same unit", () => {
    const a = { ...BASE_TASK, frequency: { unit: "day", value: 1 } } as Task;
    const b = { ...BASE_TASK, frequency: { unit: "day", value: 2 } } as Task;
    expect(isSameUnit(a, b)).toBe(true);
  });
  it("returns false for different unit", () => {
    const a = { ...BASE_TASK, frequency: { unit: "day", value: 1 } } as Task;
    const b = { ...BASE_TASK, frequency: { unit: "week", value: 1 } } as Task;
    expect(isSameUnit(a, b)).toBe(false);
  });
});

describe("isSameValue", () => {
  it("returns true for same value", () => {
    const a = { ...BASE_TASK, frequency: { unit: "day", value: 1 } } as Task;
    const b = { ...BASE_TASK, frequency: { unit: "week", value: 1 } } as Task;
    expect(isSameValue(a, b)).toBe(true);
  });
  it("returns false for different value", () => {
    const a = { ...BASE_TASK, frequency: { unit: "day", value: 1 } } as Task;
    const b = { ...BASE_TASK, frequency: { unit: "day", value: 2 } } as Task;
    expect(isSameValue(a, b)).toBe(false);
  });
});

describe("unCheckedTasksSortFunction", () => {
  it("sorts unchecked tasks by ascending frequency (converted to days)", () => {
    const t1 = {
      ...BASE_TASK,
      frequency: { unit: "week", value: 1 },
      checkedAt: "",
    } as Task;
    const t2 = {
      ...BASE_TASK,
      frequency: { unit: "day", value: 3 },
      checkedAt: "",
    } as Task;
    const t3 = {
      ...BASE_TASK,
      frequency: { unit: "month", value: 1 },
      checkedAt: "",
    } as Task;
    const arr = [t1, t2, t3];
    const sorted = [...arr].sort(unCheckedTasksSortFunction);
    expect(sorted[0]).toBe(t2); // day (3 days)
    expect(sorted[1]).toBe(t1); // week (7 days)
    expect(sorted[2]).toBe(t3); // month (30 days)
  });

  it("returns 0 for tasks with same frequency", () => {
    const t1 = {
      ...BASE_TASK,
      frequency: { unit: "day", value: 1 },
      checkedAt: "",
    } as Task;
    const t2 = {
      ...BASE_TASK,
      frequency: { unit: "day", value: 1 },
      checkedAt: "",
    } as Task;
    expect(unCheckedTasksSortFunction(t1, t2)).toBe(0);
  });
});

describe("CheckedTasksSortFunction", () => {
  it("sorts checked tasks by ascending remaining time until automatic uncheck", () => {
    const t1: Task = {
      ...BASE_TASK,
      id: "task-1",
      frequency: { unit: "week", value: 1 },
      checkedAt: "2026-04-06T12:00:00.000Z",
    }; // 1 day remaining
    const t2: Task = {
      ...BASE_TASK,
      id: "task-2",
      frequency: { unit: "day", value: 2 },
      checkedAt: "2026-04-11T12:00:00.000Z",
    }; // 1 day remaining
    const t3: Task = {
      ...BASE_TASK,
      id: "task-3",
      frequency: { unit: "month", value: 1 },
      checkedAt: "2026-04-11T12:00:00.000Z",
    }; // 29 days remaining
    const arr = [t1, t2, t3];
    const sorted = [...arr].sort(CheckedTasksSortFunction);

    expect(computeRemainingTimeUntilUncheck_ms(sorted[0])).toBe(
      computeRemainingTimeUntilUncheck_ms(t1),
    );
    expect(computeRemainingTimeUntilUncheck_ms(sorted[1])).toBe(
      computeRemainingTimeUntilUncheck_ms(t2),
    );
    expect(computeRemainingTimeUntilUncheck_ms(sorted[2])).toBe(
      computeRemainingTimeUntilUncheck_ms(t3),
    );
    expect(sorted[2]).toBe(t3);
  });

  it("returns 0 for tasks with the same remaining time", () => {
    const t1: Task = {
      ...BASE_TASK,
      id: "task-1",
      frequency: { unit: "week", value: 1 },
      checkedAt: "2026-04-06T12:00:00.000Z",
    };
    const t2: Task = {
      ...BASE_TASK,
      id: "task-2",
      frequency: { unit: "day", value: 1 },
      checkedAt: "2026-04-12T12:00:00.000Z",
    };
    expect(CheckedTasksSortFunction(t1, t2)).toBe(0);
  });
});
