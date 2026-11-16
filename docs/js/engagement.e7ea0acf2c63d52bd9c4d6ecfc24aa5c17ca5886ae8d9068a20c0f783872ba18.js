/*
 * Views and reactions under an article.
 *   markup: layouts/partials/engagement.html     API: worker/ (a Cloudflare Worker)
 *
 * The block is hidden in the HTML and is shown only after the API has answered with numbers
 * that make sense. If the API is slow, blocked, broken or gone, nothing here throws and the
 * block simply never appears: the page looks exactly as it does without this feature.
 */
(function () {
  'use strict';

  var root = document.getElementById('engagement');
  if (!root || !window.fetch || !window.AbortController) return;

  var api = root.getAttribute('data-api');
  var path = root.getAttribute('data-path');
  var views = root.querySelector('.engagement-views');
  var viewCount = root.querySelector('.engagement-view-count');
  var buttons = Array.prototype.slice.call(root.querySelectorAll('.reaction'));
  if (!api || !path || !views || !viewCount || !buttons.length) return;

  var TIMEOUT_MS = 6000; // an API that has not answered by then is treated as absent
  var MAX_COUNT = 1e9; // anything above is not a number this blog will ever show
  var storageKey = 'reactions:' + path;
  var mine = readMine(); // the reactions this browser has already given: { fire: true, ... }
  var totals = null; // the numbers on screen: { views, reactions: { fire, ... } }
  var sending = {};

  // ---------- this browser's own reactions ----------

  function readMine() {
    try {
      var saved = JSON.parse(window.localStorage.getItem(storageKey) || '{}');
      return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
    } catch (e) {
      return {}; // storage blocked or unreadable: reactions still work, they are just not remembered
    }
  }

  function saveMine() {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(mine));
    } catch (e) {
      /* see readMine */
    }
  }

  // ---------- talking to the API ----------

  function isCount(n) {
    return typeof n === 'number' && isFinite(n) && n >= 0 && n <= MAX_COUNT && Math.floor(n) === n;
  }

  // Accepts only { views: <count>, reactions: { <kind>: <count>, ... } } and returns a clean copy.
  function clean(data) {
    if (!data || typeof data !== 'object' || !isCount(data.views)) throw new Error('unexpected answer');
    var given = data.reactions && typeof data.reactions === 'object' ? data.reactions : {};
    var reactions = {};
    buttons.forEach(function (button) {
      var kind = button.getAttribute('data-kind');
      reactions[kind] = isCount(given[kind]) ? given[kind] : 0;
    });
    return { views: data.views, reactions: reactions };
  }

  function request(method, route, body) {
    var controller = new AbortController();
    var timer = window.setTimeout(function () {
      controller.abort();
    }, TIMEOUT_MS);
    var options = {
      method: method,
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
      redirect: 'error',
      signal: controller.signal,
    };
    if (body) {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(body);
      options.keepalive = true;
    }
    return window
      .fetch(api + route, options)
      .then(function (response) {
        if (!response.ok) throw new Error('status ' + response.status);
        return response.json();
      })
      .then(clean)
      .then(
        function (result) {
          window.clearTimeout(timer);
          return result;
        },
        function (error) {
          window.clearTimeout(timer);
          throw error;
        },
      );
  }

  // ---------- drawing ----------

  var exact = null;
  var compact = null;
  try {
    exact = new Intl.NumberFormat('en-US');
    compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
  } catch (e) {
    /* plain digits below */
  }

  function short(n) {
    return n >= 1000 && compact ? compact.format(n) : String(n);
  }

  function draw() {
    var label = (exact ? exact.format(totals.views) : String(totals.views)) + (totals.views === 1 ? ' view' : ' views');
    viewCount.textContent = short(totals.views);
    views.setAttribute('title', label);
    views.setAttribute('aria-label', label);
    buttons.forEach(function (button) {
      var kind = button.getAttribute('data-kind');
      var count = button.querySelector('.reaction-count');
      if (count) count.textContent = short(totals.reactions[kind]);
      button.setAttribute('aria-pressed', mine[kind] ? 'true' : 'false');
    });
    root.hidden = false;
  }

  function pop(button) {
    var emoji = button.querySelector('.reaction-emoji');
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!emoji || !emoji.animate || still) return;
    emoji.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.5)' }, { transform: 'scale(1)' }], {
      duration: 400,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    });
  }

  // ---------- reacting ----------

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      var kind = button.getAttribute('data-kind');
      if (!totals || mine[kind] || sending[kind]) return; // one of each per reader
      var before = totals;
      var reactions = {};
      Object.keys(before.reactions).forEach(function (k) {
        reactions[k] = before.reactions[k] + (k === kind ? 1 : 0);
      });
      sending[kind] = true;
      mine[kind] = true;
      saveMine();
      totals = { views: before.views, reactions: reactions };
      draw();
      pop(button);
      request('POST', '/api/react', { path: path, kind: kind })
        .then(
          function (result) {
            totals = result;
          },
          function () {
            // not recorded: put everything back as it was
            delete mine[kind];
            saveMine();
            totals = before;
          },
        )
        .then(function () {
          sending[kind] = false;
          draw();
        });
    });
  });

  // ---------- counting the view ----------

  function start() {
    request('POST', '/api/view', { path: path })
      .catch(function () {
        return request('GET', '/api/stats?path=' + encodeURIComponent(path));
      })
      .then(
        function (result) {
          totals = result;
          draw();
        },
        function () {
          /* no usable answer: the block stays hidden */
        },
      );
  }

  // A tab opened in the background (or a prerendered page) counts when it is actually looked at.
  if (document.visibilityState === 'hidden') {
    document.addEventListener('visibilitychange', function onShow() {
      if (document.visibilityState === 'hidden') return;
      document.removeEventListener('visibilitychange', onShow);
      start();
    });
  } else {
    start();
  }
})();
