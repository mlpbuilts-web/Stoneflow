// Public site: generated stone swatches, collections, page routing, contact form.
(() => {
  const CFG = window.STONEFLOW_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));


  /* ---------- stone renderer (seeded, so every visit draws the same slab) ---------- */
  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const STONES = {
    calacattaGold: { base: ["#F7F5F0", "#ECE9E2"], veins: ["rgba(150,120,70,.55)", "rgba(110,105,100,.45)"], n: 5, w: 7, speck: 0 },
    calacattaGrey: { base: ["#F6F6F4", "#E7E8E6"], veins: ["rgba(95,100,105,.5)", "rgba(140,140,140,.35)"], n: 6, w: 6, speck: 0 },
    carrara: { base: ["#E9EBEC", "#DADEE0"], veins: ["rgba(110,118,125,.35)"], n: 14, w: 2.5, speck: 0 },
    printed: { base: ["#F4F1EC", "#E6E1D9"], veins: ["rgba(120,95,70,.6)", "rgba(60,60,60,.45)"], n: 4, w: 11, speck: 0 },
    granite: { base: ["#26272A", "#1A1B1D"], veins: [], n: 0, w: 0, speck: 2600, speckColors: ["#5A5C61", "#8C8E92", "#3B3D42", "#A7A096"] },
    onyx: { base: ["#E3C48E", "#C99A57"], veins: ["rgba(255,245,220,.55)", "rgba(150,95,40,.35)"], n: 18, w: 5, speck: 0, bands: true },
  };
  function drawStone(canvas, kind, seed) {
    const st = STONES[kind], ctx = canvas.getContext("2d"), W = canvas.width, H = canvas.height, R = rng(seed);
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, st.base[0]); g.addColorStop(1, st.base[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (st.speck) {
      for (let i = 0; i < st.speck * (W * H) / (1016 * 512); i++) {
        ctx.fillStyle = st.speckColors[Math.floor(R() * st.speckColors.length)];
        ctx.globalAlpha = .35 + R() * .5; const r = .6 + R() * 2.6;
        ctx.beginPath(); ctx.arc(R() * W, R() * H, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1; return;
    }
    const vein = (color, width, blur) => {
      let x = st.bands ? -20 : R() * W * .3 - W * .1, y = st.bands ? R() * H : R() * H;
      const ang0 = st.bands ? (R() - .5) * .25 : -0.35 + (R() - .5) * .9;
      ctx.save(); ctx.filter = blur ? `blur(${blur}px)` : "none"; ctx.strokeStyle = color; ctx.lineCap = "round";
      let ang = ang0, w = width * (.5 + R());
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let i = 0; i < 220 && x < W + 40; i++) {
        ang += (R() - .5) * .35; ang = ang0 + (ang - ang0) * .92;
        x += Math.cos(ang) * 9; y += Math.sin(ang) * 9 + (R() - .5) * 3;
        ctx.lineTo(x, y);
        if (!blur && i % 6 === 5) { ctx.lineWidth = w; ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y); w = Math.max(.4, w * (.75 + R() * .5)); }
      }
      ctx.lineWidth = w; ctx.stroke(); ctx.restore();
    };
    for (let i = 0; i < st.n; i++) { const c = st.veins[i % st.veins.length]; vein(c, st.w * 2.2, 6); vein(c, st.w * .5, 0); }
    for (let i = 0; i < st.n * 3; i++) vein(st.veins[0].replace(/[\d.]+\)$/, ".18)"), 1, 0);
  }

  const COLLECTIONS = [
    { kind: "calacattaGold", title: "Quartz", href: "quartz.html", spec: "Calacatta and Carrara looks, printed full-body, regular to super jumbo sizes", size: "big", seed: 101 },
    { kind: "granite", title: "Granite", href: "granite.html", spec: "Natural stone, polished or leathered", size: "", seed: 118 },
  ];
  $("collGrid").innerHTML = COLLECTIONS.map((c) => `<a class="stone ${c.size}" href="${c.href}">
    <canvas width="${c.size ? 1200 : 900}" height="${c.size ? 1000 : 520}" data-kind="${c.kind}" data-seed="${c.seed}" aria-hidden="true"></canvas>
    <span class="stone-cap"><b>${esc(c.title)}</b><span>${esc(c.spec)}</span></span></a>`).join("");
  document.querySelectorAll("canvas[data-kind]").forEach((cv) => drawStone(cv, cv.dataset.kind, Number(cv.dataset.seed)));
  drawStone($("heroSlab"), "calacattaGold", 7);
  // Hero photo: if it can't load, fall back to the drawn kitchen underneath.
  const kp = document.getElementById("kitchenPhoto");
  if (kp) {
    const fail = () => { kp.remove(); };
    if (kp.complete && !kp.naturalWidth) fail(); else kp.addEventListener("error", fail);
  }
  // The kitchen's countertops use a marble texture drawn the same way.
  const mbl = document.getElementById("mblImg");
  if (mbl) { const cv = document.createElement("canvas"); cv.width = 1600; cv.height = 1200; drawStone(cv, "calacattaGold", 23); mbl.setAttribute("href", cv.toDataURL("image/jpeg", 0.86)); }

  /* ---------- "Fresh on the racks": four real lots from the live inventory, shown as yard tags ---------- */
  (async () => {
    const box = $("rackRow"); if (!box || !window.OSS) return;
    try {
      const { lots } = await window.OSS.inventory();
      const seen = new Set(), pick = [];
      for (const l of lots.filter((x) => x.free > 0 && x.type !== "other").sort((x, y) => y.free - x.free)) {
        if (seen.has(l.title) || seen.has(l.type + pick.filter((p) => p.type === l.type).length)) continue;
        if (pick.filter((p) => p.type === l.type).length >= 2) continue;
        seen.add(l.title); pick.push(l); if (pick.length === 4) break;
      }
      box.innerHTML = pick.map((l) => `<a class="ytag" href="slabs.html?q=${encodeURIComponent(l.title)}">
        <span class="ytag-sw" style="${esc(window.OSS.swatch(l))}" aria-hidden="true"><span class="hole"></span></span>
        <span class="ytag-b"><b>${esc(l.title)}</b><span>Lot ${esc(l.lot || "on request")}${l.L && l.H ? `, ${esc(l.L)} × ${esc(l.H)} in` : ""}</span>
        <span class="ytag-n">${l.free} slab${l.free === 1 ? "" : "s"} ready</span></span></a>`).join("");
    } catch { box.innerHTML = `<p class="note-sm">Stock is updating. <a href="slabs.html">See the slab list</a>.</p>`; }
  })();

  /* ---------- routing: #staff opens the portal, everything else is the public site ---------- */
  function route() {
    const staff = location.hash === "#staff";
    $("home-view").hidden = staff; $("staff-view").hidden = !staff;
    $("staffLink").textContent = staff ? "Back to site" : "Live Inventory";
    $("staffLink").setAttribute("href", staff ? "#home" : "#staff");
    if (staff) { window.Portal?.open(); window.scrollTo(0, 0); }
    else if (location.hash && location.hash !== "#home") document.querySelector(location.hash)?.scrollIntoView();
  }
  window.addEventListener("hashchange", route);
  route();

})();
