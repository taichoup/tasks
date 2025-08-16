import type { components } from "../../shared/types";
import { deleteTask, fetchTasks, toggleTask } from "../api/requests";

type Task = components["schemas"]["Task"];

interface TaskProps {
    task: Task;
    setTasks: (taskList: Task[]) => void;
}

export const Task = ({ task, setTasks }: TaskProps) => {

    const details =
        `Frequency: ${task.frequency ?? 'not set'}. Last checked: ${task.lastChecked ? new Intl.DateTimeFormat('fr').format(new Date(task.lastChecked)) : ''}`

    const refreshDisplayedTasks = async () => {
        console.log("DEBUG: refreshing the view with new tasks");
        const newTasks = await fetchTasks();
        console.log("DEBUG: new tasks")
        setTasks(newTasks ?? []);
    }

    const handleToggleTask = async () => {
        await toggleTask(task);
        await refreshDisplayedTasks();
    }

    const handleDeleteTask = async () => {
        await deleteTask(task.id);
        await refreshDisplayedTasks();
    }

    return (
        <li key={task.id}>
            <label>
                <input
                    type="checkbox"
                    checked={task.checked}
                    onChange={handleToggleTask}
                />
                {task.title}
            </label>
            <span>{details}</span>
            <button onClick={handleDeleteTask}>Delete</button>
        </li>
    )
}