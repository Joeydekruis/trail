# Trail UI — Design Specification

**Date:** 2026-04-10
**Status:** Approved
**Related:** `docs/superpowers/specs/2026-04-10-trail-design.md` (core spec)

---

## 1. Overview

The Trail UI is a local React application that provides visual project management on top of Trail's file-based task data. It runs via `trail ui` as a local dev server and API server. No internet required for core functionality.

### Goals

- Kanban board and list view for task management
- Rich task detail drawer with all schema fields
- Drag-and-drop status changes on the Kanban board
- Create, update, and delete tasks from the UI
- Global search and multi-field filtering
- Dark theme with a modern, techy, GitHub-inspired aesthetic

### Non-goals for v1

- Dashboard / home page (Kanban is the landing page)
- Timeline / Gantt view (deferred — see GitHub issue)
- Epic tree view (deferred)
- Dependency graph visualization (deferred)
- GitHub comment display (link to GitHub instead)
- Mobile / responsive layout (desktop-only tool)
- Saved filter presets
- Real-time collaboration

---

## 2. Architecture

### Two-server model

`trail ui` starts two servers in a single process:

1. **Hono API server** (`localhost:4700`) — lightweight REST API that imports and reuses core library functions from `packages/cli/src/core/`. Handles all mutations (create, update, delete) with Zod validation, file I/O, and snapshot recompilation. No auth needed — localhost only.

2. **Vite dev server** (`localhost:4701`) — serves the React SPA. Proxies API requests to the Hono server in development.

### API endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/tasks` | All tasks (from compiled snapshot) |
| `GET` | `/api/tasks/:id` | Single task |
| `POST` | `/api/tasks` | Create new task (draft) |
| `PATCH` | `/api/tasks/:id` | Update task fields |
| `DELETE` | `/api/tasks/:id` | Delete task |
| `GET` | `/api/config` | Repo config (`.trail/config.json`) |

Every mutation writes to `.trail/tasks/*.json`, then recompiles `snapshot.json`.

### Data flow

```
User action (drag, click, form submit)
    → React component
    → TanStack Query mutation
    → PATCH /api/tasks/:id
    → Hono API handler
    → core library (validate with Zod, write file, recompile snapshot)
    → 200 OK
    → TanStack Query invalidates + refetches
    → UI updates
```

### Polling

TanStack Query manages data freshness with smart polling based on tab visibility:

| Browser state | Poll interval |
|---|---|
| Tab focused | 30 seconds |
| Tab in background 5+ min | 2 minutes |
| Tab in background 30+ min | 10 minutes |
| Tab closed / `trail ui` stopped | No polling |

Uses the browser `visibilitychange` API for backoff.

---

## 3. Tech stack

| Layer | Technology | Rationale |
|---|---|---|
| Components | shadcn/ui (Radix primitives) | Owned component code, dark theme native, dev-tool aesthetic |
| Styling | Tailwind CSS | Fast theming, utility classes, custom dark palette |
| Drag-and-drop | dnd-kit | Modern, accessible, performant, active maintenance |
| Data fetching | TanStack Query | Caching, polling, optimistic updates, mutation invalidation |
| UI state | React context + useState | No external state library needed |
| API server | Hono | Lightweight (~14kb), TypeScript-native, fast |
| Build | Vite | Fast HMR, TypeScript native |
| Language | TypeScript (strict) | Matches CLI package |

---

## 4. Visual design

### Color palette

| Role | Value | Usage |
|---|---|---|
| Background base | `#0a0f1a` | Main background, sidebar |
| Surface | `#111827` | Cards, drawer, modals |
| Surface elevated | `#1a2332` | Hovered cards, active states |
| Border | `#1e2d3d` | Card borders, dividers |
| Text primary | `#e2e8f0` | Titles, body text |
| Text secondary | `#8b9cb6` | Metadata, timestamps |
| Accent blue | `#3b82f6` | Active nav, links, progress bars, primary buttons |
| Accent green | `#22c55e` | Done status, completed progress, success states |
| Priority p0 | `#ef4444` | Critical — red |
| Priority p1 | `#f59e0b` | High — amber |
| Priority p2 | `#3b82f6` | Medium — blue |
| Priority p3 | `#6b7280` | Low — gray |
| Type: feature | `#3b82f6` | Blue chip |
| Type: bug | `#ef4444` | Red chip |
| Type: chore | `#6b7280` | Gray chip |
| Type: epic | `#a855f7` | Purple chip |

