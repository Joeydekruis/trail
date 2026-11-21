#!/usr/bin/env node
import { runTrailMcpStdioBridge } from "./stdio-server.js";

runTrailMcpStdioBridge().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});