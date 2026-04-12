import { TaskList } from "./components/TaskList";
import { AddTaskForm } from "./components/AddTaskForm";
import styles from "./App.module.css";

export default function App() {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>Tasks App</h1>
      </header>
      <main className={styles.main}>
        <AddTaskForm />
        <TaskList />
      </main>
    </div>
  );
}
