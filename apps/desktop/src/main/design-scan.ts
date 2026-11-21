import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { buildDesignCatalog, type DesignScreenDto } from "@trail/core";

const HTML_NAME = /\.html$/i;

function collectDesignHtmlFiles(designDir: string): string[] {
  const results: string[] = [];

  function walk(dir: string): void {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const name of entries) {
      const full = join(dir, name);
      let stat;
      try {
        stat = statSync(full);
      } catch {
        continue;
      }
      if (stat.isDirectory()) {
        walk(full);
        continue;
      }
      if (!HTML_NAME.test(name)) {
        continue;
      }
      if (/^v\d+\.html$/i.test(name)) {
        results.push(relative(designDir, full));
      }
    }
  }

  walk(designDir);
  return results;
}

export function listDesignScreens(repoRoot: string | null): {
  designRoot: string | null;
  screens: DesignScreenDto[];
} {
  if (!repoRoot?.trim()) {
    return { designRoot: null, screens: [] };
  }
  const designRoot = join(repoRoot.trim(), "design");
  if (!existsSync(designRoot)) {
    return { designRoot, screens: [] };
  }
  const paths = collectDesignHtmlFiles(designRoot);
  return {
    designRoot,
    screens: buildDesignCatalog(paths),
  };
}