import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { components } from "../../shared/types";
import { deleteTask, toggleTask } from "../api/requests";

type Task = components["schemas"]["Task"];

interface TaskProps {
    task: Task;
}

export const Task = ({ task }: TaskProps) => {
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

    const details =
        `Frequency: ${task.frequency ?? 'not set'}. Last checked: ${task.lastChecked ? new Intl.DateTimeFormat('fr').format(new Date(task.lastChecked)) : ''}`;

    return (
        <li key={task.id}>
            <label>
                <input
                    type="checkbox"
                    checked={task.checked}
                    onChange={() => toggleMutation.mutate()}
                    disabled={toggleMutation.isPending}
                />
                {task.title}
            </label>
            <span>{details}</span>
            <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
            >
                Delete
            </button>
        </li>
    );
}