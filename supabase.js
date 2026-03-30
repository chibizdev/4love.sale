// ═══════════════════════════════════════════════════════════════════════════
//  4sale.love — Supabase Integration Module
//  Drop this BEFORE </body> in index.html, auth.html, and analytics.html:
//  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
//  <script src="supabase.js"></script>
//
//  SETUP (5 min):
//  1. supabase.com → New Project (free)
//  2. Settings → API → copy Project URL and anon key
//  3. Paste them below
//  4. SQL Editor → paste contents of 4sale-supabase-setup.sql → Run
// ═══════════════════════════════════════════════════════════════════════════

// ── YOUR CREDENTIALS — PASTE HERE ─────────────────────────────────────────
const SUPABASE_URL  = 'https://YOUR_PROJECT_ID.supabase.co';  // ← paste here
const SUPABASE_ANON = 'YOUR_ANON_PUBLIC_KEY';                 // ← paste here

// Also store in localStorage so auth.html and analytics.html pick them up
if (SUPABASE_URL !== 'https://YOUR_PROJECT_ID.supabase.co') {
  localStorage.setItem('4sl_url',  SUPABASE_URL);
  localStorage.setItem('4sl_anon', SUPABASE_ANON);
}

const db = supabase.createClient(
  localStorage.getItem('4sl_url')  || SUPABASE_URL,
  localStorage.getItem('4sl_anon') || SUPABASE_ANON
);

// ── AUTH STATE ─────────────────────────────────────────────────────────────
let CURRENT_USER = null;

db.auth.onAuthStateChange(async (event, session) => {
  if (session?.user) {
    // Load full profile
    const { data } = await db.from('users').select('*').eq('email', session.user.email).single();
    CURRENT_USER = data;
    if (data) {
      onUserLoaded(data);
    } else if (event === 'SIGNED_IN') {
      // New user — profile not created yet, redirect to auth to complete
      window.location.href = '/auth.html';
    }
  } else {
    CURRENT_USER = null;
    // Redirect to login if on a protected page
    const protectedPages = ['/', '/index.html'];
    if (protectedPages.includes(window.location.pathname)) {
      window.location.href = '/auth.html';
    }
  }
});

function onUserLoaded(user) {
  // Update all username displays
  document.querySelectorAll('[data-username]').forEach(el => el.textContent = user.username);
  document.querySelectorAll('[data-storename]').forEach(el => el.textContent = user.store_name);
  document.querySelectorAll('[data-storeurl]').forEach(el  => el.textContent = `4sale.love/${user.username}`);

  // Update nav user chip if present
  const navUser = document.getElementById('nav-user');
  if (navUser) navUser.textContent = user.store_name || user.username;

  // Update logo storefront link
  const logoLink = document.getElementById('logo-store-link');
  if (logoLink) logoLink.textContent = `4sale.love/${user.username}`;

  // Load live listings from Supabase instead of hardcoded demo data
  loadUserListings(user.id);

  // Update last active timestamp
  db.from('users').update({ last_active_at: new Date().toISOString() }).eq('id', user.id);
}

// ── LISTINGS ───────────────────────────────────────────────────────────────
async function loadUserListings(userId) {
  const { data, error } = await db
    .from('listings')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error || !data?.length) return; // stay on demo data

  // Map Supabase rows → app listing format
  window.LS = data.map(row => ({
    id:        row.id,
    em:        emojiForCategory(row.category),
    title:     row.title,
    price:     Math.round((row.ask_price || 0) / 100),
    cond:      row.condition || 'Good',
    cat:       row.category || 'other',
    views:     row.views_count || 0,
    slug:      row.slug,
    desc:      row.description || '',
    pl:        Math.round((row.ebay_comp_low  || 0) / 100),
    ph:        Math.round((row.ebay_comp_high || 0) / 100),
    ps:        Math.round((row.ai_suggested_price || 0) / 100),
    rationale: row.ai_rationale || '',
    tags:      row.tags || [],
    brand:     row.brand || '',
    markets:   row.platforms_pushed || [],
  }));

  // Re-render dashboard with real data
  if (typeof renderDash === 'function') renderDash();
  if (typeof renderSF   === 'function' && document.getElementById('page-storefront')?.classList.contains('on')) renderSF();

  // Update dashboard stats
  updateDashStats(data);
}

function updateDashStats(listings) {
  const active = listings.filter(l => l.status === 'active').length;
  const views  = listings.reduce((s, l) => s + (l.views_count || 0), 0);
  const plats  = new Set(listings.flatMap(l => l.platforms_pushed || [])).size;

  // Update stat cards if they have data-stat attributes
  const s1 = document.querySelector('[data-stat="listings"]');
  const s2 = document.querySelector('[data-stat="platforms"]');
  const s3 = document.querySelector('[data-stat="views"]');
  if (s1) s1.textContent = active;
  if (s2) s2.textContent = plats;
  if (s3) s3.textContent = views;
}

