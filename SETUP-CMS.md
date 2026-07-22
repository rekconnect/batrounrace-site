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

## Chat assistant

The floating chat bubble works in two modes, detected automatically:

**FAQ mode (free, the default).** Visitors get tap-to-answer question chips
and simple keyword matching. Answers come from the Race Guide FAQ — edit
those questions/answers in /admin (Race guide tab) and the bot updates
instantly. Anything it can't match hands off to WhatsApp.

**AI mode (optional, paid).** Add an `ANTHROPIC_API_KEY` environment
variable in Vercel (key from https://console.anthropic.com, then redeploy)
and the same bubble upgrades itself to a Claude-powered assistant that
answers free-form questions in English/Arabic/French from the whole site's
content. Roughly a cent per question on the Haiku model; a spending cap can
be set in the Anthropic console. Remove the variable to fall back to free
FAQ mode.
