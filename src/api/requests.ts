
import { type components } from '../../shared/generated-types';
import type { Task } from '../types/derived';

// Historical note: the old live API Gateway stage is still named "preprod".
const API_URL: string = import.meta.env.VITE_API_URL;
if (!API_URL) throw new Error("VITE_API_URL must be set");

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
    });

    if (!res.ok) {
        throw new Error(`Failed to delete task. ${res.statusText}`);
    }
}

