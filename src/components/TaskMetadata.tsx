import type { Task } from "../types/derived";
import { getCheckedTaskDateSummary } from "../utils/taskDateDisplay";
import { formatTaskFrequency } from "../utils/taskFrequencyDisplay";
import styles from "./Task.module.css";
import { Tag } from "./Tag";

type TaskMetadataProps = {
  task: Task;
};

export const TaskMetadata = ({ task }: TaskMetadataProps) => {
  const checkedTaskDateSummary = getCheckedTaskDateSummary(task);

  return (
    <>
      <span className={styles.taskDetailsItem}>
        {formatTaskFrequency(task.frequency.unit, task.frequency.value)}
      </span>
      {checkedTaskDateSummary ? (
        <span className={styles.taskDetailsItem}>{checkedTaskDateSummary}</span>
      ) : null}
      <span className={styles.taskDetailsItem}>
        {task.tags && task.tags.length > 0 ? <Tag label={task.tags[0]} /> : null}
      </span>
    </>
  );
};
