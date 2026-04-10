import { randomBytes } from "node:crypto";

/** Stable draft task id prefix + random suffix (e.g. `draft-a1b2c3d4`). */
export function generateDraftId(): string {
  return `draft-${randomBytes(4).toString("hex")}`;
}
