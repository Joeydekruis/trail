import type { SqliteDatabase } from "../db/types.js";
import type { PreviewPinAnchor, PreviewPinRecord } from "./pin-types.js";

type PinRow = {
  id: number;
  workspace_id: string;
  issue_number: number;
  pin_number: number;
  comment: string;
  page_url: string;
  selector: string;
  xpath: string;
  element_text: string;
  offset_x: number;
  offset_y: number;
  viewport_width: number;
  viewport_height: number;
  created_at: string;
};

function mapRow(row: PinRow): PreviewPinRecord {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    issueNumber: row.issue_number,
    pinNumber: row.pin_number,
    comment: row.comment,
    anchor: {
      selector: row.selector,
      xpath: row.xpath,
      elementText: row.element_text,
      offsetX: row.offset_x,
      offsetY: row.offset_y,
      viewportWidth: row.viewport_width,
      viewportHeight: row.viewport_height,
      pageUrl: row.page_url,
    },
    createdAt: row.created_at,
  };
}

export class PreviewPinStore {
  constructor(private readonly db: SqliteDatabase) {}

  nextPinNumber(workspaceId: string, issueNumber: number): number {
    const row = this.db
      .prepare(
        "SELECT MAX(pin_number) AS maxNum FROM preview_pins WHERE workspace_id = ? AND issue_number = ?",
      )
      .get(workspaceId, issueNumber) as { maxNum: number | null } | undefined;
    return (row?.maxNum ?? 0) + 1;
  }

  create(input: {
    workspaceId: string;
    issueNumber: number;
    comment: string;
    anchor: PreviewPinAnchor;
  }): PreviewPinRecord {
    const pinNumber = this.nextPinNumber(input.workspaceId, input.issueNumber);
    const createdAt = new Date().toISOString();
    const result = this.db
      .prepare(
        `
      INSERT INTO preview_pins (
        workspace_id, issue_number, pin_number, comment,
        page_url, selector, xpath, element_text,
        offset_x, offset_y, viewport_width, viewport_height, created_at
      ) VALUES (
        @workspaceId, @issueNumber, @pinNumber, @comment,
        @pageUrl, @selector, @xpath, @elementText,
        @offsetX, @offsetY, @viewportWidth, @viewportHeight, @createdAt
      )
    `,
      )
      .run({
        workspaceId: input.workspaceId,
        issueNumber: input.issueNumber,
        pinNumber,
        comment: input.comment,
        pageUrl: input.anchor.pageUrl,
        selector: input.anchor.selector,
        xpath: input.anchor.xpath,
        elementText: input.anchor.elementText,
        offsetX: input.anchor.offsetX,
        offsetY: input.anchor.offsetY,
        viewportWidth: input.anchor.viewportWidth,
        viewportHeight: input.anchor.viewportHeight,
        createdAt,
      });
    const id = Number(result.lastInsertRowid);
    return {
      id,
      workspaceId: input.workspaceId,
      issueNumber: input.issueNumber,
      pinNumber,
      comment: input.comment,
      anchor: input.anchor,
      createdAt,
    };
  }

  list(workspaceId: string, issueNumber: number): PreviewPinRecord[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM preview_pins WHERE workspace_id = ? AND issue_number = ? ORDER BY pin_number",
      )
      .all(workspaceId, issueNumber) as PinRow[];
    return rows.map(mapRow);
  }
}

export function openPreviewPinStore(db: SqliteDatabase): PreviewPinStore {
  return new PreviewPinStore(db);
}