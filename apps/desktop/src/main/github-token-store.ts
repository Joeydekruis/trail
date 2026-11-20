import { mkdirSync, readFileSync, unlinkSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { app, safeStorage } from "electron";

const TOKEN_FILE = "github-token.bin";

function tokenPath(): string {
  const dir = app.getPath("userData");
  mkdirSync(dir, { recursive: true });
  return join(dir, TOKEN_FILE);
}

export function readGitHubToken(): string | null {
  const path = tokenPath();
  if (!existsSync(path)) {
    return null;
  }
  if (!safeStorage.isEncryptionAvailable()) {
    return null;
  }
  try {
    const encrypted = readFileSync(path);
    return safeStorage.decryptString(encrypted);
  } catch {
    return null;
  }
}

export function writeGitHubToken(token: string): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("OS secure storage is not available for GitHub token");
  }
  const encrypted = safeStorage.encryptString(token.trim());
  writeFileSync(tokenPath(), encrypted);
}

export function clearGitHubToken(): void {
  const path = tokenPath();
  if (existsSync(path)) {
    unlinkSync(path);
  }
}