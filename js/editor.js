// Visual edit mode — loaded by cms.js when the page runs inside the /admin
// visual editor (?edit=1). Click any tagged text to edit it in place; list
// sections get floating add/remove/reorder controls. Every change is posted
// to the parent admin window, which owns Save & publish.
(function () {
  var CMS = window.__CMS;
  function C() { return CMS.content(); }
  function get(o, p) { return CMS.get(o, p); }
  function set(p, v) {
    var ks = p.split('.'), last = ks.pop();
    ks.reduce(function (a, k) { return a[k]; }, C())[last] = v;
  }
  function send(m) { try { parent.postMessage(m, '*'); } catch (e) {} }

  // ---------- styles ----------
  var css = document.createElement('style');
  css.textContent =
    '[data-cms]{outline:1px dashed rgba(247,160,10,.55);outline-offset:2px;cursor:text;min-height:.8em}' +
    '[data-cms]:hover{outline:2px solid rgba(247,160,10,.9)}' +
    '[data-cms].cms-editing{outline:2px solid #0668CD;background:rgba(6,104,205,.06)}' +
    '[data-cms-list]{outline:1px dashed rgba(6,104,205,.4);outline-offset:6px}' +
    '.cms-bar{position:absolute;z-index:9999;display:flex;gap:4px;font-family:monospace}' +
    '.cms-bar button{border:none;border-radius:6px;padding:4px 10px;font-size:12px;cursor:pointer;background:#030F2B;color:#fff;box-shadow:0 4px 12px rgba(0,0,0,.3)}' +
    '.cms-bar button:hover{background:#0668CD}' +
    '.cms-bar button.cms-del:hover{background:#c0392b}' +
    '.cms-hint{position:fixed;left:12px;bottom:12px;z-index:9999;background:#030F2B;color:#F4F7FC;font:12px monospace;padding:8px 14px;border-radius:999px;opacity:.9;pointer-events:none}' +
    '.cms-linkbtn{border:none;border-radius:6px;padding:4px 10px;font:12px monospace;cursor:pointer;background:#0668CD;color:#fff;box-shadow:0 4px 12px rgba(0,0,0,.3)}' +
    '.cms-linkbtn:hover{background:#030F2B}' +
    '.cms-linkpanel{position:absolute;z-index:10000;background:#030F2B;color:#F4F7FC;border-radius:10px;padding:10px;box-shadow:0 12px 32px rgba(0,0,0,.4);font:12px monospace;width:230px}' +
    '.cms-linkpanel .ttl{font-size:10px;letter-spacing:.1em;text-transform:uppercase;opacity:.6;margin:6px 0 4px}' +
    '.cms-linkpanel button{display:block;width:100%;text-align:left;border:none;background:none;color:#F4F7FC;font:inherit;padding:5px 8px;border-radius:6px;cursor:pointer}' +
    '.cms-linkpanel button:hover{background:#0668CD}' +
    '.cms-linkpanel button.cur{background:rgba(6,104,205,.45)}' +
    '.cms-linkpanel input{width:100%;border:none;border-radius:6px;padding:6px 8px;font:inherit;margin-top:4px;box-sizing:border-box}' +
    '.cms-linkpanel .apply{background:#F7A00A;color:#fff;text-align:center;margin-top:6px}' +
    '.cms-linkpanel .apply:hover{background:#DE8E05}';
  document.head.appendChild(css);

  var hint = document.createElement('div');
  hint.className = 'cms-hint';
  hint.textContent = 'EDIT MODE — click text to change it · 🔗 to change links';
  document.body.appendChild(hint);

  // ---------- sync with parent admin ----------
  window.addEventListener('message', function (e) {
    var d = e.data || {};
    if (d.type === 'cms-sync' && d.content) CMS.apply(d.content);
  });
  send({ type: 'cms-hello', page: location.pathname });

  // ---------- link editing / opening ----------
  var linkWrap = document.createElement('div');
  linkWrap.className = 'cms-linkbar';
  linkWrap.style.cssText = 'position:absolute;z-index:9999;display:none;gap:4px';
  var linkBtn = document.createElement('button');
  linkBtn.type = 'button';
  linkBtn.className = 'cms-linkbtn';
  linkBtn.textContent = '🔗 Link';
  var openBtn = document.createElement('button');
  openBtn.type = 'button';
  openBtn.className = 'cms-linkbtn';
  openBtn.textContent = '↗ Open';
  linkWrap.appendChild(linkBtn);
  linkWrap.appendChild(openBtn);
  document.body.appendChild(linkWrap);
  var linkTarget = null; // {path|null, a}

  // where an element's link lives in the JSON, if anywhere
  function linkPathFor(el) {
    var a = el.closest('a');
    if (!a) return null;
    if (a.hasAttribute('data-cms-href')) return { path: a.getAttribute('data-cms-href'), a: a };
    var container = a.closest('[data-cms-list]');
    if (container) {
      var spec = listSpec(container);
      var field = { btns: 'href', chancards: 'href', rescards: 'href', partnerchips: 'href', wall: 'link' }[spec.type];
      if (!field) return null;
      var item = a;
      while (item && item.parentElement !== container) item = item.parentElement;
      var idx = item ? Array.prototype.indexOf.call(container.children, item) : -1;
      if (idx < 0) return null;
      return { path: spec.path + '.' + idx + '.' + field, a: a };
    }
    return null;
  }
  function showLinkBtn(el) {
    var a = el.closest('a');
    if (!a || !a.getAttribute('href')) { hideLinkBtn(); return; }
    var found = linkPathFor(el);
    linkTarget = found || { path: null, a: a };
    linkBtn.style.display = found ? 'block' : 'none';
    var r = el.getBoundingClientRect();
    linkWrap.style.display = 'flex';
    linkWrap.style.left = (r.left + window.scrollX) + 'px';
    linkWrap.style.top = (r.bottom + window.scrollY + 6) + 'px';
  }
  function hideLinkBtn() {
    linkWrap.style.display = 'none';
    linkTarget = null;
    var p = document.querySelector('.cms-linkpanel');
    if (p) p.style.display = 'none';
  }
  linkWrap.addEventListener('mousedown', function (e) { e.preventDefault(); e.stopPropagation(); });

  // page picker panel for the Link chip
  var PAGES = [
    ['Homepage', 'index.html'], ['About', 'about.html'], ['Contact', 'contact.html'],
    ['Sponsors', 'sponsors.html'], ['Packages & pricing', 'sponsor-packages.html'],
    ['Results 2025', 'results-2025.html']
  ];
  var COMMON = [
    ['Registration site', 'https://register.batrounrace.com/'],
    ['2026 results', 'https://register.batrounrace.com/results'],
    ['WhatsApp', 'https://wa.me/96181300625'],
    ['Email', 'mailto:Batrounrace@gmail.com']
  ];
  var panel = document.createElement('div');
  panel.className = 'cms-linkpanel';
  panel.style.display = 'none';
  document.body.appendChild(panel);
  panel.addEventListener('mousedown', function (e) {
    e.stopPropagation();
    // keep focus where it is for buttons; the input needs focus to type
    if (e.target.tagName !== 'INPUT') e.preventDefault();
  });

  function applyLink(v) {
    if (!linkTarget || !linkTarget.path) return;
    set(linkTarget.path, v);
    linkTarget.a.setAttribute('href', v);
    send({ type: 'cms-edit', path: linkTarget.path, value: v });
    panel.style.display = 'none';
  }
  function openPanel() {
    if (!linkTarget || !linkTarget.path) return;
    var cur = get(C(), linkTarget.path) || '';
    panel.innerHTML = '';
    function group(title, items) {
      var t = document.createElement('div'); t.className = 'ttl'; t.textContent = title; panel.appendChild(t);
      items.forEach(function (it) {
        var b = document.createElement('button');
        b.type = 'button'; b.textContent = it[0];
        if (it[1] === cur) b.className = 'cur';
        b.addEventListener('click', function (e) { e.stopPropagation(); applyLink(it[1]); });
        panel.appendChild(b);
      });
    }
    group('Pages', PAGES);
    group('Common', COMMON);
    var t = document.createElement('div'); t.className = 'ttl'; t.textContent = 'Custom URL'; panel.appendChild(t);
    var inp = document.createElement('input'); inp.value = cur; panel.appendChild(inp);
    var ok = document.createElement('button'); ok.type = 'button'; ok.className = 'apply'; ok.textContent = 'Set link';
    ok.addEventListener('click', function (e) { e.stopPropagation(); applyLink(inp.value.trim()); });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') applyLink(inp.value.trim()); });
    panel.appendChild(ok);
    var r = linkWrap.getBoundingClientRect();
    panel.style.display = 'block';
    panel.style.left = (r.left + window.scrollX) + 'px';
    panel.style.top = (r.bottom + window.scrollY + 4) + 'px';
  }
  linkBtn.addEventListener('click', function (e) {
    e.preventDefault(); e.stopPropagation();
    if (panel.style.display === 'block') { panel.style.display = 'none'; return; }
    openPanel();
  });
  openBtn.addEventListener('click', function (e) {
    e.preventDefault(); e.stopPropagation();
    if (!linkTarget) return;
    var href = linkTarget.a.getAttribute('href') || '';
    if (!href) return;
    if (/^(https?:|mailto:|tel:)/.test(href)) {
      window.open(href, '_blank');           // external → new tab
    } else if (href.charAt(0) === '#') {
      location.hash = href;                  // same-page anchor
    } else {
      location.href = href.split('#')[0] + '?edit=1';  // our page → stay in editor
    }
    hideLinkBtn();
  });

  // ---------- inline text editing ----------
  var editing = null, original = '';

  function startEdit(el) {
    if (editing === el) return;
    stopEdit(true);
    showLinkBtn(el);
    editing = el; original = el.innerHTML;
    el.classList.add('cms-editing');
    el.setAttribute('contenteditable', 'true');
    el.focus();
    // put the text cursor inside and select the content, so typing replaces it
    try {
      var r = document.createRange();
      r.selectNodeContents(el);
      var s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
    } catch (e) {}
  }
  function stopEdit(save) {
    if (!editing) return;
    var el = editing; editing = null;
    el.removeAttribute('contenteditable');
    el.classList.remove('cms-editing');
    if (!save) { el.innerHTML = original; return; }
    var v = el.innerHTML.trim();
    if (v === original.trim()) return;
    var path = el.getAttribute('data-cms');
    set(path, v);
    send({ type: 'cms-edit', path: path, value: v });
  }
  document.addEventListener('focusout', function (e) {
    if (editing && e.target === editing) setTimeout(function () { stopEdit(true); }, 0);
  });
  // clicking anywhere outside the edited element commits the edit
  document.addEventListener('mousedown', function (e) {
    if (e.target.closest('.cms-linkbar') || e.target.closest('.cms-linkpanel')) return;
    if (editing && !editing.contains(e.target)) stopEdit(true);
    // clicking outside any link UI and outside a link closes the link UI
    if (!e.target.closest('a')) hideLinkBtn();
  }, true);
  // leaving the iframe (e.g. to press Save & publish) commits too
  window.addEventListener('blur', function () { stopEdit(true); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (editing) { e.preventDefault(); stopEdit(false); }
      hideLinkBtn();
    }
  });

  // ---------- click routing ----------
  document.addEventListener('click', function (e) {
    if (e.target.closest('.cms-bar') || e.target.closest('.cms-linkbar') || e.target.closest('.cms-linkpanel')) return;
    var ed = e.target.closest('[data-cms]');
    if (ed) { e.preventDefault(); e.stopPropagation(); startEdit(ed); return; }
    var a = e.target.closest('a');
    if (a) {
      e.preventDefault();
      var href = a.getAttribute('href') || '';
      // only the header menu navigates inside the editor; content links
      // never navigate — they offer link editing instead
      if (a.closest('header') && href && !/^(https?:|mailto:|tel:|#)/.test(href)) {
        location.href = href.split('#')[0] + '?edit=1';
      } else {
        showLinkBtn(a);
      }
      return;
    }
    hideLinkBtn();
  }, true);

  // ---------- list controls ----------
  var bar = document.createElement('div');
  bar.className = 'cms-bar';
  bar.style.display = 'none';
  document.body.appendChild(bar);
  var barTarget = null; // {container, index} — index null = container-level

  function listSpec(container) {
    var s = container.getAttribute('data-cms-list').split(':');
    return { type: s[0], path: s[1] };
  }
  function rerender(container) {
    var spec = listSpec(container);
    container.innerHTML = CMS.renderers[spec.type](get(C(), spec.path), spec.path);
    send({ type: 'cms-list', path: spec.path, value: get(C(), spec.path) });
  }
  var hideTimer = null;
  function scheduleHide() { clearTimeout(hideTimer); hideTimer = setTimeout(hideBar, 400); }
  function cancelHide() { clearTimeout(hideTimer); }

  function showBar(forEl) {
    var container = forEl.closest('[data-cms-list]');
    if (!container) return;
    var item = forEl === container ? null : forEl;
    while (item && item.parentElement !== container) item = item.parentElement;
    var index = item ? Array.prototype.indexOf.call(container.children, item) : null;
    cancelHide();
    // same target → keep the existing bar (no flicker while moving inside the item)
    if (barTarget && barTarget.container === container && barTarget.index === index && bar.style.display !== 'none') return;
    barTarget = { container: container, index: index };
    var arr = get(C(), listSpec(container).path);
    bar.innerHTML = '';
    function btn(txt, cls, fn) {
      var b = document.createElement('button');
      b.textContent = txt; if (cls) b.className = cls;
      b.addEventListener('click', function (ev) { ev.preventDefault(); ev.stopPropagation(); fn(); });
      bar.appendChild(b);
    }
    if (index !== null) {
      if (index > 0) btn('↑', '', function () { arr.splice(index - 1, 0, arr.splice(index, 1)[0]); rerender(container); hideBar(); });
      if (index < arr.length - 1) btn('↓', '', function () { arr.splice(index + 1, 0, arr.splice(index, 1)[0]); rerender(container); hideBar(); });
      btn('✕ Remove', 'cms-del', function () {
        if (confirm('Remove this item?')) { arr.splice(index, 1); rerender(container); hideBar(); }
      });
    }
    btn('＋ Add', '', function () {
      var model = arr.length ? arr[arr.length - 1] : '';
      arr.push(typeof model === 'string' ? 'New item' : JSON.parse(JSON.stringify(model)));
      rerender(container); hideBar();
    });
    var anchor = (item || container).getBoundingClientRect();
    bar.style.display = 'flex';
    // overlap the item's top edge so the mouse never crosses a gap to reach it
    bar.style.left = Math.max(6, anchor.left + window.scrollX + 6) + 'px';
    bar.style.top = Math.max(6, anchor.top + window.scrollY - 13) + 'px';
  }
  function hideBar() { clearTimeout(hideTimer); bar.style.display = 'none'; barTarget = null; }

  document.addEventListener('mouseover', function (e) {
    if (e.target.closest('.cms-bar')) { cancelHide(); return; }
    var inList = e.target.closest('[data-cms-list]');
    if (inList) showBar(e.target); else scheduleHide();
  });
})();
