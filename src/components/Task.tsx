import styles from "./Task.module.css";
import { computeRemainingTimeUntilUncheck_duration } from "../utils/taskSorting";
import { useTaskMutations } from "../hooks/useTaskMutations";
import { TaskMetadata } from "./TaskMetadata";
import type { Task } from "../types/derived";

interface TaskProps {
  task: Task;
}

export const Task = ({ task }: TaskProps) => {
  console.log("DEBUG: Rendering task:", task);
  const { toggleMutation, deleteMutation } = useTaskMutations(task);
  const remainingDuration = computeRemainingTimeUntilUncheck_duration(task);
  const timeRemainingUntilUncheck = new Intl.DurationFormat("fr", {
    style: "long",
  }).format(remainingDuration);

  return (
    <li key={task.id} title={`À refaire dans: ${timeRemainingUntilUncheck}`}>
      <div className={styles.taskDetails}>
        <label>
          <input
            type="checkbox"
            checked={Boolean(task.checkedAt)}
            onChange={() => toggleMutation.mutate()}
            disabled={toggleMutation.isPending}
          />
          <strong>{task.title}</strong>
        </label>
        <TaskMetadata task={task} />
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
