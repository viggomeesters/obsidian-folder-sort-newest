import test from "node:test";
import assert from "node:assert/strict";
import { sortFoldersDescending, isRootFolderOrderSupported } from "../dist/sort.mjs";

const folder = (name, path = name) => ({ file: { name, path }, type: "folder" });
const file = (name, path = name) => ({ file: { name, path }, type: "file" });
const folderLookup = new Set(["alpha", "zeta", "Beta", "10-folder", "2-folder"]);
const isFolder = (item) => folderLookup.has(item.file?.path ?? "");

test("sorts only folders Z-to-A while preserving non-folder order", () => {
  const items = [folder("alpha"), file("note.md"), folder("zeta"), file("readme.md"), folder("Beta")];
  const sorted = sortFoldersDescending(items, isFolder);
  assert.deepEqual(sorted.map((item) => item.file.name), ["zeta", "Beta", "alpha", "note.md", "readme.md"]);
});

test("uses numeric folder ordering", () => {
  const sorted = sortFoldersDescending([folder("2-folder"), folder("10-folder")], isFolder);
  assert.deepEqual(sorted.map((item) => item.file.name), ["10-folder", "2-folder"]);
});

test("reports unsupported File Explorer seams", () => {
  assert.equal(isRootFolderOrderSupported({ getSortedFolderItems: () => [] }), true);
  assert.equal(isRootFolderOrderSupported({}), false);
  assert.equal(isRootFolderOrderSupported(null), false);
});
