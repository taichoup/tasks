import { TaskList } from "./components/TaskList";
import { AddTaskForm } from "./components/AddTaskForm";

export default function App() {
  return (
    <>
      <header>
        <h1>Tasks App</h1>
      </header>
      <main>
        <AddTaskForm />
        <TaskList />
      </main>
    </>
  );
}
