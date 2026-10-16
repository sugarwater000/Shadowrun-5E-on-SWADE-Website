# Running the Shadow System (RSS)

A self-hosted message board and game table for a tabletop roleplaying group, with a cyberpunk look. It was built for a Shadowrun game played with the Savage Worlds rules, and it runs entirely on Cloudflare's free tier. No servers to look after and no monthly bill for a normal group.

> **Unofficial fan project.** Not affiliated with or endorsed by any game publisher. Some third-party game reference material is included for convenience and is **not** covered by the MIT license. Please read [`CONTENT-NOTICE.md`](CONTENT-NOTICE.md).

## What it does

**Talking**
- Boards for in-character posts, plus Off Screen Scenes, Shadowtalk-style anonymous drops, faction channels you can add to, and a scrolling news banner.
- **Private Channels**: one-to-one messages or **group chats** with several handles. An inbox, unread tracking, saved posts, muted boards, search and link previews.
- Mentions with `@`, pasted pictures, custom emoji, a Trash with restore, and undo.

**Playing**
- **Character sheets** for Savage Worlds: attributes, skills, edges and hindrances, gear, armor, wounds, Bennies, advances, drones and vehicles. Import from Savaged.us.
- A **dice roller** with Trait and Wild dice, aces, raises and damage. A shared roll log, colored pinned rolls and Table Stats (streaks, glitches, biggest hits).
- A shared **Tabletop** battle map: grid fitting, tokens, fog of war, walls and doors, sight and light, a ruler that goes around walls, movement range, templates, ranged and melee attacks with autofire, Soak, an enemy archetype library, drones and chases.
- An **initiative tracker** using action cards, a **clue board**, countdown clocks, alarm levels, street events, a shopping and gear system, a calendar, a handout vault and heat and reputation tracking for the GM.

**Running it**
- GM Tools: a dashboard, broadcasts, scenes, districts and factions, a safe house, custom gear and rules, a GM-only layer of notes and dossiers.
- Daily backups and restore, a storage panel for pictures, and a read-only JSON API for bots and spreadsheets ([`docs/API.md`](docs/API.md)).
- **Discord**: mirror boards, scenes and dice rolls into your Discord server, with real pings ([`docs/DISCORD.md`](docs/DISCORD.md)).

## How it works

```
Browser  ->  Cloudflare Access (email login)  ->  Pages: static site + _worker.js  ->  D1 database
                                                                                  ->  R2 pictures and backups
                                                                                  ->  Discord webhooks (optional)
```

The browser code is one HTML file plus one lazy-loaded file for the Tabletop. The server is one Cloudflare Worker. Data is stored as JSON documents in a single D1 table. There is no build step needed to deploy, because the finished files are in `public/`.

## Get it running

You need a free Cloudflare account and Node.js. The step-by-step guide is in **[`docs/SETUP.md`](docs/SETUP.md)** and covers everything from creating the database to locking the site to your players' email addresses.

The short version:

```
npx wrangler login
npx wrangler d1 create bbs-db                                   # copy the database_id into wrangler.toml
npx wrangler d1 execute bbs-db --remote --file=schema.sql
npx wrangler r2 bucket create bbs-images
npx wrangler r2 bucket create bbs-backups
# edit wrangler.toml: your project name and OWNER_EMAIL
npx wrangler pages project create my-rss-bbs --production-branch main
npx wrangler pages deploy public --project-name my-rss-bbs
# then put Cloudflare Access in front of it (SETUP.md, step 7). Do not skip this.
```

## Guides

| Guide | For |
|---|---|
| [`docs/SETUP.md`](docs/SETUP.md) | Full Cloudflare and Wrangler setup, Access login, first visit, troubleshooting |
| [`docs/DISCORD.md`](docs/DISCORD.md) | A GM's guide to connecting Discord: channels, webhooks, forums, dice, pings |
| [`docs/BACKUPS.md`](docs/BACKUPS.md) | Daily backups and restoring |
| [`docs/API.md`](docs/API.md) | The read-only API for bots and scripts |
| [`docs/UPDATING.md`](docs/UPDATING.md) | Updating a live site, building from source, running tests |

## Repository layout

```
public/            the finished site: index.html, tabletop.js, _worker.js, seattle-map.jpg  (deploy this)
src/               source for the browser code (shell.html, css/, main_a.js, modules/, main_b.js)
functions/         source for the server (API, read-only API, picture downloads)
backup-worker/     the separate daily backup worker
tools/             worker bundler and syntax check
tests/             server tests that run against a real SQLite database
schema.sql         the database tables
wrangler.toml      your settings (database ID, bucket names, GM email)
build.py           rebuilds public/ from src/ and functions/
```

## Security in one paragraph

The site has no passwords of its own. Cloudflare Access is the login, and the server trusts the signed identity Cloudflare adds. Follow every step of [`docs/SETUP.md`](docs/SETUP.md) section 7 and 8: protect both your Pages address **and** its `*.pages.dev` preview addresses, and turn on the signature check. The GM is whoever is listed in `OWNER_EMAIL`. Everyone who can log in can read all boards, sheets (apart from sheets a player has hidden) and Private Channels (the Help page says so: "private" is an in-world label). Only the GM can change GM-owned things such as maps, fog, clocks and the Discord channel list. Discord webhook addresses are only ever sent to the GM. Please report security problems privately rather than in a public issue.

## Requirements and limits

- A free Cloudflare account (Pages, D1, R2 and Zero Trust Access on the free plans are enough for a game group; see the limits section of the setup guide).
- Node.js to run Wrangler. Python 3 only if you rebuild from source. Node 22.5+ only to run the tests.
- Modern desktop and mobile browsers. The site is a single page app that polls the server every few seconds while open.

## Contributing

Issues and pull requests are welcome. Edit `src/` and `functions/`, run `python3 build.py`, `node tools/check.js` and `npm test`, and commit the regenerated `public/` files along with your source changes. See [`docs/UPDATING.md`](docs/UPDATING.md).

## License

The code is released under the [MIT license](LICENSE). Third-party game material that ships with the repository is **not** covered by it; see [`CONTENT-NOTICE.md`](CONTENT-NOTICE.md).
