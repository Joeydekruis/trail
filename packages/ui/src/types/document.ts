export type TrailDocumentMeta = {
  path: string;
  title: string;
  icon: string;
  updated_at: string;
  task_ids?: string[];
};

export type TrailDocument = TrailDocumentMeta & {
  content: string;
};

export type DocTreeFolder = {
  type: "folder";
  path: string;
  name: string;
  icon: string;
  children: DocTreeEntry[];
};

export type DocTreeDoc = {
  type: "doc";
  path: string;
  title: string;
  icon: string;
  updated_at: string;
};

export type DocTreeEntry = DocTreeFolder | DocTreeDoc;

export type TrailDocFolder = {
  path: string;
  name: string;
  icon: string;
};