### Typography

System font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`. No custom fonts. Clean, fast, native-feeling.

### Card styling

Subtle border (`border` color), no heavy shadows. Slight background lift on hover (`surface-elevated`). Rounded corners (8px). The "techy but not flashy" look.

### Accent philosophy

Blue is the primary interactive color (buttons, links, active states). Green is reserved for success/completion (done status, progress bars at 100%, online indicators). This gives the "hacker green" feel without overusing it.

---

## 5. Layout

Three-zone layout optimized for desktop (1200px+):

### Left sidebar (~200px, collapsible)

- Trail logo + repo name at top
- Navigation links: **Kanban**, **List**, Timeline (grayed out / "coming soon")
- Bottom section: branch indicator (e.g. `main`), open/closed task counts, current user avatar + name
- Collapsible to icon-only mode for more board space

### Top bar (fixed)

- Global search bar (right side) — searches all tasks
- "New Task" button (opens create modal)
- "View Repo" link (opens GitHub repo in new tab)
- User avatar (right corner)

Navigation tabs (Kanban, List) live in the sidebar only — not duplicated in the top bar.

### Main content area (scrollable)

- Active view (Kanban board or List table)
- Filter bar at the top of the content area
- Task detail drawer slides in from the right (~420px) when a task is clicked

### Responsive behavior

Desktop-only. Below 1200px, sidebar auto-collapses to icon mode. No mobile layout.

---

## 6. Kanban view

### Columns

5 status columns, left to right: **Draft** → **Todo** → **In Progress** → **In Review** → **Done**.

Each column has:
- Header: status name + task count badge
- Column menu (three-dot): "Collapse column"
- Vertically scrollable card list

**Cancelled toggle:** a toggle at the top of the board — "Show cancelled". When enabled, a 6th column appears on the far right.

### Task cards

Compact preview cards in each column:

```
┌─────────────────────────────────┐
│ [feature] [p1]            [···] │  type chip + priority chip + menu
│                                 │
│ Build admin dashboard           │  title (2 lines max, truncate)
│                                 │
│ 👤 Joey    #31                  │  assignee + GitHub issue number
│                                 │
│ ████████░░░░ 70%                │  progress bar (acceptance criteria)
│                                 │
│ 🔗 3  📋 4/6  ⏱ md            │  deps, checklist, estimate
└─────────────────────────────────┘
```

Card elements:
- **Type chip:** colored badge (feature=blue, bug=red, chore=gray, epic=purple)
- **Priority chip:** colored badge (p0=red, p1=amber, p2=blue, p3=gray)
- **Three-dot menu:** quick actions — "Open detail", "Change status", "Delete"
- **Title:** max 2 lines, ellipsis on overflow
- **Assignee:** small avatar circle + username
- **Issue number:** `#31` — clickable, links to GitHub
- **Progress bar:** thin bar based on acceptance_criteria completion. Blue fill, green at 100%. Only shown when acceptance_criteria exist.
- **Icon row:** dependency count, checklist progress (e.g. `4/6`), estimate badge (xs/sm/md/lg/xl). Icons only shown when values exist.
- **Labels:** hidden by default. Shown on hover as small tags below title, or when a label filter is active.

### Drag-and-drop

- Grab anywhere on the card to drag
- Drop zones highlighted with a blue glow/border when dragging over a column
- Smooth animation on drop (dnd-kit handles this)
- Dropping fires `PATCH /api/tasks/:id { status: "new_status" }`
- Cross-column drag only (status change). No within-column manual reorder.
- Cards auto-sort within columns: p0 at top → p3 at bottom, then by `updated_at` within same priority

---

## 7. List view

