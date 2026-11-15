// Shared by every public page: live stock numbers, stone types, slab swatches, saved stones, quote forms.
(() => {
  const CFG = window.STONEFLOW_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- stone type from the sheet's section and color name ---------- */
  function typeOf(l) {
    const s = String(l.section || "").toUpperCase(), n = String(l.name || "").toUpperCase();
    if (/SADDLE|SAMPLE|MIX/.test(s + " " + n)) return "other";
    if (/ONYX/.test(s + " " + n)) return "onyx";
    if (/GRANITE/.test(s)) return "granite";
    if (/PRINTED|PFB|PBP/.test(s + " " + n)) return "printed";
    return "quartz";
  }
  const TYPE_LABEL = { quartz: "Quartz", printed: "Printed quartz", granite: "Granite", onyx: "Quartz onyx", other: "Other" };
  function sizeClass(l) {
    const n = String(l.name || "").toUpperCase(), s = String(l.section || "").toUpperCase(), L = parseFloat(l.L);
    if (/-SJ\b|SJ\b|SUPER JUMBO/.test(n)) return "Super jumbo";
    if (/JUMBO/.test(s) || /-J\b|\bJ\b/.test(n) || L >= 125) return "Jumbo";
    return "Regular";
  }
  const thickness = (l) => { const m = /(\d(?:\.\d+)?)\s*CM/i.exec(`${l.name} ${l.section}`); return m ? m[1] + " cm" : "3 cm"; };
  // Color names with the yard's codes taken off: "ZIRCON-J" -> "Zircon", "AZALEA-R-PFB" -> "Azalea"
  function niceName(name) {
    let s = String(name || "").replace(/\(.*?\)/g, " ").replace(/\b(PFB|PBP|PRINTED|FB|IND|PRTD\.?.*$|PRINTED THROUGH.*$)\b/gi, " ")
      .replace(/-?\s*\b(SJ|J|R|JR|CO)\b/g, " ").replace(/\d(?:\.\d+)?\s*CM(\/\d(?:\.\d+)?\s*CM)?/gi, " ").replace(/[-–]+/g, " ").replace(/\s+/g, " ").trim();
    return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) || String(name || "");
  }

  /* ---------- an illustrative swatch from the color name (not a photo) ---------- */
  function swatch(l) {
    const n = String(l.name || "").toUpperCase(), t = typeOf(l);
    let base = ["#F4F2EE", "#E6E2DA"], vein = "rgba(120,110,100,.35)";
    if (/BLACK|NERO|MIDNIGHT|LAVA|PEARL\(|PEARL QUARTZ|FOSSIL|ORCA|DARK/.test(n)) { base = ["#2A2C2F", "#17191B"]; vein = "rgba(200,200,205,.25)"; }
    else if (/GREY|GRAY|STEEL|SLATE|ASH|CHARCOAL|BROOKLYN|HARBOR|NOVA|CASPER/.test(n)) { base = ["#B9BDC0", "#8E9397"]; vein = "rgba(255,255,255,.35)"; }
    else if (/BROWN|FANTASY|CREMA|BEIGE|BIEGE|TAJ|SAND|MUSK|NECTAR|CHAMPAGNE|GOLD|SEVELIA|SIMA/.test(n)) { base = ["#EDE3D2", "#D5C3A5"]; vein = "rgba(150,115,70,.45)"; }
    else if (/BLUE|AQUA|BAHAMAS|NEPTUNE|WAVES|RAIN/.test(n)) { base = ["#D7E1E8", "#A9BCC9"]; vein = "rgba(60,80,100,.35)"; }
    else if (/RED/.test(n)) { base = ["#B5483F", "#8C2F28"]; vein = "rgba(255,230,220,.3)"; }
    if (t === "granite" && !/WHITE/.test(n)) return `background: radial-gradient(circle at 30% 40%, rgba(255,255,255,.22) 0 .8px, transparent 1.6px) 0 0/7px 7px, radial-gradient(circle at 70% 20%, rgba(0,0,0,.28) 0 1px, transparent 1.8px) 3px 2px/9px 9px, radial-gradient(circle at 50% 50%, rgba(255,255,255,.12) 0 1.2px, transparent 2.2px) 5px 6px/13px 11px, radial-gradient(circle at 20% 80%, rgba(0,0,0,.2) 0 1.4px, transparent 2.4px) 1px 4px/17px 15px, linear-gradient(135deg, ${base[0]}, ${base[1]})`;
    if (t === "onyx") return `background: repeating-linear-gradient(170deg, rgba(255,245,220,.35) 0 6px, transparent 6px 22px), linear-gradient(135deg, #E3C48E, #C99A57)`;
    // vary the veins by name so each stone looks a little different
    let h = 0; for (const c of n) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const a1 = 95 + (h % 50), a2 = 140 + ((h >> 6) % 45), a3 = 20 + ((h >> 12) % 40), p1 = 30 + ((h >> 3) % 40), p2 = 45 + ((h >> 9) % 40), p3 = 55 + ((h >> 15) % 30);
    return `background: linear-gradient(${a1}deg, transparent ${p1}%, ${vein} ${p1 + 1}%, transparent ${p1 + 2.5}%), linear-gradient(${a2}deg, transparent ${p2}%, ${vein} ${p2 + 0.6}%, transparent ${p2 + 1.4}%), linear-gradient(${a3}deg, transparent ${p3}%, ${vein} ${p3 + 0.4}%, transparent ${p3 + 1}%), linear-gradient(135deg, ${base[0]}, ${base[1]})`;
  }

  /* ---------- color tone for the Warm / Cool / Dark filter ---------- */
  function toneOf(l) {
    const n = String(l.name || "").toUpperCase();
    if (/BLACK|NERO|MIDNIGHT|LAVA|FOSSIL|ORCA|DARK|PEARL|STEEL GREY|CHARCOAL/.test(n)) return "dark";
    if (typeOf(l) === "onyx" || /BROWN|FANTASY|CREMA|BEIGE|BIEGE|TAJ|SAND|MUSK|NECTAR|CHAMPAGNE|GOLD|SEVELIA|SIMA|CREAM|IVORY|WARM|HONEY|AGRA|SIENNA|RED/.test(n)) return "warm";
    return "cool";
  }

  /* ---------- live inventory (public, read-only) ---------- */
  let cache = null;
  async function inventory(force) {
    if (cache && !force) return cache;
    const r = await fetch("/api/inventory");
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || "The live inventory isn't available right now.");
    const lots = (d.lots || []).filter((l) => l.lot || l.name).map((l) => ({ ...l, free: Math.max(0, l.stock - (l.heldTotal || 0)), type: typeOf(l), tone: toneOf(l), size: sizeClass(l), thick: thickness(l), title: niceName(l.name) }));
    cache = { lots, meta: d.meta, at: new Date() };
    return cache;
  }

  /* ---------- saved stones (this browser only) ---------- */
  const SAVED = "oss_saved";
  const saved = {
    list() { try { return JSON.parse(localStorage.getItem(SAVED) || "[]"); } catch { return []; } },
    has(id) { return this.list().includes(id); },
    toggle(id) { const s = new Set(this.list()); s.has(id) ? s.delete(id) : s.add(id); try { localStorage.setItem(SAVED, JSON.stringify([...s])); } catch {} paintSaved(); return s.has(id); },
  };
  function paintSaved() {
    const n = saved.list().length;
    document.querySelectorAll("[data-saved-count]").forEach((el) => { el.textContent = n ? `${n} saved` : ""; });
    document.querySelectorAll("[data-saved-count-n]").forEach((el) => { el.textContent = n; });
  }

  /* ---------- live numbers on any page: <span data-live="free|colors|lots"> ---------- */
  async function fillLive() {
    const els = document.querySelectorAll("[data-live]"); if (!els.length) return;
    try {
      const { lots } = await inventory(); const inStock = lots.filter((l) => l.free > 0 && l.type !== "other");
      const vals = { free: inStock.reduce((t, l) => t + l.free, 0).toLocaleString(), colors: new Set(inStock.map((l) => l.title)).size.toLocaleString(), lots: inStock.length.toLocaleString() };
      els.forEach((el) => { if (vals[el.dataset.live] != null) el.textContent = vals[el.dataset.live]; });
    } catch { els.forEach((el) => { if (el.textContent === "…") el.textContent = "–"; }); }
  }

  /* ---------- "in stock now" lists on the Quartz / Granite pages: <div data-top="quartz,printed"> ---------- */
  async function fillTop() {
    for (const box of document.querySelectorAll("[data-top]")) {
      const types = box.dataset.top.split(",");
      try {
        const { lots } = await inventory();
        const by = new Map();
        for (const l of lots) if (l.free > 0 && types.includes(l.type)) by.set(l.title, (by.get(l.title) || 0) + l.free);
        const top = [...by.entries()].sort((a, b) => b[1] - a[1]).slice(0, 9);
        box.innerHTML = top.length ? top.map(([name, n]) => `<a class="card" href="slabs.html?q=${encodeURIComponent(name)}"><div class="sw" style="${esc(swatch({ name, section: types[0].toUpperCase() }))}"></div><h3>${esc(name)}</h3><p><span class="live-dot"></span>${n} slab${n === 1 ? "" : "s"} available now</p></a>`).join("")
          : `<p class="note-sm">Nothing listed right now. Ask us, as new lots arrive often.</p>`;
      } catch (e) { box.innerHTML = `<p class="note-sm">${esc(e.message)}</p>`; }
    }
  }

  /* ---------- quote / contact forms (Netlify Forms) ---------- */
  function wireForms() {
    document.querySelectorAll("form[data-netlify]").forEach((f) => {
      const st = f.querySelector("[data-status]");
      const q = new URLSearchParams(location.search), slab = q.get("slab"), sv = q.get("saved");
      const box = f.querySelector("[name=slabs]");
      if (box && (slab || sv)) {
        const ids = sv ? saved.list() : [];
        box.value = [slab, ...ids.map((x) => x.split("|")[1])].filter(Boolean).join(", ");
      }
      f.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (st) st.textContent = "Sending…";
        try {
          const r = await fetch("/", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(new FormData(f)).toString() });
          if (!r.ok) throw new Error();
          f.reset(); if (st) st.textContent = "Thank you! We'll get back to you within one business day.";
        } catch { if (st) st.textContent = `Couldn't send. Please call ${CFG.companyDetails?.phone || "us"} instead.`; }
      });
    });
  }

  // Close the Stone menu when clicking elsewhere or pressing Esc.
  document.addEventListener("click", (e) => { document.querySelectorAll("details.dd[open]").forEach((d) => { if (!d.contains(e.target)) d.open = false; }); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") document.querySelectorAll("details.dd[open]").forEach((d) => { d.open = false; }); });
  document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
  paintSaved(); wireForms(); fillLive(); fillTop();

  /* ---------- realistic stone texture on a canvas (used by Design Your Space) ---------- */
  function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function stoneLook(l) {
    const n = String(l.name || l.title || "").toUpperCase(), t = typeOf(l);
    let h = 0; for (const c of n) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    if (t === "granite" && !/WHITE|ICE|SNOW|BIANCO/.test(n)) {
      if (/BROWN|BALTIC|TAN|COFFEE|FANTASY|GOLD|SANTA CECILIA|GIALLO/.test(n)) return { seed: h, base: ["#6E5642", "#4E3B2D"], speck: 5200, speckColors: ["#2A1E16", "#A88B6A", "#D9C4A4", "#8E6E4F", "#1A1410"] };
      if (/GREY|GRAY|STEEL|SILVER|SALT/.test(n)) return { seed: h, base: ["#8C8F92", "#6B6E72"], speck: 5200, speckColors: ["#2E3033", "#C9CBCD", "#55585C", "#E6E6E4"] };
      return { seed: h, base: ["#26272A", "#1A1B1D"], speck: 4200, speckColors: ["#5A5C61", "#8C8E92", "#3B3D42", "#A7A096"] };
    }
    if (t === "granite") return { seed: h, base: ["#ECEBE7", "#D9D8D3"], speck: 4200, speckColors: ["#5E5E5E", "#9A9690", "#2E2E2E", "#B9A99A"] };
    if (t === "onyx") return { seed: h, base: ["#E3C48E", "#C99A57"], veins: ["rgba(255,245,220,.55)", "rgba(150,95,40,.35)"], n: 18, w: 5, bands: true };
    if (/BLACK|NERO|MIDNIGHT|LAVA|FOSSIL|ORCA|DARK|PEARL/.test(n)) return { seed: h, base: ["#2B2D30", "#1C1E20"], veins: ["rgba(225,225,230,.45)", "rgba(190,170,130,.35)"], n: 5, w: 4 };
    if (/GREY|GRAY|STEEL|SLATE|ASH|CHARCOAL|BROOKLYN|HARBOR|NOVA|CASPER|CONCRETE/.test(n)) return { seed: h, base: ["#BFC2C4", "#9EA3A6"], veins: ["rgba(250,250,250,.55)", "rgba(80,85,90,.35)"], n: 7, w: 3 };
    if (/BROWN|FANTASY|CREMA|BEIGE|BIEGE|TAJ|SAND|MUSK|NECTAR|CHAMPAGNE|GOLD|SEVELIA|SIMA|CREAM|IVORY|HONEY|AGRA/.test(n)) return { seed: h, base: ["#EFE6D6", "#DCCBAE"], veins: ["rgba(150,115,70,.55)", "rgba(120,100,80,.35)"], n: 6, w: 5 };
    if (/BLUE|AQUA|BAHAMAS|NEPTUNE|WAVES|RAIN/.test(n)) return { seed: h, base: ["#DCE5EB", "#B5C6D2"], veins: ["rgba(60,80,100,.45)"], n: 7, w: 4 };
    if (t === "printed" || h % 3 === 0) return { seed: h, base: ["#F6F3EE", "#E9E4DC"], veins: ["rgba(140,110,70,.6)", "rgba(80,80,80,.5)"], n: 5, w: 8 };
    if (h % 3 === 1) return { seed: h, base: ["#F6F6F4", "#E7E8E6"], veins: ["rgba(95,100,105,.55)", "rgba(140,140,140,.38)"], n: 6, w: 5 };
    return { seed: h, base: ["#EDEFF0", "#DDE1E3"], veins: ["rgba(110,118,125,.38)"], n: 14, w: 2.2 };
  }
  function stoneCanvas(l, W, H) {
    const st = stoneLook(l), cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d"), R = seeded(st.seed), k = W / 1200;
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, st.base[0]); g.addColorStop(1, st.base[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (st.speck) {
      // granite: soft mottling, then crystals of mixed sizes
      ctx.save(); ctx.filter = `blur(${10 * k}px)`;
      for (let i = 0; i < 260; i++) { ctx.fillStyle = st.speckColors[Math.floor(R() * st.speckColors.length)]; ctx.globalAlpha = .08 + R() * .12;
        const r = (12 + R() * 40) * k; ctx.beginPath(); ctx.ellipse(R() * W, R() * H, r, r * (.5 + R() * .7), R() * 3, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      const count = st.speck * 3 * (W * H) / (1016 * 512);
      for (let i = 0; i < count; i++) {
        ctx.fillStyle = st.speckColors[Math.floor(R() * st.speckColors.length)];
        const big = R() < .03; ctx.globalAlpha = .3 + R() * .6; const r = (big ? 1.4 + R() * 1.4 : .3 + R() * 1.0) * k;
        ctx.beginPath(); ctx.ellipse(R() * W, R() * H, r, r * (.5 + R() * .7), R() * 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1; return cv;
    }
    const vein = (color, width, blur) => {
      let x = st.bands ? -20 : R() * W * .3 - W * .1, y = R() * H;
      const ang0 = st.bands ? (R() - .5) * .25 : -0.35 + (R() - .5) * .9;
      ctx.save(); ctx.filter = blur ? `blur(${blur * k}px)` : "none"; ctx.strokeStyle = color; ctx.lineCap = "round";
      let ang = ang0, w = width * k * (.5 + R());
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let i = 0; i < 400 && x < W + 40; i++) {
        ang += (R() - .5) * .35; ang = ang0 + (ang - ang0) * .92;
        x += Math.cos(ang) * 9 * k; y += Math.sin(ang) * 9 * k + (R() - .5) * 3 * k;
        ctx.lineTo(x, y);
        if (!blur && i % 6 === 5) { ctx.lineWidth = w; ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y); w = Math.max(.4, w * (.75 + R() * .5)); }
      }
      ctx.lineWidth = w; ctx.stroke(); ctx.restore();
    };
    for (let i = 0; i < st.n; i++) { const c = st.veins[i % st.veins.length]; vein(c, st.w * 2.2, 6); vein(c, st.w * .5, 0); }
    for (let i = 0; i < st.n * 3; i++) vein(st.veins[0].replace(/[\d.]+\)$/, ".18)"), 1, 0);
    return cv;
  }

  window.OSS = { inventory, swatch, stoneCanvas, typeOf, toneOf, TYPE_LABEL, saved, esc, niceName };
})();
