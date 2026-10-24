/* Hamadullah Bijarani — academic portfolio (standalone build) */
(function () {
  "use strict";

  /* ---------- theme (day / night) ---------- */
  var root = document.documentElement;
  function applyTheme(dark) {
    root.classList.toggle("dark", dark);
    var btn = document.querySelector("[data-theme-toggle]");
    if (btn) {
      btn.setAttribute("aria-label", dark ? "Switch to day mode" : "Switch to night mode");
      btn.setAttribute("title", dark ? "Day mode" : "Night mode");
    }
  }
  var saved = null;
  try { saved = localStorage.getItem("hb-theme"); } catch (e) {}
  applyTheme(saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches);
  var themeBtn = document.querySelector("[data-theme-toggle]");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = !root.classList.contains("dark");
      applyTheme(next);
      try { localStorage.setItem("hb-theme", next ? "dark" : "light"); } catch (e) {}
    });
  }

  /* ---------- copy buttons ---------- */
  function copyText(value, statusEl) {
    function ok() {
      if (!statusEl) return;
      statusEl.textContent = "(copied!)";
      setTimeout(function () { statusEl.textContent = ""; }, 2500);
    }
    function fail() { if (statusEl) statusEl.textContent = "Unable to copy"; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(ok, fail);
    } else {
      var ta = document.createElement("textarea");
      ta.value = value;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy") ? ok() : fail(); } catch (e) { fail(); }
      document.body.removeChild(ta);
    }
  }
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var status = btn.parentElement && btn.parentElement.querySelector('[role="status"]');
      copyText(btn.getAttribute("data-copy"), status);
    });
  });

  /* ---------- native dialogs (BibTeX, mobile nav) ---------- */
  var lastTrigger = null;
  document.querySelectorAll("[data-open-dialog]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var dlg = document.getElementById(btn.getAttribute("data-open-dialog"));
      if (!dlg) return;
      lastTrigger = btn;
      if (typeof dlg.showModal === "function") dlg.showModal();
      else dlg.setAttribute("open", "");
    });
  });
  document.querySelectorAll("dialog").forEach(function (dlg) {
    dlg.querySelectorAll("[data-dialog-close]").forEach(function (c) {
      c.addEventListener("click", function () { dlg.close(); });
    });
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg) dlg.close(); // backdrop click
    });
    dlg.addEventListener("close", function () {
      if (lastTrigger) lastTrigger.focus();
    });
  });

  /* ---------- research tabs (pillars / PEFT explorer) ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll("[data-tab]"));
  function showPanel(name) {
    tabs.forEach(function (t) {
      t.setAttribute("aria-selected", String(t.getAttribute("data-tab") === name));
    });
    document.querySelectorAll("[data-panel]").forEach(function (p) {
      p.hidden = p.getAttribute("data-panel") !== name;
      p.id = "panel-" + p.getAttribute("data-panel");
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { showPanel(t.getAttribute("data-tab")); });
    t.addEventListener("keydown", function (e) {
      var n = null;
      if (e.key === "ArrowRight") n = tabs[(i + 1) % tabs.length];
      if (e.key === "ArrowLeft") n = tabs[(i - 1 + tabs.length) % tabs.length];
      if (n) { e.preventDefault(); n.focus(); n.click(); }
    });
  });
  document.querySelectorAll("[data-goto-explorer]").forEach(function (b) {
    b.addEventListener("click", function () { showPanel("explorer"); });
  });

  /* ---------- abstract accordion ---------- */
  var absBtn = document.querySelector("[data-abstract-toggle]");
  var absBlock = document.getElementById("paper-abstract");
  if (absBtn && absBlock) {
    absBtn.addEventListener("click", function () {
      var open = absBlock.hidden;
      absBlock.hidden = !open;
      absBtn.setAttribute("aria-expanded", String(open));
      absBtn.firstChild.textContent = open ? "Hide abstract " : "View abstract ";
    });
  }

  /* ---------- project filters ---------- */
  var filterBtns = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
  var articles = Array.prototype.slice.call(document.querySelectorAll("article[data-category]"));
  filterBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      var cat = b.getAttribute("data-filter");
      filterBtns.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      articles.forEach(function (a) {
        a.hidden = !(cat === "All Systems" || a.getAttribute("data-category") === cat);
      });
    });
  });

  /* ---------- PEFT compute explorer ---------- */
  // Mirrors the estimates shown on the live site: illustrative dense,
  // non-GQA transformers; 3 gated MLP projections; LoRA r*(in+out) per
  // projection; Adam-style mixed precision at 16 bytes per trainable
  // parameter; +20% frozen-weight overhead; +2 GiB activation allowance.
  var BACKBONES = [
    { parameters: 1.1e9,  layers: 24, hidden: 2048, intermediate: 5504 },
    { parameters: 3.2e9,  layers: 32, hidden: 3072, intermediate: 8192 },
    { parameters: 8.0e9,  layers: 32, hidden: 4096, intermediate: 14336 },
    { parameters: 14.7e9, layers: 40, hidden: 5120, intermediate: 13824 }
  ];
  var RANKS = [4, 8, 16, 32, 64];
  var TARGETS = ["qv", "attention", "linear"];
  var PRECISIONS = { FP16: 2, INT8: 1, INT4: 0.5 };
  var PRECISION_KEYS = ["FP16", "INT8", "INT4"];
  var GIB = Math.pow(2, 30);

  function estimate(modelIndex, rank, target, precision) {
    var m = BACKBONES[modelIndex] || BACKBONES[2];
    var attention = target === "qv" ? 4 * m.hidden : 8 * m.hidden;
    var mlp = target === "linear" ? 3 * (m.hidden + m.intermediate) : 0;
    var trainable = m.layers * rank * (attention + mlp);
    var bytes = PRECISIONS[precision];
    var peftVram = (m.parameters * bytes * 1.2 + trainable * 16) / GIB + 2;
    var fullVram = (m.parameters * 16) / GIB + 2;
    return { trainable: trainable, reduction: (1 - trainable / m.parameters) * 100, peftVram: peftVram, fullVram: fullVram };
  }
  function fmtParams(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(2) + " B";
    if (n >= 1e6) return (n / 1e6).toFixed(2) + " M";
    return (n / 1e3).toFixed(1) + " K";
  }

  var selects = {};
  document.querySelectorAll("[data-peft-select]").forEach(function (s) {
    selects[s.getAttribute("data-peft-select")] = s;
  });
  var outs = {};
  document.querySelectorAll("[data-peft-out]").forEach(function (el) {
    outs[el.getAttribute("data-peft-out")] = el;
  });

  function recompute() {
    if (!selects.model) return;
    var r = estimate(
      Number(selects.model.value),
      RANKS[Number(selects.rank.value)],
      TARGETS[Number(selects.target.value)],
      PRECISION_KEYS[Number(selects.precision.value)]
    );
    if (outs.trainable) outs.trainable.textContent = fmtParams(r.trainable);
    if (outs.reduction) outs.reduction.textContent = r.reduction.toFixed(2) + " %";
    if (outs.peftvram) outs.peftvram.textContent = r.peftVram.toFixed(1) + " GiB";
    if (outs.fullvram) outs.fullvram.textContent = r.fullVram.toFixed(1) + " GiB";
  }
  Object.keys(selects).forEach(function (k) {
    selects[k].addEventListener("change", recompute);
  });
  // Default to the 8.0B backbone / rank 16 / Q+V / FP16 view shown on the live site.
  if (selects.model) {
    selects.model.value = "2";
    selects.rank.value = "2";
    selects.target.value = "0";
    selects.precision.value = "0";
    recompute();
  }
})();
