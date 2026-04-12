import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteTask, toggleTask } from "../api/requests";
import type { Task } from "../types/derived";

export const useTaskMutations = (task: Task) => {
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: () => toggleTask(task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTask(task.id),
    onSuccess: async () => {
      console.log("DEBUG: Task deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error) => {
      console.error("DEBUG: Error deleting task:", error);
    },
  });

  return { toggleMutation, deleteMutation };
};
