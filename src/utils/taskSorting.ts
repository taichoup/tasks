  
  // TODO: write unit tests

import type { Task } from "../types/derived";
import { DAY_IN_MS, HOUR_IN_MS, MINUTE_IN_MS, MONTH_IN_MS, WEEK_IN_MS, YEAR_IN_MS } from "./constants";

  
  export const isSameFrequency = (a: Task, b: Task) => {
    return a.frequency.unit === b.frequency.unit && a.frequency.value === b.frequency.value;
  };

  export const isSameUnit = (a: Task, b: Task) => {
    return a.frequency.unit === b.frequency.unit;
  };

  export const isSameValue = (a: Task, b: Task) => {
    return a.frequency.value === b.frequency.value;
  };

  export const convertTaskToDays = (task: Task) => {
    const { frequency } = task;
    if (frequency.unit === "day") {
      return frequency.value;
    }
    if (frequency.unit === "week") {
      return frequency.value * 7;
    }
    if (frequency.unit === "month") {
      return frequency.value * 30;
    }
    if (frequency.unit === "year") {
      return frequency.value * 365;
    }
    return 0;
  };

  /**
   * Computes the remaining time until a task is unchecked.
   * @param task The task to compute the remaining time for.
   * @returns The remaining time until the task is unchecked, in Intl.DurationInput format.
   */
  export const computeRemainingTimeUntilUncheck = (task: Task): Intl.DurationInput => {
    if (!task.checkedAt || !task.frequency) {
      return { days: 0, hours: 0, minutes: 0 };
    }
    const checkedAt = new Date(task.checkedAt);
    const now = new Date();
    const frequencyInMs = {
        day: DAY_IN_MS,
        week: WEEK_IN_MS,
        month: MONTH_IN_MS,
        year: YEAR_IN_MS,
    }[task.frequency.unit] * task.frequency.value;

    const nextUncheckTime = new Date(checkedAt.getTime() + frequencyInMs);
    const timeDiff = nextUncheckTime.getTime() - now.getTime();

    return {
        days: Math.floor(timeDiff / DAY_IN_MS),
        hours: Math.floor((timeDiff % DAY_IN_MS) / HOUR_IN_MS),
        minutes: Math.floor((timeDiff % HOUR_IN_MS) / MINUTE_IN_MS),
    };
  };

  /**
   * Sort function for unchecked tasks. Tasks with shorter frequency (in days) will be sorted first.
   */
  export const unCheckedTasksSortFunction = (a: Task, b: Task) => {
    return convertTaskToDays(a) - convertTaskToDays(b);
  };
  
  // assume a and b are both checked
  export const CheckedTasksSortFunction = (a: Task, b: Task) => {
    return new Date(b.checkedAt!).getTime() - new Date(a.checkedAt!).getTime();
  };
