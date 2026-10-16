# Discord setup (for the GM)

Discord is **optional** and **one-way**: the site sends copies of things into your Discord server. Nothing typed in Discord comes back to the site.

You only need three things: your Discord server, this site, and (for one optional piece) Wrangler. No Discord bot, no developer portal, no extra hosting.

## What Discord can do for your game

| Feature | What your players see in Discord |
|---|---|
| **Board mirroring** | Each site board (General, Shadowtalk, a faction channel...) can post into its own Discord channel, in full, under the poster's handle. |
| **Dice rolls** | Rolls made with **Post to Discord** switched on appear in a dice channel. |
| **Forum posts** | Off Screen Scenes and Private Channels can become Discord **Forum** posts: one post per scene or conversation, each new message added to it. |
| **Real pings** | A player who adds their Discord user ID gets a real `@` ping when mentioned or sent a private message. |
| **Discord Summary** | A digest of what happened since the last one, edited by you and posted with one click (needs the optional main channel, below). |

Everything below is set up **inside the site** by the GM, except the optional main channel, which uses one Wrangler command.

---

## Part 1: Plan your Discord channels

Make the channels you want in Discord first. A common layout:

| Discord channel | Type | Used for |
|---|---|---|
| `#dice-rolls` | Text | Dice rolls |
| `#general`, `#shadowtalk`, `#runs-wanted`... | Text | The site boards you want mirrored (pick only the ones you care about) |
| `#scenes` | **Forum** | Off Screen Scenes |
| `#private-messages` | **Forum** (optional) | Private Channels. Read the privacy note in Part 4 first. |

You choose which boards get a channel. A board with no channel simply is not mirrored.

To create a Forum channel: **Create Channel** then choose **Forum**. (If you do not see Forum, your server needs the **Community** feature turned on under Server Settings.) A normal text channel also works for the scenes and private rows; it just gets ordinary messages instead of separate posts.

## Part 2: Make a webhook for each channel

A webhook is a private web address that lets the site post into one channel.

1. In Discord, hover the channel and click the **gear** (Edit Channel).
2. Open **Integrations**, then **Webhooks**, then **New Webhook**.
3. Give it any name. Check that the right channel is selected.
4. Click **Copy Webhook URL**. It looks like `https://discord.com/api/webhooks/123456789012345678/abcDEF...`.

Do this for every channel you want to connect. Forum channels work the same way.

You need the **Manage Webhooks** permission in that channel (server owners and admins have it).

**Treat these addresses like passwords.** Anyone who has one can post in that channel. Do not paste them into public places. The site only ever sends them to the GM.

## Part 3: Connect them in the site

1. Log in as the GM and open **GM Tools**.
2. Find the **Discord Channels** panel.
3. For each row, paste the matching webhook address:
   - **🎲 Dice rolls** is the first row. It is where rolls with Post to Discord go.
   - Then one row per board. Rows marked **(forum)** (Off Screen Scenes and Private Channels) work best with a Forum channel.
4. Press **Test** beside a row. Discord should show a "connected to this channel" message (or a new forum post for forum rows), and the site shows a green check.
5. Press **Save**. The panel says how many boards are connected.

You can change or clear any row later and Save again. There is an Undo after saving.

### How each row behaves

