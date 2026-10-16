# Updating the site and building from source

## Updating a running site

When a new version of this repository comes out:

1. Download or `git pull` the new files.
2. **Keep your own `wrangler.toml`.** It holds your database ID, your project name and your email. If the new version changes that file, copy your values into the new one rather than the other way around.
3. Deploy:

   ```
   npx wrangler pages deploy public --project-name my-rss-bbs
   ```

4. Players press **Ctrl+Shift+R** once to load the new version.

If a release adds database tables, the release notes will say so, and tell you to run `npx wrangler d1 execute bbs-db --remote --file=schema.sql` again. That file only ever uses `CREATE ... IF NOT EXISTS`, so running it twice is safe.

Your game data is never touched by a deploy. It lives in D1 and R2.

## What is in `public/`

`public/` is the finished site. You can deploy it without building anything.

| File | What it is |
|---|---|
| `index.html` | The whole site in one file |
| `tabletop.js` | The shared battle map code, loaded only when someone opens the Tabletop |
| `_worker.js` | The server code in one file (Cloudflare Pages "advanced mode") |
| `seattle-map.jpg` | A map picture used by the Map page (see `CONTENT-NOTICE.md`) |

`public/index.html`, `tabletop.js` and `_worker.js` are generated. Edit the files under `src/` and `functions/`, then rebuild.

## Building from source

You need Python 3 (3.8 or newer) and Node.js.

```
python3 build.py
node tools/check.js
```

- `build.py` assembles `src/shell.html`, `src/css/app.css`, `src/main_a.js`, every module listed in `src/modules.txt`, and `src/main_b.js` into `public/index.html`. Modules marked `@lazy` in `src/modules.txt` go into `public/tabletop.js`. It then builds `public/_worker.js` from `functions/`.
- `tools/check.js` loads the built scripts and reports any syntax error. No output means OK.

Rules for the source:

- All the browser JavaScript shares one global scope. A function declared later in `modules.txt` replaces an earlier one with the same name.
- A module's top level may only declare things; it must not call functions from `main_a.js` or `main_b.js`, because those run later.
- A `@lazy` module must not redeclare a name from the main bundle.
- Fixed pixel font sizes (`font-size:14px`) are rewritten at build time to follow the in-app Text size setting.
- Server code lives in `functions/api/[[path]].js` (the main API), `functions/api/v1/[[path]].js` (the read-only API) and `functions/_blob/[id].js` (picture downloads). `tools/build_worker.py` bundles them into `_worker.js`.

## Running the server tests

```
npm test
```

Needs Node.js 22.5 or newer (it uses Node's built-in SQLite). The test starts the built `_worker.js` against a real in-memory SQLite database created from `schema.sql` (D1 is SQLite underneath, so it behaves the same way), and checks login, permissions, syncing, uploads, backups, Discord posting and the read-only API.
