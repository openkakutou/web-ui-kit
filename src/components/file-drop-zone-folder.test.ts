import { describe, expect, it } from "vitest";
import {
  type DirectoryEntryLike,
  type EntryLike,
  type FileEntryLike,
  filesFromDroppedItems,
  filesFromPickedFolder,
} from "./file-drop-zone-folder.ts";

function fileEntry(path: string): FileEntryLike {
  return {
    isFile: true,
    isDirectory: false,
    fullPath: path,
    file: (ok) => ok(new File(["x"], path.split("/").pop() ?? path)),
  };
}

/** Returns children in batches of `batchSize`, then an empty batch, like the real reader. */
function dirEntry(
  path: string,
  children: EntryLike[],
  batchSize = 100,
): DirectoryEntryLike {
  return {
    isFile: false,
    isDirectory: true,
    fullPath: path,
    createReader: () => {
      let offset = 0;
      return {
        readEntries: (ok) => {
          const batch = children.slice(offset, offset + batchSize);
          offset += batchSize;
          ok(batch);
        },
      };
    },
  };
}

const item = (entry: EntryLike | null) => ({ webkitGetAsEntry: () => entry });

describe("filesFromDroppedItems", () => {
  it("walks nested directories and keeps paths relative, without the leading slash", async () => {
    const root = dirEntry("/hero", [
      fileEntry("/hero/hero.def"),
      dirEntry("/hero/sprites", [fileEntry("/hero/sprites/a.png")]),
    ]);
    const gathered = await filesFromDroppedItems([item(root)]);
    expect(gathered.map((g) => g.relativePath).sort()).toEqual([
      "hero/hero.def",
      "hero/sprites/a.png",
    ]);
  });

  it("keeps reading until the reader returns an empty batch", async () => {
    const root = dirEntry(
      "/d",
      [fileEntry("/d/1"), fileEntry("/d/2"), fileEntry("/d/3")],
      2,
    );
    expect(await filesFromDroppedItems([item(root)])).toHaveLength(3);
  });

  it("skips items that yield no entry", async () => {
    expect(await filesFromDroppedItems([item(null)])).toEqual([]);
  });

  it("rejects when a file cannot be read", async () => {
    const broken: FileEntryLike = {
      ...fileEntry("/x"),
      file: (_ok, fail) => fail?.(new Error("denied")),
    };
    await expect(filesFromDroppedItems([item(broken)])).rejects.toThrow(
      "denied",
    );
  });
});

describe("filesFromPickedFolder", () => {
  it("uses webkitRelativePath and falls back to the file name", () => {
    const withPath = new File(["x"], "a.png");
    Object.defineProperty(withPath, "webkitRelativePath", { value: "d/a.png" });
    const plain = new File(["x"], "b.png");
    expect(
      filesFromPickedFolder([withPath, plain]).map((g) => g.relativePath),
    ).toEqual(["d/a.png", "b.png"]);
  });
});
