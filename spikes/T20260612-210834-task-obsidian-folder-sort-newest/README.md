# T20260612-210834-task-obsidian-folder-sort-z-to-a

## Task

Process `FZA-001 — Spike Folder Z-to-A native File Explorer sorting feasibility` via Vault-first Agent Workflow Lite.

## Given / When / Then

Given Obsidian's native File Explorer, when a one-purpose plugin tries to influence folder ordering, then we need to know whether folders can be shown Z-to-A safely without changing vault content or bundling unrelated behavior.

## Questions

1. Does the native File Explorer expose a seam for folder ordering?
2. Can a plugin influence only folder order while preserving native file behavior?
3. Is the seam stable/public enough to build on?

## Findings

- Native File Explorer has an internal `getSortedFolderItems(folder)` method on the File Explorer view prototype.
- The native method sorts folders A-to-Z separately from file sorting. The active sort setting does not reverse folder names.
- A plugin can patch `getSortedFolderItems`, call the original method, split returned items into folders and non-folders, sort folders Z-to-A, then return folders plus untouched native file items.
- This approach is non-destructive: it changes only rendered ordering and does not write notes, folders, metadata, or vault config.
- The seam is internal/minified and therefore brittle. It is feasible for a small personal plugin, not something to treat as a stable public API.

## Evidence

Runtime CDP inspection of `obsidian-test-vault` showed:

- File Explorer view type exists: `file-explorer`.
- View methods include `getSortedFolderItems`, `sort`, `requestSort`, and `setSortOrder`.
- Native `getSortedFolderItems` uses folders-first behavior and sorts folders by name before applying the file comparator to files.

Prototype plugin evidence:

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed.
- `npm run sync:test-vault` built and copied runtime artifacts to the Windows-local test vault.
- `npm run smoke:cdp` passed: folders were Z-to-A after enabling the plugin and native order restored after disabling it.

## Verdict: PARTIAL

### What worked

- Folder Z-to-A ordering in the native File Explorer is possible with a tiny patch.
- The patch can be scoped to folder items only.
- Disabling the plugin restores the original method and native order.
- The plugin remains separate from Newest Files and Minimal Hidden Files.

### What didn't / risks

- There is no public Obsidian API for File Explorer folder comparator override.
- The implementation depends on internal File Explorer object shape and method names.
- Obsidian updates can break the seam without TypeScript/compiler warning.

### Recommendation

Keep as a personal/experimental plugin unless we add release hardening:

1. explicit Obsidian version support note;
2. runtime guard and visible warning when internals change;
3. one-click disable/restore setting;
4. CDP smoke in release checklist;
5. no extra file-explorer features in this plugin.
