# Folder Sort Newest

Spike plugin for Obsidian's native File Explorer folder ordering.

## Goal

Validate whether a one-purpose plugin can make folders in the native File Explorer sort Z-to-A without writing vault content or bundling unrelated file-explorer behavior.

## Verdict

**PARTIAL**: feasible as a small internal patch, not as a stable public API integration.

Obsidian's native File Explorer exposes an internal `getSortedFolderItems()` method. The native implementation always puts folders before files and sorts folders A-to-Z independently of the active file sort setting. A plugin can monkey-patch that method and reorder only folder items Z-to-A while leaving files in the native order.

This is non-destructive and worked in the Windows-local `obsidian-test-vault`, but it depends on internal/minified File Explorer methods and should be treated as brittle across Obsidian releases.

## Commands

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run sync:test-vault
npm run smoke:cdp
```

`npm run sync:test-vault` copies only `main.js`, `manifest.json`, and `styles.css` to:

```text
/mnt/c/Users/viggo/github/obsidian-test-vault/.obsidian/plugins/folder-sort-newest
```

It refuses `Syncthing/vault` targets.

## Recommendation

Do not publish this immediately as a normal release. If this remains useful after a few real Obsidian sessions, harden it with:

- explicit supported Obsidian version notes;
- a setting to disable/restore instantly;
- a console warning when the File Explorer internal method shape changes;
- a CDP smoke test in the release checklist.
