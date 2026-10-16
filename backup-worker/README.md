# Backup worker

A small Cloudflare Worker that saves a daily copy of the database into the `bbs-backups` R2 bucket and keeps the newest `KEEP_DAYS` files.

Setup instructions are in [`../docs/BACKUPS.md`](../docs/BACKUPS.md).
