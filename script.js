/* Hamadullah Bijarani: shared script (theme, copy, sidebar toggle, PEFT explorer). Safe on every page. */
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  var root = document.documentElement, tb = $("[data-theme-toggle]");
  function applyTheme(d) {
    root.classList.toggle("dark", d);
    if (!tb) return;
    tb.textContent = d ? "☀" : "☾";
    tb.setAttribute("aria-label", d ? "Switch to day mode" : "Switch to night mode");
    tb.title = d ? "Day mode" : "Night mode";
  }
  var saved = null; try { saved = localStorage.getItem("hb-theme"); } catch (e) {}
  applyTheme(saved ? saved === "dark" : matchMedia("(prefers-color-scheme: dark)").matches);
  if (tb) tb.addEventListener("click", function () {
    var n = !root.classList.contains("dark"); applyTheme(n);
    try { localStorage.setItem("hb-theme", n ? "dark" : "light"); } catch (e) {}
  });

  $$("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var st = b.parentElement.querySelector('[role="status"]');
      function say(t) { if (st) { st.textContent = t; setTimeout(function () { st.textContent = ""; }, 2500); } }
      if (navigator.clipboard) navigator.clipboard.writeText(b.getAttribute("data-copy")).then(function () { say("Copied"); }, function () { say("Unable to copy"); });
      else say("Unable to copy");
    });
  });

  var fb = $("[data-follow]");
  if (fb) fb.addEventListener("click", function () {
    var o = $("#follow").classList.toggle("open"); fb.setAttribute("aria-expanded", String(o));
  });

  var links = $$(".masthead nav a[href^='#']");
  if (links.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) links.forEach(function (a) { a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id); }); });
    }, { rootMargin: "-30% 0px -60% 0px" });
    $$(".content section[id]").forEach(function (s) { io.observe(s); });
  }

  /* PEFT explorer (only on peft-explorer.html) */
  var sel = {}, out = {};
  $$("[data-peft-select]").forEach(function (s) { sel[s.getAttribute("data-peft-select")] = s; });
  if (!sel.model) return;
  $$("[data-peft-out]").forEach(function (o) { out[o.getAttribute("data-peft-out")] = o; });
  var BB = [{ n: "1.1B", p: 1.1e9, l: 24, h: 2048, f: 5504 }, { n: "3.2B", p: 3.2e9, l: 32, h: 3072, f: 8192 }, { n: "8.0B", p: 8.0e9, l: 32, h: 4096, f: 14336 }, { n: "14.7B", p: 14.7e9, l: 40, h: 5120, f: 13824 }];
  var RANKS = [4, 8, 16, 32, 64], TARGETS = ["qv", "attention", "linear"], TL = ["Q + V", "All attention", "All linear"];
  var PREC = ["FP16", "INT8", "INT4"], BYTES = [2, 1, 0.5], GIB = Math.pow(2, 30);
  function fill(s, a) { a.forEach(function (t, i) { var o = document.createElement("option"); o.value = i; o.textContent = t; s.appendChild(o); }); }
  fill(sel.model, BB.map(function (b) { return b.n; })); fill(sel.rank, RANKS.map(String)); fill(sel.target, TL); fill(sel.precision, PREC);
  sel.model.value = 2; sel.rank.value = 2; sel.target.value = 0; sel.precision.value = 0;
  function fmt(n) { return n >= 1e9 ? (n / 1e9).toFixed(2) + " B" : n >= 1e6 ? (n / 1e6).toFixed(2) + " M" : (n / 1e3).toFixed(1) + " K"; }
  function recompute() {
    var m = BB[sel.model.value], r = RANKS[sel.rank.value], t = TARGETS[sel.target.value];
    var tr = m.l * r * ((t === "qv" ? 4 * m.h : 8 * m.h) + (t === "linear" ? 3 * (m.h + m.f) : 0));
    var peft = (m.p * BYTES[sel.precision.value] * 1.2 + tr * 16) / GIB + 2, full = m.p * 16 / GIB + 2;
    out.trainable.textContent = fmt(tr);
    out.reduction.textContent = ((1 - tr / m.p) * 100).toFixed(2) + " %";
    out.peftvram.textContent = out.peftvram2.textContent = peft.toFixed(1) + " GiB";
    out.fullvram.textContent = full.toFixed(1) + " GiB";
    $("[data-peft-bar]").style.width = Math.max(2, Math.min(100, peft / full * 100)) + "%";
    $("[data-peft-note]").textContent = peft <= 24 ? "Within a 24 GiB consumer GPU budget" : "Exceeds a 24 GiB consumer GPU budget";
  }
  Object.keys(sel).forEach(function (k) { sel[k].addEventListener("change", recompute); });
  recompute();
})();
