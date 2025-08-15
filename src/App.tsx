import { useEffect, useState } from "react";

const API_GATEWAY_ID = "6s6jd82e80";
const API_URL = `https://${API_GATEWAY_ID}.execute-api.us-east-1.amazonaws.com/dev/tasks`;

// ----- Types -----
export interface Task {
  id: string;
  title: string;
  checked: boolean;
  lastChecked?: string;
  frequency?: string;
}

// ----- Component -----
export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");

  // Fetch tasks from API
  async function fetchTasks() {
    const res = await fetch(API_URL, { method: "GET" });
    if (!res.ok) {
      console.error("Failed to fetch tasks", res.statusText);
      return;
    }
    const data: Task[] = await res.json();
    setTasks(data);
  }

  // Add a task
  async function addTask() {
    if (!newTitle.trim()) return;
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, frequency: "daily" }),
    });
    if (!res.ok) {
      console.error("Failed to add task", res.statusText);
      return;
    }
    setNewTitle("");
    await fetchTasks();
  }

  // Toggle task completion
  async function toggleTask(task: Task) {
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

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div>
      <h1>Task App (AWS)</h1>
      <input
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
        placeholder="New task..."
      />
      <button onClick={addTask}>Add</button>
      <ul>
        {tasks.map((t) => (
          <li key={t.id}>
            <label>
              <input
                type="checkbox"
                checked={t.checked}
                onChange={() => toggleTask(t)}
              />
              {t.title}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
