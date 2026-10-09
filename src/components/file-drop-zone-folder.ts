/**
 * Folder gathering for `<wuik-file-drop-zone directory>`: a dropped folder
 * is walked recursively through `DataTransferItem.webkitGetAsEntry()`, a
 * picked one arrives as a flat `FileList` whose files carry
 * `webkitRelativePath`. Only the few `FileSystemEntry` members actually used
 * are modeled, so the walk is testable against plain mocks (jsdom does not
 * implement these Chromium-originated APIs).
 */

/** A gathered file plus its path relative to the folder the user chose. */
export interface GatheredFile {
  file: File;
  relativePath: string;
}

export interface FileEntryLike {
  isFile: true;
  isDirectory: false;
  fullPath: string;
  file(
    successCallback: (file: File) => void,
    errorCallback?: (error: unknown) => void,
  ): void;
}

export interface DirectoryEntryLike {
  isFile: false;
  isDirectory: true;
  fullPath: string;
  createReader(): {
    readEntries(
      successCallback: (entries: EntryLike[]) => void,
      errorCallback?: (error: unknown) => void,
    ): void;
  };
}

export type EntryLike = FileEntryLike | DirectoryEntryLike;

export interface DataTransferItemLike {
  webkitGetAsEntry(): EntryLike | null;
}

function toRelativePath(fullPath: string): string {
  return fullPath.startsWith("/") ? fullPath.slice(1) : fullPath;
}

/** A single `readEntries` call may return a partial batch: loop until empty. */
function readAllEntries(entry: DirectoryEntryLike): Promise<EntryLike[]> {
  const reader = entry.createReader();
  return new Promise((resolve, reject) => {
    const all: EntryLike[] = [];
    const readNextBatch = (): void => {
      reader.readEntries((batch) => {
        if (batch.length === 0) {
          resolve(all);
          return;
        }
        all.push(...batch);
        readNextBatch();
      }, reject);
    };
    readNextBatch();
  });
}

async function collectFilesFromEntry(
  entry: EntryLike,
): Promise<GatheredFile[]> {
  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) => {
      entry.file(resolve, reject);
    });
    return [{ file, relativePath: toRelativePath(entry.fullPath) }];
  }
  const children = await readAllEntries(entry);
  const collected = await Promise.all(children.map(collectFilesFromEntry));
  return collected.flat();
}

/** Every file under the dropped items, directories walked recursively. */
export async function filesFromDroppedItems(
  items: readonly DataTransferItemLike[],
): Promise<GatheredFile[]> {
  const entries = items
    .map((item) => item.webkitGetAsEntry())
    .filter((entry): entry is EntryLike => entry !== null);
  const collected = await Promise.all(entries.map(collectFilesFromEntry));
  return collected.flat();
}

/** Adapts the flat `FileList` of an `<input webkitdirectory>` picker. */
export function filesFromPickedFolder(files: readonly File[]): GatheredFile[] {
  return files.map((file) => ({
    file,
    relativePath: file.webkitRelativePath || file.name,
  }));
}
