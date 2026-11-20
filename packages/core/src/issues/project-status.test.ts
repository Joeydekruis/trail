import { describe, expect, it } from "vitest";
import { boardColumnFromProjectStatus } from "./project-status.js";

describe("boardColumnFromProjectStatus", () => {
  it("maps known Status values", () => {
    expect(boardColumnFromProjectStatus("Todo")).toBe("todo");
    expect(boardColumnFromProjectStatus("In progress")).toBe("in-progress");
    expect(boardColumnFromProjectStatus("Unknown")).toBeNull();
  });
});