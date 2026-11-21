import { describe, expect, it } from "vitest";
import { LIST_VIRTUAL_THRESHOLD, shouldVirtualizeList } from "./list-virtual-threshold";

describe("shouldVirtualizeList", () => {
  it("does not virtualize at threshold", () => {
    expect(shouldVirtualizeList(LIST_VIRTUAL_THRESHOLD)).toBe(false);
  });

  it("virtualizes above threshold", () => {
    expect(shouldVirtualizeList(LIST_VIRTUAL_THRESHOLD + 1)).toBe(true);
  });
});