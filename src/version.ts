import packageJson from "../package.json" with { type: "json" };

// Single source of truth is package.json's own version field — never a
// second, hand-maintained copy here. A hardcoded literal is exactly what
// drifted out of sync and broke the real v0.4.0 release (backlog item 008).
export const version: string = packageJson.version;
