/**
 * Login gate (Netlify Edge Function).
 *
 * Protects the whole site behind ONE username + password that you set in
 * Netlify → Site settings → Environment variables:
 *     VIS_USER   = the username
 *     VIS_PASS   = the password
 *
 * - Credentials live only on the server (env vars) — never shipped to the browser.
 * - A signed-ish cookie remembers the visitor for 14 days.
 * - Change the username or password anytime in Netlify; old cookies stop working.
 *
 * If VIS_USER / VIS_PASS are NOT set, the gate stays OPEN (site is public) so a
 * fresh deploy never locks you out. Set them to turn the lock on.
 */

const COOKIE = "cg_gate";
const MAX_AGE = 60 * 60 * 24 * 14; // 14 days

async function token(user, pass) {
  const data = new TextEncoder().encode(`${user}:${pass}:castilla-glass`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function readCookie(req, name) {
  const raw = req.headers.get("cookie") || "";
  const hit = raw.split(/;\s*/).find((c) => c.startsWith(name + "="));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : "";
}

function loginPage(error = "") {
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Castilla Glass · Sign in</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;800&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0}
  body{min-height:100vh;display:grid;place-items:center;background:
    radial-gradient(1200px 600px at 50% -10%, #10314f, #06121f 60%);
    color:#e9f2f8;font-family:Inter,system-ui,sans-serif;padding:24px}
  .card{width:100%;max-width:380px;background:#0b2138;border:1px solid rgba(233,242,248,.12);
    border-radius:18px;padding:34px 30px;box-shadow:0 30px 80px rgba(0,0,0,.55)}
  .brand{display:flex;align-items:center;gap:12px;margin-bottom:6px}
  .brand img{width:42px;height:42px;border-radius:50%;
    box-shadow:0 0 0 1px rgba(233,242,248,.15),0 0 40px -8px rgba(91,200,235,.7)}
  h1{font-family:Anton,sans-serif;font-size:1.5rem;font-weight:400;letter-spacing:.02em;text-transform:uppercase}
  p.sub{color:#7e96a8;font-size:.85rem;margin:4px 0 22px}
  label{display:block;font-size:.74rem;text-transform:uppercase;letter-spacing:.08em;
    color:#7e96a8;margin:14px 0 6px}
  input{width:100%;background:#06121f;border:1px solid rgba(233,242,248,.14);color:#e9f2f8;
    border-radius:10px;padding:12px 13px;font-size:.95rem;font-family:inherit}
  input:focus{outline:none;border-color:#5bc8eb;box-shadow:0 0 0 3px rgba(91,200,235,.25)}
  button{width:100%;margin-top:22px;background:linear-gradient(135deg,#5bc8eb,#2e95cb);
    color:#06121f;border:0;border-radius:11px;padding:13px;font-family:Inter,sans-serif;
    font-weight:800;font-size:.95rem;cursor:pointer;transition:filter .15s}
  button:hover{filter:brightness(1.08)}
  .err{background:rgba(91,200,235,.12);border:1px solid rgba(91,200,235,.4);color:#86dbf5;
    border-radius:9px;padding:9px 11px;font-size:.82rem;margin-bottom:6px}
</style></head><body>
  <form class="card" method="POST" action="/__login">
    <div class="brand"><img src="/assets/img/cg-badge.png" alt="Castilla Glass"><h1>Castilla Glass</h1></div>
    <p class="sub">Imagine It Visualizer — please sign in.</p>
    ${error ? `<div class="err">${error}</div>` : ""}
    <label for="u">Username</label>
    <input id="u" name="user" autocomplete="username" autofocus required>
    <label for="p">Password</label>
    <input id="p" name="pass" type="password" autocomplete="current-password" required>
    <button type="submit">Enter →</button>
  </form>
</body></html>`;
}

export default async function gate(request, context) {
  const user = Deno.env.get("VIS_USER");
  const pass = Deno.env.get("VIS_PASS");

  // Not configured → leave the site public (don't lock anyone out).
  if (!user || !pass) return context.next();

  const url = new URL(request.url);

  // Let the login screen's own logo load even while the site is locked.
  if (url.pathname === "/assets/img/cg-badge.png" || url.pathname === "/assets/img/cg-crest-white.png") {
    return context.next();
  }

  const want = await token(user, pass);

  // Logout
  if (url.pathname === "/__logout") {
    return new Response(null, {
      status: 302,
      headers: {
        location: "/",
        "set-cookie": `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`,
      },
    });
  }

  // Login submit
  if (request.method === "POST" && url.pathname === "/__login") {
    const body = new URLSearchParams(await request.text());
    const ok = body.get("user") === user && body.get("pass") === pass;
    if (ok) {
      return new Response(null, {
        status: 302,
        headers: {
          location: "/",
          "set-cookie": `${COOKIE}=${want}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
        },
      });
    }
    return new Response(loginPage("Wrong username or password."), {
      status: 401,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  // Already signed in?
  if (readCookie(request, COOKIE) === want) return context.next();

  // Otherwise show the login screen.
  return new Response(loginPage(), {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export const config = { path: "/*" };
