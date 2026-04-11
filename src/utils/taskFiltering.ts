import type { NonNullishTag, Task } from "../types/derived";

export const ALL_TAGS_FILTER = "all";
export const UNTAGGED_FILTER = "untagged";

export type TaskTagFilter =
  | typeof ALL_TAGS_FILTER
  | typeof UNTAGGED_FILTER
  | NonNullishTag;

export function getAvailableTaskTags(tasks: Task[]): NonNullishTag[] {
  return [...new Set(tasks.flatMap((task) => task.tags ?? []))].sort((a, b) =>
    a.localeCompare(b, "fr"),
  );
}

export function filterTasksByTag(
  tasks: Task[],
  selectedTag: TaskTagFilter,
): Task[] {
  if (selectedTag === ALL_TAGS_FILTER) {
    return tasks;
  }

  if (selectedTag === UNTAGGED_FILTER) {
    return tasks.filter((task) => !task.tags || task.tags.length === 0);
  }

  return tasks.filter((task) => task.tags?.includes(selectedTag));
}
