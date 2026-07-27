# Security Policy

QuickFile Actions runs entirely on your device. It reads only the files you give it, writes new files next to them, and makes no network requests.

## Reporting a vulnerability

Please report security issues privately via GitHub's **[Report a vulnerability](https://github.com/MalyStern/quickfile-actions/security/advisories/new)** rather than a public issue. Include what the issue is, how to reproduce it, and the affected version/OS.

Relevant areas: file/path handling, the IPC surface, and image decoding (sharp/libvips) on untrusted files.
