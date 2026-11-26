/* Loads published horse profiles and funding totals from Supabase and refreshes the page.
   Uses only the publishable key. If loading fails, the built-in sample profiles stay on screen. */
(function () {
  const SUPABASE_URL = "https://uxumryxftrpmnjilbhdu.supabase.co";
  const PUBLISHABLE_KEY = "sb_publishable_tZ2jKhtcoy-LsvYGkZzdkg_bfjhmp-E";
  const CAT = { Critical: 0, Urgent: 1, Recovery: 2 };

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  async function get(path) {
    const res = await fetch(SUPABASE_URL + "/rest/v1/" + path, {
      headers: { apikey: PUBLISHABLE_KEY }
    });
    if (!res.ok) throw new Error("Supabase request failed: " + res.status);
    return res.json();
  }

  function toCardData(row, raisedCents) {
    return {
      id: row.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      uid: row.id,
      n: esc(row.name),
      a: null,
      m: esc(row.estimated_age_text),
      c: CAT[row.rescue_category] != null ? CAT[row.rescue_category] : 0,
      s: esc((row.description || "").replace(/^DEMONSTRATION PROFILE\.\s*/, "")),
      i: esc(row.injury_description),
      d: esc(row.medical_condition),
      t: esc(row.treatment_information),
      g: row.funding_target_cents != null ? row.funding_target_cents / 100 : null,
      r: raisedCents / 100
    };
  }

  function render(list) {
    H.length = 0;
    H.push.apply(H, list);

    const active = document.querySelector("[data-f][aria-pressed=true]");
    fil(active ? active.dataset.f : "all");

    $("em").innerHTML = H.filter(function (h) { return h.c === 0; }).map(function (h) {
      return '<div class="erow"><div><h3>' + h.n + "</h3><p>" + h.i + '</p></div><a class="btn light sm" href="#horse-' + h.id + '">View case</a><button class="btn sm" data-sponsor="' + h.id + '">Sponsor now</button></div>';
    }).join("");

    const select = $("sp-horse");
    const previous = select.value;
    select.innerHTML = H.map(function (h) {
      return '<option value="' + h.id + '">' + h.n + " (" + CATS[h.c] + ")</option>";
    }).join("");
    if (H.some(function (h) { return h.id === previous; })) select.value = previous;
    upd();

    if (location.hash.indexOf("#horse-") === 0) route();
  }

  async function load() {
    try {
      const horses = await get(
        "horses?select=id,name,estimated_age_text,rescue_category,description,injury_description,medical_condition,treatment_information,funding_target_cents&is_published=eq.true&order=name.asc"
      );
      const funding = await get("horse_funding?select=horse_id,raised_cents");
      if (!horses.length) return;
      const raised = new Map(funding.map(function (f) { return [f.horse_id, f.raised_cents]; }));
      render(horses.map(function (row) { return toCardData(row, raised.get(row.id) || 0); }));
    } catch (err) {
      console.warn("Live horse data unavailable; showing sample profiles.", err);
    }
  }

  load();
})();
