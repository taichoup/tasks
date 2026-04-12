import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTasks } from "../api/requests";
import type { Task as TaskType } from "../types/derived";
import { TaskFilterBar } from "./TaskFilterBar";
import { TaskSection } from "./TaskSection";
import {
  CheckedTasksSortFunction,
  unCheckedTasksSortFunction,
} from "../utils/taskSorting";
import {
  ALL_TAGS_FILTER,
  filterTasksByTag,
  getAvailableTaskTags,
  type TaskTagFilter,
} from "../utils/taskFiltering";
import styles from "./TaskList.module.css";

export function TaskList() {
  const [selectedTag, setSelectedTag] =
    useState<TaskTagFilter>(ALL_TAGS_FILTER);
  const {
    data: tasks,
    isLoading,
    error,
  } = useQuery<unknown, Error, TaskType[]>({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
  });

  if (isLoading) {
    return <div>Loading tasks...</div>;
  }
  if (error) {
    return <div>Error loading tasks</div>;
  }

  const filteredTasks = filterTasksByTag(tasks ?? [], selectedTag);
  const availableTags = getAvailableTaskTags(tasks ?? []);
  const uncheckedTasks = filteredTasks.filter((t) => !t.checkedAt);
  const sortedUncheckedTasks = [...(uncheckedTasks ?? [])].sort(
    unCheckedTasksSortFunction,
  );
  const checkedTasks = filteredTasks.filter((t) => t.checkedAt);
  const sortedCheckedTasks = [...(checkedTasks ?? [])].sort(
    CheckedTasksSortFunction,
  );
  const isFiltered = selectedTag !== ALL_TAGS_FILTER;

  return (
    <div className={styles.container}>
      <TaskFilterBar
        selectedTag={selectedTag}
        availableTags={availableTags}
        onChange={setSelectedTag}
      />
      <div className={styles.wrapper}>
        <TaskSection
          title="A faire"
          tasks={sortedUncheckedTasks}
          emptyTitle="Rien à faire"
          isFiltered={isFiltered}
        />
        <TaskSection
          title="Déjà fait"
          tasks={sortedCheckedTasks}
          emptyTitle="Rien de coché"
          isFiltered={isFiltered}
        />
      </div>
    </div>
  );
}
