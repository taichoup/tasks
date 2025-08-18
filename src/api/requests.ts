
import { type components } from '../../shared/generated-types';
import type { Task } from '../types/derived';

const API_GATEWAY_ID = "6s6jd82e80";
const API_URL = `https://${API_GATEWAY_ID}.execute-api.eu-north-1.amazonaws.com/preprod/tasks`

// Fetch tasks from API
export async function fetchTasks() {
    const res = await fetch(API_URL, { method: "GET" });
    if (!res.ok) {
        console.error("Failed to fetch tasks", res.statusText);
        return;
    }
    const data: Task[] = await res.json();
    return data;
}

// Add a task
// The type of the param should be <components["schemas"]["NewTask"]
export async function addTask(
    newTitle: string, 
    newRecurrenceQty: number,
    newRecurrenceUnit: components["schemas"]["Task"]["frequency"]["unit"],
    newTags: components["schemas"]["Task"]["tags"] | []) {
        if (!newTitle.trim()) throw new Error('New title cannot be empty');
        if (newRecurrenceQty <= 0) throw new Error('Recurrence quantity must be greater than 0');
        if (!newRecurrenceUnit) throw new Error('Recurrence unit must be specified');

        const body: components["schemas"]["NewTask"] = {
            title: newTitle,
            frequency: { value: newRecurrenceQty, unit: newRecurrenceUnit },
            tags: newTags,
        };
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            throw new Error(`Failed to add task. ${res.statusText}`);
        }
        return res;
}

// Toggle task completion
export async function toggleTask(task: Task) {
    const res = await fetch(API_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            id: task.id,
            checked: !task.checked,
            lastChecked: !task.checked ? new Date().toISOString() : "",
        }),
    });
    if (!res.ok) {
        console.error("Failed to update task", res.statusText);
        return;
    }
    await fetchTasks();
}

export async function deleteTask(id: string) {
    const deleteUrl = `${API_URL}/${id}`;
    try {
        fetch(deleteUrl, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id,
            }),
        });
    } catch (serverError) {
        console.error("Could not delete the task");
    }
}