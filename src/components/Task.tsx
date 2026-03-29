import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { components } from "../../shared/generated-types";
import { deleteTask, toggleTask } from "../api/requests";
import styles from './Task.module.css';
import { Tag } from "./Tag";
import { DAY_IN_MS, MONTH_IN_MS, WEEK_IN_MS, YEAR_IN_MS, HOUR_IN_MS, MINUTE_IN_MS } from "../utils/constants";

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
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
        onError: (error) => {
            console.error("DEBUG: Error deleting task:", error);
        }
    });

    // TODO: extract to utility function
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

    const checkedAtDateDisplayString = task.checkedAt ? new Intl.DateTimeFormat('fr-FR', dateFormatOptions).format(new Date(task.checkedAt)) : null;

    const timeRemainingUntilUncheck = task.checkedAt && task.frequency
        // TODO: extract to utility function
        ? (() => {
            const checkedAt = new Date(task.checkedAt);
            const now = new Date();
            const frequencyInMs = {
                day: DAY_IN_MS,
                week: WEEK_IN_MS,
                month: MONTH_IN_MS,
                year: YEAR_IN_MS,
            }[task.frequency.unit] * task.frequency.value;

            const nextUncheckTime = new Date(checkedAt.getTime() + frequencyInMs);
            const timeDiff = nextUncheckTime.getTime() - now.getTime();

            const remainingDuration = {
                days: Math.floor(timeDiff / DAY_IN_MS),
                hours: Math.floor((timeDiff % DAY_IN_MS) / HOUR_IN_MS),
                minutes: Math.floor((timeDiff % HOUR_IN_MS) / MINUTE_IN_MS),
            };

            return new Intl.DurationFormat('fr', { style: 'long' }).format(remainingDuration);
        })()
        : null;

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
                <span className={styles.taskDetailsItem}>{getLocalizedUnit(task.frequency?.unit, task.frequency.value)}</span>
                <span className={styles.taskDetailsItem}>{task.checkedAt ? `Fait depuis le ${checkedAtDateDisplayString}` : ''}</span>
                <span className={styles.taskDetailsItem}>{task.tags && task.tags.length > 0 ? <Tag label={task.tags[0]} /> : null}</span>
                {/* <span className={styles.taskDetailsItem}>{timeRemainingUntilUncheck ? `Temps restant avant décochage: ${timeRemainingUntilUncheck}` : ''}</span> */}
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
