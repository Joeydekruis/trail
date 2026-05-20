/**
 * Stops processes listening on Trail dev ports before `dev:all`.
 * Avoids EADDRINUSE when a previous API (4700) or Vite (4701) server was left running.
 */
import { execSync } from "node:child_process";
import { platform } from "node:os";

const PORTS = [4700, 4701];

function pidsOnPortWindows(port) {
  try {
    const out = execSync(`netstat -ano | findstr ":${port}" | findstr LISTENING`, {
      encoding: "utf8",
    });
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid) && pid !== "0") {
        pids.add(pid);
      }
    }
    return [...pids];
  } catch {
    return [];
  }
}

function pidsOnPortUnix(port) {
  try {
    const out = execSync(`lsof -ti :${port} -sTCP:LISTEN`, { encoding: "utf8" });
    return out
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => /^\d+$/.test(s));
  } catch {
    return [];
  }
}

function killPid(pid) {
  try {
    if (platform() === "win32") {
      execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
    } else {
      execSync(`kill -9 ${pid}`, { stdio: "ignore" });
    }
    return true;
  } catch {
    return false;
  }
}

const isWin = platform() === "win32";

for (const port of PORTS) {
  const pids = isWin ? pidsOnPortWindows(port) : pidsOnPortUnix(port);
  for (const pid of pids) {
    if (killPid(pid)) {
      console.log(`Freed port ${port} (stopped PID ${pid})`);
    }
  }
}
