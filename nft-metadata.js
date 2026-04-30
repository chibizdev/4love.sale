// netlify/edge-functions/nft-metadata.js
// Serves dynamic ERC-721 metadata JSON at /api/nft/:handle
// Deploy this to Netlify Edge Functions
// Add to netlify.toml:
//   [[edge_functions]]
//     path = "/api/nft/*"
//     function = "nft-metadata"

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://sbwcjvdhacxkxbrckanv.supabase.co';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_KEY') || '';
const SITE_URL     = 'https://4sale.love';

export default async (request, context) => {
  const url    = new URL(request.url);
  const parts  = url.pathname.split('/').filter(Boolean);
  // /api/nft/:handle  or  /api/nft/:handle/image
  const handle = parts[2]?.toLowerCase();
  const isImage = parts[3] === 'image';

  if (!handle) {
    return new Response(JSON.stringify({ error: 'handle required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  // ── FETCH DATA FROM SUPABASE ──────────────────────────────────────────────
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data: user } = await sb
    .from('users').select('*').eq('username', handle).single();

  if (!user) {
    return new Response(JSON.stringify({ error: 'Handle not found' }), {
      status: 404, headers: { 'Content-Type': 'application/json' }
    });
  }

  const { data: listings } = await sb
    .from('listings').select('*')
    .eq('user_id', user.id).eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(10);

  const all      = listings || [];
  const featured = all[0];
  const items    = all.filter(l => !l.type || l.type === 'item');
  const services = all.filter(l => l.type === 'service');
  const rentals  = all.filter(l => l.type === 'rental');

  const storeName = user.store_name || user.username;
  const location  = user.location  || 'Chicago';

  // ── IMAGE ENDPOINT ─────────────────────────────────────────────────────────
  // Returns an SVG "sign card" as the NFT image
  if (isImage) {
    let design = {};
    try { design = JSON.parse(user.design || '{}'); } catch(e) {}
    const accent    = design.accent    || '#7c3aed';
    const green     = design.green     || '#16a34a';
    const profileBg = design.profileBg || '#0d0d0d';
    const avatar    = user.avatar      || '🏠';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${profileBg}"/>
      <stop offset="100%" style="stop-color:#1a0a2e"/>
    </linearGradient>
    <linearGradient id="rb" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#ff4d4d"/>
      <stop offset="16%"  stop-color="#ff9a00"/>
      <stop offset="32%"  stop-color="#ffe600"/>
      <stop offset="50%"  stop-color="#4ade80"/>
      <stop offset="66%"  stop-color="#38bdf8"/>
      <stop offset="83%"  stop-color="#818cf8"/>
      <stop offset="100%" stop-color="#e879f9"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="${green}"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="600" height="400" rx="24" fill="url(#bg)"/>

  <!-- Rainbow stripe -->
  <rect width="600" height="4" rx="2" fill="url(#rb)"/>

  <!-- Ambient glow -->
  <circle cx="520" cy="60" r="120" fill="${accent}" opacity="0.08"/>
  <circle cx="80"  cy="340" r="100" fill="${green}"  opacity="0.06"/>

  <!-- Avatar circle -->
  <rect x="40" y="40" width="64" height="64" rx="16" fill="url(#accent)" opacity="0.9"/>
  <text x="72" y="80" font-size="32" text-anchor="middle" dominant-baseline="middle">${avatar}</text>

  <!-- Store name -->
  <text x="120" y="60" font-family="Arial Black, sans-serif" font-size="22" font-weight="900" fill="white" letter-spacing="-0.5">${esc(storeName)}</text>

  <!-- Handle -->
  <text x="120" y="84" font-family="monospace" font-size="12" fill="rgba(255,255,255,0.4)">4sale.love/${handle}</text>

  <!-- Location -->
  <text x="120" y="100" font-family="Arial, sans-serif" font-size="11" fill="rgba(255,255,255,0.3)">📍 ${esc(location)}</text>

  <!-- Divider -->
  <line x1="40" y1="128" x2="560" y2="128" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>

  <!-- Stats -->
  <text x="60"  y="165" font-family="Arial Black,sans-serif" font-size="28" font-weight="900" fill="white">${items.length}</text>
  <text x="60"  y="183" font-family="Arial,sans-serif" font-size="10" fill="rgba(255,255,255,0.35)" letter-spacing="1">ITEMS</text>

  <text x="180" y="165" font-family="Arial Black,sans-serif" font-size="28" font-weight="900" fill="white">${services.length}</text>
  <text x="180" y="183" font-family="Arial,sans-serif" font-size="10" fill="rgba(255,255,255,0.35)" letter-spacing="1">SERVICES</text>

  <text x="300" y="165" font-family="Arial Black,sans-serif" font-size="28" font-weight="900" fill="white">${rentals.length}</text>
  <text x="300" y="183" font-family="Arial,sans-serif" font-size="10" fill="rgba(255,255,255,0.35)" letter-spacing="1">RENTALS</text>

  <!-- Status pill -->
  <rect x="430" y="144" width="100" height="28" rx="14" fill="rgba(74,222,128,0.15)" stroke="rgba(74,222,128,0.3)" stroke-width="1"/>
  <text x="480" y="158" font-family="Arial,sans-serif" font-size="10" font-weight="800" fill="#4ade80" text-anchor="middle" dominant-baseline="middle">● AVAILABLE</text>

  <!-- Featured item -->
  ${featured ? `
  <rect x="40" y="210" width="520" height="80" rx="12" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
  <text x="60" y="240" font-family="Arial,sans-serif" font-size="9" fill="rgba(255,255,255,0.3)" letter-spacing="1">FEATURED</text>
  <text x="60" y="262" font-family="Arial Black,sans-serif" font-size="15" font-weight="900" fill="white">${esc(featured.title.slice(0,40))}</text>
  <text x="60" y="280" font-family="Arial Black,sans-serif" font-size="22" font-weight="900" fill="${accent}">$${featured.price}</text>
  <text x="480" y="262" font-family="Arial,sans-serif" font-size="11" fill="rgba(255,255,255,0.5)" text-anchor="end">${esc(featured.condition||'Make offer')}</text>
  ` : `
  <rect x="40" y="210" width="520" height="80" rx="12" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.05)" stroke-width="1" stroke-dasharray="4,4"/>
  <text x="300" y="255" font-family="Arial,sans-serif" font-size="13" fill="rgba(255,255,255,0.25)" text-anchor="middle">No listings yet</text>
  `}

  <!-- 4sale branding -->
  <text x="40"  y="378" font-family="Arial Black,sans-serif" font-size="13" font-weight="900" fill="${accent}">4sale</text>
  <text x="80"  y="378" font-family="Arial Black,sans-serif" font-size="13" font-weight="900" fill="rgba(255,255,255,0.6)">.love</text>

  <!-- Base NFT badge -->
  <rect x="490" y="362" width="70" height="22" rx="11" fill="#1652f0" opacity="0.8"/>
  <text x="525" y="373" font-family="Arial,sans-serif" font-size="9" font-weight="800" fill="white" text-anchor="middle" dominant-baseline="middle">⬡ ON BASE</text>
</svg>`;

    return new Response(svg, {
      status: 200,
      headers: {
        'Content-Type':  'image/svg+xml',
        'Cache-Control': 'public, max-age=300',   // 5 min cache — dynamic
        'Access-Control-Allow-Origin': '*',
      }
    });
  }

  // ── JSON METADATA ENDPOINT ────────────────────────────────────────────────
  const metadata = {
    name:          `${storeName} — 4sale.love`,
    description:   user.bio
      || `${storeName}'s personal commerce page on 4sale.love. ${all.length} active listing${all.length !== 1 ? 's' : ''} — items, services & rentals.`,
    image:         `${SITE_URL}/api/nft/${handle}/image`,
    external_url:  `${SITE_URL}/${handle}`,
    animation_url: `${SITE_URL}/embed/${handle}`,   // live interactive embed
    background_color: '0d0d0d',

    attributes: [
      { trait_type: 'Handle',        value: handle },
      { trait_type: 'Status',        value: all.length > 0 ? 'Active' : 'Open' },
      { trait_type: 'City',          value: user.location || 'Chicago' },
      { trait_type: 'Total Listings',value: all.length,      display_type: 'number' },
      { trait_type: 'Items',         value: items.length,    display_type: 'number' },
      { trait_type: 'Services',      value: services.length, display_type: 'number' },
      { trait_type: 'Rentals',       value: rentals.length,  display_type: 'number' },
      { trait_type: 'Category',      value: rentals.length > 0 ? 'Rental' : services.length > 0 ? 'Service' : 'Marketplace' },
      { trait_type: 'Platform',      value: '4sale.love' },
      { trait_type: 'Network',       value: 'Base' },
      ...(featured ? [
        { trait_type: 'Featured Item',  value: featured.title },
        { trait_type: 'Featured Price', value: `$${featured.price}` },
      ] : []),
    ],
  };

  return new Response(JSON.stringify(metadata, null, 2), {
    status: 200,
    headers: {
      'Content-Type':  'application/json',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    }
  });
};

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
