# Castilla Glass — “Imagine It” Visualizer

A standalone web app for **Castilla Glass** that lets a customer **see new glass on
their own home or business before it's installed** — then send the design for a
free quote.

> Separate app, same brand. Lives alongside the main marketing site
> (`junofrompluto/castillaglass`).

## What it does

1. **Enter an address** → pulls the building from **Google Maps** (interactive
   Street View + an optional **photorealistic 3D model** of the location), and
   "📸 Use this view" loads it straight into the editor. *Or* **upload a photo**
   (or pick a sample) — drag-and-drop works too.
2. **Pick a project** — Glass Railing · Frameless Shower · Impact Window · Storefront.
3. **Style it** — glass type (Clear / Low-iron / Frosted / Tinted) and hardware
   finish (Chrome / Matte Black / Brushed Nickel / Gold).
4. **Place it** — drag the glass where it goes, pull the corner to resize.
5. **Compare** — hold “👁 Before/After”, **download** the image, or…
6. **✨ Render photoreal** — turn the mockup into an AI-generated photoreal image
   of *your* space (optional — see below).
7. **⚡ Get this quoted** — emails the design + specs to Daniel.

The styled mockup is **100% client-side** — no key, no backend, free and instant.

## Tech

Plain HTML/CSS/JS (Sora + Inter, brand red/black/white). No build step. The
glass overlay is rendered with CSS (backdrop-filter, gradients) and composited to
a canvas for download / AI input.

```
castillaglass-modeler/
├── index.html
├── assets/{css,js,img}
├── netlify/functions/render.js   # optional Gemini "Nano Banana" renderer
└── netlify.toml
```

## Enable Google Maps (address → Street View / 3D)

The address lookup, Street View, and 3D location view use **Google Maps
Platform**. You need a key with these APIs enabled: **Maps JavaScript API,
Places API, Street View (JS + Static), Map Tiles API** (for 3D). Billing must be
on (Google's $200/mo free credit covers light use).

Two places use it (a clean setup uses two keys, but one unrestricted key works):
1. **Browser key** → paste into [`assets/js/config.js`](assets/js/config.js)
   (`mapsBrowserKey`). Restrict it by **HTTP referrer** to your domain — then it's
   safe to commit. Powers autocomplete, Street View, and the 3D map.
2. **Server key** → Netlify env var **`MAPS_API_KEY`** (Street View Static API).
   Used by the `/api/streetview` proxy so the editor gets a same-origin,
   canvas-safe image (needed for download + AI render).

> No Maps key? The address box just shows a hint and the **photo-upload flow
> works exactly as before** — nothing breaks.

> **3D model:** uses Google's Photorealistic 3D Map element (alpha). If it isn't
> available for the key/area, the “🧊 3D model” button falls back to opening the
> location in Google Maps' 3D view.

## Optional: enable photoreal AI rendering (Gemini “Nano Banana”)

The “✨ Render photoreal” button calls a serverless function that uses Google's
Gemini image model to turn the mockup into a realistic photo. Without a key it
just tells the user the mockup is enough for a quote.

To switch it on:
1. Get a key at **https://aistudio.google.com/apikey**.
2. Netlify → **Site settings → Environment variables**:
   - `GEMINI_API_KEY` = your key
   - *(optional)* `GEMINI_MODEL` = `gemini-2.5-flash-image` *(use the current image model name)*
3. Redeploy.

> Model names evolve — if a render errors, set `GEMINI_MODEL` to the current
> image-capable Gemini model from Google AI Studio.

## Lock the site behind a login (username + password)

The whole app sits behind a one-user login, enforced by a Netlify **Edge
Function** ([`netlify/edge-functions/gate.js`](netlify/edge-functions/gate.js)).
Set the credentials in **Netlify → Site settings → Environment variables**:

| Variable | Value |
|---|---|
| `VIS_USER` | the username you want |
| `VIS_PASS` | the password you want |

Redeploy and the site shows a branded sign-in screen; a cookie remembers the
visitor for 14 days. Change either value anytime in Netlify (then redeploy) —
old sessions are invalidated automatically. Visit `/__logout` to sign out.

> Credentials live only in Netlify env vars — they're **never** sent to the
> browser. If `VIS_USER`/`VIS_PASS` aren't set, the gate stays open (public) so
> a fresh deploy can't lock you out. The login only runs on Netlify (Edge
> runtime), so the plain `python3` local server below is **not** gated — use
> `netlify dev` to test the login locally.

## Run locally

```bash
python3 -m http.server 8080   # then open http://localhost:8080
```
(The AI button needs Netlify’s function runtime — use `netlify dev` to test it locally.)

## Deploy (Netlify)

Import this repo in Netlify (publish `.`, no build command — see `netlify.toml`).
Link it from the main site’s nav as “Visualizer / Imagine It”.

**Contact:** (305) 219-0308 · Dcastilla89@yahoo.com
