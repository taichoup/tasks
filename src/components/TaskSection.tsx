import type { Task as TaskType } from "../types/derived";
import { Task } from "./Task";
import styles from "./TaskList.module.css";

type TaskSectionProps = {
  title: string;
  tasks: TaskType[];
  emptyTitle: string;
  isFiltered: boolean;
};

function EmptyState({
  title,
  filtered,
}: {
  title: string;
  filtered: boolean;
}) {
  return (
    <div className={styles.emptyState}>
      <p className={styles.emptyStateTitle}>{title}</p>
      <p className={styles.emptyStateText}>
        {filtered
          ? "Aucune tâche ne correspond au filtre actuel."
          : "Aucune tâche dans cette section pour le moment."}
      </p>
    </div>
  );
}

export function TaskSection({
  title,
  tasks,
  emptyTitle,
  isFiltered,
}: TaskSectionProps) {
  return (
    <div className={styles.taskList}>
      <h2>{title}</h2>
      {tasks.length > 0 ? (
        <ul>
          {tasks.map((task) => (
            <Task task={task} key={task.id} />
          ))}
        </ul>
      ) : (
        <EmptyState title={emptyTitle} filtered={isFiltered} />
      )}
    </div>
  );
}
