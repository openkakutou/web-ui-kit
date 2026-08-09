// Imports exactly the way a consumer app's own README says to: a plain
// package import plus its CSS entrypoint, with no bundler-specific
// configuration beyond what a default `npm create vite@latest` app
// already has. If this fails to build, the published package is broken
// for real consumers regardless of what package.json's `exports` field
// claims.
import "@openkakutou/web-ui-kit";
import "@openkakutou/web-ui-kit/tokens.css";

document.querySelector("#app").textContent = "web-ui-kit smoke build OK";
