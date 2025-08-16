import { useEffect, useState } from "react";

import styles from './App.module.css';
import { Task } from "./components/Task";
import { addTask, fetchTasks } from "./api/requests";





// ----- Component -----
export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");

  const refreshTasks = async () => {
    const data = await fetchTasks() ?? []; // default to empty array if errors (to be improved)
    setTasks(data);
  }

  useEffect(() => {
    refreshTasks();
  }, []);

  const handleAddTask = async () => {
    try {
      addTask(newTitle);
      setNewTitle("");
      refreshTasks();
    } catch (serverError) {
      console.error(serverError);
    }
  }

  return (
    <>
      <header>
        <h1>Task App (AWS)</h1>
      </header>
      <main>
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New task..."
        />
        <button onClick={handleAddTask}>Add</button>
        <ul>
          {tasks.map(t => <Task task={t} key={t.id} setTasks={setTasks} />)}
        </ul>
      </main>
    </>

  );
}
