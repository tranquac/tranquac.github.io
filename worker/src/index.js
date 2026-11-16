/**
 * blog-engagement: the view counter and the reactions shown under each article on
 * https://tranquac.github.io. A Cloudflare Worker with a D1 database (see ../schema.sql).
 *
 *   GET  /api/stats?path=/posts/foo/                          -> { views, reactions }
 *   POST /api/view   {"path": "/posts/foo/"}                  -> { views, reactions, counted }
 *   POST /api/react  {"path": "/posts/foo/", "kind": "fire"}  -> { views, reactions, counted }
 *
 * What keeps the numbers honest:
 *   - only article paths listed in the site's sitemap are accepted, so nobody can fill the
 *     database with made-up pages;
 *   - a visitor adds at most one view per article per day, and one of each reaction per
 *     article per day;
 *   - a "visitor" is HMAC(SALT, day + IP). The IP address is never stored, the hash changes
 *     every day, and the rows of earlier days are deleted by the daily cron;
 *   - writes are accepted only from the blog's own origin, as JSON, and every caller is rate
 *     limited per IP.
 */

// Reaction keys. The emoji for each key lives in the blog (layouts/partials/engagement.html).
const KINDS = ['fire', 'eyes', 'bulb', 'target'];

// Article URLs as Hugo writes them: /posts/<slug>/ and /write-up/<slug>/
const PATH_RE = /^\/(?:posts|write-up)\/[a-z0-9][a-z0-9._-]{0,120}\/$/;

// Clients that say they are not a person. They get the numbers but are not counted.
const BOT_RE = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|curl|wget|python|go-http|okhttp|java\/|node-fetch|axios|libwww|httpclient|scrapy|facebookexternalhit|whatsapp|telegram/i;

const SITEMAP_MAX_AGE = 10 * 60 * 1000; // the cached sitemap is trusted this long
const SITEMAP_MIN_GAP = 60 * 1000; // ... and is fetched at most this often
const SITEMAP_MAX_BYTES = 2 * 1024 * 1024;
const MAX_BODY_BYTES = 512;

// Lives as long as the isolate does; rebuilt from the sitemap when it is missing or stale.
const sitemap = { paths: new Set(), fetchedAt: 0, triedAt: 0, pending: null };

export default {
  async fetch(request, env) {
    try {
      return await handle(request, env);
    } catch (err) {
      console.error(err && err.stack ? err.stack : err);
      return json({ error: 'internal error' }, 500, corsFor(request, env));
    }
  },

  // Daily cleanup: nothing older than today is needed to decide who was already counted.
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(env.DB.prepare('DELETE FROM seen WHERE day < ?1').bind(today()).run());
  },
};

