import { getCliFailureMessage, runCli } from "./cli/run-cli.js";

runCli(process.argv).catch((err: unknown) => {
  console.error(getCliFailureMessage(err));
  process.exit(1);
});
