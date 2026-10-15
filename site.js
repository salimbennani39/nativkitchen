/* Nativ' Kitchen: page-local behaviour. The engine is untouched; this reads
   the --sc-p it publishes and adds the fizz, the hero lean, the poke builder,
   and the index. */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // ---- fizz: deterministic bubbles, so every visit fizzes the same way ----
  var seed = 7;
  function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
  function fizz(el, n, xMin, xMax, dMin, dMax) {
    for (var i = 0; i < n; i++) {
      var b = document.createElement('span');
      b.className = 'bub';
      var r = rnd();
      b.style.setProperty('--x', (xMin + rnd() * (xMax - xMin)).toFixed(1) + '%');
      b.style.setProperty('--d', Math.round(dMin + r * (dMax - dMin)) + 'px');
      b.style.setProperty('--t', (7 + rnd() * 8).toFixed(1) + 's');
      b.style.setProperty('--dl', (-rnd() * 14).toFixed(1) + 's');
      b.style.setProperty('--sway', Math.round((rnd() - 0.5) * 60) + 'px');
      b.style.setProperty('--r', (2 + rnd() * 7).toFixed(1));
      el.appendChild(b);
    }
  }
  var back = document.querySelector('.fizz--back');
  var front = document.querySelector('.fizz--front');
  var narrow = innerWidth < 760;
  if (back) fizz(back, narrow ? 9 : 16, narrow ? 40 : 52, narrow ? 98 : 86, 5, 16);
  if (front) fizz(front, narrow ? 5 : 8, narrow ? 10 : 30, 96, 14, 34);

  // pause the fizz when the hero is offscreen
  var heroStage = document.querySelector('.hero__stage');
  if (heroStage && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      heroStage.classList.toggle('is-paused', !es[0].isIntersecting);
    }).observe(heroStage);
  }

  // ---- hero lean: the planes shift a little as the pointer moves ----------
  if (heroStage && fine && !reduce) {
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    heroStage.addEventListener('pointermove', function (e) {
      tx = (e.clientX / innerWidth - 0.5) * 2;
      ty = (e.clientY / innerHeight - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(lean);
    });
    heroStage.addEventListener('pointerleave', function () { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(lean); });
    function lean() {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      heroStage.style.setProperty('--mx', cx.toFixed(3));
      heroStage.style.setProperty('--my', cy.toFixed(3));
      raf = (Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002) ? requestAnimationFrame(lean) : 0;
    }
  }

  // ---- the poke builder ---------------------------------------------------
  var notes = {
    "Nativ'": "Fruits de la passion, huile d'olive, vinaigre de figue de barbarie, ciboulette.",
    "Extra Miso": "Huile de sésame, citron, miso.",
    "Extra Yuzu": "Vinaigre de figue de barbarie, yuzu, huile d'olive.",
    "Green": "Cerfeuil, persil, sauge, huile d'olive, yuzu."
  };
  var form = document.getElementById('build');
  var KEY = 'nativ-poke';
  function store(get, val) {
    try { return get ? JSON.parse(localStorage.getItem(KEY) || 'null') : localStorage.setItem(KEY, JSON.stringify(val)); }
    catch (e) { return null; }
  }
  function choice() {
    return {
      base: form.querySelector('input[name="base"]:checked').value,
      sauce: form.querySelector('input[name="sauce"]:checked').value
    };
  }
  function render() {
    var c = choice();
    var line = 'Teriyaki, ' + c.base + ', sauce ' + c.sauce;
    document.getElementById('sum').textContent = line;
    document.getElementById('sauce-note').textContent = notes[c.sauce];
    document.querySelectorAll('.js-sum').forEach(function (el) { el.textContent = line; });
    var msg = "Bonjour Nativ' Kitchen, je voudrais réserver une table. Mon poke : " + line + '.';
    document.querySelectorAll('.js-book').forEach(function (a) {
      a.href = 'https://wa.me/212666699799?text=' + encodeURIComponent(msg);
    });
    return c;
  }
  if (form) {
    var saved = store(true);
    if (saved) {
      ['base', 'sauce'].forEach(function (k) {
        var el = form.querySelector('input[name="' + k + '"][value="' + (saved[k] || '').replace(/"/g, '') + '"]');
        if (el) el.checked = true;
      });
    }
    render();
    form.addEventListener('change', function () { store(false, render()); });
    form.addEventListener('submit', function (e) { e.preventDefault(); });

    // open the builder once the bowl has come apart
    var poke = document.getElementById('poke');
    var open = null;
    function setOpen(v) {
      if (v === open) return;
      open = v;
      form.classList.toggle('is-open', v);
      if (v) form.removeAttribute('inert'); else form.setAttribute('inert', '');
    }
    if (reduce) setOpen(true);
    else {
      (function tick() {
        var p = parseFloat(poke.style.getPropertyValue('--sc-p')) || 0;
        setOpen(p > 0.58);
        requestAnimationFrame(tick);
      })();
    }
  }

  // ---- index: mark where you are, toggle on phones -------------------------
  var bar = document.querySelector('.bar');
  var toggle = document.querySelector('.bar__toggle');
  var links = {};
  document.querySelectorAll('.bar__index a').forEach(function (a) {
    links[a.getAttribute('data-ix')] = a;
    a.addEventListener('click', function () { bar.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); });
  });
  toggle.addEventListener('click', function () {
    var o = bar.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(o));
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && bar.classList.contains('is-open')) { bar.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); toggle.focus(); }
  });
  var ids = ['top', 'lieu', 'poke', 'carte', 'equipe', 'table'];
  var secs = ids.map(function (id) { return id === 'top' ? document.querySelector('.hero') : document.getElementById(id); });
  function mark() {
    var y = innerHeight * 0.45, cur = 'top';
    secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top <= y) cur = ids[i]; });
    Object.keys(links).forEach(function (k) { links[k].setAttribute('aria-current', k === cur ? 'true' : 'false'); });
  }
  addEventListener('scroll', mark, { passive: true });
  mark();
})();
