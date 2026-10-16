# Setup guide: Cloudflare + Wrangler

This takes about 30 to 45 minutes the first time. You do not need to know how to program. You will copy and paste a handful of commands and click through two Cloudflare pages.

**What you are building**

| Piece | What it does | Cloudflare product |
|---|---|---|
| The website | The page everyone opens | Pages |
| The server code | Saves and loads everything, talks to Discord | Pages "advanced mode" worker (`public/_worker.js`) |
| The database | Posts, sheets, maps, rolls | D1 |
| Picture storage | Uploaded maps, portraits and handouts | R2 |
| The login | Only the people you invite can open the site | Zero Trust Access |

The site has **no passwords of its own**. Cloudflare Access is the login, so Step 7 is not optional.

---

## 0. What you need

- A free Cloudflare account: <https://dash.cloudflare.com/sign-up>
- **Node.js** (the "LTS" version) from <https://nodejs.org>. It installs `npm` and `npx`, which run Wrangler.
- This repository on your computer. Either `git clone` it, or press the green **Code** button on GitHub, choose **Download ZIP**, and unzip it.
- (Optional) A Discord server where you can manage channels, for [Discord](DISCORD.md).

Open a terminal in the project folder. On Windows, open the folder in File Explorer, click the address bar, type `powershell`, and press Enter. Every command below is run from this folder.

Check that Node works:

```
node --version
```

## 1. Log in to Wrangler

Wrangler is Cloudflare's command-line tool. You do not install it; `npx` fetches it when you run it.

```
npx wrangler login
```

A browser window opens. Click **Allow**. Then check:

```
npx wrangler whoami
```

It should show your account.

## 2. Create the database (D1)

```
npx wrangler d1 create bbs-db
```

The output includes a line like `database_id = "1234abcd-...."`. Copy that long ID. Open `wrangler.toml` in any text editor (Notepad is fine) and replace `PASTE-YOUR-DATABASE-ID-HERE` with it.

Now create the tables. The `--remote` part matters: without it the tables go to a throwaway local copy.

```
npx wrangler d1 execute bbs-db --remote --file=schema.sql
```

Answer `y` if it asks to confirm.

## 3. Create the picture storage (R2)

```
npx wrangler r2 bucket create bbs-images
npx wrangler r2 bucket create bbs-backups
```

If Wrangler says R2 is not enabled, open the Cloudflare dashboard, click **R2 Object Storage** in the left menu, and follow the prompt to turn it on. Cloudflare may ask for a payment method even though the free allowance (about 10 GB) is far more than a game needs. Then run the two commands again.

`bbs-images` holds uploaded pictures. `bbs-backups` holds the daily backups ([BACKUPS.md](BACKUPS.md)). Both names must match `wrangler.toml`.

## 4. Edit `wrangler.toml`

Open `wrangler.toml` and set these, then save:

```toml
name = "my-rss-bbs"                # becomes your address: my-rss-bbs.pages.dev (must be unique on Cloudflare)

[vars]
OWNER_EMAIL = "you@example.com"    # YOU, the GM. Use the email you will log in with.
```

- `name` is your site's name and web address. Use lowercase letters, numbers and dashes.
- `OWNER_EMAIL` decides who is the GM. For more than one GM, list them separated by commas or spaces: `"a@example.com, b@example.com"`. Everybody else is a player.
- Leave the two Access lines (`TEAM_DOMAIN`, `POLICY_AUD`) commented out for now. You will fill them in at Step 8.

## 5. Deploy the site

Create the Pages project once (use the same name as in `wrangler.toml`):

```
npx wrangler pages project create my-rss-bbs --production-branch main
```

Then upload the site:

```
npx wrangler pages deploy public --project-name my-rss-bbs
```

When it finishes it prints your address, `https://my-rss-bbs.pages.dev`. **Do not share it yet.** Anyone could open it until you finish Step 7.

Because `wrangler.toml` lists the database and the buckets, the deploy connects them for you. If the deploy output does not mention `DB`, `IMAGES` and `BACKUPS` bindings, re-check the file for typos.

## 6. (Optional now, handy later) Discord

You can skip this and come back to it any time. See [DISCORD.md](DISCORD.md).

## 7. Put the login in front of the site (Cloudflare Access)

