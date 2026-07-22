// Batroun Race floating AI assistant widget. Self-contained: injects its own
// styles and DOM. Talks to /api/chat (Claude, grounded in site content).
(function () {
  if (/[?&]edit=1/.test(location.search)) return; // stay out of the visual editor

  var WA = 'https://wa.me/message/IJ45O3ILIUGMF1';
  var GREETING = 'Marhaba! 👋 I\'m the Batroun Race assistant. Ask me about distances, registration, the route, results, or sponsorship — English, العربية, or français.';

  var css = document.createElement('style');
  css.textContent =
    '.brc-bubble{position:fixed;right:18px;bottom:18px;z-index:80;width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;background:var(--ink,#030F2B);color:#fff;font-size:1.45rem;box-shadow:0 12px 30px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;transition:transform .2s ease-out,background .2s}' +
    '.brc-bubble:hover{transform:translateY(-3px);background:var(--sea,#0668CD)}' +
    '@media(max-width:720px){.brc-bubble{bottom:78px}}' +
    '.brc-panel{position:fixed;right:18px;bottom:84px;z-index:90;width:min(360px,calc(100vw - 36px));height:min(480px,calc(100vh - 140px));background:#fff;border:1px solid rgba(3,15,43,.14);border-radius:16px;box-shadow:0 24px 60px rgba(0,0,0,.35);display:none;flex-direction:column;overflow:hidden;font-family:var(--body,sans-serif)}' +
    '@media(max-width:720px){.brc-panel{bottom:144px}}' +
    '.brc-panel.open{display:flex}' +
    '.brc-head{background:var(--ink,#030F2B);color:#F4F7FC;padding:13px 16px;display:flex;align-items:center;gap:9px;font-weight:700;font-size:.92rem}' +
    '.brc-head .dot{width:9px;height:9px;border-radius:50%;background:var(--coral,#F7A00A)}' +
    '.brc-head button{margin-left:auto;background:none;border:none;color:#F4F7FC;font-size:1rem;cursor:pointer;opacity:.8}' +
    '.brc-head button:hover{opacity:1}' +
    '.brc-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:9px;background:#F4F7FC}' +
    '.brc-m{max-width:85%;padding:9px 13px;border-radius:14px;font-size:.88rem;line-height:1.45;white-space:pre-wrap;word-break:break-word}' +
    '.brc-m.bot{background:#fff;border:1px solid rgba(3,15,43,.1);align-self:flex-start;border-bottom-left-radius:4px;color:#0E2247}' +
    '.brc-m.me{background:var(--sea,#0668CD);color:#fff;align-self:flex-end;border-bottom-right-radius:4px}' +
    '.brc-m a{color:var(--sea,#0668CD);word-break:break-all}' +
    '.brc-m.me a{color:#fff}' +
    '.brc-m.typing{color:#9aa7bd;font-style:italic}' +
    '.brc-form{display:flex;gap:8px;padding:10px;border-top:1px solid rgba(3,15,43,.1);background:#fff}' +
    '.brc-form input{flex:1;border:1px solid rgba(3,15,43,.16);border-radius:999px;padding:10px 15px;font:inherit;font-size:.88rem;outline-color:var(--coral,#F7A00A)}' +
    '.brc-form button{border:none;border-radius:999px;padding:10px 17px;background:var(--coral,#F7A00A);color:#fff;font-weight:700;cursor:pointer;font-size:.88rem}' +
    '.brc-form button:disabled{opacity:.5}';
  document.head.appendChild(css);

  var bubble = document.createElement('button');
  bubble.className = 'brc-bubble';
  bubble.type = 'button';
  bubble.setAttribute('aria-label', 'Chat with the Batroun Race assistant');
  bubble.innerHTML = '💬';

  var panel = document.createElement('div');
  panel.className = 'brc-panel';
  panel.innerHTML =
    '<div class="brc-head"><span class="dot"></span>Batroun Race Assistant<button type="button" aria-label="Close chat">✕</button></div>' +
    '<div class="brc-msgs"></div>' +
    '<form class="brc-form"><input type="text" placeholder="Ask about the race…" maxlength="500" aria-label="Your question"><button type="submit">Send</button></form>';

  document.body.appendChild(bubble);
  document.body.appendChild(panel);

  var msgs = panel.querySelector('.brc-msgs');
  var form = panel.querySelector('.brc-form');
  var input = form.querySelector('input');
  var sendBtn = form.querySelector('button');
  var history = [];
  try { history = JSON.parse(sessionStorage.getItem('brc-chat') || '[]'); } catch (e) {}

  function esc(t) {
    var d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
  }
  function linkify(t) {
    return esc(t).replace(/(https?:\/\/[^\s<)]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  }
  function bubbleMsg(role, text, typing) {
    var m = document.createElement('div');
    m.className = 'brc-m ' + (role === 'user' ? 'me' : 'bot') + (typing ? ' typing' : '');
    m.innerHTML = linkify(text);
    msgs.appendChild(m);
    msgs.scrollTop = msgs.scrollHeight;
    return m;
  }
  function render() {
    msgs.innerHTML = '';
    bubbleMsg('assistant', GREETING);
    history.forEach(function (m) { bubbleMsg(m.role, m.content); });
  }

  bubble.addEventListener('click', function () {
    var open = panel.classList.toggle('open');
    if (open) { render(); input.focus(); }
  });
  panel.querySelector('.brc-head button').addEventListener('click', function () {
    panel.classList.remove('open');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var q = input.value.trim();
    if (!q || sendBtn.disabled) return;
    input.value = '';
    history.push({ role: 'user', content: q });
    bubbleMsg('user', q);
    var typing = bubbleMsg('assistant', 'typing…', true);
    sendBtn.disabled = true;
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history.slice(-10) })
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        typing.remove();
        if (!res.ok) throw new Error(res.j && res.j.error);
        history.push({ role: 'assistant', content: res.j.reply });
        try { sessionStorage.setItem('brc-chat', JSON.stringify(history.slice(-16))); } catch (e) {}
        bubbleMsg('assistant', res.j.reply);
      })
      .catch(function () {
        typing.remove();
        bubbleMsg('assistant', 'Sorry — I can\'t answer right now. A human can! Message us on WhatsApp: ' + WA);
      })
      .then(function () { sendBtn.disabled = false; input.focus(); });
  });
})();
