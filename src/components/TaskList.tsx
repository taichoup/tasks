import { useQuery } from "@tanstack/react-query";
import styles from '../App.module.css';
import { Task } from "./Task";
import { fetchTasks } from "../api/requests";
import type { Task as TaskType } from "../types/derived";
import { CheckedTasksSortFunction, unCheckedTasksSortFunction } from "../utils/taskSorting";

export function TaskList() {
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


  // Sort: tasks without lastChecked first, by descending frequency, then the checked tasks by descending lastChecked date
  const uncheckedTasks = (tasks ?? []).filter(t => !t.lastChecked);
  const sortedUncheckedTasks = [...(uncheckedTasks ?? [])].sort(unCheckedTasksSortFunction);
  const checkedTasks = (tasks ?? []).filter(t => t.lastChecked);
  const sortedCheckedTasks = [...(checkedTasks ?? [])].sort(CheckedTasksSortFunction);
  const sortedTasks = sortedUncheckedTasks.concat(sortedCheckedTasks);

  return (
    <ul className={styles.taskList}>
      {sortedTasks.map(t => <Task task={t} key={t.id} />)}
    </ul>
  );
}