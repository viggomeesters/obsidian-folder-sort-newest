# Folder Sort Newest

Sort folders Z-to-A in Obsidian's native File Explorer without changing files or vault content.

## Features

- keeps folders grouped before files;
- sorts folder names Z-to-A;
- preserves the native file ordering behavior;
- restores native File Explorer behavior when the plugin unloads;
- does not create, rename, delete, or modify vault files.

## Development

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
npm run sync:test-vault
npm run smoke:cdp
npm run community:check
```

`npm run sync:test-vault` copies only `main.js`, `manifest.json`, and `styles.css` to:

```text
/mnt/c/Users/viggo/github/obsidian-test-vault/.obsidian/plugins/folder-sort-newest
```

The sync script refuses `Syncthing/vault` targets.

## Release

Create a GitHub release whose tag exactly matches `manifest.json.version` and attach:

- `main.js`
- `manifest.json`
- `styles.css`
