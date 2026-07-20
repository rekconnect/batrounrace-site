// Vercel serverless function: publish admin edits as a git commit.
// Env vars required (Vercel project settings):
//   ADMIN_PASSWORD — the password typed into /admin
//   GITHUB_TOKEN   — fine-grained token with Contents: read & write on this repo
const crypto = require('crypto');

const OWNER = 'rekconnect';
const REPO = 'batrounrace-site';
const BRANCH = 'main';
const API = 'https://api.github.com';

// Only these paths can ever be written, even with a valid password.
function pathAllowed(p) {
  if (p === 'content/site.json') return true;
  return /^images\/sponsors\/[a-z0-9-]+\.png$/.test(p);
}

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

async function gh(token, method, url, body) {
  const r = await fetch(API + url, {
    method,
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'batrounrace-admin'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error('GitHub ' + method + ' ' + url + ' → ' + r.status + ': ' + text.slice(0, 200));
  }
  return r.json();
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { password, message, files } = req.body || {};
  const adminPw = process.env.ADMIN_PASSWORD;
  const token = process.env.GITHUB_TOKEN;

  if (!adminPw || !token) {
    res.status(500).json({ error: 'Server not configured: set ADMIN_PASSWORD and GITHUB_TOKEN in Vercel.' });
    return;
  }
  if (!password || !safeEqual(password, adminPw)) {
    res.status(401).json({ error: 'Wrong password' });
    return;
  }
  if (!Array.isArray(files)) {
    res.status(400).json({ error: 'files must be an array' });
    return;
  }
  if (files.length === 0) {
    // auth check from the login screen
    res.status(200).json({ ok: true });
    return;
  }
  for (const f of files) {
    if (!f || typeof f.path !== 'string' || typeof f.content !== 'string' || !pathAllowed(f.path)) {
      res.status(400).json({ error: 'Path not allowed: ' + (f && f.path) });
      return;
    }
  }

  try {
    // one atomic commit containing every changed file
    const ref = await gh(token, 'GET', `/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
    const headSha = ref.object.sha;
    const headCommit = await gh(token, 'GET', `/repos/${OWNER}/${REPO}/git/commits/${headSha}`);

    const treeItems = [];
    for (const f of files) {
      const blob = await gh(token, 'POST', `/repos/${OWNER}/${REPO}/git/blobs`, {
        content: f.content,
        encoding: 'base64'
      });
      treeItems.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha });
    }
    const tree = await gh(token, 'POST', `/repos/${OWNER}/${REPO}/git/trees`, {
      base_tree: headCommit.tree.sha,
      tree: treeItems
    });
    const commit = await gh(token, 'POST', `/repos/${OWNER}/${REPO}/git/commits`, {
      message: (message || 'Admin content update') + '\n\nPublished from /admin',
      tree: tree.sha,
      parents: [headSha]
    });
    await gh(token, 'PATCH', `/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
      sha: commit.sha
    });

    res.status(200).json({ ok: true, commit: commit.sha });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
};
