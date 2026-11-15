// projects.html: filter the project gallery by room type.
(() => {
  const bar = document.getElementById("projFilter"), items = document.querySelectorAll("#projGrid .proj");
  bar.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-k]"); if (!b) return;
    bar.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    items.forEach((it) => { it.hidden = b.dataset.k !== "all" && it.dataset.k !== b.dataset.k; });
  });
})();
