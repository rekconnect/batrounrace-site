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
    '.cms-hint{position:fixed;left:12px;bottom:12px;z-index:9999;background:#030F2B;color:#F4F7FC;font:12px monospace;padding:8px 14px;border-radius:999px;opacity:.9;pointer-events:none}';
  document.head.appendChild(css);

  var hint = document.createElement('div');
  hint.className = 'cms-hint';
  hint.textContent = 'EDIT MODE — click any text to change it';
  document.body.appendChild(hint);

  // ---------- sync with parent admin ----------
  window.addEventListener('message', function (e) {
    var d = e.data || {};
    if (d.type === 'cms-sync' && d.content) CMS.apply(d.content);
  });
  send({ type: 'cms-hello', page: location.pathname });

  // ---------- inline text editing ----------
  var editing = null, original = '';

  function startEdit(el) {
    if (editing === el) return;
    stopEdit(true);
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
    if (editing && !editing.contains(e.target)) stopEdit(true);
  }, true);
  // leaving the iframe (e.g. to press Save & publish) commits too
  window.addEventListener('blur', function () { stopEdit(true); });
  document.addEventListener('keydown', function (e) {
    if (editing && e.key === 'Escape') { e.preventDefault(); stopEdit(false); }
  });

  // ---------- click routing ----------
  document.addEventListener('click', function (e) {
    if (e.target.closest('.cms-bar')) return;
    var ed = e.target.closest('[data-cms]');
    if (ed) { e.preventDefault(); e.stopPropagation(); startEdit(ed); return; }
    var a = e.target.closest('a');
    if (a) {
      e.preventDefault();
      var href = a.getAttribute('href') || '';
      // navigate between our own pages inside the editor; block external links
      if (href && !/^(https?:|mailto:|tel:|#)/.test(href)) {
        location.href = href.split('#')[0] + '?edit=1';
      }
    }
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
