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

  /* Quantization simulator: 16x16 weight matrix, uniform symmetric quantization to 2^bits levels */
  var qRoot = $("[data-quantization]");
  if (qRoot) (function () {
    var slider = $("[data-quant-slider]"), outl = $("[data-quant-outliers]"), lc = $("[data-q-line]"), mc = $("[data-q-mat]");
    var presets = $$("[data-quant-preset]"), seed = 7, W = [], OUT = { 37: 1, 150: -0.95, 201: 0.9 };
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    function gauss() { return Math.sqrt(-2 * Math.log(rnd() || 1e-9)) * Math.cos(2 * Math.PI * rnd()); }
    for (var i = 0; i < 256; i++) W.push(Math.max(-0.7, Math.min(0.7, gauss() * 0.22)));
    function setup(c) {
      var d = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight, x = c.getContext("2d");
      c.width = Math.round(w * d); c.height = Math.round(h * d); x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, w, h);
      return { x: x, w: w, h: h };
    }
    function heat(v, dark) {
      var a = Math.min(1, Math.abs(v) * 1.15).toFixed(2);
      return v >= 0 ? (dark ? "rgba(130,150,255," : "rgba(58,61,240,") + a + ")" : "rgba(240,110,40," + a + ")";
    }
    function draw() {
      var bits = Number(slider.value), levels = Math.pow(2, bits), dark = document.documentElement.classList.contains("dark");
      var cs = getComputedStyle(document.documentElement), ink = cs.getPropertyValue("--ink"), muted = cs.getPropertyValue("--muted"), acc = cs.getPropertyValue("--acc"), line = cs.getPropertyValue("--line");
      var w = W.map(function (v, i) { return outl.checked && OUT[i] !== undefined ? OUT[i] : v; });
      var m = Math.max.apply(null, w.map(Math.abs)), step = 2 * m / (levels - 1);
      var q = w.map(function (v) { return Math.round((v + m) / step) * step - m; });
      var mse = 0, pow = 0; w.forEach(function (v, i) { mse += (v - q[i]) * (v - q[i]); pow += v * v; }); mse /= 256; pow /= 256;
      $("[data-quant-bits]").textContent = bits;
      $("[data-quant-memory]").textContent = Math.round(bits / 16 * 100) + "% (" + (16 / bits).toFixed(bits === 8 || bits === 4 || bits === 2 ? 0 : 1) + "× smaller)";
      $("[data-quant-levels]").textContent = levels.toLocaleString();
      $("[data-quant-mse]").textContent = mse.toExponential(1);
      $("[data-quant-snr]").textContent = (10 * Math.log10(pow / mse)).toFixed(1) + " dB";
      presets.forEach(function (b) { b.setAttribute("aria-pressed", String(Number(b.getAttribute("data-quant-preset")) === bits)); });

      var L = setup(lc), x = L.x, pad = 10, n = 64, dx = (L.w - 2 * pad) / n;
      function X(i) { return pad + (i + 0.5) * dx; } function Y(v) { return L.h / 2 - v / 1.08 * (L.h / 2 - pad); }
      x.lineWidth = 1; x.strokeStyle = line; x.beginPath(); x.moveTo(pad, Y(0)); x.lineTo(L.w - pad, Y(0)); x.stroke();
      if (bits <= 5) { x.globalAlpha = 0.55; for (var k = 0; k < levels; k++) { x.beginPath(); x.moveTo(pad, Y(-m + k * step)); x.lineTo(L.w - pad, Y(-m + k * step)); x.stroke(); } x.globalAlpha = 1; }
      x.strokeStyle = muted; x.lineWidth = 1.5; x.beginPath(); for (var i2 = 0; i2 < n; i2++) i2 ? x.lineTo(X(i2), Y(w[i2])) : x.moveTo(X(i2), Y(w[i2])); x.stroke();
      x.strokeStyle = acc; x.lineWidth = 2.5; x.beginPath();
      for (var j = 0; j < n; j++) { var a = X(j) - dx / 2, b = X(j) + dx / 2; j ? x.lineTo(a, Y(q[j])) : x.moveTo(a, Y(q[j])); x.lineTo(b, Y(q[j])); } x.stroke();
      x.fillStyle = muted; x.font = "10px JetBrains Mono, monospace"; x.fillText("+" + m.toFixed(2), pad, 12); x.fillText("-" + m.toFixed(2), pad, L.h - 4);

      var M = setup(mc), g = 8, pw = (M.w - 2 * g) / 3, cell = Math.min(pw, M.h - 24) / 16, names = ["Original", "Quantized", "Error"];
      for (var p = 0; p < 3; p++) {
        var ox = p * (pw + g) + (pw - cell * 16) / 2;
        for (var r = 0; r < 256; r++) {
          var v = p === 0 ? w[r] : p === 1 ? q[r] : (w[r] - q[r]) / 0.25;
          M.x.fillStyle = heat(v, dark); M.x.fillRect(ox + (r % 16) * cell, 4 + Math.floor(r / 16) * cell, cell + 0.4, cell + 0.4);
        }
        M.x.strokeStyle = line; M.x.lineWidth = 1; M.x.strokeRect(ox, 4, cell * 16, cell * 16);
        M.x.strokeStyle = ink; M.x.lineWidth = 1.5; M.x.strokeRect(ox, 4, cell * 16, cell * 4);
        M.x.fillStyle = muted; M.x.font = "11px Plus Jakarta Sans, sans-serif"; M.x.textAlign = "center"; M.x.fillText(names[p], ox + cell * 8, M.h - 6);
      }
    }
    slider.addEventListener("input", draw); outl.addEventListener("change", draw);
    presets.forEach(function (b) { b.addEventListener("click", function () { slider.value = b.getAttribute("data-quant-preset"); draw(); }); });
    window.addEventListener("resize", draw);
    new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    draw();
  })();

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
