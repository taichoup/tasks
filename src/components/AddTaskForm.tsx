import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { components } from "../../shared/generated-types";
import { addTask } from "../api/requests";
import styles from "../App.module.css";

type TaskFrequencyUnit = components["schemas"]["Task"]["frequency"]["unit"];
type TaskTags = components["schemas"]["Task"]["tags"];

export const AddTaskForm = () => {
    const [newTitle, setNewTitle] = useState("");
    const [newRecurrenceQty, setNewRecurrenceQty] = useState(0);
    const [newRecurrenceUnit, setNewRecurrenceUnit] = useState<TaskFrequencyUnit>("day");
    const [newTags, setNewTags] = useState<TaskTags | []>([]);
    const queryClient = useQueryClient();

    const addTaskMutation = useMutation({
        mutationFn: () => addTask(newTitle, newRecurrenceQty, newRecurrenceUnit, newTags),
        onSuccess: () => {
            setNewTitle("");
            setNewRecurrenceQty(0);
            setNewRecurrenceUnit("day");
            setNewTags([]);
            queryClient.invalidateQueries({ queryKey: ["tasks"], refetchType: "active" });
        },
        onError: (error) => {
            console.error(error);
        },
    });

    const handleAddTask = () => {
        if (newTitle.trim()) {
            addTaskMutation.mutate();
        }
    };

    return (
        <div className={styles.addTaskForm}>
            <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="New task..."
                autoFocus
            />
            <span>tous les...</span>
            <input
                type="number"
                value={newRecurrenceQty}
                onChange={(e) => setNewRecurrenceQty(Number(e.target.value))}
                className={styles.numberInput}
            />
            <select
                value={newRecurrenceUnit}
                onChange={(e) => setNewRecurrenceUnit(e.target.value as TaskFrequencyUnit)}
            >
                <option value="day">Jours</option>
                <option value="week">Semaines</option>
                <option value="month">Mois</option>
                <option value="year">Ans</option>
            </select>

            {/* Possible de supporter plusieurs tags, et le schema l'accepterait mais pour l'instant faisons simple */}
            {/* <select value={newTags ?? ""} onChange={(e) => setNewTags(Array.from(e.target.selectedOptions, option => option.value as components["schemas"]["Task"]["tag"]))} multiple> */}
            <select
                value={newTags ?? ""}
                onChange={(e) => setNewTags([e.target.value] as TaskTags)}
            >
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
    );
};
