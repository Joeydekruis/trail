import { useState } from "react";
import { ChevronDown, ChevronRight, FilePlus, FolderPlus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DocTreeEntry } from "@/types/document";

interface DocSidebarTreeProps {
  tree: DocTreeEntry[];
  selectedPath: string | null;
  collapsed: boolean;
  onSelectDoc: (path: string) => void;
  onCreateDoc: (folder?: string) => void;
  onCreateFolder: (parentFolder?: string) => void;
}

function TreeFolder({
  node,
  depth,
  selectedPath,
  collapsed,
  onSelectDoc,
  onCreateDoc,
  onCreateFolder,
}: {
  node: Extract<DocTreeEntry, { type: "folder" }>;
  depth: number;
  selectedPath: string | null;
  collapsed: boolean;
  onSelectDoc: (path: string) => void;
  onCreateDoc: (folder?: string) => void;
  onCreateFolder: (parentFolder?: string) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <div
        className="group flex items-center gap-0.5 rounded-md pr-1 hover:bg-muted/50"
        style={{ paddingLeft: depth * 12 + 4 }}
      >
        <button
          type="button"
          className="flex h-7 w-5 shrink-0 items-center justify-center text-muted-foreground"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Collapse folder" : "Expand folder"}
        >
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <span className="flex h-7 w-5 shrink-0 items-center justify-center text-sm">
          {node.icon}
        </span>
        {!collapsed && (
          <span className="min-w-0 flex-1 truncate py-1.5 text-sm text-muted-foreground">
            {node.name}
          </span>
        )}
      </div>
      {open &&
        node.children.map((child) => (
          <DocTreeNode
            key={child.type === "folder" ? `f:${child.path}` : `d:${child.path}`}
            node={child}
            depth={depth + 1}
            selectedPath={selectedPath}
            collapsed={collapsed}
            onSelectDoc={onSelectDoc}
            onCreateDoc={onCreateDoc}
            onCreateFolder={onCreateFolder}
          />
        ))}
    </div>
  );
}

function TreeDoc({
  node,
  depth,
  selectedPath,
  collapsed,
  onSelectDoc,
}: {
  node: Extract<DocTreeEntry, { type: "doc" }>;
  depth: number;
  selectedPath: string | null;
  collapsed: boolean;
  onSelectDoc: (path: string) => void;
}) {
  const isActive = selectedPath === node.path;
  return (
    <button
      type="button"
      onClick={() => onSelectDoc(node.path)}
      className={cn(
        "flex h-7 w-full items-center gap-1.5 rounded-md pr-2 text-left text-sm transition-colors",
        isActive
          ? "bg-primary/10 text-foreground"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
      style={{ paddingLeft: depth * 12 + 24 }}
      title={node.title}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-sm">
        {node.icon}
      </span>
      {!collapsed && <span className="truncate">{node.title}</span>}
    </button>
  );
}

function DocTreeNode(props: {
  node: DocTreeEntry;
  depth: number;
  selectedPath: string | null;
  collapsed: boolean;
  onSelectDoc: (path: string) => void;
  onCreateDoc: (folder?: string) => void;
  onCreateFolder: (parentFolder?: string) => void;
}) {
  if (props.node.type === "folder") {
    return <TreeFolder {...props} node={props.node} />;
  }
  return <TreeDoc {...props} node={props.node} />;
}

export function DocSidebarTree({
  tree,
  selectedPath,
  collapsed,
  onSelectDoc,
  onCreateDoc,
  onCreateFolder,
}: DocSidebarTreeProps) {
  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1 px-1 py-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onCreateDoc()}
          aria-label="New page"
        >
          <Plus size={16} />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Pages
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="h-6 w-6 opacity-60 hover:opacity-100"
              aria-label="Add page or folder"
            >
              <Plus size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuItem onClick={() => onCreateDoc()}>
              <FilePlus size={14} className="mr-2" />
              New page
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCreateFolder()}>
              <FolderPlus size={14} className="mr-2" />
              New folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-1 pb-2">
        {tree.length === 0 ? (
          <p className="px-2 py-1 text-xs text-muted-foreground">No pages yet</p>
        ) : (
          tree.map((node) => (
            <DocTreeNode
              key={node.type === "folder" ? `f:${node.path}` : `d:${node.path}`}
              node={node}
              depth={0}
              selectedPath={selectedPath}
              collapsed={collapsed}
              onSelectDoc={onSelectDoc}
              onCreateDoc={onCreateDoc}
              onCreateFolder={onCreateFolder}
            />
          ))
        )}
      </div>
    </div>
  );
}
