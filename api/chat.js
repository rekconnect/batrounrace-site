// Vercel serverless function: Batroun Race AI assistant.
// Env var required (Vercel project settings): ANTHROPIC_API_KEY
// Answers are grounded in content/site.json fetched from this same
// deployment, so the bot stays current with admin edits.

const MODEL = 'claude-haiku-4-5-20251001';

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    // diagnostics: visit /api/chat in a browser to check configuration
    res.status(200).json({ ok: true, configured: !!process.env.ANTHROPIC_API_KEY });
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    res.status(500).json({ error: 'Chat is not configured yet (missing ANTHROPIC_API_KEY).' });
    return;
  }
  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 12) {
    res.status(400).json({ error: 'Bad request' });
    return;
  }
  for (const m of messages) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') ||
        typeof m.content !== 'string' || m.content.length === 0 || m.content.length > 1500) {
      res.status(400).json({ error: 'Bad request' });
      return;
    }
  }
  if (messages[messages.length - 1].role !== 'user') {
    res.status(400).json({ error: 'Bad request' });
    return;
  }

  try {
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const contentRes = await fetch(`https://${host}/content/site.json`);
    const content = contentRes.ok ? await contentRes.json() : null;

    const system =
      'You are the friendly assistant on batrounrace.com, the official website of the Batroun Race — ' +
      "Lebanon's coastal running event (5KM & 10KM) in Batroun.\n\n" +
      'RULES:\n' +
      '- Answer ONLY from the SITE CONTENT below. If the answer is not there, say you are not sure and ' +
      'point the visitor to WhatsApp (https://wa.me/message/IJ45O3ILIUGMF1) or email Batrounrace@gmail.com. Never invent dates, prices, or race details.\n' +
      '- Registration and payment happen at https://register.batrounrace.com/ when registration is open. ' +
      'If the site content indicates registration has not opened yet, tell visitors how to get notified instead (WhatsApp or Instagram @batrounrace) and do not promise dates.\n' +
      '- Reply in the same language the visitor writes (English, Arabic, or French).\n' +
      '- Keep answers short and warm — 1 to 3 sentences unless more is truly needed. Include a relevant link when useful.\n' +
      '- Stay on topic: the race, registration, route, results, sponsorship, volunteering, and Batroun. ' +
      'Politely decline anything else.\n\n' +
      'SITE CONTENT (JSON):\n' + (content ? JSON.stringify(content) : '(unavailable — apologize and hand off to WhatsApp)');

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 500,
        system: system,
        messages: messages
      })
    });
    if (!r.ok) {
      const t = await r.text();
      res.status(502).json({ error: 'Assistant unavailable right now.', detail: t.slice(0, 200) });
      return;
    }
    const data = await r.json();
    const reply = (data.content || []).filter(function (b) { return b.type === 'text'; })
      .map(function (b) { return b.text; }).join('');
    res.status(200).json({ reply: reply || '…' });
  } catch (e) {
    res.status(502).json({ error: 'Assistant unavailable right now.' });
  }
};
