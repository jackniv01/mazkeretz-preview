/* shared motion helpers for the home-page concepts (no dependencies) */
(function () {
  'use strict';
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  /* scroll reveals */
  if ('IntersectionObserver' in window && !reduce) {
    var ro = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    $$('.rv').forEach(function (el) { ro.observe(el); });
  } else { $$('.rv').forEach(function (el) { el.classList.add('in'); }); }

  /* lazy autoplay videos: <video data-auto><source data-src data-src-small></video> */
  var saveData = navigator.connection && navigator.connection.saveData;
  var load = function (v) {
    if (v.dataset.loaded) return; v.dataset.loaded = 1;
    var small = (v.clientWidth || innerWidth) * (devicePixelRatio || 1) <= 800;
    $$('source[data-src]', v).forEach(function (s) { s.src = (small && s.dataset.srcSmall) || s.dataset.src; });
    v.load();
  };
  if ('IntersectionObserver' in window && !saveData) {
    var vo = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { load(v); if (!reduce) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } }
        else if (v.dataset.loaded) v.pause();
      });
    }, { rootMargin: '250px' });
    $$('video[data-auto]').forEach(function (v) { vo.observe(v); });
  }

  /* split text into letters for engraving/burn-in effects: [data-split] */
  $$('[data-split]').forEach(function (el) {
    var words = el.textContent.trim().split(/(\s+)/), i = 0;
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = words.map(function (w) {
      if (/^\s+$/.test(w)) return ' ';
      return '<span class="w" aria-hidden="true">' + Array.from(w).map(function (ch) {
        return '<span class="ch" style="--i:' + (i++) + '">' + ch + '</span>';
      }).join('') + '</span>';
    }).join('');
  });

  /* light parallax: [data-parallax="0.15"] */
  var par = $$('[data-parallax]');
  if (par.length && !reduce) {
    var tick = false;
    var run = function () {
      tick = false; var vh = innerHeight;
      par.forEach(function (el) {
        var r = el.getBoundingClientRect(); if (r.bottom < -200 || r.top > vh + 200) return;
        var k = parseFloat(el.dataset.parallax) || 0.12;
        el.style.transform = 'translate3d(0,' + ((r.top + r.height / 2 - vh / 2) * -k).toFixed(1) + 'px,0)';
      });
    };
    addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(run); } }, { passive: true });
    run();
  }

  /* nav state */
  var nav = document.querySelector('[data-nav]');
  if (nav) { var f = function () { nav.classList.toggle('solid', scrollY > 60); }; addEventListener('scroll', f, { passive: true }); f(); }
})();
