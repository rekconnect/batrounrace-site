// Batroun Race CMS hydration — loads content/site.json and fills the page.
// Elements opt in via data-cms (text/HTML), data-cms-href (link), or
// data-cms-list="type:path" (container re-rendered from a JSON array).
// Rendered list items carry indexed data-cms paths so the visual editor
// can edit their text in place too.
// With ?edit=1 (inside the /admin visual editor) js/editor.js is loaded.
(function () {
  function get(obj, path) {
    return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, obj);
  }

  var C; // site content

  var renderers = {
    btns: function (items, p) {
      return items.map(function (b, i) {
        return '<a class="btn btn-' + (b.style || 'coral') + '" href="' + b.href + '" data-cms="' + p + '.' + i + '.label">' + b.label + '</a>';
      }).join('');
    },
    meta: function (items, p) {
      return items.map(function (m, i) {
        return '<div><b data-cms="' + p + '.' + i + '.b">' + m.b + '</b><span data-cms="' + p + '.' + i + '.label">' + m.label + '</span></div>';
      }).join('');
    },
    cards: function (items, p) {
      return items.map(function (c, i) {
        return '<div class="card reveal in"><span class="tag" data-cms="' + p + '.' + i + '.tag">' + c.tag + '</span><h3 data-cms="' + p + '.' + i + '.h3">' + c.h3 + '</h3><p data-cms="' + p + '.' + i + '.p">' + c.p + '</p></div>';
      }).join('');
    },
    flow: function (items, p) {
      return items.map(function (s, i) {
        return '<div class="flow-step reveal in"><span class="t" data-cms="' + p + '.' + i + '.t">' + s.t + '</span><h3 data-cms="' + p + '.' + i + '.h3">' + s.h3 + '</h3><p data-cms="' + p + '.' + i + '.p">' + s.p + '</p></div>';
      }).join('');
    },
    rescards: function (items, p) {
      return items.map(function (c, i) {
        return '<a class="res-card reveal in" href="' + c.href + '"><div class="yr" data-cms="' + p + '.' + i + '.yr">' + c.yr + '</div><h3 data-cms="' + p + '.' + i + '.h3">' + c.h3 + '</h3><p data-cms="' + p + '.' + i + '.p">' + c.p + '</p><div class="go" data-cms="' + p + '.' + i + '.go">' + c.go + '</div></a>';
      }).join('');
    },
    chips: function (items, p) {
      return items.map(function (t, i) {
        return '<span class="spon-chip" data-cms="' + p + '.' + i + '">' + t + '</span>';
      }).join('');
    },
    partnerchips: function (items, p) {
      return items.map(function (c, i) {
        var inner = '<span data-cms="' + p + '.' + i + '.label">' + c.label + '</span>';
        return c.href
          ? '<a class="spon-chip" href="' + c.href + '">' + inner + '</a>'
          : '<span class="spon-chip">' + inner + '</span>';
      }).join('');
    },
    tags: function (items, p) {
      return items.map(function (t, i) { return '<span data-cms="' + p + '.' + i + '">' + t + '</span>'; }).join('');
    },
    teaser: function (items, p) {
      return items.map(function (t, i) { return '<li data-cms="' + p + '.' + i + '">' + t + '</li>'; }).join('');
    },
    chancards: function (items, p) {
      return items.map(function (c, i) {
        return '<a class="card reveal in" href="' + c.href + '"><span class="tag" data-cms="' + p + '.' + i + '.tag">' + c.tag + '</span><h3 data-cms="' + p + '.' + i + '.h3">' + c.h3 + '</h3><p class="val" data-cms="' + p + '.' + i + '.val">' + c.val + '</p><div class="go" data-cms="' + p + '.' + i + '.go">' + c.go + '</div></a>';
      }).join('');
    },
    faq: function (items, p) {
      return items.map(function (f, i) {
        return '<div class="faq-item reveal in"><h3 data-cms="' + p + '.' + i + '.q">' + f.q + '</h3><p data-cms="' + p + '.' + i + '.a">' + f.a + '</p></div>';
      }).join('');
    },
    wall: function (items, p) {
      return items.map(function (s, i) {
        var img = '<img src="images/sponsors/' + s.slug + '.png" alt="' + s.name + '" onerror="this.parentElement.classList.add(\'nologo\')">' +
                  '<span class="name" data-cms="' + p + '.' + i + '.name">' + s.name + '</span>';
        return s.link
          ? '<a class="logo-tile" href="' + s.link + '">' + img + '</a>'
          : '<div class="logo-tile">' + img + '</div>';
      }).join('');
    },
    pkg: function (items, p) {
      return items.map(function (pk, i) {
        var badge = pk.highlight && pk.badge ? '<span class="pkg-badge" data-cms="' + p + '.' + i + '.badge">' + pk.badge + '</span>' : '';
        return '<div class="pkg reveal in' + (pk.highlight ? ' hot' : '') + '">' + badge +
          '<div class="name" data-cms="' + p + '.' + i + '.name">' + pk.name + '</div>' +
          '<div class="price" data-cms="' + p + '.' + i + '.price">' + pk.price + '</div>' +
          '<div class="for" data-cms="' + p + '.' + i + '.tagline">' + pk.tagline + '</div>' +
          '<ul>' + pk.features.map(function (f, j) { return '<li data-cms="' + p + '.' + i + '.features.' + j + '">' + f + '</li>'; }).join('') + '</ul>' +
          '<a class="pick" href="mailto:' + get(C, 'global.email') + '?subject=' + encodeURIComponent(pk.mailto_subject || '') + '" data-cms="' + p + '.' + i + '.cta">' + pk.cta + '</a></div>';
      }).join('');
    },
    decide: function (items, p) {
      return items.map(function (r, i) {
        return '<div class="decide-row"><span class="goal" data-cms="' + p + '.' + i + '.goal">' + r.goal + '</span><span class="pkg-name" data-cms="' + p + '.' + i + '.pkg">' + r.pkg + '</span></div>';
      }).join('');
    },
    podium: function (items, p) {
      return items.map(function (c, i) {
        var img = c.img ? '<img src="' + c.img + '" alt="' + c.cat + ' podium winners, Batroun Race 2025" onerror="this.style.display=\'none\'">' : '';
        var rows = c.rows.map(function (r, j) {
          var rp = p + '.' + i + '.rows.' + j;
          return '<li><span class="pos" data-cms="' + rp + '.pos">' + r.pos + '</span><span class="nm" data-cms="' + rp + '.name">' + r.name + '</span><span class="meta" data-cms="' + rp + '.meta">' + r.meta + '</span></li>';
        }).join('');
        return '<div class="pod-card reveal in">' + img + '<div class="body"><div class="cat" data-cms="' + p + '.' + i + '.cat">' + c.cat + '</div><ol>' + rows + '</ol></div></div>';
      }).join('');
    },
    slides: function (items, p) {
      return items.map(function (s, i) {
        return '<div class="slide' + (i === 0 ? ' on' : '') + '">' +
          '<img class="bg" src="' + s.img + '" alt="" aria-hidden="true" onerror="this.style.display=\'none\'">' +
          '<img class="fg" src="' + s.img + '" alt="' + (s.alt || '') + '" onerror="this.style.display=\'none\'" onload="if(this.naturalWidth/this.naturalHeight>1.35)this.classList.add(\'wide\')"></div>';
      }).join('');
    },
    storycards: function (items, p) {
      return items.map(function (c, i) {
        return '<div class="story-card reveal in"><img src="' + c.img + '" alt="' + c.alt + '" onerror="this.style.display=\'none\'">' +
          '<div class="body"><span class="tag" data-cms="' + p + '.' + i + '.tag">' + c.tag + '</span><h3 data-cms="' + p + '.' + i + '.h3">' + c.h3 + '</h3><p data-cms="' + p + '.' + i + '.p">' + c.p + '</p></div></div>';
      }).join('');
    }
  };

  function apply(data) {
    C = data;
    // lists first, so the indexed data-cms nodes they generate get skipped
    // cleanly by the pass below (their values are already fresh)
    document.querySelectorAll('[data-cms-list]').forEach(function (el) {
      var spec = el.getAttribute('data-cms-list').split(':');
      var fn = renderers[spec[0]];
      var items = get(C, spec[1]);
      if (fn && Array.isArray(items)) el.innerHTML = fn(items, spec[1]);
    });
    document.querySelectorAll('[data-cms]').forEach(function (el) {
      var v = get(C, el.getAttribute('data-cms'));
      if (typeof v === 'string') el.innerHTML = v;
    });
    document.querySelectorAll('[data-cms-href]').forEach(function (el) {
      var v = get(C, el.getAttribute('data-cms-href'));
      if (typeof v === 'string' && v) el.setAttribute('href', v);
    });
    initSliders();
    initCountdown();
  }

  function initCountdown() {
    var el = document.getElementById('raceNext');
    if (!el) return;
    var race = get(C, 'global.race') || {};
    if (el._timer) clearInterval(el._timer);
    var when = race.date ? new Date(race.date + (race.time ? 'T' + race.time : 'T07:00')) : null;
    if (!when || isNaN(when) || when < new Date()) {
      if (race.tba_text) {
        el.hidden = false;
        el.innerHTML = '<span class="rn-what">' + (race.edition_label || 'Next edition') + '</span>' +
          '<span class="rn-when">' + race.tba_text + '</span>';
      } else {
        el.hidden = true;
      }
      return;
    }
    var dateStr = when.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    el.hidden = false;
    el.innerHTML = '<span class="rn-what">' + (race.edition_label || 'Next edition') + '</span>' +
      '<span class="rn-when">' + dateStr + (race.time ? ' · ' + race.time : '') + (race.location ? ' · ' + race.location : '') + '</span>' +
      '<div class="rn-boxes">' + ['Days', 'Hours', 'Min', 'Sec'].map(function (l) {
        return '<div class="rn-box"><b>–</b><span>' + l + '</span></div>';
      }).join('') + '</div>';
    var boxes = el.querySelectorAll('.rn-box b');
    function tick() {
      var ms = when - new Date();
      if (ms < 0) { clearInterval(el._timer); return; }
      var d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4), s = Math.floor(ms % 6e4 / 1e3);
      [d, h, m, s].forEach(function (v, i) { boxes[i].textContent = v; });
    }
    tick();
    el._timer = setInterval(tick, 1000);
    // structured data for Google (event rich results)
    var old = document.getElementById('event-jsonld');
    if (old) old.remove();
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.id = 'event-jsonld';
    s.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      name: 'Batroun Race',
      sport: 'Running',
      startDate: race.date + (race.time ? 'T' + race.time : ''),
      location: { '@type': 'Place', name: race.location || 'Batroun, Lebanon', address: 'Batroun, Lebanon' },
      url: 'https://batrounrace.com/',
      organizer: { '@type': 'Organization', name: 'Batroun Race', url: 'https://batrounrace.com/' }
    });
    document.head.appendChild(s);
  }

  function initSliders() {
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var edit = /[?&]edit=1/.test(location.search);
    document.querySelectorAll('.hero-slider').forEach(function (slider) {
      var wrap = slider.parentElement;
      // rebuild controls fresh on every (re)hydration
      wrap.querySelectorAll('.sl-btn,.sl-dots').forEach(function (n) { n.remove(); });
      if (slider._timer) clearInterval(slider._timer);
      var slides = slider.querySelectorAll('.slide');
      if (slides.length < 2) return;
      var cur = 0;
      var dots = document.createElement('div');
      dots.className = 'sl-dots';
      slides.forEach(function (_, i) {
        var d = document.createElement('button');
        d.type = 'button';
        d.setAttribute('aria-label', 'Photo ' + (i + 1));
        if (i === 0) d.className = 'on';
        d.addEventListener('click', function () { go(i); restart(); });
        dots.appendChild(d);
      });
      function btn(cls, txt, delta) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'sl-btn ' + cls;
        b.innerHTML = txt;
        b.setAttribute('aria-label', delta > 0 ? 'Next photo' : 'Previous photo');
        b.addEventListener('click', function () { go(cur + delta); restart(); });
        wrap.appendChild(b);
      }
      btn('prev', '‹', -1); btn('next', '›', 1);
      wrap.appendChild(dots);
      function go(i) {
        cur = (i + slides.length) % slides.length;
        slides.forEach(function (s, j) { s.classList.toggle('on', j === cur); });
        dots.querySelectorAll('button').forEach(function (d, j) { d.classList.toggle('on', j === cur); });
      }
      function restart() {
        if (slider._timer) clearInterval(slider._timer);
        if (!reduce && !edit) slider._timer = setInterval(function () { go(cur + 1); }, 5000);
      }
      // pause on hover, resume on leave
      wrap.addEventListener('mouseenter', function () { if (slider._timer) clearInterval(slider._timer); });
      wrap.addEventListener('mouseleave', restart);
      // swipe
      var sx = null;
      wrap.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
      wrap.addEventListener('touchend', function (e) {
        if (sx === null) return;
        var dx = e.changedTouches[0].clientX - sx;
        if (Math.abs(dx) > 40) { go(cur + (dx < 0 ? 1 : -1)); restart(); }
        sx = null;
      }, { passive: true });
      restart();
    });
  }

  // shared handle for the visual editor
  window.__CMS = {
    get: get,
    apply: apply,
    renderers: renderers,
    content: function () { return C; }
  };

  var EDIT = /[?&]edit=1/.test(location.search);

  fetch('/content/site.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      apply(data);
      if (EDIT) {
        var s = document.createElement('script');
        s.src = '/js/editor.js';
        document.head.appendChild(s);
      }
    })
    .catch(function (e) {
      // JSON missing or invalid: the baked-in HTML stays as-is.
      console.warn('CMS content not applied:', e);
    });
})();