// ── SAVE LISTING ───────────────────────────────────────────────────────────
async function saveListing(listingData, slug) {
  if (!CURRENT_USER) return null;
  const { data, error } = await db.from('listings').insert({
    user_id:             CURRENT_USER.id,
    slug,
    title:               listingData.title,
    description:         listingData.description,
    category:            listingData.category || 'other',
    condition:           listingData.condition,
    brand:               listingData.brand || '',
    ask_price:           Math.round((listingData.price || 0) * 100),
    ai_suggested_price:  Math.round((listingData.ps    || 0) * 100),
    ai_rationale:        listingData.rationale || '',
    ebay_comp_low:       Math.round((listingData.pl    || 0) * 100),
    ebay_comp_high:      Math.round((listingData.ph    || 0) * 100),
    tags:                listingData.tags || [],
    city:                CURRENT_USER.city,
    status:              'active',
    platforms_pushed:    [],
    created_at:          new Date().toISOString(),
  }).select().single();

  if (!error && data) {
    track('listing_created', { listing_id:data.id, category:data.category, ask_price:listingData.price });
    return data;
  }
  return null;
}

// ── TRACK PLATFORM POST ────────────────────────────────────────────────────
async function trackPlatformPost(listingId, platform) {
  const { data: listing } = await db.from('listings').select('platforms_pushed').eq('id', listingId).single();
  const platforms = [...new Set([...(listing?.platforms_pushed || []), platform])];
  await db.from('listings').update({ platforms_pushed: platforms }).eq('id', listingId);
  track('platform_posted', { listing_id: listingId, platform });
}

// ── SAVE NEGOTIATION ───────────────────────────────────────────────────────
async function saveNegotiation(thread) {
  if (!CURRENT_USER) return;
  const opening = thread.messages.find(m => m.role==='buyer' && m.price)?.price || 0;
  const closing = [...thread.messages].reverse().find(m => m.role==='seller' && m.price)?.price || null;

  await db.from('negotiations').insert({
    listing_id:       thread.listingId || null,
    buyer_name:       thread.buyerName,
    opening_offer:    Math.round(opening * 100),
    closing_price:    closing ? Math.round(closing * 100) : null,
    round_count:      thread.round || 0,
    outcome:          thread.status === 'closed' ? 'accepted' : thread.status === 'active' ? 'pending' : 'declined',
    ai_handled:       !thread.sellerIntervened,
    strategy_used:    document.getElementById('neg-strategy')?.value || 'moderate',
    messages:         thread.messages,
    created_at:       new Date().toISOString(),
  });
}

// ── MARK SOLD ──────────────────────────────────────────────────────────────
async function markSold(listingId, finalPrice) {
  await db.from('listings').update({
    status:      'sold',
    final_price: Math.round(finalPrice * 100),
    sold_at:     new Date().toISOString(),
  }).eq('id', listingId);
  track('listing_sold', { listing_id: listingId, final_price: finalPrice });
}

// ── INCREMENT VIEW ─────────────────────────────────────────────────────────
async function incrementView(slug) {
  await db.rpc('increment_views', { listing_slug: slug });
}

// ── ANALYTICS EVENTS ───────────────────────────────────────────────────────
const SESSION_ID  = 'sess_' + Math.random().toString(36).slice(2, 10);
const EVENT_QUEUE = [];
let flushTimer;

function track(eventType, props = {}) {
  EVENT_QUEUE.push({
    user_id:    CURRENT_USER?.id || null,
    event_type: eventType,
    properties: { ...props, app_version: '1.0' },
    session_id: SESSION_ID,
    referrer:   document.referrer || null,
    created_at: new Date().toISOString(),
  });
  clearTimeout(flushTimer);
  flushTimer = setTimeout(flushEvents, 2000);

  // Also fire PostHog if loaded
  if (window.posthog) window.posthog.capture(eventType, props);
}

async function flushEvents() {
  if (!EVENT_QUEUE.length) return;
  const batch = EVENT_QUEUE.splice(0, 50);
  try { await db.from('events').insert(batch); }
  catch { /* analytics failure never crashes app */ }
}

// Flush on page hide
document.addEventListener('visibilitychange', () => { if (document.hidden) flushEvents(); });
window.addEventListener('pagehide', flushEvents);

// ── SIGN OUT ───────────────────────────────────────────────────────────────
async function signOut() {
  await db.auth.signOut();
  localStorage.removeItem('4sl_url');
  localStorage.removeItem('4sl_anon');
  window.location.href = '/auth.html';
}

// ── UTILS ──────────────────────────────────────────────────────────────────
function emojiForCategory(cat) {
  const map = { electronics:'📱', furniture:'🛋️', appliances:'🥤', services:'🏠', clothing:'👕', sports:'🏋️', other:'📦' };
  return map[cat] || '📦';
}

// ── EXPOSE GLOBALS ─────────────────────────────────────────────────────────
window.db               = db;
window.getCurrentUser   = () => CURRENT_USER;
window.saveListing      = saveListing;
window.trackPlatformPost= trackPlatformPost;
window.saveNegotiation  = saveNegotiation;
window.markSold         = markSold;
window.incrementView    = incrementView;
window.track            = track;
window.signOut          = signOut;

// ── PAGE LOAD TRACKING ─────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  track('page_view', { path: window.location.pathname });
});

console.log('✅ 4sale.love Supabase module loaded!');
