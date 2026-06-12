# Changelog

## 0.2.0

- Renamed the plugin ID and public naming to `folder-sort-z-to-a` / Folder Sort Z to A so the community listing matches the actual behavior.
- Kept the runtime implementation intentionally minimal: one File Explorer seam, tested folder-order core, fail-closed guards, no settings, no commands, and no vault writes.

## 0.1.1

- Extracted the folder ordering logic into a tiny tested core module.
- Added fail-closed guards for unsupported File Explorer internals.
- Re-applies the lightweight patch on layout changes and restores native behavior on unload.

## 0.1.0

- Initial community-review-ready release for Folder Sort Z to A.
- Added runtime plugin bundle, manifest, styles, tests, documentation, community checks, and release workflow.
