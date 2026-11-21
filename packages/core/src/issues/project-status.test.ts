import { describe, expect, it } from "vitest";
import { boardColumnFromProjectStatus, projectStatusOptionIdForColumn } from "./project-status.js";

describe("boardColumnFromProjectStatus", () => {
  it("maps known Status values", () => {
    expect(boardColumnFromProjectStatus("Todo")).toBe("todo");
    expect(boardColumnFromProjectStatus("In progress")).toBe("in-progress");
    expect(boardColumnFromProjectStatus("Unknown")).toBeNull();
  });
});

describe("projectStatusOptionIdForColumn", () => {
  const options = [
    { id: "opt-backlog", name: "Backlog" },
    { id: "opt-todo", name: "Todo" },
    { id: "opt-progress", name: "In progress" },
  ];

  it("matches by canonical column name", () => {
    expect(projectStatusOptionIdForColumn("todo", options)).toBe("opt-todo");
  });

  it("falls back to status-to-column mapping", () => {
    expect(
      projectStatusOptionIdForColumn("in-progress", [{ id: "x", name: "In Progress" }]),
    ).toBe("x");
  });
});