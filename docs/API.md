# Seattle Matrix BBS: read-only API (v1)

Read-only: it can look at your game, never change it. Everything is GET.

## What it gives you

| Address | What you get |
|---|---|
| `/api/v1` | List of all endpoints, and who you are signed in as |
| `/api/v1/clock` | The in-game date and time |
| `/api/v1/boards` | Custom channels, and how many posts each board has |
| `/api/v1/posts` | Posts. Filters: `board`, `thread`, `handle`, `since`, `limit`, `order=asc`. In Off Screen Scenes a post may carry `sc`, the scene character the player (`handle`) was writing as |
| `/api/v1/characters` | Every character sheet, with Toughness, Parry, Armor and Funds worked out |
| `/api/v1/characters/{id}` | One full sheet (use the id, the name or the handle) plus worn and carried equipment |
| `/api/v1/rolls` | The table roll log (who rolled, what they rolled, when) |
| `/api/v1/calendar?from=2077-03-01&to=2077-03-31` | Calendar events, job deadlines and dated map pins |
| `/api/v1/scene` | The current scene (where, when, weather) |
| `/api/v1/districts` | The Seattle district guide (GM secrets are never included) |
| `/api/v1/broadcasts` | Past GM broadcasts |
| `/api/v1/heat` | Heat, Street Rep and faction standing, with the history of changes and faction profiles (GM secrets are never included) |
| `/api/v1/customgear` | Custom gear and catalog entries that players added to the shop |
| `/api/v1/glossary` | The GM's own rules and slang terms (the built-in terms are part of the app, not the API) |
| `/api/v1/safehouse` | The team safe house (name, security, rent, upgrades). Empty until the GM turns the safe house on |
| `/api/v1/stash` | The safe house stash, rent payments and activity. Empty until the GM turns the safe house on |
| `/api/v1/jobs` `missions` `contacts` `downtime` `events` `ledger` `inventory` `pins` `handouts` `npcs` `feedback` | Those lists. Inventory also takes `owner=` |

Lists take `limit` (default 50, max 200) and `since` (a number from the last reply's `next_since`, to get only what is new).
Deleted items never show up.

**Never shown:** private session notes, player profiles, Discord IDs and players' email addresses.

## Turn it on (about 10 minutes)

### 1. Make a key
A key is a long random password for the program that will call the API. In a terminal:

    node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"

Copy the result. Keys must be at least 16 characters. Make one per program, so you can cancel one without breaking the others.

### 2. Give the site the key
In the project folder:

    npx wrangler pages secret put API_KEYS --project-name my-rss-bbs

When it asks for the value, type a name, a colon and the key, like `discordbot:3f9a...` (no spaces).
For two programs, separate them with a comma: `discordbot:3f9a...,sheets:81bc...`.
To cancel a key later, run the same command again without it.

### 3. Deploy the new files

    npx wrangler pages deploy public --project-name my-rss-bbs

. The API code is already part of `public/_worker.js`.

### 4. Let programs through Cloudflare Access
Your site is locked behind a login that a program cannot do, so give the API address its own door. The API's own key check protects it.

1. Cloudflare dashboard > **Zero Trust** > **Access** > **Applications** > **Add an application** > **Self-hosted**.
2. Name: `BBS API`.
3. Domain: your site address (for example `my-rss-bbs.pages.dev`). Path: `api/v1`.
4. Add a policy: name `API key`, action **Bypass**, include **Everyone**. Save.

Access always uses the most specific path, so only `/api/v1/...` bypasses the login. The rest of the site stays locked.
You can skip this step if you only want to try the API in a browser while you are signed in to the site.

### 5. Try it
In a browser, signed in to the site, open `https://YOUR-SITE/api/v1/characters`. You should see JSON.

From a terminal, using your key:

    curl https://YOUR-SITE/api/v1/characters -H "Authorization: Bearer YOUR_KEY"

## Example reply

    GET /api/v1/characters/kestrel

    {
      "name": "Kestrel", "handle": "Kestrel", ...
      "derived": {
        "toughness": 10, "parry": 6,
        "armor": { "Head": 3, "Torso": 5, "Arms": 5, "Legs": 1 },
        "wornArmor": ["Helmet", "Armor Jacket"], "funds": 3800
      },
      "equipment": [ { "name": "Armor Jacket", "qty": 1, "worn": true, ... } ]
    }

## Good to know

- **Keep keys secret.** Anyone with a key can read the whole game board. Do not paste one into Discord or a public repo.
- **Errors:** `401` = missing or wrong key. `405` = you tried to change something (not allowed). `404` = no such address or character.
- It is meant for programs on a server (a Discord bot, a spreadsheet script), not for web pages on other sites. Browsers on other sites cannot read it.
- Post text comes back in the board's own text format (`@[Name]` for mentions, and so on).
