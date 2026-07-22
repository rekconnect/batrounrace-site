# Batroun Race — Admin CMS setup

The site has a built-in admin panel at **`/admin`** where an administrator can
edit every text, list, sponsor, package, and podium entry on the website, and
upload sponsor logos. Every save becomes a git commit on `main`, and Vercel
publishes it automatically (~1 minute).

## One-time setup (Vercel)

The admin panel needs two environment variables in Vercel
(**vercel.com → batrounrace-site → Settings → Environment Variables**):

| Name | Value |
|---|---|
| `ADMIN_PASSWORD` | The password the administrator types at `/admin`. Pick a long one. |
| `GITHUB_TOKEN` | A GitHub fine-grained personal access token (see below). |

Creating the token: GitHub → Settings → Developer settings →
**Fine-grained personal access tokens** → Generate new token →
Repository access: **Only `batrounrace-site`** → Permissions →
**Contents: Read and write**. Copy the token into the Vercel variable.

After adding both variables, **redeploy** once (Vercel → Deployments →
⋯ → Redeploy) so the function picks them up.

## How it works

- `content/site.json` — all editable content lives here.
- `js/cms.js` — every page loads this; it fills the page from the JSON.
- `admin.html` (served at `/admin`) — the editor. Tabs per page, plus
  sponsor-logo uploads and a raw-JSON view for advanced edits.
- `api/save.js` — serverless function that checks the password and commits
  the JSON (and any uploaded logos) to `main`. It can only write
  `content/site.json` and `images/sponsors/*.png` — nothing else, even with
  a valid password.

## Notes

- Every save is a commit — full history, and any mistake can be reverted
  with `git revert` or from GitHub's history view.
- The baked-in HTML text acts as a fallback (and is what search engines see
  first); the JSON is the live source of truth once the page loads.
- Don't commit real secrets to this file or anywhere in the repo — the two
  values above live only in Vercel.

## AI chat assistant (optional)

The floating chat bubble on the site is powered by Claude and answers only
from the website's own content (it reads `content/site.json`, so it stays
current with admin edits). To enable it:

1. Create an API key at https://console.anthropic.com → API Keys.
2. Vercel → batrounrace-site → Settings → Environment Variables →
   add `ANTHROPIC_API_KEY` with that key → redeploy once.

Until the key is set, the chat replies with a WhatsApp handoff message.
Cost: it uses the small Haiku model with short answers — typical traffic
costs are a few dollars per month at most; you can see usage in the
Anthropic console and cap spending there.