A filterable, sortable table.

### Columns

| Column | Width | Content |
|---|---|---|
| Type | 60px | Colored icon |
| Priority | 50px | Colored badge |
| Title | flex | Task title + `#31` suffix |
| Status | 120px | Status badge |
| Assignee | 120px | Avatar + name |
| Progress | 100px | Mini progress bar + % |
| Dependencies | 60px | Count icon |
| Estimate | 60px | Size badge |
| Updated | 100px | Relative time ("2h ago") |

### Behavior

- Click any row → opens the task detail drawer
- Column headers clickable to sort (ascending/descending toggle)
- Default sort: priority (p0 first), then `updated_at` (newest first)
- Same filter bar as Kanban (shared filter state across views)
- Same cancelled toggle
- Rows have subtle hover highlight
- No inline editing — all editing in the drawer
- Virtual scroll for performance (handles hundreds of tasks)
- No drag-and-drop. Status changes via drawer or right-click context menu.

---

## 8. Task detail drawer

Slides in from the right (~420px) when a task card or list row is clicked. Rest of the content stays visible but slightly dimmed. Click outside to close.

### Layout (top to bottom)

**Header:**
- Type chip + Priority chip (top left)
- Close button `✕` (top right)
- Title — large, editable inline (click to edit, Enter to save)
- Assignee avatar + name + status badge
- GitHub issue link: `#31` → opens on GitHub in new tab

**Metadata section:**
Two-column grid of editable fields:
- Status → dropdown
- Priority → dropdown
- Type → dropdown
- Assignee → dropdown
- Estimate → dropdown (xs/sm/md/lg/xl)
- Milestone → dropdown
- Start date → date picker
- Due date → date picker
- Branch → text field (read-only, copy button)
- Labels → tag input (add/remove)

**Description:**
- Markdown-rendered block
- "Edit" button toggles to textarea

**Acceptance Criteria** (only if exists):
- Header: "Acceptance Criteria" + progress indicator (e.g. `3/6 — 50%`)
- Full-width progress bar
- Checklist items with checkboxes — toggling updates via API

