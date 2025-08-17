import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import styles from './App.module.css';
import { addTask } from "./api/requests";
import type { components } from "../shared/types";
import { TaskList } from "./components/TaskList";


export default function App() {
  const [newTitle, setNewTitle] = useState("");
  const [newRecurrenceQty, setNewRecurrenceQty] = useState(0);
  const [newRecurrenceUnit, setNewRecurrenceUnit] = useState<components["schemas"]["Task"]["frequency"]["unit"]>("day");
  const [newTags, setNewTags] = useState<components["schemas"]["Task"]["tag"] | []>([]);
  const queryClient = useQueryClient();

  const addTaskMutation = useMutation({
    mutationFn: () => addTask(newTitle, newRecurrenceQty, newRecurrenceUnit, newTags),
    onSuccess: () => {
      setNewTitle("");
      setNewRecurrenceQty(0);
      setNewRecurrenceUnit("day"); // default
      setNewTags([]);
      queryClient.invalidateQueries({ queryKey: ['tasks'], refetchType: 'active' });
    },
    onError: (error) => {
      console.error(error);
    }
  });

  const handleAddTask = () => {
    if (newTitle.trim()) {
      addTaskMutation.mutate(newTitle);
    }
  };

  return (
    <>
      <header>
        <h1>Task App</h1>
      </header>
      <main>
        <div className={styles.addTaskForm}>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="New task..."
            autoFocus
          />
          <input type="number" value={newRecurrenceQty} onChange={(e) => setNewRecurrenceQty(Number(e.target.value))} />
          <select value={newRecurrenceUnit} onChange={(e) => setNewRecurrenceUnit(e.target.value as components["schemas"]["Task"]["frequency"]["unit"])}>
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>

          {/* Possible de supporter plusieurs tags, et le schema l'accepterait mais pour l'instant faisons simple */}
          {/* <select value={newTags ?? ""} onChange={(e) => setNewTags(Array.from(e.target.selectedOptions, option => option.value as components["schemas"]["Task"]["tag"]))} multiple> */}
          <select value={newTags ?? ""} onChange={(e) => setNewTags([e.target.value] as components["schemas"]["Task"]["tag"])} >
            <option value="">Ajouter un tag ? </option>
            <option value="maison">Maison</option>
            <option value="jardin">Jardin</option>
            <option value="vélos">Vélos</option>
            <option value="voiture">Voiture</option>
          </select>
          <button onClick={handleAddTask} disabled={addTaskMutation.isPending}>
            Ajouter
          </button>
        </div>
        <TaskList />
      </main>
    </>
  );
}
