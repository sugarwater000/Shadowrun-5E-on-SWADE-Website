# Daily backups

Your game lives in a Cloudflare D1 database. A small separate Worker (in `backup-worker/`) copies the whole database into the private `bbs-backups` bucket every day and keeps the newest 30 days. It is free at game-group sizes.

Set it up once, before your first real session. About 10 minutes.

## What is and is not backed up

- **Backed up:** posts, sheets, maps, tokens, fog, walls, clocks, notes pinned to maps, settings and everything else stored in the database.
- **Not backed up:** each player's private "My Notes" (the same as the Export everything button), and uploaded pictures (they stay in the `bbs-images` bucket, which Cloudflare keeps for you).
- This protects you from deleted or damaged game data. It does not protect you from losing your Cloudflare account. For that, once in a while download a backup file and keep it somewhere else (see below).

## Set it up

Open a terminal in the `backup-worker` folder of the project.

1. Make sure the bucket exists (you made it during setup):

   ```
   npx wrangler r2 bucket create bbs-backups
   ```

   It is fine if it says the bucket already exists.

2. Open `backup-worker/wrangler.toml` and replace `PASTE-YOUR-DATABASE-ID-HERE` with the same `database_id` that is in the main `wrangler.toml`.

3. Deploy it:

   ```
   npx wrangler deploy
   ```

4. Test it now instead of waiting for tomorrow:

   ```
   npx wrangler dev --test-scheduled --remote
   ```

   Leave that running, open <http://localhost:8787/__scheduled> in a browser, then stop Wrangler with Ctrl+C. Check the bucket in the Cloudflare dashboard under **R2 Object Storage** then **bbs-backups**. You should see a file named `backup-YYYY-MM-DD.json` for today.

## Schedule and retention

- It runs every day at 10:00 UTC (3:00 AM Pacific in summer). Change the `crons` line in `backup-worker/wrangler.toml` to move it, then run `npx wrangler deploy` again.
- `KEEP_DAYS` (default `30`) sets how many daily files are kept. Older ones are deleted automatically.

## Looking at your backups

In the site, as the GM, open the menu (the ☰ list of tools) and choose **Restore from backup (GM)**. It lists the daily files and lets you look inside one, compare it with what is live, and put chosen items back.

(This needs the `BACKUPS` bucket block to stay in the main `wrangler.toml`.)

## Restoring

- **Put some things back:** use **Restore from backup (GM)** in the menu, as above.
- **Start over from a file:** download a backup from the R2 dashboard (click the file, then **Download**). In the site, use **⬆ Restore (GM)** in the menu and pick the file. It is the same format as the Export everything file.

## Keeping a copy off Cloudflare

Every so often, download a file from the R2 dashboard and drop it in your own cloud drive. The **Export everything** button in GM Tools also downloads a copy to your computer at any time.