async function handle(request, env) {
  const url = new URL(request.url);
  const cors = corsFor(request, env);
  const fromBlog = 'Access-Control-Allow-Origin' in cors;
  const route = url.pathname;

  if (request.method === 'OPTIONS') {
    if (!fromBlog) return new Response(null, { status: 403 });
    return new Response(null, {
      status: 204,
      headers: {
        ...cors,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  if (route !== '/api/stats' && route !== '/api/view' && route !== '/api/react') {
    return json({ error: 'not found' }, 404, cors);
  }

  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (env.LIMITER) {
    const { success } = await env.LIMITER.limit({ key: ipKey(ip) });
    if (!success) return json({ error: 'too many requests' }, 429, cors);
  }

  if (route === '/api/stats') {
    if (request.method !== 'GET') return json({ error: 'method not allowed' }, 405, { ...cors, Allow: 'GET, OPTIONS' });
    const path = await knownPath(url.searchParams.get('path'), env);
    if (!path) return json({ error: 'unknown page' }, 404, cors);
    return json(await readStats(env, path), 200, cors);
  }

  // /api/view and /api/react change a number
  if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405, { ...cors, Allow: 'POST, OPTIONS' });
  if (!fromBlog) return json({ error: 'forbidden' }, 403, cors);
  if (!/^application\/json\b/i.test(request.headers.get('Content-Type') || '')) {
    return json({ error: 'expected application/json' }, 415, cors);
  }
  const body = await readJsonObject(request);
  if (!body) return json({ error: 'bad request' }, 400, cors);

  let kind = 'view';
  if (route === '/api/react') {
    kind = body.kind;
    if (typeof kind !== 'string' || !KINDS.includes(kind)) return json({ error: 'unknown reaction' }, 400, cors);
  }
  const path = await knownPath(body.path, env);
  if (!path) return json({ error: 'unknown page' }, 404, cors);

  const agent = request.headers.get('User-Agent') || '';
  if (!ip || !agent || BOT_RE.test(agent)) {
    return json({ ...(await readStats(env, path)), counted: false }, 200, cors);
  }
  if (!env.SALT) throw new Error('the SALT secret is not set');

  const day = today();
  const visitor = await visitorId(env.SALT, day, ip);
  return json(await count(env, path, kind, day, visitor), 200, cors);
}

// ---------- storage ----------

async function readStats(env, path) {
  const { results } = await env.DB.prepare('SELECT kind, n FROM counts WHERE path = ?1').bind(path).all();
  return toStats(results);
}

// Adds one to (path, kind) unless this visitor was already counted for it today, and returns
// the totals. The three statements run as one transaction.
async function count(env, path, kind, day, visitor) {
  const db = env.DB;
  const [, marked, totals] = await db.batch([
    db
      .prepare(
        `INSERT INTO counts (path, kind, n)
         SELECT ?1, ?2, 1
         WHERE NOT EXISTS (SELECT 1 FROM seen WHERE day = ?3 AND visitor = ?4 AND path = ?1 AND kind = ?2)
         ON CONFLICT (path, kind) DO UPDATE SET n = n + 1`,
      )
      .bind(path, kind, day, visitor),
    db.prepare('INSERT OR IGNORE INTO seen (day, visitor, path, kind) VALUES (?1, ?2, ?3, ?4)').bind(day, visitor, path, kind),
    db.prepare('SELECT kind, n FROM counts WHERE path = ?1').bind(path),
  ]);
  return { ...toStats(totals.results), counted: marked.meta.changes > 0 };
}

function toStats(rows) {
  const stats = { views: 0, reactions: Object.fromEntries(KINDS.map((k) => [k, 0])) };
  for (const row of rows || []) {
    if (row.kind === 'view') stats.views = row.n;
    else if (KINDS.includes(row.kind)) stats.reactions[row.kind] = row.n;
  }
  return stats;
}

// ---------- which pages exist ----------

// Returns the path when it is an article of the site, null otherwise.
async function knownPath(path, env) {
  if (typeof path !== 'string' || !PATH_RE.test(path)) return null;
  const now = Date.now();
  const fresh = now - sitemap.fetchedAt < SITEMAP_MAX_AGE;
  if (fresh && sitemap.paths.has(path)) return path;
  // Stale list, or a path that is not on it (a new article, or a made-up one): look again,
  // but not more than once a minute however many such requests arrive.
  if (now - sitemap.triedAt >= SITEMAP_MIN_GAP) {
    sitemap.triedAt = now;
    sitemap.pending = loadSitemap(env).finally(() => {
      sitemap.pending = null;
    });
  }
  if (sitemap.pending) await sitemap.pending;
  return sitemap.paths.has(path) ? path : null;
}

async function loadSitemap(env) {
  try {
    const res = await fetch(new URL('/sitemap.xml', env.SITE_ORIGIN), { headers: { 'User-Agent': 'blog-engagement' } });
    if (!res.ok) return;
    const xml = (await res.text()).slice(0, SITEMAP_MAX_BYTES);
    const paths = new Set();
    for (const match of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
      let pathname;
      try {
        pathname = new URL(match[1]).pathname;
      } catch {
        continue;
      }
      if (PATH_RE.test(pathname)) paths.add(pathname);
    }
    // An empty or broken sitemap never replaces a good list.
    if (paths.size > 0) {
      sitemap.paths = paths;
      sitemap.fetchedAt = Date.now();
    }
  } catch (err) {
    console.warn('sitemap refresh failed:', err && err.message);
  }
}

// ---------- who is asking ----------

function today() {
  return new Date().toISOString().slice(0, 10); // UTC
}

async function visitorId(salt, day, ip) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(salt), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(`${day}|${ipKey(ip)}`)));
  return Array.from(mac.subarray(0, 16), (b) => b.toString(16).padStart(2, '0')).join('');
}

// One key per IPv4 address and per IPv6 /64, because a single IPv6 user owns a whole /64.
function ipKey(ip) {
  if (!ip.includes(':')) return ip;
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(ip);
  if (mapped) return mapped[1];
  const [head, tail] = ip.split('::');
  const left = head ? head.split(':') : [];
  const right = tail ? tail.split(':') : [];
  const groups = tail === undefined ? left : [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill('0'), ...right];
  return groups.slice(0, 4).map((g) => (parseInt(g, 16) || 0).toString(16)).join(':') + '::/64';
}

// ---------- http ----------

function corsFor(request, env) {
  const origin = request.headers.get('Origin');
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  return origin && allowed.includes(origin) ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : { Vary: 'Origin' };
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    },
  });
}

// Reads a small JSON object; anything larger than MAX_BODY_BYTES or not an object gives null.
async function readJsonObject(request) {
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    const value = JSON.parse(new TextDecoder().decode(bytes));
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}
