import {
  ALL_TAGS_FILTER,
  UNTAGGED_FILTER,
  type TaskTagFilter,
} from "../utils/taskFiltering";
import styles from "./TaskList.module.css";

type TaskFilterBarProps = {
  selectedTag: TaskTagFilter;
  availableTags: string[];
  onChange: (value: TaskTagFilter) => void;
};

export function TaskFilterBar({
  selectedTag,
  availableTags,
  onChange,
}: TaskFilterBarProps) {
  return (
    <div className={styles.filterRow}>
      <label className={styles.filterLabel}>
        Filtrer par tag
        <select
          value={selectedTag}
          onChange={(event) => onChange(event.target.value as TaskTagFilter)}
          className={styles.filterSelect}
        >
          <option value={ALL_TAGS_FILTER}>Tous</option>
          <option value={UNTAGGED_FILTER}>Sans tag</option>
          {availableTags.map((tag) => (
            <option value={tag} key={tag}>
              {tag}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
