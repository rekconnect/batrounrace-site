// Vercel serverless function: Batroun Race assistant.
// Env var required (Vercel project settings): ANTHROPIC_API_KEY
// Answers are grounded in content/site.json fetched from this same deployment,
// so the bot stays current with whatever Raed edits in /admin. On top of the
// raw content we compute a small fact sheet (today's date, which race is next,
// how many days away, whether registration is open) because the model cannot
// work those out from JSON alone — that is what used to make it answer with
// last season's race.

const MODEL = 'claude-sonnet-5';
const MAX_TOKENS = 600;
const CONTENT_TTL = 60 * 1000;   // re-fetch site.json at most once a minute
const ANTHROPIC_TIMEOUT = 22000;
const CONTENT_TIMEOUT = 8000;

// per-instance throttle: enough to blunt a bored visitor hammering the box
const RATE_MAX = 25;
const RATE_WINDOW = 10 * 60 * 1000;
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now - rec.start > RATE_WINDOW) {
    hits.set(ip, { start: now, n: 1 });
    if (hits.size > 500) for (const [k, v] of hits) if (now - v.start > RATE_WINDOW) hits.delete(k);
    return false;
  }
  rec.n += 1;
  return rec.n > RATE_MAX;
}

function fetchWithTimeout(url, opts, ms) {
  const ctl = new AbortController();
  const t = setTimeout(function () { ctl.abort(); }, ms);
  return fetch(url, Object.assign({}, opts, { signal: ctl.signal }))
    .finally(function () { clearTimeout(t); });
}

let cached = { at: 0, content: null };
async function siteContent(host) {
  if (cached.content && Date.now() - cached.at < CONTENT_TTL) return cached.content;
  try {
    const r = await fetchWithTimeout('https://' + host + '/content/site.json', {}, CONTENT_TIMEOUT);
    if (!r.ok) return cached.content;
    const json = await r.json();
    cached = { at: Date.now(), content: json };
    return json;
  } catch (e) {
    return cached.content;   // stale beats nothing
  }
}

function stripTags(v) {
  if (typeof v === 'string') return v.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (Array.isArray(v)) return v.map(stripTags);
  if (v && typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v)) {
      // drop layout-only noise the assistant can never need
      if (/^(img|img_portrait|bg|alt|map_url|slug|style|highlight|upcoming)$/.test(k)) continue;
      out[k] = stripTags(v[k]);
    }
    return out;
  }
  return v;
}

function factSheet(c, now) {
  const g = (c && c.global) || {};
  const promo = (c && c.home && c.home.promos && c.home.promos[0]) || null;
  const race = (promo && promo.race) || g.race || null;
  const lines = [];
  const today = now.toISOString().slice(0, 10);
  lines.push('Today is ' + today + '.');

  if (race && race.date) {
    const start = new Date(race.date + 'T' + (race.time || '08:00') + ':00+03:00');
    const days = Math.ceil((start - now) / 86400000);
    const name = String(race.edition_label || 'Next race').replace(/^Next race\s*·\s*/i, '').trim();
    if (days >= 0) {
      lines.push('The NEXT race is: ' + name + ' — ' + race.date +
        (race.time ? ' at ' + race.time : '') +
        (race.location ? ', ' + race.location : '') + '. That is ' + days + ' day(s) from today.');
    } else {
      lines.push('The last listed race (' + name + ', ' + race.date + ') has already happened. ' +
        'No future race date is published yet — do not invent one.');
    }
    if (race.info) lines.push('Race-day timings: ' + stripTags(race.info) + '.');
  } else {
    lines.push('No race date is published on the site right now — do not invent one.');
  }

  const past = !!(race && race.date && new Date(race.date + 'T23:59:59+03:00') < now);
  const open = !!(promo && promo.label && promo.href) && !past;
  if (past) {
    lines.push('The site still shows a registration button, but it belongs to that finished race — ' +
      'tell visitors to check with the organisers before signing up.');
  }
  lines.push(open
    ? 'Registration is OPEN: the site shows a "' + stripTags(promo.label) + '" button pointing to ' + promo.href +
      '. Send people there to sign up and pay.'
    : 'Registration is NOT open yet on the site. Do not promise an opening date; offer to be notified via WhatsApp or Instagram instead.');

  lines.push('Contacts — WhatsApp: ' + (g.whatsapp_url || '') +
    ' · email: ' + (g.email || '') +
    ' · phone: ' + (g.phone_display || '') +
    ' · Instagram: ' + (g.instagram_url || '') +
    ' · Facebook: ' + (g.facebook_url || '') + '.');
  lines.push('Registration & payment site: ' + (g.register_url || 'https://register.batrounrace.com/') +
    ' · Results: ' + (g.results2026_url || 'https://register.batrounrace.com/results') + '.');
  return lines.join('\n');
}

