// design.html: try stones from live stock on a real kitchen photo.
// The countertops, backsplash and cabinets in the photo are re-colored on a canvas. The photo's own
// light and shadow are kept, so the chosen stone and color sit naturally in the room.
(() => {
  const { inventory, swatch, stoneCanvas, esc } = window.OSS;
  const $ = (id) => document.getElementById(id);
  const S = { stones: [], type: "quartz", pick: null, cab: "#F4F3EE", cabName: "white", splash: "match" };
  const W = 1206, H = 690;

  /* Areas of img/design-kitchen.jpg, in photo pixels. Each area is a polygon, minus "holes" for things
     standing in front of it. "keep" boxes hold objects like cutting boards and the faucet: inside them,
     only pixels that look like the object (wood colored or very dark) are left as they are. */
  const R = (x1, y1, x2, y2) => [[x1, y1], [x2, y1], [x2, y2], [x1, y2]];
  const AREAS = {
    uppers:   { polys: [R(221, 4, 853, 171), R(221, 182, 853, 272)], holes: [], keep: [] },
    tall:     { polys: [R(866, 8, 984, 268), R(866, 446, 984, 472)], holes: [], keep: [] },
    base:     { polys: [R(200, 441, 862, 475)], holes: [], keep: [R(418, 438, 530, 478)] },
    splash:   { polys: [R(222, 280, 850, 427)], holes: [], bowls: [R(222, 396, 270, 430)], keep: [R(256, 328, 366, 430), R(776, 328, 858, 430), R(436, 408, 655, 430), R(498, 358, 528, 430)] },
    counter:  { polys: [R(197, 427, 866, 441)], holes: [], bowls: [R(222, 424, 270, 434)], keep: [R(436, 418, 655, 441), R(498, 425, 528, 441), R(256, 420, 366, 436), R(776, 420, 858, 436)] },
    islandTop:{ polys: [[[150, 475], [1100, 475], [1194, 522], [9, 522]]],
                holes: [], bowls: [R(327, 466, 370, 497), R(822, 458, 879, 493)],
                keep: [R(133, 468, 247, 501), R(418, 438, 530, 499), R(406, 470, 770, 494), R(810, 474, 900, 501)] },
    islandEdge:{ polys: [[[9, 522], [1194, 522], [1191, 545], [13, 545]]], holes: [], keep: [] },
    islandFront:{ polys: [R(142, 543, 1013, 690)], holes: [], keep: [] },
  };
  const STONE_AREAS = ["counter", "islandTop", "islandEdge", "islandFront"];
  const CAB_AREAS = ["uppers", "tall", "base"];

  const cv = $("roomCanvas"), ctx = cv.getContext("2d", { willReadFrequently: true });
  let base = null, light = null, masks = {}, means = {}, stoneCache = new Map();

  function maskOf(a) {
    const m = document.createElement("canvas"); m.width = W; m.height = H; const c = m.getContext("2d");
    const path = (p) => { c.beginPath(); p.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill(); };
    c.fillStyle = "#fff"; a.polys.forEach(path);
    c.globalCompositeOperation = "destination-out"; a.holes.forEach(path);
    const d = c.getImageData(0, 0, W, H).data, out = new Uint8Array(W * H);
    for (let i = 0; i < out.length; i++) out[i] = d[i * 4 + 3];
    // inside "keep" boxes, leave the object's own pixels (plus a 1px edge) untouched
    const boxes = a.keep.map((b) => [b, false]).concat((a.bowls || []).map((b) => [b, true]));
    for (const [box, bowl] of boxes) {
      const [x1, y1] = box[0], [x2, y2] = box[2], obj = [];
      for (let y = y1; y < y2; y++) for (let x = x1; x < x2; x++) if (isObject(y * W + x, bowl)) obj.push([x, y]);
      for (const [x, y] of obj) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H) out[yy * W + xx] = 0; }
    }
    return out;
  }
  // An object pixel is wood colored (clearly saturated) or very dark (faucet, sink, cooktop).
  // Grey bowls are told apart from the white stone by being darker.
  function isObject(i, bowl) {
    const r = base[i * 4], g = base[i * 4 + 1], b = base[i * 4 + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    return mx < (bowl ? 185 : 90) || (mx > 0 && (mx - mn) / mx > 0.2);
  }
  // Blurred brightness of the photo: the room's light and shadow without the old marble veins.
  function lightMap(px) {
    let a = new Float32Array(W * H), b = new Float32Array(W * H);
    for (let i = 0; i < a.length; i++) a[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
    const r = 24;
    for (let pass = 0; pass < 3; pass++) {
      for (let y = 0; y < H; y++) { let s = 0, n = 0; const o = y * W;
        for (let x = -r; x < W; x++) { if (x + r < W) { s += a[o + x + r]; n++; } if (x - r - 1 >= 0) { s -= a[o + x - r - 1]; n--; } if (x >= 0) b[o + x] = s / n; } }
      for (let x = 0; x < W; x++) { let s = 0, n = 0;
        for (let y = -r; y < H; y++) { if (y + r < H) { s += b[(y + r) * W + x]; n++; } if (y - r - 1 >= 0) { s -= b[(y - r - 1) * W + x]; n--; } if (y >= 0) a[y * W + x] = s / n; } }
    }
    return a;
  }
  function solid(color) { const c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d"); g.fillStyle = color; g.fillRect(0, 0, W, H); return g.getImageData(0, 0, W, H).data; }
  function tiles() {
    const c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d");
    g.fillStyle = "#F7F6F2"; g.fillRect(0, 0, W, H); g.strokeStyle = "#D9D6CE"; g.lineWidth = 1.4;
    for (let y = 0, row = 0; y < H; y += 18, row++) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
      for (let x = row % 2 ? 0 : 18; x < W; x += 36) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 18); g.stroke(); } }
    return g.getImageData(0, 0, W, H).data;
  }
  function stonePixels(pick) {
    const key = pick.title;
    if (!stoneCache.has(key)) stoneCache.set(key, stoneCanvas(pick.lot, W, H).getContext("2d").getImageData(0, 0, W, H).data);
    return stoneCache.get(key);
  }

  function paint(out, area, src) {
    const m = masks[area], M = means[area];
    for (let i = 0; i < m.length; i++) {
      const a = m[i]; if (!a) continue;
      const f = 0.95 * Math.min(1.45, Math.max(0.45, 1 + (light[i] / M - 1) * 0.8)), k = a / 255, j = i * 4;
      out[j] = out[j] * (1 - k) + Math.min(255, src[j] * f) * k;
      out[j + 1] = out[j + 1] * (1 - k) + Math.min(255, src[j + 1] * f) * k;
      out[j + 2] = out[j + 2] * (1 - k) + Math.min(255, src[j + 2] * f) * k;
    }
  }
  function render() {
    if (!base) return;
    const img = new ImageData(new Uint8ClampedArray(base), W, H), out = img.data;
    const cab = solid(S.cab);
    CAB_AREAS.forEach((a) => paint(out, a, cab));
    if (S.pick) {
      const st = stonePixels(S.pick);
      STONE_AREAS.forEach((a) => paint(out, a, st));
      paint(out, "splash", S.splash === "match" ? st : S.splash === "tile" ? tiles() : solid("#E8E4DC"));
    }
    ctx.putImageData(img, 0, 0);
  }

  function summary() {
    const name = S.pick ? S.pick.title : null;
    const splash = S.splash === "match" ? "matching backsplash" : S.splash === "tile" ? "white tile backsplash" : "painted wall";
    $("lookName").textContent = name ? `${name} countertops with ${S.cabName} cabinets` : "Pick a countertop to see it on the kitchen.";
    $("quoteLook").href = name ? `contact.html?slab=${encodeURIComponent(`${name} (${S.cabName} cabinets, ${splash})`)}` : "contact.html";
    $("roomNote").textContent = name ? `${name} · ${S.cabName} cabinets · ${splash}` : "Pick a countertop";
  }
  const update = () => { summary(); requestAnimationFrame(render); };

  function renderStones() {
    const list = S.stones.filter((s) => s.type === S.type || (S.type === "quartz" && s.type === "printed")).slice(0, 30);
    $("stonePick").innerHTML = list.length ? list.map((s) => `<button type="button" class="sp ${S.pick && S.pick.title === s.title ? "on" : ""}" data-title="${esc(s.title)}" aria-pressed="${!!(S.pick && S.pick.title === s.title)}">
      <span class="sp-sw" style="${esc(swatch(s.lot))}" aria-hidden="true"></span><span class="sp-n">${esc(s.title)}</span><span class="sp-f">${s.free} slab${s.free === 1 ? "" : "s"}</span></button>`).join("")
      : `<p class="note-sm">None of this stone is in stock right now.</p>`;
  }
  const press = (bar, b) => bar.querySelectorAll("button").forEach((x) => x.setAttribute(x.getAttribute("role") === "radio" ? "aria-checked" : "aria-pressed", String(x === b)));

  $("cabOpts").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; S.cab = b.dataset.cab; S.cabName = b.dataset.name; press($("cabOpts"), b); update(); });
  $("splashOpts").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; S.splash = b.dataset.splash; press($("splashOpts"), b); update(); });
  $("stoneType").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; S.type = b.dataset.t; press($("stoneType"), b); renderStones(); });
  $("stonePick").addEventListener("click", (e) => { const b = e.target.closest("button[data-title]"); if (!b) return; S.pick = S.stones.find((s) => s.title === b.dataset.title); renderStones(); update(); });

  // Load the photo, then work out the light map and the areas once.
  const photo = new Image();
  photo.onload = () => {
    ctx.drawImage(photo, 0, 0, W, H);
    base = ctx.getImageData(0, 0, W, H).data.slice();
    light = lightMap(base);
    for (const [k, a] of Object.entries(AREAS)) {
      masks[k] = maskOf(a); let s = 0, n = 0;
      for (let i = 0; i < masks[k].length; i++) if (masks[k][i] > 200) { s += light[i]; n++; }
      means[k] = n ? s / n : 128;
    }
    update();
  };
  photo.onerror = () => { $("roomNote").textContent = "The kitchen photo didn't load. Refresh the page to try again."; };
  photo.src = "img/design-kitchen.jpg";

  summary();
  inventory().then(({ lots }) => {
    const by = new Map();
    for (const l of lots) if (l.free > 0 && l.type !== "other" && l.type !== "onyx") { const g = by.get(l.title) || { title: l.title, type: l.type, free: 0, lot: l }; g.free += l.free; by.set(l.title, g); }
    S.stones = [...by.values()].sort((a, b) => b.free - a.free);
    S.pick = S.stones.find((s) => s.type === "quartz") || S.stones[0] || null;
    renderStones(); update();
  }).catch((e) => { console.warn("inventory:", e.message); $("stonePick").innerHTML = `<p class="note-sm">Our live stock list is updating. Please <a href="tel:+19999999999">call 999-999-9999</a> for colors in stock.</p>`; });
})();
