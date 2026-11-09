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

  /* videos: <video data-auto><source data-src data-src-small></video>, plus the hero (video.hv, sources in data-*).
     Autoplay muted+playsinline; if the browser refuses (iOS Low Power Mode, battery/data saver) or the user asked for
     reduced motion, the poster stays and a play button appears; tapping it (or the video) loads and plays. */
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  var AV1 = 'video/mp4; codecs="av01.0.05M.08"';
  /* AV1 only where it is hardware-decoded (smooth + power-efficient); otherwise H.264 */
  var av1Ok = (function () {
    var t = document.createElement('video');
    if (t.canPlayType(AV1) !== 'probably') return Promise.resolve(false);
    if (!navigator.mediaCapabilities || !navigator.mediaCapabilities.decodingInfo) return Promise.resolve(true);
    return navigator.mediaCapabilities.decodingInfo({ type: 'file', video: { contentType: AV1, width: 1280, height: 720, bitrate: 1200000, framerate: 24 } })
      .then(function (r) { return !!(r.supported && r.smooth && r.powerEfficient); }, function () { return true; });
  })();
  var PLAY_SVG = '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z"/></svg>';
  var css = document.createElement('style');
  css.textContent = '.mz-play{position:absolute;z-index:3;left:50%;top:50%;transform:translate(-50%,-50%);width:64px;height:64px;border-radius:50%;' +
    'display:grid;place-items:center;padding:0 0 0 4px;cursor:pointer;color:#f6eee1;background:rgba(42,25,13,.55);border:1.5px solid rgba(216,180,106,.9);' +
    'box-shadow:0 8px 30px rgba(0,0,0,.35);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);transition:opacity .3s,transform .3s;-webkit-tap-highlight-color:transparent}' +
    '.mz-play:hover,.mz-play:focus-visible{transform:translate(-50%,-50%) scale(1.06);outline:none;box-shadow:0 0 0 3px rgba(216,180,106,.45),0 8px 30px rgba(0,0,0,.35)}' +
    '.mz-play[hidden]{display:none}.hero .mz-play.hero-play{left:clamp(1.25rem,5vw,5rem);top:auto;bottom:clamp(1.5rem,5vh,3rem);transform:none;width:56px;height:56px;z-index:4}' +
    '.hero .mz-play.hero-play:hover,.hero .mz-play.hero-play:focus-visible{transform:scale(1.06)}' +
    '@media (max-width:700px){.hero .mz-play.hero-play{top:5.5rem;bottom:auto;width:48px;height:48px}}' +
    'video.mz-tap{cursor:pointer}';
  document.head.appendChild(css);

  var isHero = function (v) { return v.classList.contains('hv'); };
  var setSrc = function (v, useAv1) {
    if (v.dataset.loaded) return; v.dataset.loaded = 1;
    if (isHero(v)) {
      var d = v.dataset, mob = matchMedia('(max-width:700px) and (orientation:portrait)').matches;
      v.dataset.fallback = mob ? d.m : d.d;
      v.src = mob ? (useAv1 && d.mAv1 || d.m) : (useAv1 && d.dAv1 || d.d);
    } else {
      var small = (v.clientWidth || innerWidth) * (devicePixelRatio || 1) <= 800;
      $$('source[data-src]', v).forEach(function (s) {
        if (!useAv1 && /av01/.test(s.type)) { s.remove(); return; }
        s.src = (small && s.dataset.srcSmall) || s.dataset.src;
      });
    }
    v.load();
  };
  /* a source that fails to decode (e.g. AV1 reported but not really playable) falls back to H.264 */
  var onError = function (v) {
    if (isHero(v)) { if (v.dataset.fallback && v.getAttribute('src') !== v.dataset.fallback) { v.src = v.dataset.fallback; v.load(); want(v); } return; }
    var av = $$('source', v).filter(function (s) { return /av01/.test(s.type); });
    if (av.length && (!v.currentSrc || /-av1\./.test(v.currentSrc))) { av.forEach(function (s) { s.remove(); }); v.load(); want(v); }
  };
  var btnFor = function (v) {
    if (v._btn) return v._btn;
    var host = isHero(v) ? v.closest('.hero') : v.parentElement;
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'mz-play' + (isHero(v) ? ' hero-play' : ''); b.hidden = true;
    b.setAttribute('aria-label', 'הפעלת הסרטון' + (v.getAttribute('aria-label') ? ': ' + v.getAttribute('aria-label') : ''));
    b.innerHTML = PLAY_SVG;
    b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); start(v); });
    host.appendChild(b); v._btn = b; return b;
  };
  var showBtn = function (v) { btnFor(v).hidden = false; v.classList.add('mz-tap'); v.dataset.blocked = 1; };
  var hideBtn = function (v) { if (v._btn) v._btn.hidden = true; v.classList.remove('mz-tap'); delete v.dataset.blocked; };
  var ready = function (v) { return av1Ok.then(function (ok) { setSrc(v, ok); }); };
  /* user-initiated: must call play() synchronously inside the gesture (iOS) */
  var start = function (v) {
    v.dataset.user = 1;
    if (!v.dataset.loaded) setSrc(v, v._av1 === true);
    var p = v.play(); hideBtn(v);
    if (p && p.catch) p.catch(function () { showBtn(v); });
  };
  /* automatic: autoplay unless reduced motion / data saver; any refusal shows the button */
  var want = function (v) {
    if ((reduce || saveData) && !v.dataset.user) { if (!saveData) ready(v); showBtn(v); return; }
    ready(v).then(function () {
      var p = v.play();
      if (p && p.catch) p.catch(function (e) { if (!e || e.name !== 'AbortError') showBtn(v); });
    });
  };
  var vids = $$('video[data-auto], video.hv');
  av1Ok.then(function (ok) { vids.forEach(function (v) { v._av1 = ok; }); });
  vids.forEach(function (v) {
    v.addEventListener('playing', function () { v.classList.add('on'); hideBtn(v); });
    v.addEventListener('error', function () { onError(v); });   /* media error (e.g. decode); <source> misses fall through natively */
    v.addEventListener('click', function () { if (v.paused) start(v); });
    if (saveData || reduce) showBtn(v);
  });
  /* first touch anywhere: start the visible videos that autoplay refused (not under reduced motion / data saver) */
  if (!reduce && !saveData) {
    var kick = function () {
      $$('video[data-blocked]').forEach(function (v) {
        var r = v.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight) start(v);
      });
    };
    ['touchend', 'click'].forEach(function (t) { document.addEventListener(t, kick, { capture: true, passive: true }); });
  }
  var hero = document.querySelector('video.hv');
  if (hero) {   /* hero: after first paint, so the poster wins LCP */
    var go = function () { setTimeout(function () { want(hero); }, 150); };
    if (document.readyState === 'complete') go(); else addEventListener('load', go);
  }
  var lazy = $$('video[data-auto]');
  if ('IntersectionObserver' in window) {
    var vo = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          if (!v.dataset.user) want(v);
          else if (v.dataset.resume) { delete v.dataset.resume; var p = v.play(); if (p && p.catch) p.catch(function () { showBtn(v); }); }
        } else if (v.dataset.loaded && !v.paused) { v.pause(); if (v.dataset.user) v.dataset.resume = 1; }
      });
    }, { rootMargin: '250px' });
    lazy.forEach(function (v) { vo.observe(v); });
  } else lazy.forEach(want);

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
