// Batroun Race CMS hydration — loads content/site.json and fills the page.
// Elements opt in via data-cms (text/HTML), data-cms-href (link), or
// data-cms-list="type:path" (container re-rendered from a JSON array).
(function () {
  function get(obj, path) {
    return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, obj);
  }

  var C; // site content

  function mailtoHref(subject) {
    return 'mailto:' + get(C, 'global.email') + (subject ? '?subject=' + encodeURIComponent(subject) : '');
  }

  var renderers = {
    meta: function (items) {
      return items.map(function (m) {
        return '<div><b>' + m.b + '</b>' + m.label + '</div>';
      }).join('');
    },
    cards: function (items) {
      return items.map(function (c) {
        return '<div class="card reveal in"><span class="tag">' + c.tag + '</span><h3>' + c.h3 + '</h3><p>' + c.p + '</p></div>';
      }).join('');
    },
    flow: function (items) {
      return items.map(function (s) {
        return '<div class="flow-step reveal in"><span class="t">' + s.t + '</span><h3>' + s.h3 + '</h3><p>' + s.p + '</p></div>';
      }).join('');
    },
    rescards: function (items) {
      return items.map(function (c) {
        return '<a class="res-card reveal in" href="' + c.href + '"><div class="yr">' + c.yr + '</div><h3>' + c.h3 + '</h3><p>' + c.p + '</p><div class="go">' + c.go + '</div></a>';
      }).join('');
    },
    chips: function (items) {
      return items.map(function (t) {
        return '<span class="spon-chip">' + t + '</span>';
      }).join('');
    },
    partnerchips: function (items) {
      return items.map(function (c) {
        return c.href
          ? '<a class="spon-chip" href="' + c.href + '">' + c.label + '</a>'
          : '<span class="spon-chip">' + c.label + '</span>';
      }).join('');
    },
    tags: function (items) {
      return items.map(function (t) { return '<span>' + t + '</span>'; }).join('');
    },
    teaser: function (items) {
      return items.map(function (t) { return '<li>' + t + '</li>'; }).join('');
    },
    chancards: function (items) {
      return items.map(function (c) {
        return '<a class="card reveal in" href="' + c.href + '"><span class="tag">' + c.tag + '</span><h3>' + c.h3 + '</h3><p class="val">' + c.val + '</p><div class="go">' + c.go + '</div></a>';
      }).join('');
    },
    faq: function (items) {
      return items.map(function (f) {
        return '<div class="faq-item reveal in"><h3>' + f.q + '</h3><p>' + f.a + '</p></div>';
      }).join('');
    },
    wall: function (items) {
      return items.map(function (s) {
        var img = '<img src="images/sponsors/' + s.slug + '.png" alt="' + s.name + '" onerror="this.parentElement.classList.add(\'nologo\')">' +
                  '<span class="name">' + s.name + '</span>';
        return s.link
          ? '<a class="logo-tile" href="' + s.link + '">' + img + '</a>'
          : '<div class="logo-tile">' + img + '</div>';
      }).join('');
    },
    pkg: function (items) {
      return items.map(function (p) {
        var badge = p.highlight && p.badge ? '<span class="pkg-badge">' + p.badge + '</span>' : '';
        return '<div class="pkg reveal in' + (p.highlight ? ' hot' : '') + '">' + badge +
          '<div class="name">' + p.name + '</div>' +
          '<div class="price">' + p.price + '</div>' +
          '<div class="for">' + p.tagline + '</div>' +
          '<ul>' + p.features.map(function (f) { return '<li>' + f + '</li>'; }).join('') + '</ul>' +
          '<a class="pick" href="' + mailtoHref(p.mailto_subject) + '">' + p.cta + '</a></div>';
      }).join('');
    },
    decide: function (items) {
      return items.map(function (r) {
        return '<div class="decide-row"><span class="goal">' + r.goal + '</span><span class="pkg-name">' + r.pkg + '</span></div>';
      }).join('');
    },
    podium: function (items) {
      return items.map(function (c) {
        var img = c.img ? '<img src="' + c.img + '" alt="' + c.cat + ' podium winners, Batroun Race 2025" onerror="this.style.display=\'none\'">' : '';
        var rows = c.rows.map(function (r) {
          return '<li><span class="pos">' + r.pos + '</span><span class="nm">' + r.name + '</span><span class="meta">' + r.meta + '</span></li>';
        }).join('');
        return '<div class="pod-card reveal in">' + img + '<div class="body"><div class="cat">' + c.cat + '</div><ol>' + rows + '</ol></div></div>';
      }).join('');
    },
    storycards: function (items) {
      return items.map(function (c) {
        return '<div class="story-card reveal in"><img src="' + c.img + '" alt="' + c.alt + '" onerror="this.style.display=\'none\'">' +
          '<div class="body"><span class="tag">' + c.tag + '</span><h3>' + c.h3 + '</h3><p>' + c.p + '</p></div></div>';
      }).join('');
    }
  };

  fetch('/content/site.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      C = data;
      document.querySelectorAll('[data-cms]').forEach(function (el) {
        var v = get(C, el.getAttribute('data-cms'));
        if (typeof v === 'string') el.innerHTML = v;
      });
      document.querySelectorAll('[data-cms-href]').forEach(function (el) {
        var v = get(C, el.getAttribute('data-cms-href'));
        if (typeof v === 'string' && v) el.setAttribute('href', v);
      });
      document.querySelectorAll('[data-cms-list]').forEach(function (el) {
        var spec = el.getAttribute('data-cms-list').split(':');
        var fn = renderers[spec[0]];
        var items = get(C, spec[1]);
        if (fn && Array.isArray(items)) el.innerHTML = fn(items);
      });
    })
    .catch(function (e) {
      // JSON missing or invalid: the baked-in HTML stays as-is.
      console.warn('CMS content not applied:', e);
    });
})();
