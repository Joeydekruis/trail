import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

export async function promptPresetWhenInteractive(): Promise<
  "solo" | "collaborative" | "offline"
> {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  try {
    console.log("");
    console.log("How should Trail sync with GitHub?");
    console.log("  1 — Solo: you run `trail sync` when you want (typical for individual work)");
    console.log(
      "  2 — Collaborative: optional auto-pull before reads; good for shared repos",
    );
    console.log("  3 — Offline: local tasks only (no GitHub API)");
    const raw = (await rl.question("Enter 1, 2, or 3 [1]: ")).trim();
    const choice = raw === "" ? "1" : raw;
    if (choice === "1") return "solo";
    if (choice === "2") return "collaborative";
    if (choice === "3") return "offline";
    console.log("Unknown choice, using solo.");
    return "solo";
  } finally {
    rl.close();
  }
}
