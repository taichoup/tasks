  
  // TODO: write unit tests

import type { Task } from "../types/derived";

  
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

  export const unCheckedTasksSortFunction = (a: Task, b: Task) => {
    return convertTaskToDays(a) - convertTaskToDays(b);
  };
  
  // assume a and b are both checked
  export const CheckedTasksSortFunction = (a: Task, b: Task) => {
    return new Date(b.lastChecked!).getTime() - new Date(a.lastChecked!).getTime();
  };