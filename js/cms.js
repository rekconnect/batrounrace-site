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
    /* One race's logos, everyone the same size: no tiers, so nothing here
       ranks anybody. The folder comes from the content, so next year's set
       is a new folder and a new list, not a code change. */
    logos: function (items, p) {
      var dir = get(C, 'sponsors.race.dir') || 'images/sponsors/';
      return items.map(function (s, i) {
        var inner = '<img src="' + dir + s.slug + '.png" alt="' + s.name +
                    '" loading="lazy" onerror="this.parentElement.classList.add(\'nologo\')">' +
                    '<span class="name" data-cms="' + p + '.' + i + '.name">' + s.name + '</span>';
        return s.link
          ? '<a class="lg-item" href="' + s.link + '" target="_blank" rel="noopener">' + inner + '</a>'
          : '<div class="lg-item">' + inner + '</div>';
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
    events: function (items, p) {
      return items.map(function (e, i) {
        return '<div class="ev-card reveal in' + (e.upcoming ? ' hot' : '') + '">' +
          '<span class="ev-badge" data-cms="' + p + '.' + i + '.status">' + e.status + '</span>' +
          '<h3 data-cms="' + p + '.' + i + '.name">' + e.name + '</h3>' +
          '<div class="ev-meta" data-cms="' + p + '.' + i + '.meta">' + e.meta + '</div>' +
          '<p data-cms="' + p + '.' + i + '.p">' + e.p + '</p>' +
          '<a class="go" href="' + e.href + '" data-cms="' + p + '.' + i + '.label">' + e.label + '</a></div>';
      }).join('');
    },
    gallery: function (items, p) {
      return items.map(function (s, i) {
        return '<figure class="g-item reveal in"><img src="' + s.img + '" alt="' + (s.alt || 'Batroun Race photo') + '" loading="lazy" onerror="this.parentElement.remove()"></figure>';
      }).join('');
    },
    accordion: function (items, p) {
      return items.map(function (f, i) {
        return '<details class="reveal in"' + (i === 0 ? ' open' : '') + '><summary data-cms="' + p + '.' + i + '.q">' + f.q + '</summary><div class="a" data-cms="' + p + '.' + i + '.a">' + f.a + '</div></details>';
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
    document.querySelectorAll('[data-cms-src]').forEach(function (el) {
      var v = get(C, el.getAttribute('data-cms-src'));
      if (typeof v === 'string' && v && el.getAttribute('src') !== v) el.setAttribute('src', v);
    });
    document.querySelectorAll('[data-cms-srcset]').forEach(function (el) {
      var v = get(C, el.getAttribute('data-cms-srcset'));
      if (typeof v === 'string' && v && el.getAttribute('srcset') !== v) el.setAttribute('srcset', v);
    });
    initPromo();
    initSliders();
    initLightbox();
    initGuideRaces();
    renderRacesMenu();
    tagRegLinks();
    initRegLock();
    // hydration grows content above a #hash target after the browser's own
    // anchor jump, so land on it once more — once, and never in the editor
    if (location.hash && !apply._anchored && !EDIT) {
      apply._anchored = true;
      var anchor = document.getElementById(location.hash.slice(1));
      if (anchor) anchor.scrollIntoView();
    }
  }

  /* The Races menu in the nav: one row per race, each flying out its own
     links (results, race info, gallery…). Driven by global.races_menu, so
     next year's race is a content edit in /admin, not eight nav markups. */
  function renderRacesMenu() {
    var races = get(C, 'global.races_menu');
    if (!Array.isArray(races) || !races.length) return;
    document.querySelectorAll('[data-races-menu]').forEach(function (host) {
      host.innerHTML = races.map(function (r, i) {
        var base = 'global.races_menu.' + i;
        var links = (r.links || []).map(function (l, j) {
          return '<a href="' + l.href + '" data-cms="' + base + '.links.' + j + '.label">' + l.label + '</a>';
        }).join('');
        return '<div class="nav-sub"><a href="' + (r.href || '#') + '" data-cms="' + base + '.name">' + r.name + '</a>' +
          (links ? '<div class="nav-sub-menu">' + links + '</div>' : '') + '</div>';
      }).join('');
    });
  }

  /* Registration is not open until race.reg_open, and until then no link on the
     site should hand anyone to the registration system — it is still being set
     up. Every link to it is greyed out and stops navigating; the moment the
     clock runs out they all come back on their own, no reload and no deploy.
     Results links are left alone: those belong to races already run. */
  function regMoment() {
    var promos = promoList();
    var race = (promos[0] && promos[0].race) || get(C, 'global.race') || {};
    var at = race.reg_open ? new Date(race.reg_open) : null;
    return at && !isNaN(at) ? at : null;
  }

  /* …and it closes again at race.reg_close — the deadline before race day
     after which no more runners can be taken. Empty means it never closes. */
  function regCloseMoment() {
    var promos = promoList();
    var race = (promos[0] && promos[0].race) || get(C, 'global.race') || {};
    var at = race.reg_close ? new Date(race.reg_close) : null;
    return at && !isNaN(at) ? at : null;
  }

  function regLinks() {
    return [].slice.call(document.querySelectorAll('a[href],a[data-reg-href]')).filter(function (a) {
      var h = a.getAttribute('href') || a.getAttribute('data-reg-href') || '';
      return h.indexOf('register.batrounrace.com') > -1 && h.indexOf('/results') === -1;
    });
  }

  var REG_NOTE = 'Registration opens soon — the countdown is on the homepage';

  /* Every registration link carries where it was clicked, so the registration
     system can say which button actually produced a runner — and which one
     produced somebody who then walked away from the form. Tagged before the
     lock runs, so the tag is already on the href the lock stores away and
     hands back when registration opens. */
  function srcFor(a) {
    if (a.classList.contains('promo-btn')) return 'banner';
    if (a.classList.contains('rd-cta')) return 'race-info';
    if (a.classList.contains('mobile-register')) return 'mobile-bar';
    if (a.classList.contains('nav-cta')) return 'nav';
    if (a.classList.contains('bib')) return 'bib';
    // anything else: the page it was on is the useful answer. The live site
    // serves clean URLs, so the homepage is "" there and "index" locally —
    // both mean the same thing and should read the same in the dashboard.
    var page = location.pathname.replace(/\/$/, '').split('/').pop().replace(/\.html$/, '');
    return (!page || page === 'index') ? 'home' : page;
  }

  function tagRegLinks() {
    regLinks().forEach(function (a) {
      var attr = a.hasAttribute('href') ? 'href' : 'data-reg-href';
      var h = a.getAttribute(attr);
      if (!h || /[?&]src=/.test(h)) return;
      a.setAttribute(attr, h + (h.indexOf('?') > -1 ? '&' : '?') + 'src=' + encodeURIComponent(srcFor(a)));
    });
  }

  var REG_CLOSED_NOTE = 'Results coming soon';

  function lockRegistration(note, label) {
    if (!document.getElementById('reg-lock-css')) {
      var s = document.createElement('style');
      s.id = 'reg-lock-css';
      // grayscale rather than a fixed grey: works the same on the coral button,
      // the ghost buttons and the bib card without hardcoding any of them
      s.textContent = '.reg-locked{filter:grayscale(1);opacity:.6;cursor:not-allowed;box-shadow:none!important}' +
        // no transform override here: the banner button is CENTRED by its
        // transform on phones, so cancelling it on tap flung the button half
        // its width to the right. Every hover rule keeps its own positional
        // part anyway — a dead button lifting 3px is fine; one that jumps
        // across the poster is not.
        '.reg-locked:hover,.reg-locked:focus-visible{filter:grayscale(1)}';
      document.head.appendChild(s);
    }
    regLinks().forEach(function (a) {
      if (a.hasAttribute('href')) a.setAttribute('data-reg-href', a.getAttribute('href'));
      a.removeAttribute('href');            // an anchor with no href is not a link
      a.classList.add('reg-locked');
      a.setAttribute('aria-disabled', 'true');
      a.setAttribute('title', note);
      // Closing is not opening: before opening the clock above the button says
      // what is coming, so the wording stays put. After closing the clock
      // counts to race day, so a dead "Register now" would just look broken —
      // plain text buttons say why instead. Composed ones (the bib card) keep
      // their structure and rely on the grey and the title.
      // …and only buttons that had words to begin with: the mobile bottom bar
      // is deliberately empty (and therefore hidden) when register_bar_label
      // is blank — writing a label into it would summon it out of hiding
      if (label && !a.children.length && a.textContent.trim()) {
        if (!a.hasAttribute('data-reg-label')) a.setAttribute('data-reg-label', a.textContent);
        a.textContent = label;
      }
    });
  }

  /* One state machine, re-run at every boundary it schedules itself for:
     closed (reg_close passed) → every link dead and saying so;
     waiting (reg_open ahead)  → every link dead, the countdown explains;
     open                      → links live, with the close moment armed. */
  function initRegLock() {
    var openAt = regMoment(), closeAt = regCloseMoment(), now = new Date();
    clearTimeout(initRegLock._t);
    var next = null;
    if (closeAt && closeAt <= now) {
      // Registration is over, so the same dead buttons now promise what comes
      // next instead of repeating what ended: they read Results, still grey
      // and still going nowhere, until the results actually exist and the
      // links are pointed at them.
      lockRegistration(REG_CLOSED_NOTE, 'Results');
    } else if (openAt && openAt > now) {
      lockRegistration(REG_NOTE, null);
      next = openAt;
    } else {
      unlockRegistration();
      next = closeAt;   // may be null: registration that never closes
    }
    if (next) {
      var ms = next - now;
      if (ms > 0 && ms < 2147483647) initRegLock._t = setTimeout(initRegLock, ms + 500);
    }
  }

  function unlockRegistration() {
    document.querySelectorAll('a[data-reg-href]').forEach(function (a) {
      a.setAttribute('href', a.getAttribute('data-reg-href'));
      a.removeAttribute('data-reg-href');
      a.removeAttribute('aria-disabled');
      if (a.getAttribute('title') === REG_NOTE || a.getAttribute('title') === REG_CLOSED_NOTE) a.removeAttribute('title');
      if (a.hasAttribute('data-reg-label')) {
        a.textContent = a.getAttribute('data-reg-label');
        a.removeAttribute('data-reg-label');
      }
      a.classList.remove('reg-locked');
    });
  }

  /* Banners: home.promos is a list, one entry per upcoming race, each carrying
     its own banner images AND its own countdown/info. home.promo (singular) is
     still honoured as the first entry so older content keeps working. */
  function promoList() {
    var list = get(C, 'home.promos');
    if (Array.isArray(list) && list.length) return list;
    var single = get(C, 'home.promo');
    return single ? [single] : [];
  }

  function initPromo() {
    var host = document.getElementById('promoSec');
    if (!host) return;
    var tpl = host.parentNode.querySelector('#promoTemplate');
    if (!tpl) return;
    var editing = /[?&]edit=1/.test(location.search);
    var races = promoList();
    if (!races.length && !editing) { host.innerHTML = ''; return; }
    if (!races.length) races = [{}];

    host.innerHTML = '';
    races.forEach(function (promo, i) {
      var node = tpl.content.cloneNode(true);
      var sec = node.querySelector('.promo-sec');
      sec.classList.toggle('has-promo', !!promo.img || editing);
      sec.classList.toggle('edit-empty', editing && !promo.img);
      var img = sec.querySelector('picture img');   // the artwork, not the lockup's logos
      if (img) {
        if (promo.img) img.setAttribute('src', promo.img);
        if (promo.alt) img.setAttribute('alt', promo.alt);
        img.style.display = promo.img ? '' : 'none';
      }
      // the blurred fill behind the poster on portrait screens: the phone
      // artwork when there is one, otherwise the wide one
      var bg = sec.querySelector('.promo-bg');
      if (bg) {
        var bgSrc = promo.img_portrait || promo.img;
        if (bgSrc) bg.setAttribute('src', bgSrc); else bg.remove();
      }
      var source = sec.querySelector('source');
      if (source) {
        if (promo.img_portrait) source.setAttribute('srcset', promo.img_portrait);
        else source.remove();
      }
      var a = sec.querySelector('a.promo');
      if (a && !promo.href) a.removeAttribute('href');
      var btn = sec.querySelector('.promo-btn');
      if (btn) {
        if (promo.href) btn.setAttribute('href', promo.href);
        btn.innerHTML = promo.label || '';
        btn.style.display = (promo.href && promo.label) ? '' : 'none';
      }
      // each banner carries its own countdown + info pills, written over the
      // artwork itself: race line under the 5 KM pill, clock in the middle
      var race = promo.race || (i === 0 ? get(C, 'global.race') : null) || {};
      var cd = sec.querySelector('.race-next');
      var info = sec.querySelector('.race-info');
      if (info) info.innerHTML = race.info || '';
      renderCountdown(cd, race, i === 0);
      // the runway is the scroll room the sticky banner travels through while
      // the countdown writes itself in — pointless without a banner
      var runway = node.querySelector('.cd-runway');
      var holds = !!(promo.img && !editing);
      if (runway) runway.style.display = holds ? '' : 'none';
      // the page only rides over the banner when there is a banner to hold
      if (holds) document.body.classList.add('has-banner');
      host.appendChild(node);
    });
    revealCountdowns();
    initBannerStages();
  }

  /* The race guide: one page, every race. guide.races carries a block per
     race; the switcher pills pick one and the route section reads from it —
     headline, description, race-day pills, the four route cards and the map.
     Deep-linkable: /race-guide#cedar opens on that race, so the right guide
     can be shared into a WhatsApp group directly. The data-cms paths are
     re-pointed on every switch, so the visual editor edits the race that is
     actually on screen. */
  function initGuideRaces() {
    var h2 = document.getElementById('rgH2');
    if (!h2) return;
    var races = get(C, 'guide.races');
    if (!Array.isArray(races) || !races.length) return;

    function show(i, sec) {
      var r = races[i];
      if (!r) return;
      var base = 'guide.races.' + i;
      // the page belongs to this race: its name leads the hero and the tab
      var kicker = document.querySelector('.hero .km');
      if (kicker) {
        kicker.textContent = (r.name || '') + (r.town ? ' · ' + r.town : '');
        kicker.removeAttribute('data-cms');   // computed now, not a field
      }
      if (r.name) document.title = r.name + ' — Race Guide · Batroun Race';
      var p = document.getElementById('rgP');
      var day = document.getElementById('rgDay');
      var flow = document.getElementById('rgFlow');
      var map = document.getElementById('rgMap');
      h2.innerHTML = r.h2 || '';
      h2.setAttribute('data-cms', base + '.h2');
      if (p) { p.innerHTML = r.p || ''; p.setAttribute('data-cms', base + '.p'); }
      if (day) day.innerHTML = r.day || '';
      if (flow) {
        flow.setAttribute('data-cms-list', 'flow:' + base + '.kms');
        flow.innerHTML = renderers.flow(r.kms || [], base + '.kms');
      }
      if (map && r.map_url && map.getAttribute('src') !== r.map_url) {
        map.setAttribute('src', r.map_url);
        map.setAttribute('data-cms-src', base + '.map_url');
        map.setAttribute('title', (r.name || 'Race') + ' route area map');
      }
      // bib pickup + age categories are per-race too; a race without the
      // data simply hides the section instead of showing an empty band
      [['pickup', 'rgPickup', 'pickup'], ['cats', 'rgCats', 'cats']].forEach(function (m) {
        var secEl = document.getElementById(m[0]);
        var host = document.getElementById(m[1]);
        var items = Array.isArray(r[m[2]]) ? r[m[2]] : [];
        if (secEl) secEl.style.display = items.length ? '' : 'none';
        if (host) {
          host.setAttribute('data-cms-list', 'flow:' + base + '.' + m[2]);
          host.innerHTML = renderers.flow(items, base + '.' + m[2]);
        }
      });
      var inc = document.getElementById('rgIncluded');
      if (inc) {
        inc.innerHTML = (Array.isArray(r.included) ? r.included : []).map(function (x, j) {
          return '<span>✓ <span data-cms="' + base + '.included.' + j + '">' + x + '</span></span>';
        }).join('');
      }
      // remember the pick in the URL without adding history entries
      if (r.id) history.replaceState(null, '', '#' + r.id + (sec ? '-' + sec : ''));
      // a deep link like #cedar-pickup scrolls to that section once dressed
      if (sec) {
        var target = document.getElementById(sec);
        if (target) {
          var smooth = !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
          target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
        }
      }
    }

    // Which race is chosen by the nav's deep link (else the first, the
    // upcoming race leading the list in content). The nav can re-link this
    // same page to another race, which only changes the hash — so hash
    // navigation re-dresses the page in place, no reload.
    function pick() {
      var want = location.hash.replace('#', '');
      var sec = '';
      var i = races.findIndex(function (r) { return r.id === want; });
      if (i < 0 && want.indexOf('-') > -1) {
        // #cedar-pickup → the cedar page, scrolled to its pickup section
        var race = want.slice(0, want.indexOf('-'));
        i = races.findIndex(function (r) { return r.id === race; });
        if (i > -1) sec = want.slice(want.indexOf('-') + 1);
      }
      show(i > -1 ? i : 0, sec);
    }
    window.addEventListener('hashchange', pick);
    pick();
  }

  /* The banner is two states: the poster, then the site climbing over it.
     Nothing is dealt over the artwork any more, so all this does is fade the
     scroll cue out as the hold runs down and hand the social rail back to the
     site. Stage lengths are measured off the runway's own spacers, so CSS
     stays the single source of those numbers. */
  function initBannerStages() {
    var sec = document.querySelector('.promo-top');
    if (!sec) return;
    var holdEl = sec.querySelector('.cd-stage-hold');
    var climbEl = sec.querySelector('.cd-stage-climb');
    var cue = sec.querySelector('.promo-cue');
    if (!holdEl) return;
    if (/[?&]edit=1/.test(location.search)) return;   // the editor shows a still banner
    var ticking = false;
    function frame() {
      ticking = false;
      var scrolled = Math.max(0, -sec.getBoundingClientRect().top);
      // the cue has done its job the moment the hold starts running out
      var p = scrolled / (holdEl.offsetHeight || 1);
      p = p < 0 ? 0 : p > 1 ? 1 : p;
      if (cue) cue.style.opacity = String(Math.max(0, 1 - p * 1.6));
      // The rail is a second column of icons over the poster. It belongs to
      // the site, so it waits until the site has climbed over half the banner
      // and the poster is no longer what you are looking at.
      var railAt = holdEl.offsetHeight + (climbEl ? climbEl.offsetHeight * 0.5 : 0);
      document.body.classList.toggle('rail-off', scrolled < railAt);
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(frame); }
    }, { passive: true });
    window.addEventListener('resize', frame);
    frame();
  }

  /* The clock is the first thing the banner has to say, so it is on screen
     from the first paint — no scroll to earn it. It still fades up rather than
     snapping in: one frame's delay is enough for the transition to run. */
  function revealCountdowns() {
    var tops = [].slice.call(document.querySelectorAll('.promo-top'));
    if (!tops.length) return;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        tops.forEach(function (t) { t.classList.add('cd-on'); });
      });
    });
  }

  function initLightbox() {
    var lb = document.getElementById('lightbox');
    var grids = document.querySelectorAll('.gallery-grid');
    if (!lb || !grids.length || /[?&]edit=1/.test(location.search)) return;
    var img = lb.querySelector('img');
    var cur = 0;
    // each race has its own grid; the arrows page through the grid clicked
    var active = grids[0];
    function imgs() { return Array.prototype.map.call(active.querySelectorAll('.g-item img'), function (im) { return im.getAttribute('src'); }); }
    function open(i) {
      var list = imgs();
      cur = (i + list.length) % list.length;
      img.src = list[cur];
      lb.classList.add('open');
    }
    grids.forEach(function (grid) {
      if (grid._lbBound) return;
      grid._lbBound = true;
      grid.addEventListener('click', function (e) {
        var item = e.target.closest('.g-item');
        if (!item) return;
        active = grid;
        open(Array.prototype.indexOf.call(grid.children, item));
      });
    });
    if (!lb._lbBound) {
      lb._lbBound = true;
      lb.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (b) {
          var a = b.getAttribute('data-lb');
          if (a === 'close') lb.classList.remove('open');
          else open(cur + (a === 'next' ? 1 : -1));
        } else if (e.target === lb) {
          lb.classList.remove('open');
        }
      });
      document.addEventListener('keydown', function (e) {
        if (!lb.classList.contains('open')) return;
        if (e.key === 'Escape') lb.classList.remove('open');
        if (e.key === 'ArrowRight') open(cur + 1);
        if (e.key === 'ArrowLeft') open(cur - 1);
      });
    }
  }

  /* Two clocks share the one slot in the banner. While registration is still
     shut the clock counts down to it opening and says so above itself, with the
     race-day pills held back — they are about race morning, not sign-up. The
     second that moment passes the same clock switches to race day and the pills
     come back, without the visitor reloading anything. */
  function renderCountdown(el, race, seo) {
    if (!el) return;
    race = race || {};
    if (el._timer) clearInterval(el._timer);
    var pills = el.parentNode ? el.parentNode.querySelector('.race-info') : null;
    var raceAt = race.date ? new Date(race.date + (race.time ? 'T' + race.time : 'T07:00')) : null;
    if (raceAt && isNaN(raceAt)) raceAt = null;
    // registration opening carries its own UTC offset (…+03:00), so it lands on
    // the same instant for a runner in Batroun and one reading from abroad
    var regAt = race.reg_open ? new Date(race.reg_open) : null;
    if (regAt && isNaN(regAt)) regAt = null;
    var waiting = !!(regAt && regAt > new Date());
    var when = waiting ? regAt : raceAt;
    if (pills) pills.hidden = waiting;
    if (!when || when < new Date()) {
      if (race.tba_text) {
        el.hidden = false;
        el.innerHTML = '<span class="rn-what">' + (race.edition_label || 'Next edition') + '</span>' +
          '<span class="rn-when">' + race.tba_text + '</span>';
      } else {
        el.hidden = true;
      }
      return;
    }
    el.hidden = false;
    // the banner artwork already carries the date, town and race name, so the
    // overlay adds only the clock — no second copy of the same three lines
    el.innerHTML = '<div class="rn-boxes">' +
      (waiting ? '<span class="rn-lead">' + (race.reg_label || 'Registration opening soon') + '</span>' : '') +
      ['Days', 'Hours', 'Min', 'Sec'].map(function (l) {
        return '<div class="rn-box"><b>–</b><span>' + l + '</span></div>';
      }).join('') + '</div>';
    var boxes = el.querySelectorAll('.rn-box b');
    function tick() {
      var ms = when - new Date();
      if (ms < 0) {
        clearInterval(el._timer);
        // registration just opened: hand the slot over to the race-day clock
        if (waiting) renderCountdown(el, race, seo);
        return;
      }
      var d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4), s = Math.floor(ms % 6e4 / 1e3);
      [d, h, m, s].forEach(function (v, i) { boxes[i].textContent = v; });
    }
    tick();
    el._timer = setInterval(tick, 1000);
    if (!seo || !race.date) return;
    // structured data for Google (event rich results) — first/next race only
    var old = document.getElementById('event-jsonld');
    if (old) old.remove();
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.id = 'event-jsonld';
    s.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      name: (race.edition_label || 'Batroun Race').replace(/^Next race · /, ''),
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

  // Results dropdown in the nav (desktop: click to open; mobile: always expanded)
  document.querySelectorAll('.nav-drop').forEach(function (drop) {
    var btn = drop.querySelector('.nav-drop-btn');
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = drop.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!drop.contains(e.target)) {
        drop.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // On phones each race row folds shut; tapping the race name unfolds its
  // links instead of navigating (the row's own links still navigate).
  // Delegated, because renderRacesMenu rebuilds the rows on every hydration.
  document.addEventListener('click', function (e) {
    if (!matchMedia('(max-width: 768px)').matches) return;
    var a = e.target.closest('.nav-sub > a');
    if (!a || !a.parentElement.querySelector('.nav-sub-menu')) return;
    e.preventDefault();
    a.parentElement.classList.toggle('open');
  });

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
