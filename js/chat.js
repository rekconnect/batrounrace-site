// Batroun Race floating assistant widget. Two modes, detected automatically:
//  - AI mode: /api/chat reports an ANTHROPIC_API_KEY is configured, so
//    free-form questions go to Claude, grounded in content/site.json.
//  - FAQ mode (free, no key): question chips + keyword matching over the
//    Race Guide FAQ in content/site.json (edit them in /admin).
// AI mode falls back to FAQ mode mid-conversation if the API goes down, so a
// visitor always gets something useful instead of a dead end.
(function () {
  if (/[?&]edit=1/.test(location.search)) return; // stay out of the visual editor

  var WA = 'https://wa.me/message/IJ45O3ILIUGMF1';
  var EMAIL = 'Batrounrace@gmail.com';
  var GREET_AI = 'Marhaba! 👋 I\'m the Batroun Race assistant. Ask me about the next race, registration, the route, results or sponsorship — English, العربية, or français.';
  var GREET_FAQ = 'Marhaba! 👋 Tap a question below — or type yours. For anything else, a human answers fast on WhatsApp.';
  var TIMEOUT = 28000;

  var css = document.createElement('style');
  css.textContent =
    '.brc-bubble{position:fixed;right:18px;bottom:18px;z-index:80;width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;background:var(--ink,#030F2B);color:#fff;font-size:1.45rem;box-shadow:0 12px 30px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;transition:transform .2s ease-out,background .2s}' +
    '.brc-bubble:hover{transform:translateY(-3px);background:var(--sea,#0668CD)}' +
    '.brc-bubble{transition:transform .25s ease-out,background .2s,opacity .25s ease-out}' +
    '.brc-bubble.brc-away{opacity:0;transform:translateY(14px) scale(.85);pointer-events:none}' +
    '@media(max-width:720px){.brc-bubble{bottom:78px}}' +
    '@media (prefers-reduced-motion:reduce){.brc-bubble:hover{transform:none}}' +
    '.brc-panel{position:fixed;right:18px;bottom:84px;z-index:90;width:min(370px,calc(100vw - 36px));height:min(520px,calc(100vh - 140px));background:#fff;border:1px solid rgba(3,15,43,.14);border-radius:16px;box-shadow:0 24px 60px rgba(0,0,0,.35);display:none;flex-direction:column;overflow:hidden;font-family:var(--body,sans-serif)}' +
    '@media(max-width:720px){.brc-panel{bottom:144px}}' +
    '.brc-panel.open{display:flex}' +
    '.brc-head{background:var(--ink,#030F2B);color:#F4F7FC;padding:13px 16px;display:flex;align-items:center;gap:9px;font-weight:700;font-size:.92rem}' +
    '.brc-head .dot{width:9px;height:9px;border-radius:50%;background:var(--coral,#F7A00A);flex:none}' +
    '.brc-head .sp{margin-left:auto;display:flex;gap:4px}' +
    '.brc-head button{background:none;border:none;color:#F4F7FC;font-size:.95rem;cursor:pointer;opacity:.75;padding:2px 6px;border-radius:6px}' +
    '.brc-head button:hover,.brc-head button:focus-visible{opacity:1;background:rgba(255,255,255,.12)}' +
    '.brc-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:9px;background:#F4F7FC}' +
    '.brc-m{max-width:88%;padding:9px 13px;border-radius:14px;font-size:.88rem;line-height:1.5;word-break:break-word}' +
    '.brc-m.bot{background:#fff;border:1px solid rgba(3,15,43,.1);align-self:flex-start;border-bottom-left-radius:4px;color:#0E2247}' +
    '.brc-m.me{background:var(--sea,#0668CD);color:#fff;align-self:flex-end;border-bottom-right-radius:4px;white-space:pre-wrap}' +
    '.brc-m a{color:var(--sea,#0668CD);text-decoration:underline;word-break:break-word}' +
    '.brc-m.me a{color:#fff}' +
    '.brc-m strong{font-weight:700}' +
    '.brc-m ul{margin:6px 0 2px;padding-left:18px}' +
    '.brc-m li{margin:2px 0}' +
    '.brc-m p{margin:0 0 6px}.brc-m p:last-child{margin-bottom:0}' +
    '.brc-dots{display:inline-flex;gap:4px;align-items:center;height:14px}' +
    '.brc-dots i{width:6px;height:6px;border-radius:50%;background:#9aa7bd;display:block;animation:brcb 1.2s ease-in-out infinite}' +
    '.brc-dots i:nth-child(2){animation-delay:.18s}.brc-dots i:nth-child(3){animation-delay:.36s}' +
    '@keyframes brcb{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}' +
    '@media (prefers-reduced-motion:reduce){.brc-dots i{animation:none;opacity:.6}}' +
    '.brc-chips{display:flex;flex-wrap:wrap;gap:6px;align-self:stretch}' +
    '.brc-chips button{border:1px solid rgba(3,15,43,.16);background:#fff;border-radius:999px;padding:7px 12px;font:inherit;font-size:.78rem;cursor:pointer;color:#0E2247;text-align:left;transition:border-color .2s,color .2s}' +
    '.brc-chips button:hover,.brc-chips button:focus-visible{border-color:var(--sea,#0668CD);color:var(--sea,#0668CD)}' +
    '.brc-chips button.wa{background:#25D366;color:#fff;border-color:#25D366}' +
    '.brc-form{display:flex;gap:8px;padding:10px;border-top:1px solid rgba(3,15,43,.1);background:#fff}' +
    '.brc-form input{flex:1;min-width:0;border:1px solid rgba(3,15,43,.16);border-radius:999px;padding:10px 15px;font:inherit;font-size:16px;outline-color:var(--coral,#F7A00A)}' +
    '@media(min-width:721px){.brc-form input{font-size:.88rem}}' +
    '.brc-form button{border:none;border-radius:999px;padding:10px 17px;background:var(--coral,#F7A00A);color:#fff;font-weight:700;cursor:pointer;font-size:.88rem}' +
    '.brc-form button:disabled{opacity:.5;cursor:default}';
  document.head.appendChild(css);

  var bubble = document.createElement('button');
  bubble.className = 'brc-bubble';
  bubble.type = 'button';
  bubble.setAttribute('aria-label', 'Chat with the Batroun Race assistant');
  bubble.setAttribute('aria-expanded', 'false');
  bubble.innerHTML = '💬';

  var panel = document.createElement('div');
  panel.className = 'brc-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Batroun Race assistant');
  panel.innerHTML =
    '<div class="brc-head"><span class="dot"></span>Batroun Race Assistant' +
    '<span class="sp"><button type="button" class="clear" aria-label="Start a new conversation" title="New conversation">⟲</button>' +
    '<button type="button" class="close" aria-label="Close chat" title="Close">✕</button></span></div>' +
    '<div class="brc-msgs" role="log" aria-live="polite" aria-atomic="false"></div>' +
    '<form class="brc-form"><input type="text" placeholder="Ask about the race…" maxlength="500" aria-label="Your question" autocomplete="off"><button type="submit">Send</button></form>';

  document.body.appendChild(bubble);
  document.body.appendChild(panel);

  var msgs = panel.querySelector('.brc-msgs');
  var form = panel.querySelector('.brc-form');
  var input = form.querySelector('input');
  var sendBtn = form.querySelector('button');
  var aiMode = null;   // null = unknown yet
  var faqs = [];
  var history = [];
  try { history = JSON.parse(sessionStorage.getItem('brc-chat') || '[]'); } catch (e) {}

  function esc(t) {
    var d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
  }
  function stripHtml(t) {
    var d = document.createElement('div');
    d.innerHTML = t;
    return d.textContent || '';
  }
  function saveHistory() {
    try { sessionStorage.setItem('brc-chat', JSON.stringify(history.slice(-16))); } catch (e) {}
  }

  // tiny markdown: escape first, then allow **bold**, [text](url), bare URLs,
  // "- " bullets and paragraph breaks. Nothing else gets through.
  function render(text) {
    var lines = esc(String(text)).split(/\n/);
    var out = [], list = null;
    function inline(s) {
      return s
        .replace(/\[([^\]<>]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
        .replace(/(^|[\s(])((?:https?:\/\/)[^\s<)]+[^\s<).,;:!?])/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    }
    lines.forEach(function (raw) {
      var line = raw.trim();
      var b = line.match(/^[-*•]\s+(.*)$/);
      if (b) {
        if (!list) { list = []; }
        list.push('<li>' + inline(b[1]) + '</li>');
        return;
      }
      if (list) { out.push('<ul>' + list.join('') + '</ul>'); list = null; }
      if (line) out.push('<p>' + inline(line) + '</p>');
    });
    if (list) out.push('<ul>' + list.join('') + '</ul>');
    return out.join('') || '<p></p>';
  }

  function bubbleMsg(role, text, opts) {
    opts = opts || {};
    var m = document.createElement('div');
    m.className = 'brc-m ' + (role === 'user' ? 'me' : 'bot');
    if (role === 'user') m.textContent = text;
    else m.innerHTML = opts.raw ? text : render(text);
    msgs.appendChild(m);
    msgs.scrollTop = msgs.scrollHeight;
    return m;
  }

  function typingMsg() {
    return bubbleMsg('assistant', '<span class="brc-dots"><i></i><i></i><i></i></span>', { raw: true });
  }

  function loadFaqs() {
    var apply = function (c) {
      faqs = (c && c.guide && c.guide.faq && c.guide.faq.items) || [];
    };
    if (window.__CMS && window.__CMS.content()) { apply(window.__CMS.content()); return Promise.resolve(); }
    return fetch('/content/site.json', { cache: 'no-cache' })
      .then(function (r) { return r.json(); }).then(apply).catch(function () {});
  }

  // chips: either the FAQ list (FAQ mode / starters) or the model's follow-ups
  function showChips(labels, onPick, withWa) {
    var old = msgs.querySelector('.brc-chips');
    if (old) old.remove();
    if (!labels.length && !withWa) return;
    var wrap = document.createElement('div');
    wrap.className = 'brc-chips';
    labels.forEach(function (label, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.addEventListener('click', function () { onPick(i, label); });
      wrap.appendChild(b);
    });
    if (withWa) {
      var wa = document.createElement('button');
      wa.type = 'button';
      wa.className = 'wa';
      wa.textContent = '💬 WhatsApp us';
      wa.addEventListener('click', function () { window.open(WA, '_blank'); });
      wrap.appendChild(wa);
    }
    msgs.appendChild(wrap);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function faqChips() {
    showChips(faqs.map(function (f) { return stripHtml(f.q); }), answerFaq, true);
  }
  function starterChips() {
    // in AI mode the FAQ questions make good openers, but keep it to four
    showChips(faqs.slice(0, 4).map(function (f) { return stripHtml(f.q); }), function (i, label) {
      ask(label);
    }, true);
  }
  function suggestionChips(list) {
    showChips(list, function (i, label) { ask(label); }, true);
  }

  function answerFaq(i) {
    var f = faqs[i];
    bubbleMsg('user', stripHtml(f.q));
    bubbleMsg('assistant', stripHtml(f.a));
    faqChips();
  }

  // keyword match: score question+answer word overlap with the typed text
  function matchFaq(q) {
    var words = q.toLowerCase().replace(/[^\w؀-ۿ\s]/g, ' ').split(/\s+/).filter(function (w) { return w.length > 2; });
    if (!words.length) return -1;
    var best = -1, bestScore = 0;
    faqs.forEach(function (f, i) {
      var hay = (stripHtml(f.q) + ' ' + stripHtml(f.a)).toLowerCase();
      var score = 0;
      words.forEach(function (w) { if (hay.indexOf(w) > -1) score++; });
      if (score > bestScore) { bestScore = score; best = i; }
    });
    return bestScore >= 1 ? best : -1;
  }

  function paint() {
    msgs.innerHTML = '';
    bubbleMsg('assistant', aiMode ? GREET_AI : GREET_FAQ);
    history.forEach(function (m) { bubbleMsg(m.role, m.content); });
    if (aiMode) { if (!history.length) starterChips(); } else faqChips();
  }

  function detectMode() {
    if (aiMode !== null) return Promise.resolve();
    return fetch('/api/chat')
      .then(function (r) { return r.json(); })
      .then(function (j) { aiMode = !!(j && j.configured); })
      .catch(function () { aiMode = false; });
  }

  function handoff(msg) {
    bubbleMsg('assistant', msg + '\n\nWhatsApp: ' + WA + '\nEmail: ' + EMAIL);
  }

  function askAI(q) {
    history.push({ role: 'user', content: q });
    bubbleMsg('user', q);
    var old = msgs.querySelector('.brc-chips');
    if (old) old.remove();
    var typing = typingMsg();
    sendBtn.disabled = true;

    var ctl = new AbortController();
    var timer = setTimeout(function () { ctl.abort(); }, TIMEOUT);

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history.slice(-10) }),
      signal: ctl.signal
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, status: r.status, j: j }; }); })
      .then(function (res) {
        typing.remove();
        if (!res.ok) {
          var err = (res.j && res.j.error) || 'upstream';
          history.pop();                       // don't keep a turn we never answered
          if (res.status === 429) {
            bubbleMsg('assistant', 'That\'s a lot of questions in a short time 😅 Give me a minute — or ask a human right away on WhatsApp: ' + WA);
            showChips([], null, true);
          } else if (err === 'not_configured') {
            aiMode = false;                    // key went away: drop to FAQ mode
            askFaq(q, true);
          } else {
            fallback(q);
          }
          return;
        }
        history.push({ role: 'assistant', content: res.j.reply });
        saveHistory();
        bubbleMsg('assistant', res.j.reply);
        var s = res.j.suggestions || [];
        if (s.length) suggestionChips(s); else showChips([], null, true);
      })
      .catch(function () {
        typing.remove();
        history.pop();
        fallback(q);
      })
      .then(function () {
        clearTimeout(timer);
        sendBtn.disabled = false;
        input.focus();
      });
  }

  // AI unreachable — try the FAQ before giving up on the visitor
  function fallback(q) {
    var i = matchFaq(q);
    if (i > -1) {
      bubbleMsg('assistant', stripHtml(faqs[i].a));
      showChips([], null, true);
    } else {
      handoff('I can\'t reach my answers right now — but a human can help straight away.');
    }
  }

  function askFaq(q, skipEcho) {
    if (!skipEcho) bubbleMsg('user', q);
    var i = matchFaq(q);
    if (i > -1) bubbleMsg('assistant', stripHtml(faqs[i].a));
    else handoff('Good question — a human can answer that best!');
    faqChips();
  }

  function ask(q) {
    if (aiMode) askAI(q); else askFaq(q);
  }

  bubble.addEventListener('click', function () {
    var open = panel.classList.toggle('open');
    bubble.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      Promise.all([detectMode(), loadFaqs()]).then(function () {
        paint();
        input.focus();
      });
    }
  });
  function close() {
    panel.classList.remove('open');
    bubble.setAttribute('aria-expanded', 'false');
    bubble.focus();
  }
  panel.querySelector('.brc-head .close').addEventListener('click', close);
  panel.querySelector('.brc-head .clear').addEventListener('click', function () {
    history = [];
    saveHistory();
    paint();
    input.focus();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) close();
  });

  /* The homepage opens on a full-bleed banner; a chat bubble parked on top of
     it is just clutter over the poster. Hold it back until the visitor has
     scrolled past the banner, then let it fade in. Other pages keep it always. */
  function hideOverBanner() {
    if (!document.getElementById('promoSec')) return;   // no banner on this page
    var stage = null;
    bubble.classList.add('brc-away');
    function update() {
      if (panel.classList.contains('open')) { bubble.classList.remove('brc-away'); return; }
      stage = stage || document.querySelector('.promo-top');
      if (!stage) { bubble.classList.remove('brc-away'); return; }
      var past = stage.getBoundingClientRect().bottom <= window.innerHeight * 0.55;
      bubble.classList.toggle('brc-away', !past);
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    // the banner is rendered by cms.js, so re-check once it has landed
    setTimeout(update, 300);
    setTimeout(update, 1500);
    update();
  }
  hideOverBanner();

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var q = input.value.trim();
    if (!q || sendBtn.disabled) return;
    input.value = '';
    ask(q);
  });
})();
