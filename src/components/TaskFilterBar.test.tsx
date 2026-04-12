import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TaskFilterBar } from "./TaskFilterBar";

describe("TaskFilterBar", () => {
  it("renders built-in and available tag options", () => {
    const markup = renderToStaticMarkup(
      <TaskFilterBar
        selectedTag="jardin"
        availableTags={["jardin", "voiture"]}
        onChange={vi.fn()}
      />,
    );

    expect(markup).toContain("Filtrer par tag");
    expect(markup).toContain('option value="all"');
    expect(markup).toContain(">Tous<");
    expect(markup).toContain('option value="untagged"');
    expect(markup).toContain(">Sans tag<");
    expect(markup).toContain('option value="jardin" selected=""');
    expect(markup).toContain('option value="voiture"');
  });
});