1. Open <https://dash.cloudflare.com> and click **Zero Trust** in the left menu. The first time, Cloudflare asks you to choose a **team name** (anything, for example `mygroup`) and a plan. Choose the **Free** plan, which covers up to 50 people. Cloudflare may ask for a payment method; the free plan does not charge.
2. Go to **Access controls** then **Applications** (on older layouts: **Access** then **Applications**). Click **Add an application** and choose **Self-hosted**.
3. Name it `RSS`. Under **Public hostname** (older layouts: "Application domain") add **two** entries:
   - Domain `my-rss-bbs.pages.dev`, path empty.
   - Domain `*.my-rss-bbs.pages.dev`, path empty. This second one is important: every Pages deployment also gets a long address like `abc123.my-rss-bbs.pages.dev`, and it would otherwise be open to the world.
4. Create an access policy:
   - Name: `Players`. Action: **Allow**.
   - Include rule: choose **Emails** and add every player's email address (and yours). Or choose **Emails ending in** to let a whole domain in.
5. Make sure a login method is on: **Settings** then **Authentication** then **Login methods**. **One-time PIN** is on by default. It emails a 6-digit code to anyone on your list when they open the site, so players do not need any account.
6. Save the application.

**Test it.** Open a private browser window and go to `https://my-rss-bbs.pages.dev`. You should see a Cloudflare login asking for an email. Enter yours, then the code you receive, and you should land on the site. Anyone not on the list gets no code.

## 8. Turn on the extra protection (strongly recommended)

The server learns who you are from a header that Cloudflare Access adds. This step makes the server also check Cloudflare's signature on the login, so nobody can pretend to be someone else by reaching the server another way.

1. In Zero Trust open **Access controls** then **Applications**, click your `RSS` application, and copy the **Application Audience (AUD) Tag**. It is a long string of letters and numbers.
2. Find your team domain: **Settings** then **General**; it looks like `mygroup.cloudflareaccess.com`.
3. In `wrangler.toml`, remove the `#` in front of the two lines and fill them in:

```toml
[vars]
OWNER_EMAIL = "you@example.com"
TEAM_DOMAIN = "mygroup.cloudflareaccess.com"
POLICY_AUD = "paste-the-long-audience-tag-here"
```

4. Deploy again:

```
npx wrangler pages deploy public --project-name my-rss-bbs
```

If everyone suddenly sees "Not signed in", the audience tag or team domain has a typo. Comment the two lines out again, redeploy, and recheck what you copied.

## 9. First visit

1. Open your site and log in with the `OWNER_EMAIL` address. You are the GM, so you get the GM Tools page.
2. Pick a **handle** when the site asks. Handles are the names people post under.
3. Send players the address. They log in with their own email and pick their own handle.

## 10. Set up daily backups

See [BACKUPS.md](BACKUPS.md). It is a separate small worker and takes about ten minutes. Do it before your first real session.

---

## Costs and limits

Everything here fits in Cloudflare's free plans for a normal game group. Check Cloudflare's current pricing pages for exact numbers, because they change. At the time of writing:

- Pages Functions and Workers: 100,000 requests per day. The site checks for changes every few seconds while a page is open and visible, and much more slowly when idle or in a background tab. A handful of players in a long session uses a small fraction of the allowance.
- D1: millions of reads and 100,000 writes per day on the free plan.
- R2: about 10 GB of storage.
- Zero Trust Access: free for up to 50 people.

## Troubleshooting

| What you see | Likely cause and fix |
|---|---|
| Browser shows the old version after a deploy | Press **Ctrl+Shift+R** (Cmd+Shift+R on Mac) for a hard refresh. |
| "Not signed in (is Cloudflare Access set up for this address?)" | Access is not in front of the address you opened, or Step 8 values do not match. Open the site through the exact address you protected. |
| "Server error: D1_ERROR: no such table: docs" | The tables were not created. Run Step 2's `d1 execute ... --remote` command. |
| Pictures will not upload, or "Cannot read properties of undefined (reading 'put')" | The `IMAGES` bucket is not connected. Check the bucket name in `wrangler.toml` and redeploy. |
| Restore or backups say "The backup bucket is not connected" | `wrangler.toml` is missing the `BACKUPS` bucket block. Add it back and redeploy. |
| Discord "Test" says refused or not found | See the troubleshooting list in [DISCORD.md](DISCORD.md). |
| `wrangler` says you are not logged in | Run `npx wrangler login` again. |
| A player never receives the login code | Their email is not on the Access policy, or it went to spam. |

## Using your own web address

You can attach a custom domain in the Pages project settings. After you do, add that domain to the Access application in Step 7, and update `TEAM_DOMAIN`/`POLICY_AUD` only if you created a different application.
