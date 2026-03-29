import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Task } from "./Task";
import { fetchTasks } from "../api/requests";
import type { Task as TaskType } from "../types/derived";
import { CheckedTasksSortFunction, unCheckedTasksSortFunction } from "../utils/taskSorting";
import { ALL_TAGS_FILTER, filterTasksByTag, getAvailableTaskTags, UNTAGGED_FILTER, type TaskTagFilter } from "../utils/taskFiltering";
import styles from './TaskList.module.css';

export function TaskList() {
  const [selectedTag, setSelectedTag] = useState<TaskTagFilter>(ALL_TAGS_FILTER);
  const { data: tasks, isLoading, error } = 
    useQuery<unknown, Error, TaskType[]>({
      queryKey: ['tasks'],
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
  const uncheckedTasks = filteredTasks.filter(t => !t.checkedAt);
  const sortedUncheckedTasks = [...(uncheckedTasks ?? [])].sort(unCheckedTasksSortFunction);
  const checkedTasks = filteredTasks.filter(t => t.checkedAt);
  const sortedCheckedTasks = [...(checkedTasks ?? [])].sort(CheckedTasksSortFunction);

  return (
    <div className={styles.container}>
      <div className={styles.filterRow}>
        <label className={styles.filterLabel}>
          Filtrer par tag
          <select
            value={selectedTag}
            onChange={(event) => setSelectedTag(event.target.value as TaskTagFilter)}
            className={styles.filterSelect}
          >
            <option value={ALL_TAGS_FILTER}>Tous</option>
            <option value={UNTAGGED_FILTER}>Sans tag</option>
            {availableTags.map((tag) => (
              <option value={tag} key={tag}>{tag}</option>
            ))}
          </select>
        </label>
      </div>
      <div className={styles.wrapper}>
        <div className={styles.taskList}>
          <h2>A faire</h2>
          <ul>
            {sortedUncheckedTasks.map(t => <Task task={t} key={t.id} />)}
          </ul>
        </div>
        <div className={styles.taskList}>
          <h2>Déjà fait</h2>
          <ul>
            {sortedCheckedTasks.map(t => <Task task={t} key={t.id} />)}
          </ul>
        </div>
      </div>
    </div>
  );
}
