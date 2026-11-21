import { createServer } from "node:net";
import { spawn, type ChildProcess } from "node:child_process";
import {
  preferredPortFromPreviewUrl,
  previewUrlWithPort,
  type TrailPreviewConfig,
} from "@trail/core";
import type { PreviewWorktreeRef } from "@trail/ipc";
import { getWorktreeStore, getWorkspaceStore } from "./database";
import { loadTrailPreviewConfig } from "./preview-dev-config";
import { readWorkspaceRepoRoot } from "./worktree-paths";

type DevServerKey = string;

type DevServerEntry = {
  proc: ChildProcess;
  url: string;
  port: number;
  cwd: string;
};

const servers = new Map<DevServerKey, DevServerEntry>();

function serverKey(ref: PreviewWorktreeRef): DevServerKey {
  return `${ref.workspaceId}:${ref.issueNumber}`;
}

export async function pickLocalPort(preferred: number): Promise<number> {
  const tryBind = (port: number) =>
    new Promise<number | null>((resolve) => {
      const server = createServer();
      server.once("error", () => resolve(null));
      server.listen(port, "127.0.0.1", () => {
        const address = server.address();
        const bound =
          typeof address === "object" && address?.port ? address.port : port;
        server.close(() => resolve(bound));
      });
    });

  for (let offset = 0; offset < 64; offset += 1) {
    const candidate = preferred + offset;
    if (candidate > 65535) {
      break;
    }
    const bound = await tryBind(candidate);
    if (bound !== null) {
      return bound;
    }
  }
  throw new Error("No free local port for preview dev server");
}

async function waitForHttpOk(url: string, timeoutMs: number): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(2_000),
      });
      if (response.status < 500) {
        return true;
      }
    } catch {
      // keep polling until timeout
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  return false;
}

function spawnDevServer(
  config: TrailPreviewConfig,
  cwd: string,
  port: number,
): ChildProcess {
  const env = {
    ...process.env,
    PORT: String(port),
    BROWSER: "none",
  };
  const proc = spawn(config.devCommand, {
    cwd,
    env,
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  proc.stdout?.on("data", (chunk: Buffer) => {
    const text = chunk.toString("utf8").trim();
    if (text) {
      console.info(`[trail] preview dev (${cwd}):`, text);
    }
  });
  proc.stderr?.on("data", (chunk: Buffer) => {
    const text = chunk.toString("utf8").trim();
    if (text) {
      console.warn(`[trail] preview dev stderr (${cwd}):`, text);
    }
  });
  return proc;
}

function resolveWorktreePath(ref: PreviewWorktreeRef): string | null {
  const record = getWorktreeStore().get(ref.workspaceId, ref.issueNumber);
  return record?.path?.trim() ? record.path.trim() : null;
}

export async function ensurePreviewDevServer(
  ref: PreviewWorktreeRef,
): Promise<
  { ok: true; url: string; started: boolean } | { ok: false; message: string }
> {
  const key = serverKey(ref);
  const existing = servers.get(key);
  if (existing && existing.proc.exitCode === null && !existing.proc.killed) {
    return { ok: true, url: existing.url, started: false };
  }

  const worktreePath = resolveWorktreePath(ref);
  if (!worktreePath) {
    return {
      ok: false,
      message: "Create a local worktree with a folder path before starting the dev server",
    };
  }

  const repoRoot = readWorkspaceRepoRoot(getWorkspaceStore(), ref.workspaceId);
  const config = loadTrailPreviewConfig(worktreePath, repoRoot);
  if (!config) {
    return {
      ok: false,
      message:
        "Add preview.devCommand and preview.url to .trail/config.yml, or a package.json dev script",
    };
  }

  const preferred = preferredPortFromPreviewUrl(config.url);
  let port: number;
  try {
    port = await pickLocalPort(preferred);
  } catch {
    return { ok: false, message: "Could not find a free port for the dev server" };
  }

  const url = previewUrlWithPort(config.url, port);
  const proc = spawnDevServer(config, worktreePath, port);
  servers.set(key, { proc, url, port, cwd: worktreePath });

  proc.on("exit", (code, signal) => {
    const current = servers.get(key);
    if (current?.proc === proc) {
      servers.delete(key);
    }
    console.info(`[trail] preview dev stopped (${worktreePath}) code=${code} signal=${signal}`);
  });

  const ready = await waitForHttpOk(url, 45_000);
  if (!ready) {
    stopPreviewDevServer(ref);
    return {
      ok: false,
      message: `Dev server did not respond at ${url} within 45s`,
    };
  }

  return { ok: true, url, started: true };
}

export function stopPreviewDevServer(ref: PreviewWorktreeRef): void {
  const key = serverKey(ref);
  const entry = servers.get(key);
  if (!entry) {
    return;
  }
  servers.delete(key);
  if (entry.proc.exitCode !== null || entry.proc.killed) {
    return;
  }
  entry.proc.kill("SIGTERM");
  setTimeout(() => {
    if (entry.proc.exitCode === null && !entry.proc.killed) {
      entry.proc.kill("SIGKILL");
    }
  }, 5_000);
}

export function disposeAllPreviewDevServers(): void {
  for (const key of [...servers.keys()]) {
    const [workspaceId, issueNumber] = key.split(":");
    const parsedIssue = Number.parseInt(issueNumber ?? "", 10);
    if (!workspaceId || !Number.isFinite(parsedIssue)) {
      servers.get(key)?.proc.kill("SIGTERM");
      servers.delete(key);
      continue;
    }
    stopPreviewDevServer({ workspaceId, issueNumber: parsedIssue });
  }
}