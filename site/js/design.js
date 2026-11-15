// design.html: try stones from live stock on a simple kitchen, with cabinet and backsplash choices.
(() => {
  const { inventory, swatch, esc } = window.OSS;
  const $ = (id) => document.getElementById(id);
  const S = { stones: [], type: "quartz", pick: null, cab: "#F4F3EE", cabName: "white", splash: "match" };
  const TILE = "background: linear-gradient(#E3E1DA 1px, transparent 1px) 0 0 / 100% 18px, linear-gradient(90deg, #E3E1DA 1px, transparent 1px) 0 0 / 36px 100%, #F7F6F2";
  const PAINT = "background: #DDE2D6";

  function paintRoom() {
    $("room").style.setProperty("--cab", S.cab);
    const st = S.pick ? swatch(S.pick.lot) : "background: #ECEAE4";
    $("rCounter").setAttribute("style", st); $("rIsland").setAttribute("style", st);
    $("rSplash").setAttribute("style", S.splash === "match" ? st : S.splash === "tile" ? TILE : PAINT);
    const name = S.pick ? S.pick.title : null;
    $("lookName").textContent = name ? `${name} countertops with ${S.cabName} cabinets` : "Pick a countertop to see it on the kitchen.";
    $("quoteLook").href = name ? `contact.html?slab=${encodeURIComponent(`${name} (${S.cabName} cabinets, ${S.splash === "match" ? "matching backsplash" : S.splash === "tile" ? "white tile backsplash" : "painted wall"})`)}` : "contact.html";
  }
  function renderStones() {
    const list = S.stones.filter((s) => s.type === S.type || (S.type === "quartz" && s.type === "printed")).slice(0, 30);
    $("stonePick").innerHTML = list.length ? list.map((s) => `<button type="button" class="sp ${S.pick && S.pick.title === s.title ? "on" : ""}" data-title="${esc(s.title)}" aria-pressed="${!!(S.pick && S.pick.title === s.title)}">
      <span class="sp-sw" style="${esc(swatch(s.lot))}" aria-hidden="true"></span><span class="sp-n">${esc(s.title)}</span><span class="sp-f">${s.free} slab${s.free === 1 ? "" : "s"}</span></button>`).join("")
      : `<p class="note-sm">None of this stone is in stock right now.</p>`;
  }
  const press = (bar, b) => bar.querySelectorAll("button").forEach((x) => x.setAttribute(x.getAttribute("role") === "radio" ? "aria-checked" : "aria-pressed", String(x === b)));

  $("cabOpts").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; S.cab = b.dataset.cab; S.cabName = b.dataset.name; press($("cabOpts"), b); paintRoom(); });
  $("splashOpts").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; S.splash = b.dataset.splash; press($("splashOpts"), b); paintRoom(); });
  $("stoneType").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; S.type = b.dataset.t; press($("stoneType"), b); renderStones(); });
  $("stonePick").addEventListener("click", (e) => { const b = e.target.closest("button[data-title]"); if (!b) return; S.pick = S.stones.find((s) => s.title === b.dataset.title); renderStones(); paintRoom(); });

  paintRoom();
  inventory().then(({ lots }) => {
    const by = new Map();
    for (const l of lots) if (l.free > 0 && l.type !== "other") { const g = by.get(l.title) || { title: l.title, type: l.type, free: 0, lot: l }; g.free += l.free; by.set(l.title, g); }
    S.stones = [...by.values()].sort((a, b) => b.free - a.free);
    S.pick = S.stones.find((s) => s.type === "quartz") || S.stones[0] || null;
    renderStones(); paintRoom();
  }).catch((e) => { $("stonePick").innerHTML = `<p class="note-sm">${esc(e.message)}</p>`; });
})();
