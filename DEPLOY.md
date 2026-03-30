# 4sale.love — Go Live in 10 Minutes

## What you're deploying
```
4sale-deploy/
├── index.html    ← Admin app (the 6-tab platform)
├── demo.html     ← Public demo (shareable)
├── widget.js     ← Embeddable script for business sites
└── vercel.json   ← Routing rules
```

---

## Step 1 — Vercel account (2 min)
1. Go to **vercel.com** → Sign up with GitHub (free)
2. Install Vercel CLI: `npm i -g vercel`
   - Or just use the web UI (drag & drop — no CLI needed)

---

## Step 2 — Deploy (1 min)

### Option A — Drag & Drop (easiest)
1. Go to **vercel.com/new**
2. Drag the entire `4sale-deploy/` folder onto the page
3. Click **Deploy**
4. You get a URL like `https://4sale-xyz.vercel.app` instantly

### Option B — CLI
```bash
cd 4sale-deploy
vercel
# Follow prompts → deployed in 30 seconds
```

---

## Step 3 — Connect your domain (3 min)
1. In Vercel dashboard → your project → **Settings → Domains**
2. Add `4sale.love`
3. Vercel shows you two DNS records to add
4. Go to your domain registrar (GoDaddy / Namecheap / wherever)
5. Add the records — usually takes < 5 minutes to propagate

**Result:**
- `4sale.love` → Admin app
- `4sale.love/demo` → Public demo
- `4sale.love/widget.js` → Embeddable widget

---

## Step 4 — Add your Anthropic API key (30 sec)
1. Open `4sale.love` in your browser
2. Click **⚙️ Settings** tab
3. Paste your Anthropic API key (`sk-ant-...`)
4. Click **Save Key**

The key is stored in your browser's localStorage — never sent to any server except Anthropic directly.

---

## Step 5 — Test it
1. Go to **🚀 Push** tab
2. Type: `"Sony headphones, barely used, has case"`
3. Click **Generate with AI** — real Claude response in ~3 seconds
4. Review the listing, hit **Push to Selected Platforms**

---

## Embed on a business site
Paste this anywhere in the site's HTML before `</body>`:
```html
<script src="https://4sale.love/widget.js"
  data-store="omar"
  data-color="#7c3aed"
  data-text="🏷️ List with 4sale.love"
></script>
```
Works on: Squarespace, Webflow, WordPress, Wix, Framer, raw HTML — anything.

---

## Future upgrades (when ready)
| Feature | What to add |
|---|---|
| Persist listings across sessions | Add Supabase (free tier) |
| Real storefront pages at `/u/omar` | Deploy `microsite/index.html` as separate route |
| Multi-user / B2B accounts | Add Supabase Auth |
| Real marketplace autofill | Load the Chrome extension |
| Payment / escrow on offers | Add Stripe |

None of these are required to go live. The core loop works today.

---

## Files already built (from earlier sessions)
- `extension/` — Chrome extension for marketplace autofill
- `microsite/` — Full storefront page (4sale.love/u/omar)
- `backend/` — FastAPI + Supabase backend (for when you scale)

Everything lives in `4sale-core/` from previous sessions.
