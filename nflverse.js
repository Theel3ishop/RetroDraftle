const ALLOWED_YEAR = /^(200[0-9]|201[0-9]|202[0-5])$/;

export async function onRequestGet(context) {
  const year = new URL(context.request.url).searchParams.get('year') || '';
  if (!ALLOWED_YEAR.test(year)) {
    return Response.json({ error: 'Invalid season.' }, { status: 400 });
  }

  const upstreamUrl = `https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_${year}.csv`;
  const cacheKey = new Request(context.request.url, { method: 'GET' });
  const cached = await caches.default.match(cacheKey);
  if (cached) return cached;

  const upstream = await fetch(upstreamUrl, {
    headers: { 'User-Agent': 'Sunday-Draft-Club' },
  });
  if (!upstream.ok) {
    return Response.json({ error: `Could not load the ${year} archive.` }, { status: upstream.status });
  }

  const response = new Response(upstream.body, {
    headers: {
      'Cache-Control': 'public, max-age=86400',
      'Content-Type': 'text/csv; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
  context.waitUntil(caches.default.put(cacheKey, response.clone()));
  return response;
}