/**
 * Castilla Glass Visualizer — photoreal render (OPTIONAL AI upgrade)
 * -----------------------------------------------------------------
 * The visualizer works fully without this (the styled mockup). This function
 * turns a user's mockup into a photorealistic image using Google's Gemini
 * image model ("Nano Banana").
 *
 * To enable:
 *   1. Get a key: https://aistudio.google.com/apikey
 *   2. Netlify → Site settings → Environment variables:
 *        GEMINI_API_KEY = your key
 *        (optional) GEMINI_MODEL = gemini-2.5-flash-image   ← current image model
 *   3. Redeploy. The "✨ Render photoreal" button now returns AI images.
 *
 * Routed from /api/render via netlify.toml. Without a key it returns a friendly
 * message and the front-end keeps the free mockup.
 */

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-image";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message:
          "Photoreal AI rendering isn't switched on yet. Add a GEMINI_API_KEY in Netlify to enable it — your styled mockup still works perfectly for getting a quote.",
      }),
    };
  }

  try {
    const { image, product, glass, finish } = JSON.parse(event.body || "{}");
    if (!image) return { statusCode: 400, body: JSON.stringify({ error: "No image" }) };

    const b64 = image.replace(/^data:image\/\w+;base64,/, "");
    const mime = (image.match(/^data:(image\/\w+);base64,/) || [])[1] || "image/jpeg";

    const prompt =
      `This photo contains a rough mockup of a ${product}. Re-render it as a photorealistic, ` +
      `professionally installed ${product} made of ${glass} glass with ${finish} hardware. ` +
      `Blend the glass naturally into the scene with realistic reflections, refraction, shadows ` +
      `and lighting that match the existing photo. Keep the rest of the photo (building, ` +
      `surroundings, perspective) unchanged and photorealistic. Output only the edited image.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }, { inline_data: { mime_type: mime, data: b64 } }] }],
        generationConfig: { responseModalities: ["IMAGE"] },
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      return { statusCode: 502, body: JSON.stringify({ error: "Upstream error", detail: detail.slice(0, 400) }) };
    }

    const data = await resp.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const img = parts.find((p) => p.inline_data || p.inlineData);
    const inline = img && (img.inline_data || img.inlineData);
    if (!inline) {
      return { statusCode: 200, body: JSON.stringify({ message: "The model didn't return an image — try again or tweak the design." }) };
    }
    const outMime = inline.mime_type || inline.mimeType || "image/png";
    return { statusCode: 200, body: JSON.stringify({ image: `data:${outMime};base64,${inline.data}` }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
