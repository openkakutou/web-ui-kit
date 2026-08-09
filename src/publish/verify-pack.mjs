#!/usr/bin/env node
// Fails the process (non-zero exit) if `npm pack`'s file list isn't
// exactly what's expected to be published. Run before `npm publish` —
// see .vibe/decisions/002-publish-pipeline-safety-gates.md: this must
// catch a bad tarball before the irreversible step, not after.
import { execFileSync } from "node:child_process";
import { validatePackFileList } from "./validate-pack-file-list.ts";

function getPackedFileList() {
  const output = execFileSync("npm", ["pack", "--dry-run", "--json"], {
    encoding: "utf8",
  });
  const [entry] = JSON.parse(output);
  return entry.files.map((file) => file.path);
}

const files = getPackedFileList();
const error = validatePackFileList(files);

if (error !== null) {
  console.error(`verify-pack: ${error}`);
  process.exit(1);
}

console.log(`verify-pack: OK (${files.length} files: ${files.join(", ")})`);
