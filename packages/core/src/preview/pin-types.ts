export type PreviewPinAnchor = {
  selector: string;
  xpath: string;
  elementText: string;
  offsetX: number;
  offsetY: number;
  viewportWidth: number;
  viewportHeight: number;
  pageUrl: string;
};

export type PreviewPinRecord = {
  id: number;
  workspaceId: string;
  issueNumber: number;
  pinNumber: number;
  comment: string;
  anchor: PreviewPinAnchor;
  createdAt: string;
};