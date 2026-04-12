import type { Task } from "../types/derived";
import { computeUncheckDate } from "./taskSorting";

export const formatTaskDate = (
  date: Date | string | null,
  now: Date = new Date(),
): string | null => {
  if (!date) {
    return null;
  }

  const parsedDate = typeof date === "string" ? new Date(date) : date;
  const includeYear = parsedDate.getFullYear() !== now.getFullYear();
  const dateFormatOptions = {
    month: "long",
    day: "numeric",
    ...(includeYear ? { year: "numeric" as const } : {}),
  } satisfies Intl.DateTimeFormatOptions;

  return new Intl.DateTimeFormat("fr-FR", dateFormatOptions).format(
    parsedDate,
  );
};

export const getCheckedTaskDateSummary = (
  task: Task,
  now: Date = new Date(),
): string | null => {
  if (!task.checkedAt) {
    return null;
  }

  const checkedAtDateDisplayString = formatTaskDate(task.checkedAt, now);
  const uncheckDateDisplayString = formatTaskDate(computeUncheckDate(task), now);

  return `Fait le ${checkedAtDateDisplayString}, prochaine échéance le ${uncheckDateDisplayString ?? "n/a"}`;
};