- **A normal board:** every new post and reply is sent to the channel as the full message, under the poster's handle, with a link back to the post. Long messages are shortened to fit Discord's 2,000 character limit. Attached pictures arrive as links. Dossiers (the GM's hidden reference pages) are never sent.
- **Off Screen Scenes:** each scene becomes its own forum post named after the scene. Messages show as `Character (Player)`.
- **Private Channels:** each conversation becomes its own forum post, titled `Sender → Recipients: subject`. For a group chat, every message names everyone else in the conversation.
- **Dice rolls:** see Part 5.

## Part 4: Privacy, and what players are told

- Private Channels in this site are **not** secret from other players or the GM: the in-world label is "private", but the Help page says everyone can read everything. Discord copying does not change who can read them on the site.
- If you connect the **Private Channels** row, everyone who can open that Discord forum can read those conversations. Put that forum in a Discord channel that only the people who should see it can open, or leave the row empty.
- If you set the optional main channel (Part 7), private messages produce a short notice there too (sender, recipients, subject and a link, never the text), unless the Private Channels row is connected.
- When private messages are mirrored, the site shows players a notice on the private message form ("the GM has turned on Discord copies of private messages") so nobody is surprised.

## Part 5: Dice rolls

Players and the GM tick **Post to Discord** on the Dice Roller page (the same switch is on character sheets and the quick roll bar). With it on, each roll is posted to the **Dice rolls** channel under the roller's display name. With it off, rolls still appear in the site's shared roll log; they just do not go to Discord.

If the Dice rolls row is empty, rolls fall back to the older dice channel variable (below) and then to the main channel. If nothing is set, the site tells the player that the GM can add a dice channel in GM Tools.

## Part 6: Real `@` pings (players)

Discord only pings people by their numeric user ID, not by name. Each player who wants pings does this once:

1. In Discord open **User Settings** then **Advanced** and turn on **Developer Mode**.
2. Right-click your own name anywhere and choose **Copy User ID**.
3. In the site, open **Profile** and paste it into **Discord user ID (optional, for real @pings)**. Save.

After that:

- When someone `@mentions` that handle in a post that is copied to Discord, the Discord message pings them.
- When someone sends them a private message, they are pinged by the short notice in the **main channel** (Part 7). If you connect the Private Channels row to a forum instead, the forum copy only pings people who are `@mentioned` inside the message, because that copy replaces the short notice.

People who do not add an ID are still named in the text; they just do not get a notification.

## Part 7: The optional main channel (needs Wrangler)

Two features use one more Discord address that is stored in Cloudflare instead of the site:

- **Discord Summary** (GM Tools) posts its digest there.
- Any post on a board that has **no** channel of its own falls back to a short notice with a link in this channel. For a private message the notice names the sender, the recipients and the subject, but not the message text. Leave `DISCORD_WEBHOOK` unset if you do not want even that to leave the site.

It is a normal webhook from Part 2, just stored as a secret. Run this from the project folder (use your own project name):

```
npx wrangler pages secret put DISCORD_WEBHOOK --project-name my-rss-bbs
```

Wrangler asks for the value: paste the webhook address and press Enter. Secrets take effect on the next deployment, so deploy again:

```
npx wrangler pages deploy public --project-name my-rss-bbs
```

There is also an optional `DISCORD_ROLLS_WEBHOOK` secret with the same command shape. It is an older way to set the dice channel and is only used when the Dice rolls row in GM Tools is empty. New setups can ignore it.

To remove a secret: `npx wrangler pages secret delete DISCORD_WEBHOOK --project-name my-rss-bbs`.

## Part 8: Importing an old Discord history (optional)

The Import page can load a Discord channel that was exported with the free **DiscordChatExporter** tool. Export in **JSON** format, then choose the file on the Import page. Pictures are not imported (Discord picture links expire), so attachments show as text placeholders. Imported posts are never sent back to Discord.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "Not a webhook address" | The text must start with `https://discord.com/api/webhooks/`. Copy it again with **Copy Webhook URL**. |
| Test says **Discord refused the message (404)** | The webhook was deleted in Discord. Make a new one and paste it. |
| Test says **refused (401)** or **(403)** | The webhook address is damaged (a missing character) or was regenerated. Copy it again. |
| Test works but real posts do not appear | Press **Save** after pasting. A test does not save the row. |
| A forum row posts plain messages instead of forum posts | The channel is a normal text channel, not a Forum. That is allowed, just different. |
| Rolls do not show in Discord | Check that **Post to Discord** is on, that the Dice rolls row is saved, and that the roller is not blocked by Discord's rate limit (a burst of many rolls). |
| Someone is not pinged | They have not added their Discord user ID in Profile, or the ID has a typo (it is 15 to 22 digits). |
| An address leaked | In Discord open the channel's Webhooks, delete that webhook, make a new one, and paste the new address in GM Tools. |
| Discord Summary says no webhook is set up | Do Part 7. |

## What the site sends, so you can judge it

The site sends: the poster's handle, the text of the post (or roll), a link to the post, and links to attached pictures. It does **not** send email addresses, private character notes or GM dossiers.
