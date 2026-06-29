# Castilla Glass — “Imagine It” Visualizer

A standalone web app for **Castilla Glass** that lets a customer **see new glass on
their own home or business before it's installed** — then send the design for a
free quote.

> Separate app, same brand. Lives alongside the main marketing site
> (`junofrompluto/castillaglass`).

## What it does

1. **Upload a photo** of your space (or pick a sample) — drag-and-drop works too.
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

## Run locally

```bash
python3 -m http.server 8080   # then open http://localhost:8080
```
(The AI button needs Netlify’s function runtime — use `netlify dev` to test it locally.)

## Deploy (Netlify)

Import this repo in Netlify (publish `.`, no build command — see `netlify.toml`).
Link it from the main site’s nav as “Visualizer / Imagine It”.

**Contact:** (305) 219-0308 · Dcastilla89@yahoo.com