function buildSystem(content, now) {
  const facts = content ? factSheet(content, now) : 'Site content is unavailable right now.';
  return (
    'You are the assistant on batrounrace.com, the official site of Batroun Race — a Lebanese running ' +
    'organisation that puts on road races (the Batroun coastal race, and other editions in other towns). ' +
    'You speak for the organisers: warm, local, straight to the point.\n\n' +
    'HOW TO ANSWER\n' +
    '- Ground every factual claim in the FACT SHEET and SITE CONTENT below. Never invent dates, prices, ' +
    'distances, names, or results. If something is not there, say so plainly and hand off to WhatsApp or email.\n' +
    '- The FACT SHEET wins over anything in SITE CONTENT that looks older. Different races have different ' +
    'towns, distances and dates — never mix one race\'s details into another.\n' +
    '- Answer in the visitor\'s language (English, Arabic, or French), matching Lebanese Arabic if they use it.\n' +
    '- 1–3 short sentences. No headings, no preamble, no "as an AI". Sound like a person at the race desk.\n' +
    '- You may use **bold** sparingly, - bullet lists for 3+ items, and [text](url) links. Always link the ' +
    'registration or results site when it answers the question.\n' +
    '- Do not repeat the visitor\'s question back to them. Do not apologise more than once.\n' +
    '- Stay on the race, registration, route, results, sponsorship, volunteering, travel to the venue and ' +
    'Batroun/Lebanon around the event. For anything else, say it is outside what you can help with and offer WhatsApp.\n' +
    '- If someone asks to change site content, book them a spot, take a payment, or share personal data of ' +
    'runners, explain you cannot and point them to the organisers.\n\n' +
    'FOLLOW-UPS\n' +
    'After your answer, on a final separate line, you MAY offer up to 3 short follow-up questions the visitor ' +
    'is likely to ask next, in their language, formatted exactly as:\n' +
    'SUGGEST: question one | question two | question three\n' +
    'Each under 40 characters. Only suggest things the SITE CONTENT can actually answer. Omit the line if nothing fits.\n\n' +
    'FACT SHEET (authoritative, computed today)\n' + facts + '\n\n' +
    'SITE CONTENT (JSON)\n' + (content ? JSON.stringify(stripTags(content)) : '(unavailable)')
  );
}

function splitSuggestions(text) {
  const m = text.match(/\n?\s*SUGGEST:\s*(.+)\s*$/i);
  if (!m) return { reply: text.trim(), suggestions: [] };
  const suggestions = m[1].split('|')
    .map(function (s) { return s.trim().replace(/^["'\-\s]+|["'\s]+$/g, ''); })
    .filter(function (s) { return s.length > 1 && s.length <= 60; })
    .slice(0, 3);
  return { reply: text.slice(0, m.index).trim(), suggestions: suggestions };
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    // diagnostics: visit /api/chat in a browser to check configuration
    res.status(200).json({ ok: true, configured: !!process.env.ANTHROPIC_API_KEY, model: MODEL });
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    res.status(503).json({ error: 'not_configured' });
    return;
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) {
    res.status(429).json({ error: 'rate_limited' });
    return;
  }

  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 12) {
    res.status(400).json({ error: 'bad_request' });
    return;
  }
  for (const m of messages) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') ||
        typeof m.content !== 'string' || m.content.length === 0 || m.content.length > 1500) {
      res.status(400).json({ error: 'bad_request' });
      return;
    }
  }
  if (messages[messages.length - 1].role !== 'user') {
    res.status(400).json({ error: 'bad_request' });
    return;
  }

  try {
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const content = await siteContent(host);
    const system = buildSystem(content, new Date());

    const r = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        // the system block is identical between turns, so cache it: every
        // follow-up message re-reads the whole site for ~10% of the price
        system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
        messages: messages
      })
    }, ANTHROPIC_TIMEOUT);

    if (!r.ok) {
      const t = await r.text();
      res.status(r.status === 429 ? 429 : 502)
        .json({ error: r.status === 429 ? 'rate_limited' : 'upstream', detail: t.slice(0, 200) });
      return;
    }
    const data = await r.json();
    const text = (data.content || []).filter(function (b) { return b.type === 'text'; })
      .map(function (b) { return b.text; }).join('');
    const out = splitSuggestions(text);
    if (!out.reply) {
      res.status(502).json({ error: 'empty' });
      return;
    }
    res.status(200).json(out);
  } catch (e) {
    res.status(502).json({ error: e && e.name === 'AbortError' ? 'timeout' : 'upstream' });
  }
};

// exported for the local test harness
module.exports.buildSystem = buildSystem;
module.exports.splitSuggestions = splitSuggestions;
module.exports.factSheet = factSheet;
