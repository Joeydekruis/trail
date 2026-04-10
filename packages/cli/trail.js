#!/usr/bin/env node
/**
 * Published CLI entry. Keeps `bin` outside `dist/` so npm publish validation
 * accepts the path (npm 11+ can strip bin targets it considers invalid).
 */
import "./dist/index.js";
