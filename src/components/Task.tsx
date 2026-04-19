import styles from "./Task.module.css";
import { computeRemainingTimeUntilUncheck_duration } from "../utils/taskSorting";
import { useTaskMutations } from "../hooks/useTaskMutations";
import { TaskMetadata } from "./TaskMetadata";
import { DateCheckbox } from "./DateCheckbox";
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
    <li key={task.id}>
      <div
        className={styles.taskMain}
        title={task.checkedAt ? `À refaire dans: ${timeRemainingUntilUncheck}` : undefined}
      >
        <DateCheckbox
          checked={Boolean(task.checkedAt)}
          onChange={(checkedAt) => toggleMutation.mutate(checkedAt)}
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
