/* ============================================================
   Castilla Glass — Imagine It Visualizer
   ============================================================ */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const CONTACT = { email: "Dcastilla89@yahoo.com", phone: "+13052190308" };

  /* ----- catalog ----- */
  const PRODUCTS = {
    railing:    { name: "Glass Railing",    icon: "🛡️", frame: "none",   ratio: 2.6, w: 0.62,
                  decor: [{ k: "rail", y: -0.02 }, { k: "post", x: 0.03 }, { k: "post", x: 0.355 }, { k: "post", x: 0.68 }, { k: "post", x: 0.985 }] },
    shower:     { name: "Frameless Shower", icon: "🚿", frame: "none",   ratio: 0.78, w: 0.34,
                  decor: [{ k: "handle", x: 0.86, y: 0.36, h: 0.28 }] },
    window:     { name: "Impact Window",    icon: "🪟", frame: "sash",   ratio: 1.05, w: 0.34,
                  decor: [{ k: "vline", x: 0.5 }, { k: "hline", y: 0.5 }] },
    storefront: { name: "Storefront",       icon: "🏢", frame: "framed", ratio: 2.2, w: 0.7,
                  decor: [{ k: "vline", x: 0.34 }, { k: "vline", x: 0.67 }] },
  };
  const GLASS = {
    clear:   { name: "Clear" },
    lowiron: { name: "Low-iron" },
    frosted: { name: "Frosted" },
    tinted:  { name: "Tinted" },
  };
  const FINISH = {
    chrome: { name: "Chrome", grad: "linear-gradient(180deg,#e9e9ef,#9aa0aa 50%,#e9e9ef)", solid: "#c8ccd2" },
    black:  { name: "Matte Black", grad: "linear-gradient(180deg,#2a2a2c,#101012 50%,#2a2a2c)", solid: "#1a1a1a" },
    nickel: { name: "Brushed Nickel", grad: "linear-gradient(180deg,#d7dadf,#9fa3aa 50%,#d7dadf)", solid: "#b7bbc1" },
    gold:   { name: "Gold/Brass", grad: "linear-gradient(180deg,#f3d27a,#c69a44 50%,#f3d27a)", solid: "#d8b35a" },
  };

  /* ----- state ----- */
  const state = { product: "railing", glass: "clear", finish: "chrome", piece: null, aiSrc: null };

  /* ----- elements ----- */
  const stage = $("#stage"), photo = $("#photo"), dropzone = $("#dropzone"),
        glassLayer = $("#glassLayer"), fileInput = $("#fileInput"),
        renderOverlay = $("#renderOverlay"), renderMsg = $("#renderMsg"),
        compareBadge = $("#compareBadge"), stageHint = $("#stageHint");

  /* ----- render chips ----- */
  $("#productChips").innerHTML = Object.entries(PRODUCTS)
    .map(([k, p]) => `<button class="chip" data-product="${k}">${p.icon} ${p.name}</button>`).join("");
  $("#glassChips").innerHTML = Object.entries(GLASS)
    .map(([k, g]) => `<button class="chip" data-glass="${k}">${g.name}</button>`).join("");
  $("#finishChips").innerHTML = Object.entries(FINISH)
    .map(([k, f]) => `<button class="chip" data-finish="${k}"><span class="sw" style="background:${f.grad}"></span>${f.name}</button>`).join("");

  const setActive = (sel, attr, val) => $$(sel).forEach((c) => c.classList.toggle("on", c.dataset[attr] === val));

  /* ----- photo loading ----- */
  function loadImage(src, suggest) {
    photo.onload = () => {
      dropzone.style.display = "none";
      photo.hidden = false;
      stageHint.hidden = false;
      if (suggest && PRODUCTS[suggest]) state.product = suggest;
      buildPiece();
      enableControls(true);
      setActive(".chip[data-product]", "product", state.product);
    };
    state.aiSrc = null;
    photo.src = src;
  }
  $("#uploadBtn").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (f) loadImage(URL.createObjectURL(f));
  });
  $$(".sample").forEach((b) => b.addEventListener("click", () => loadImage(b.dataset.sample, b.dataset.suggest)));
  // drag & drop
  ["dragover", "dragenter"].forEach((ev) => stage.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.add("drag"); }));
  ["dragleave", "drop"].forEach((ev) => stage.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.remove("drag"); }));
  stage.addEventListener("drop", (e) => {
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) loadImage(URL.createObjectURL(f));
  });

  function enableControls(on) {
    ["#renderBtn", "#compareBtn", "#resetBtn"].forEach((s) => { $(s).disabled = !on; });
  }

  /* ----- the glass piece ----- */
  function buildPiece() {
    glassLayer.innerHTML = "";
    const p = PRODUCTS[state.product];
    const rect = photoRect();
    const w = rect.w * p.w;
    const h = w / p.ratio;
    const el = document.createElement("div");
    el.className = "glass-piece sel";
    el.dataset.glass = state.glass;
    el.dataset.frame = p.frame;
    el.style.cssText = `left:${rect.x + (rect.w - w) / 2}px;top:${rect.y + (rect.h - h) / 2}px;width:${w}px;height:${h}px;--finish:${FINISH[state.finish].grad};`;
    el.innerHTML = `<div class="surf"></div><div class="sheen"></div><div class="frame"></div>`;
    // decor
    p.decor.forEach((d) => el.appendChild(decorEl(d)));
    const grip = document.createElement("div"); grip.className = "grip"; el.appendChild(grip);
    glassLayer.appendChild(el);
    state.piece = el;
    makeDraggable(el, grip);
  }

  function decorEl(d) {
    const e = document.createElement("div");
    const fin = "var(--finish)";
    if (d.k === "post") e.style.cssText = `position:absolute;top:-10%;bottom:0;left:${d.x * 100}%;width:6px;transform:translateX(-50%);background:${fin};border-radius:2px;box-shadow:0 2px 4px rgba(0,0,0,.4);`;
    else if (d.k === "rail") e.style.cssText = `position:absolute;left:-2%;right:-2%;top:${(d.y || 0) * 100}%;height:7px;background:${fin};border-radius:3px;box-shadow:0 2px 4px rgba(0,0,0,.4);`;
    else if (d.k === "vline") e.style.cssText = `position:absolute;top:0;bottom:0;left:${d.x * 100}%;width:5px;transform:translateX(-50%);background:${fin};`;
    else if (d.k === "hline") e.style.cssText = `position:absolute;left:0;right:0;top:${d.y * 100}%;height:5px;transform:translateY(-50%);background:${fin};`;
    else if (d.k === "handle") e.style.cssText = `position:absolute;left:${d.x * 100}%;top:${d.y * 100}%;height:${d.h * 100}%;width:8px;background:${fin};border-radius:4px;box-shadow:0 2px 6px rgba(0,0,0,.5);`;
    return e;
  }

  /* photo content rect within the stage (object-fit: contain) */
  function photoRect() {
    const sw = stage.clientWidth, sh = stage.clientHeight;
    const nw = photo.naturalWidth || 4, nh = photo.naturalHeight || 3;
    const scale = Math.min(sw / nw, sh / nh);
    const w = nw * scale, h = nh * scale;
    return { x: (sw - w) / 2, y: (sh - h) / 2, w, h };
  }

  /* ----- drag & resize ----- */
  function makeDraggable(el, grip) {
    let mode = null, sx, sy, sl, st, swd, sht;
    const down = (e, m) => {
      mode = m; const pt = e.touches ? e.touches[0] : e;
      sx = pt.clientX; sy = pt.clientY;
      sl = el.offsetLeft; st = el.offsetTop; swd = el.offsetWidth; sht = el.offsetHeight;
      el.classList.add("sel"); e.preventDefault(); e.stopPropagation();
      window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    };
    const move = (e) => {
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (mode === "drag") { el.style.left = sl + dx + "px"; el.style.top = st + dy + "px"; }
      else { const w = Math.max(40, swd + dx); el.style.width = w + "px"; el.style.height = w / PRODUCTS[state.product].ratio + "px"; }
    };
    const up = () => { mode = null; window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    el.addEventListener("pointerdown", (e) => down(e, "drag"));
    grip.addEventListener("pointerdown", (e) => down(e, "resize"));
  }

  /* ----- option chips ----- */
  $$(".chip[data-product]").forEach((c) => c.addEventListener("click", () => {
    state.product = c.dataset.product; setActive(".chip[data-product]", "product", state.product);
    if (!photo.hidden) buildPiece();
  }));
  $$(".chip[data-glass]").forEach((c) => c.addEventListener("click", () => {
    state.glass = c.dataset.glass; setActive(".chip[data-glass]", "glass", state.glass);
    if (state.piece) state.piece.dataset.glass = state.glass;
  }));
  $$(".chip[data-finish]").forEach((c) => c.addEventListener("click", () => {
    state.finish = c.dataset.finish; setActive(".chip[data-finish]", "finish", state.finish);
    if (state.piece) state.piece.style.setProperty("--finish", FINISH[state.finish].grad);
  }));
  setActive(".chip[data-product]", "product", state.product);
  setActive(".chip[data-glass]", "glass", state.glass);
  setActive(".chip[data-finish]", "finish", state.finish);

  /* ----- before / after compare ----- */
  const compareBtn = $("#compareBtn");
  const showBefore = (on) => { glassLayer.classList.toggle("hidden", on); compareBadge.hidden = !on; };
  ["pointerdown", "touchstart"].forEach((ev) => compareBtn.addEventListener(ev, (e) => { e.preventDefault(); showBefore(true); }));
  ["pointerup", "pointerleave", "touchend"].forEach((ev) => compareBtn.addEventListener(ev, () => showBefore(false)));

  $("#resetBtn").addEventListener("click", () => { if (!photo.hidden) buildPiece(); });

  /* ----- compose photo + mockup glass to a canvas ----- */
  function compose(maxW = 1280) {
    const nw = photo.naturalWidth, nh = photo.naturalHeight;
    const scale = Math.min(1, maxW / nw);
    const cw = Math.round(nw * scale), ch = Math.round(nh * scale);
    const cv = document.createElement("canvas"); cv.width = cw; cv.height = ch;
    const ctx = cv.getContext("2d");
    ctx.drawImage(photo, 0, 0, cw, ch);
    const pr = photoRect();
    const piece = state.piece;
    if (piece) {
      const toX = (px) => ((px - pr.x) / pr.w) * cw;
      const toY = (py) => ((py - pr.y) / pr.h) * ch;
      const x = toX(piece.offsetLeft), y = toY(piece.offsetTop);
      const w = (piece.offsetWidth / pr.w) * cw, h = (piece.offsetHeight / pr.h) * ch;
      const fin = FINISH[state.finish].solid, p = PRODUCTS[state.product];
      ctx.save();
      // glass fill
      const fills = { clear: "rgba(200,225,235,0.16)", lowiron: "rgba(228,244,248,0.12)", frosted: "rgba(248,250,252,0.55)", tinted: "rgba(16,18,28,0.44)" };
      ctx.fillStyle = fills[state.glass]; ctx.fillRect(x, y, w, h);
      // sheen
      const g = ctx.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0.28, "rgba(255,255,255,0)"); g.addColorStop(0.44, "rgba(255,255,255,0.30)");
      g.addColorStop(0.52, "rgba(255,255,255,0.05)"); g.addColorStop(0.66, "rgba(255,255,255,0)");
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
      // frame
      ctx.strokeStyle = fin;
      if (p.frame === "framed") { ctx.lineWidth = w * 0.018; ctx.strokeRect(x, y, w, h); }
      if (p.frame === "sash") { ctx.lineWidth = w * 0.024; ctx.strokeRect(x, y, w, h); }
      // decor
      ctx.fillStyle = fin; ctx.lineWidth = Math.max(2, w * 0.01);
      p.decor.forEach((d) => {
        if (d.k === "post") { ctx.fillRect(x + d.x * w - 3, y - h * 0.1, 5, h * 1.1); }
        else if (d.k === "rail") { ctx.fillRect(x - w * 0.02, y + (d.y || 0) * h, w * 1.04, 6); }
        else if (d.k === "vline") { ctx.fillRect(x + d.x * w - 2, y, 4, h); }
        else if (d.k === "hline") { ctx.fillRect(x, y + d.y * h - 2, w, 4); }
        else if (d.k === "handle") { ctx.fillRect(x + d.x * w, y + d.y * h, 7, d.h * h); }
      });
      ctx.restore();
    }
    return cv;
  }

  /* ----- download ----- */
  $("#downloadBtn").addEventListener("click", (e) => {
    if (photo.hidden) { e.preventDefault(); return; }
    e.currentTarget.href = state.aiSrc || compose().toDataURL("image/png");
  });

  /* ----- AI photoreal render ----- */
  $("#renderBtn").addEventListener("click", async () => {
    if (photo.hidden) return;
    renderOverlay.hidden = false; renderMsg.textContent = "Rendering your photoreal preview…";
    const image = compose(1280).toDataURL("image/jpeg", 0.9);
    try {
      const res = await fetch("/api/render", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, product: PRODUCTS[state.product].name, glass: GLASS[state.glass].name, finish: FINISH[state.finish].name }),
      });
      const data = await res.json();
      if (data.image) {
        state.aiSrc = data.image;
        photo.src = data.image;
        glassLayer.innerHTML = ""; state.piece = null;
        compareBadge.hidden = false; compareBadge.textContent = "AFTER · AI";
        renderOverlay.hidden = true;
      } else {
        renderMsg.innerHTML = (data.message || "Photoreal rendering isn’t enabled yet.") +
          "<br><br><button class='btn btn--ghost btn--sm' onclick=\"document.getElementById('renderOverlay').hidden=true\">Got it</button>";
      }
    } catch (err) {
      renderMsg.innerHTML = "Couldn’t reach the renderer. Your styled mockup still works — and you can send it for a quote.<br><br><button class='btn btn--ghost btn--sm' onclick=\"document.getElementById('renderOverlay').hidden=true\">Close</button>";
    }
  });

  /* ----- quote ----- */
  $("#quoteBtn").addEventListener("click", () => {
    const lines = [
      "Hi Daniel — I designed this in the Castilla Glass visualizer and I'd love a quote:",
      "",
      `• Project: ${PRODUCTS[state.product].name}`,
      `• Glass: ${GLASS[state.glass].name}`,
      `• Hardware finish: ${FINISH[state.finish].name}`,
      "",
      "I'll attach the screenshot of my design. My name / phone / address:",
      "",
    ].join("\n");
    const subject = encodeURIComponent(`Visualizer design — ${PRODUCTS[state.product].name}`);
    window.location.href = `mailto:${CONTACT.email}?subject=${subject}&body=${encodeURIComponent(lines)}`;
  });
})();
