import styles from "./Task.module.css";
import { computeRemainingTimeUntilUncheck_duration } from "../utils/taskSorting";
import { useTaskMutations } from "../hooks/useTaskMutations";
import { TaskMetadata } from "./TaskMetadata";
import type { Task as TaskItem } from "../types/derived";

interface TaskProps {
  task: TaskItem;
}

export const Task = ({ task }: TaskProps) => {
  const { toggleMutation, deleteMutation } = useTaskMutations(task);
  const remainingDuration = computeRemainingTimeUntilUncheck_duration(task);
  const timeRemainingUntilUncheck = new Intl.DurationFormat("fr", {
    style: "long",
  }).format(remainingDuration);

  return (
    <li key={task.id} title={`À refaire dans: ${timeRemainingUntilUncheck}`}>
      <div className={styles.taskMain}>
        <input
          className={styles.taskCheckbox}
          type="checkbox"
          checked={Boolean(task.checkedAt)}
          onChange={() => toggleMutation.mutate()}
          disabled={toggleMutation.isPending}
        />
        <div className={styles.taskDetails}>
          <label className={styles.taskTitle}>
            <strong>{task.title}</strong>
          </label>
          <TaskMetadata task={task} />
        </div>
      </div>
      <button
        onClick={() => deleteMutation.mutate()}
        disabled={deleteMutation.isPending}
      >
        Supprimer
      </button>
    </li>
  );
};
