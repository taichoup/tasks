import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { components } from "../../shared/generated-types";
import { deleteTask, toggleTask } from "../api/requests";
import styles from './Task.module.css';
import { Tag } from "./Tag";

type Task = components["schemas"]["Task"];
type TaskFrequencyUnit = components["schemas"]["Task"]["frequency"]["unit"];

interface TaskProps {
    task: Task;
}

export const Task = ({ task }: TaskProps) => {
    console.log("DEBUG: Rendering task:", task);
    const queryClient = useQueryClient();

    const toggleMutation = useMutation({
        mutationFn: () => toggleTask(task),
        onSuccess: () => {
            // Invalidate tasks query to refetch updated list
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteTask(task.id),
        onSuccess: async () => {
            console.log("DEBUG: Task deleted successfully");
            // TODO: fix. Without this hack, the sever replies with stale data somehow
            // Wait briefly before refetching
            await new Promise(res => setTimeout(res, 300));
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
        onError: (error) => {
            console.error("DEBUG: Error deleting task:", error);
        }
    });

    const getLocalizedUnit = (unitInEnglish: TaskFrequencyUnit, value: number) => {
        const translations: Record<TaskFrequencyUnit, string> = {
            day: "jour",
            week: "semaine",
            month: "mois",
            year: "an"
        };
        const prefix = unitInEnglish === "week" ? "Fréquence: toutes les " : "Fréquence: tous les "
        if (value === 1) {
            return `${prefix}${translations[unitInEnglish]}${unitInEnglish === "month" ? "" : "s"}`;
        }
        if (value > 1 && unitInEnglish !== "month") {
            return `${prefix}${value} ${translations[unitInEnglish]}s`;
        } else {
            return `${prefix}${value} ${translations[unitInEnglish]}`;
        }
    };

    const dateFormatOptions = {
        weekday: undefined,
        year: "numeric",
        month: "long",
        day: "numeric",
    } satisfies Intl.DateTimeFormatOptions;

    const lastCheckedDate = task.lastChecked ? new Intl.DateTimeFormat('fr-FR', dateFormatOptions).format(new Date(task.lastChecked)) : null;

    return (
        <li key={task.id}>
            <div className={styles.taskDetails}>
                <label>
                    <input
                        type="checkbox"
                        checked={task.checked}
                        onChange={() => toggleMutation.mutate()}
                        disabled={toggleMutation.isPending}
                    />
                    <strong>{task.title}</strong>
                </label>
                <span className={styles.taskDetailsItem}>{getLocalizedUnit(task.frequency?.unit, task.frequency.value)}</span>
                <span className={styles.taskDetailsItem}>{task.lastChecked ? `Effectué pour la dernière fois le ${lastCheckedDate}` : ''}</span>
                <span className={styles.taskDetailsItem}>{task.tags && task.tags.length > 0 ? <Tag label={task.tags[0]} /> : null}</span>
            </div>
            <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
            >
                Supprimer
            </button>
        </li>
    );
}