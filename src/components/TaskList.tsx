import { useQuery } from "@tanstack/react-query";
import styles from '../App.module.css';
import { Task } from "./Task";
import { fetchTasks } from "../api/requests";
import type { components } from "../../shared/types";

type Task = components["schemas"]["Task"];

export function TaskList() {
  const { data: tasks, isLoading, error } = 
    useQuery<unknown, Error, Task[]>({
      queryKey: ['tasks'],
      queryFn: fetchTasks,
    });

  if (isLoading) {
    return <div>Loading tasks...</div>;
  }
  if (error) {
    return <div>Error loading tasks</div>;
  }

  // Sort: tasks without lastChecked first, then by descending lastChecked date
  const sortedTasks = [...(tasks ?? [])].sort((a, b) => {
    if (!a.lastChecked && !b.lastChecked) return 0;
    if (!a.lastChecked) return -1;
    if (!b.lastChecked) return 1;
    return new Date(b.lastChecked).getTime() - new Date(a.lastChecked).getTime();
  });

  return (
    <ul className={styles.taskList}>
      {sortedTasks.map(t => <Task task={t} key={t.id} />)}
    </ul>
  );
}