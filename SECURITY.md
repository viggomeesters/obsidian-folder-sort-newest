# Security Policy

## Supported versions

Only the latest release is actively supported.

## Reporting a vulnerability

Please report security issues privately by emailing the maintainer or opening a minimal GitHub security advisory if available.

Do not include sensitive vault content in public issues. Reduce reproductions to minimal synthetic fixtures.

## Security posture

Folder Sort Newest changes only the rendered order of folder items in the native File Explorer. It does not create, modify, delete, rename, or transmit vault files. It does not call git, use network APIs, or access the clipboard. The implementation depends on Obsidian File Explorer internals and should fail closed with a warning if those internals change.
