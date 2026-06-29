/**
 * Street View proxy — fetches a Google Street View Static image server-side so
 * the browser gets it same-origin (no canvas taint → download + AI render work).
 *
 * Set MAPS_API_KEY in Netlify (a Maps Platform key with the Street View Static
 * API enabled). Routed from /api/streetview via netlify.toml.
 *   /api/streetview?lat=..&lng=..&heading=..&pitch=..&fov=..&size=1024x768
 */
exports.handler = async (event) => {
  const key = process.env.MAPS_API_KEY;
  if (!key) return { statusCode: 503, body: "MAPS_API_KEY not configured" };
  const p = event.queryStringParameters || {};
  if (!p.lat || !p.lng) return { statusCode: 400, body: "lat/lng required" };

  const size = /^\d{2,4}x\d{2,4}$/.test(p.size || "") ? p.size : "1024x768";
  const q = new URLSearchParams({
    size,
    location: `${p.lat},${p.lng}`,
    heading: p.heading || "0",
    pitch: p.pitch || "0",
    fov: p.fov || "80",
    source: "outdoor",
    return_error_code: "true",   // 404 instead of a "no imagery" gray image
    key,
  });

  try {
    const r = await fetch(`https://maps.googleapis.com/maps/api/streetview?${q}`);
    if (!r.ok) return { statusCode: r.status, body: "no street view imagery here" };
    const buf = Buffer.from(await r.arrayBuffer());
    return {
      statusCode: 200,
      headers: {
        "Content-Type": r.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
      body: buf.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (e) {
    return { statusCode: 500, body: String(e) };
  }
};