**Dependencies** (only if `depends_on` or `blocks` have entries):
- "Depends on" — linked task chips (ID + title, colored by status, clickable → navigates to that task's drawer)
- "Blocks" — same format

**AI Context** (collapsible, collapsed by default):
- Summary
- Implementation context — file paths (monospace)
- Test strategy — list items
- Constraints — list items

**Refs** (only if exists):
- Linked doc file paths (clickable)

**Action buttons** (sticky at bottom):
- "Delete" — red outline, left. Confirmation dialog before action.
- "Mark as Done" — secondary. Only shown when status is not `done`/`cancelled`.
- "Update" — primary blue, right. Saves changed fields. Disabled when nothing is dirty.

---

## 9. Create task modal

Opened via "New Task" button in the top bar.

**Fields:**
- Title — text input (required)
- Description — textarea with markdown
- Type — dropdown (default: feature)
- Priority — dropdown (default: p2)
- Status — dropdown: draft / todo (default: draft)
- Assignee — dropdown (optional)
- Labels — tag input (optional)
- Milestone — dropdown (optional)
- Estimate — dropdown (optional)

**Actions:** "Cancel" (secondary) | "Create Task" (primary blue)

**Behavior:**
- `POST /api/tasks` on submit
- Task appears on board in correct column immediately
- Keyboard: Escape closes, Cmd/Ctrl+Enter submits

---

## 10. Global search

- Input in top bar, always visible
- Debounced search (300ms) across all tasks
- Searches: title, description, ID, assignee, labels
- Results in a dropdown below search bar: compact rows with type icon, title, ID, status badge
- Click result → opens detail drawer
- Escape or click-away closes dropdown
- Empty state: "No tasks found"

---

## 11. Filter bar

Sits above the board/list content area.

- Row of dropdown selectors: Assignee, Priority, Type, Label, Milestone
- Selecting a value adds a colored dismissable chip below the dropdowns
- "Clear all" link when any filters are active
- AND-logic: all filters must match
- Filter state persists when switching between Kanban and List views
- Filter state resets on page reload (no disk persistence)

---

## 12. Delete flow

- Triggered from drawer "Delete" button or card three-dot menu
- Confirmation dialog: "Delete task #31 — Build admin dashboard? This cannot be undone."
- "Cancel" / "Delete" (red) buttons
- On confirm: `DELETE /api/tasks/:id`
- Card removed with fade-out animation

---

## 13. Package structure

```
packages/ui/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── src/
│   ├── main.tsx                     # React entry point
│   ├── App.tsx                      # Root component, router, layout
│   ├── api/
│   │   ├── client.ts               # Fetch wrapper, base URL config
│   │   └── hooks.ts                # TanStack Query hooks
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   └── AppLayout.tsx
│   │   ├── kanban/
│   │   │   ├── KanbanBoard.tsx     # Board container, dnd-kit context
│   │   │   ├── KanbanColumn.tsx    # Single column (droppable)
│   │   │   └── TaskCard.tsx        # Compact card (draggable)
│   │   ├── list/
│   │   │   └── ListView.tsx        # Table with virtual scroll
│   │   ├── task/
│   │   │   ├── TaskDrawer.tsx      # Detail slide-out
│   │   │   ├── TaskForm.tsx        # Create modal form
│   │   │   └── TaskFields.tsx      # Shared field renderers
│   │   ├── filters/
│   │   │   ├── FilterBar.tsx       # Filter dropdowns + chips
│   │   │   └── SearchBar.tsx       # Global search + results dropdown
│   │   └── shared/
│   │       ├── Badge.tsx           # Type/priority/status badges
│   │       ├── ProgressBar.tsx
│   │       ├── ConfirmDialog.tsx
│   │       └── EmptyState.tsx
│   ├── lib/
│   │   ├── theme.ts               # Color tokens, CSS variables
│   │   ├── constants.ts           # Status/priority/type label maps
│   │   └── utils.ts               # Formatters (relative time, truncate)
│   └── types/
│       └── task.ts                # TypeScript types (mirrors CLI Zod schemas)
└── server/
    └── api.ts                     # Hono API server
```

### Key boundaries

- `src/api/` — all API communication. Components never call fetch directly.
- `src/components/` — pure UI. Each folder maps to a feature area.
- `src/lib/` — utilities and constants. No React, no side effects.
- `src/types/` — TypeScript types derived from CLI package's Zod schemas.
- `server/` — Hono API server. Thin layer delegating to core library.

### Cross-package dependency

The API server (`packages/ui/server/api.ts`) imports from `packages/cli/src/core/`. This works via npm workspaces — `@trail-pm/cli` is a workspace dependency of `@trail-pm/ui`.

---

## 14. Error handling

API failures are surfaced to the user via toast notifications (bottom-right corner):

| Scenario | Behavior |
|---|---|
| Mutation fails (create/update/delete) | Red toast: "Failed to update task #31" with error detail. UI reverts optimistic update. |
| Snapshot fetch fails | Yellow toast: "Could not refresh tasks. Retrying..." Auto-retry with backoff. |
| API server unreachable | Banner at top of page: "API server disconnected. Is `trail ui` running?" |
| Validation error (400) | Red toast with the specific validation message from Zod. |

Toast notifications auto-dismiss after 5 seconds. Errors persist until dismissed manually.

---

## 15. Deferred features

| Feature | Phase | Notes |
|---|---|---|
| Timeline / Gantt view | Later | Sidebar bucket for unscheduled tasks, drag to assign dates. Create GitHub issue. |
| Dashboard view | Later | Project overview with summary stats |
| Epic tree view | Later | Parent-child hierarchy, expandable |
| Dependency graph | Later | Visual DAG from depends_on/blocks |
| Saved filter presets | Later | "My tasks", "High priority bugs", etc. |
| Within-column drag reorder | Later | Manual sort order (needs schema field) |
| Static HTML export | Later | `trail export` generates static site |
| GitHub comment display | Never (v1) | Link to GitHub instead |
