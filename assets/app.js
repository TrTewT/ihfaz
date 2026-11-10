/*
 * Ihfaz — the only script of the site. No library, no request, no tracking.
 *
 * It does three small things:
 *   1. on a "door" page (the root, /privacy/, /support/), send the visitor to their language;
 *   2. remember the language they choose — in this browser, on this device, nowhere else;
 *   3. let the sections arrive as they are scrolled into view.
 *
 * The pages are complete without it: the doors show their three links, and nothing is hidden.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var KEY = 'ihfaz.lang';
  var LANGS = ['en', 'fr', 'ar'];

  function stored() {
    try {
      var value = window.localStorage.getItem(KEY);
      return LANGS.indexOf(value) >= 0 ? value : null;
    } catch (e) {
      return null; // private browsing, storage refused: the browser's language decides
    }
  }

  function remember(lang) {
    try {
      window.localStorage.setItem(KEY, lang);
    } catch (e) {
      /* nothing to do: the choice simply is not kept */
    }
  }

  function preferred() {
    var kept = stored();
    if (kept) return kept;
    var list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'];
    for (var i = 0; i < list.length; i++) {
      var code = String(list[i]).slice(0, 2).toLowerCase();
      if (LANGS.indexOf(code) >= 0) return code;
    }
    return 'en';
  }

  // 1. the doors
  var door = root.getAttribute('data-door');
  if (door) {
    window.location.replace(door.replace('{lang}', preferred()) + window.location.search + window.location.hash);
    return;
  }

  // 2. the language chosen by hand wins over the browser's, next time
  document.addEventListener('click', function (event) {
    var target = event.target;
    var link = target && target.closest ? target.closest('a[data-lang]') : null;
    if (link) remember(link.getAttribute('data-lang'));
  });

  // 3. the sections arrive on scroll — unless the visitor asked for less motion
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still || !window.requestAnimationFrame) return;

  root.classList.add('js');

  // A section is shown as soon as its top is above the bottom of the screen — and stays shown.
  // (Not an IntersectionObserver: a fast scroll can carry a section from below the screen to above
  // it between two observations, and it would then stay invisible until scrolled back to.)
  var pending = [];
  var queued = false;

  function sweep() {
    queued = false;
    var line = (window.innerHeight || root.clientHeight) * 0.94;
    var rest = [];
    for (var i = 0; i < pending.length; i++) {
      if (pending[i].getBoundingClientRect().top < line) pending[i].classList.add('in');
      else rest.push(pending[i]);
    }
    pending = rest;
    if (pending.length === 0) {
      window.removeEventListener('scroll', ask);
      window.removeEventListener('resize', ask);
    }
  }

  function ask() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(sweep);
  }

  function start() {
    try {
      pending = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
      window.addEventListener('scroll', ask, { passive: true });
      window.addEventListener('resize', ask);
      sweep();
    } catch (e) {
      root.classList.remove('js'); // never leave a section invisible
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
  window.addEventListener('load', ask);

  // printing, or a page restored from the back-forward cache: show everything
  window.addEventListener('beforeprint', function () {
    root.classList.remove('js');
  });
})();
