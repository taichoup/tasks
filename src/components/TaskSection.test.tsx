import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TaskSection } from "./TaskSection";

vi.mock("./Task", () => ({
  Task: ({ task }: { task: { title: string } }) => (
    <li data-testid="task-item">{task.title}</li>
  ),
}));

describe("TaskSection", () => {
  it("renders the empty-state copy for filtered sections", () => {
    const markup = renderToStaticMarkup(
      <TaskSection
        title="A faire"
        tasks={[]}
        emptyTitle="Rien à faire"
        isFiltered
      />,
    );

    expect(markup).toContain(">A faire<");
    expect(markup).toContain(">Rien à faire<");
    expect(markup).toContain("Aucune tâche ne correspond au filtre actuel.");
  });

  it("renders tasks instead of the empty state when items are present", () => {
    const markup = renderToStaticMarkup(
      <TaskSection
        title="Déjà fait"
        tasks={[
          {
            id: "task-1",
            title: "Arroser",
            checkedAt: "",
            frequency: { value: 1, unit: "day" },
            tags: [],
          },
        ]}
        emptyTitle="Rien de coché"
        isFiltered={false}
      />,
    );

    expect(markup).toContain(">Déjà fait<");
    expect(markup).toContain(">Arroser<");
    expect(markup).not.toContain("Rien de coché");
  });
});
