import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import styles from './App.module.css';
import { Task } from "./components/Task";
import { addTask, fetchTasks } from "./api/requests";
import type { components } from "../shared/types";

type Task = components["schemas"]["Task"];

function TaskList() {

  const { data: tasks, isLoading, error } = 
    useQuery<unknown, Error, Task[]>({
      queryKey: ['tasks'],
      queryFn: fetchTasks,
    });

  if (isLoading) {
    return <div>Loading tasks...</div>;
  }
  if (error) {
    return <div>Error loading tasks</div>;
  }

  return (
    <ul className={styles.taskList}>
      {tasks?.map(t => <Task task={t} key={t.id} />)}
    </ul>
  );
}


export default function App() {
  const [newTitle, setNewTitle] = useState("");

  const queryClient = useQueryClient();

  const handleAddTask = async () => {
    try {
      await addTask(newTitle);
      setNewTitle("");
      // mark query as stale to refetch tasks automatically
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
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
        <TaskList />
      </main>
    </>

  );
}
