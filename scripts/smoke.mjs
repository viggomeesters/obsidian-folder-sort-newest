import fs from "node:fs/promises";

const main = await fs.readFile("main.js", "utf8");
const manifest = JSON.parse(await fs.readFile("manifest.json", "utf8"));
const packageJson = JSON.parse(await fs.readFile("package.json", "utf8"));

const assertions = [
  [manifest.id === "folder-sort-newest", "manifest id must remain one-purpose"],
  [manifest.version === packageJson.version, "manifest version must match package version"],
  [main.includes("getSortedFolderItems"), "bundle must patch File Explorer getSortedFolderItems"],
  [main.includes("folder-sort-newest.patch"), "bundle must include patch marker for safe restore"],
  [!main.includes("newest-files-view"), "bundle must not include Newest Files code"],
];

const failures = assertions.filter(([ok]) => !ok).map(([, message]) => message);
if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Folder Sort Newest smoke checks passed.");
