
import { type components } from '../../shared/generated-types';
import type { Task } from '../types/derived';

// Historical note: the old live API Gateway stage is still named "preprod".
// Local development should usually override this with VITE_API_URL and point
// to the separate dev API Gateway.
const DEFAULT_API_URL = "https://6s6jd82e80.execute-api.eu-north-1.amazonaws.com/preprod/tasks";
const API_URL = import.meta.env.VITE_API_URL || DEFAULT_API_URL;

// Fetch tasks from API
export async function fetchTasks() {
    const res = await fetch(API_URL, { method: "GET" });
    if (!res.ok) {
        throw new Error(`Failed to fetch tasks. ${res.statusText}`);
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
    const checkedAt = task.checkedAt ? "" : new Date().toISOString();
    const res = await fetch(API_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            id: task.id,
            checkedAt,
        }),
    });
    if (!res.ok) {
        throw new Error(`Failed to update task. ${res.statusText}`);
    }
}

export async function deleteTask(id: string) {
    const deleteUrl = `${API_URL}/${id}`;
    const res = await fetch(deleteUrl, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            id,
        }),
    });
    if (!res.ok) {
        throw new Error(`Failed to delete task. ${res.statusText}`);
    }
}
