// slabs.html: the live slab catalog (read-only, from the yard's Excel through /api/inventory).
// "By stone" groups every lot of one color into one card; "All slabs" lists each lot; "Saved" shows saved lots.
(() => {
  const { inventory, swatch, TYPE_LABEL, saved, esc } = window.OSS;
  const $ = (id) => document.getElementById(id);
  const q = new URLSearchParams(location.search);
  const S = { lots: [], text: q.get("q") || "", type: ["quartz", "granite"].includes(q.get("type")) ? q.get("type") : "all", tones: new Set(), minL: "", minW: "",
    view: q.get("saved") === "1" ? "saved" : (q.get("q") ? "pieces" : "stone") };

  const toks = (s) => String(s || "").toLowerCase().replace(/(\d)\s*[x×*]\s*(\d)/g, "$1 $2").split(/[\s,]+/).filter(Boolean);
  const fits = (l) => {   // minimum size in either orientation
    const a = Number(S.minL) || 0, b = Number(S.minW) || 0, L = parseFloat(l.L) || 0, H = parseFloat(l.H) || 0;
    return (!a && !b) || (L >= a && H >= b) || (L >= b && H >= a);
  };
  const typeOk = (l) => S.type === "all" || l.type === S.type || (S.type === "quartz" && l.type === "printed");
  function visible() {
    const ts = toks(S.text), mine = new Set(saved.list().map((x) => x.split("|")[0]));
    return S.lots.filter((l) => l.free > 0 && l.type !== "other" && typeOk(l) && (!S.tones.size || S.tones.has(l.tone)) && fits(l)
      && (S.view !== "saved" || mine.has(l.id))
      && ts.every((t) => [l.title, l.name, l.lot, l.section, l.L, l.H, TYPE_LABEL[l.type], l.size].join(" ").toLowerCase().includes(t)));
  }

  function pieceCard(l, mine) {
    const on = mine.has(l.id), size = l.L && l.H ? `${l.L} × ${l.H} in` : "size on request";
    return `<article class="slabcard">
      <div class="sw" style="${esc(swatch(l))}" role="img" aria-label="Color illustration of ${esc(l.title)}"><span class="free">${l.free} available</span></div>
      <div class="body"><h3>${esc(l.title)}</h3>
        <span class="spec">${esc(TYPE_LABEL[l.type])} · ${esc(l.size)} · ${esc(l.thick)}${l.bm ? " · bookmatched" : ""}</span>
        <span class="spec">${esc(size)} · Lot ${esc(l.lot || "—")}</span>
        <div class="acts"><a class="btn primary" href="contact.html?slab=${encodeURIComponent(`${l.lot} ${l.title}`)}">Get a quote</a>
        <button class="btn save" type="button" data-save="${esc(l.id)}|${esc(`${l.lot} ${l.title}`)}" aria-pressed="${on}">${on ? "Saved" : "Save"}</button></div></div></article>`;
  }
  function stoneCard(g) {
    const sizes = [...new Set(g.lots.map((l) => (l.L && l.H ? `${l.L} × ${l.H}` : "")).filter(Boolean))];
    const sizeText = sizes.length > 2 ? `${sizes.length} sizes, up to ${g.maxL} in long` : sizes.map((x) => x + " in").join(" · ");
    return `<button type="button" class="stonecard" data-stone="${esc(g.title)}">
      <span class="sw" style="${esc(swatch(g.lots[0]))}" aria-hidden="true"><span class="badge">${g.lots.length} lot${g.lots.length === 1 ? "" : "s"} · ${g.free} slab${g.free === 1 ? "" : "s"}</span></span>
      <span class="body"><b>${esc(g.title)}</b><span class="spec">${esc([...new Set(g.lots.map((l) => TYPE_LABEL[l.type]))].join(" · "))}${sizeText ? " · " + esc(sizeText) : ""}</span>
      <span class="see">See the slabs →</span></span></button>`;
  }

  function render() {
    const rows = visible(), slabs = rows.reduce((t, l) => t + l.free, 0), mine = new Set(saved.list().map((x) => x.split("|")[0]));
    const grid = $("catGrid");
    if (S.view === "stone") {
      const by = new Map();
      for (const l of rows) { const g = by.get(l.title) || { title: l.title, lots: [], free: 0, maxL: 0 }; g.lots.push(l); g.free += l.free; g.maxL = Math.max(g.maxL, parseFloat(l.L) || 0); by.set(l.title, g); }
      const groups = [...by.values()].sort((a, b) => b.free - a.free || a.title.localeCompare(b.title));
      $("catCount").textContent = `${groups.length} stone${groups.length === 1 ? "" : "s"} · ${rows.length} lots · ${slabs.toLocaleString()} slabs available`;
      grid.className = "grid-stones";
      grid.innerHTML = groups.length ? groups.map(stoneCard).join("") : empty();
    } else {
      rows.sort((a, b) => a.title.localeCompare(b.title) || b.free - a.free);
      $("catCount").textContent = `${rows.length} lot${rows.length === 1 ? "" : "s"} · ${slabs.toLocaleString()} slabs available`;
      grid.className = "grid-slabs";
      grid.innerHTML = rows.length ? rows.map((l) => pieceCard(l, mine)).join("")
        : (S.view === "saved" ? `<p class="note-sm">No saved slabs yet. Tap <b>Save</b> on any slab to keep it here.</p>` : empty());
    }
  }
  const empty = () => `<p class="note-sm">No slabs match. Try fewer filters, or <a href="contact.html">ask us</a>: new lots arrive often.</p>`;
  function paint() {
    document.querySelectorAll("#viewSeg button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === S.view)));
    document.querySelectorAll("#typeSeg button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.type === S.type)));
    document.querySelectorAll("#toneSeg button").forEach((b) => b.setAttribute("aria-pressed", String(S.tones.has(b.dataset.tone))));
  }

  $("catSearch").value = S.text;
  $("catSearch").addEventListener("input", (e) => { S.text = e.target.value; render(); });
  $("viewSeg").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { S.view = b.dataset.view; if (S.view === "stone") { S.text = ""; $("catSearch").value = ""; } paint(); render(); } });
  $("typeSeg").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { S.type = b.dataset.type; paint(); render(); } });
  $("toneSeg").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { const t = b.dataset.tone; S.tones.has(t) ? S.tones.delete(t) : S.tones.add(t); paint(); render(); } });
  $("catGrid").addEventListener("click", (e) => {
    const st = e.target.closest("[data-stone]");
    if (st) { S.view = "pieces"; S.text = st.dataset.stone; $("catSearch").value = S.text; paint(); render(); $("catGrid").scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    const b = e.target.closest("[data-save]"); if (!b) return;
    const on = saved.toggle(b.dataset.save); b.setAttribute("aria-pressed", String(on)); b.textContent = on ? "Saved" : "Save";
    if (S.view === "saved") render();
  });
  $("quoteSaved").addEventListener("click", (e) => { if (!saved.list().length) { e.preventDefault(); $("catCount").textContent = "Save a few slabs first, then ask for one quote for all of them."; } });
  async function load(force) {
    $("catUpdated").textContent = "updating…";
    try {
      const { lots, at } = await inventory(force);
      S.lots = lots; $("catUpdated").textContent = "updated " + at.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); render();
    } catch (e) {
      console.warn("inventory:", e.message);   // the technical reason stays in the console, not on the page
      $("catGrid").innerHTML = `<p class="note-sm">Our live stock list is updating. Please <a href="tel:+19999999999">call 999-999-9999</a> or <a href="contact.html">send us a message</a> for availability.</p>`;
      $("catCount").textContent = ""; $("catStatus").innerHTML = `<span class="live-dot off"></span>Live stock list unavailable right now`;
    }
  }
  $("catRefresh").addEventListener("click", () => load(true));
  paint(); load(false);
})();
