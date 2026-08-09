import { describe, expect, it } from "vitest";
import { matchesAccept } from "./file-drop-zone-accept.ts";

describe("matchesAccept", () => {
  it("matches a file by extension pattern", () => {
    const file = { name: "photo.PNG", type: "image/png" };
    expect(matchesAccept(file, ".png")).toBe(true);
  });

  it("rejects a file whose extension is not in the accept list", () => {
    const file = { name: "notes.txt", type: "text/plain" };
    expect(matchesAccept(file, ".png,.jpg")).toBe(false);
  });

  it("accepts everything when accept is empty, null, or undefined (edge case)", () => {
    const file = { name: "anything.xyz", type: "" };
    expect(matchesAccept(file, "")).toBe(true);
    expect(matchesAccept(file, null)).toBe(true);
    expect(matchesAccept(file, undefined)).toBe(true);
  });

  it("matches a MIME type group wildcard (edge case)", () => {
    const file = { name: "photo.webp", type: "image/webp" };
    expect(matchesAccept(file, "image/*")).toBe(true);
  });

  it("matches an exact MIME type and rejects a different exact MIME type (error path)", () => {
    const file = { name: "data.json", type: "application/json" };
    expect(matchesAccept(file, "application/json")).toBe(true);
    expect(matchesAccept(file, "application/xml")).toBe(false);
  });

  it("matches when at least one of several comma-separated patterns matches", () => {
    const file = { name: "photo.jpg", type: "image/jpeg" };
    expect(matchesAccept(file, ".png, .jpg, image/gif")).toBe(true);
  });
});
