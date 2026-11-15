/* Hamadullah Bijarani: portfolio (theme toggle, quantizer hero, nav highlight) */
(function () {
  "use strict";
  var root = document.documentElement;

  /* theme: system default, button overrides, choice remembered */
  var btn = document.querySelector("[data-theme-toggle]");
  function isDark() {
    var t = root.getAttribute("data-theme");
    return t ? t === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function label() { if (btn) btn.textContent = isDark() ? "Light mode" : "Dark mode"; }
  try { var s = localStorage.getItem("hb-theme"); if (s) root.setAttribute("data-theme", s); } catch (e) {}
  label();
  if (btn) btn.addEventListener("click", function () {
    var next = isDark() ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("hb-theme", next); } catch (e) {}
    label();
  });

  /* hero: a smooth signal and its quantized version */
  var svg = document.getElementById("quant-svg");
  var range = document.getElementById("quant-bits");
  if (svg && range) {
    var W = 600, H = 150, N = 240;
    var out = document.getElementById("quant-out");
    var info = document.getElementById("quant-info");
    var sig = function (t) { return 0.62 * Math.sin(t * 6.2832 * 1.5) + 0.25 * Math.sin(t * 6.2832 * 4.5 + 1); };
    var y = function (v) { return H / 2 - v * (H / 2 - 10); };
    var wave = "";
    for (var i = 0; i <= N; i++) wave += (i ? "L" : "M") + (i / N * W).toFixed(1) + " " + y(sig(i / N)).toFixed(1);
    function draw() {
      var bits = Number(range.value), levels = Math.pow(2, bits), step = 2 / (levels - 1);
      var q = "", err = 0;
      for (var i = 0; i <= N; i++) {
        var v = sig(i / N), qv = Math.max(-1, Math.min(1, Math.round(v / step) * step));
        err += Math.abs(v - qv);
        q += (i ? "L" : "M") + (i / N * W).toFixed(1) + " " + y(qv).toFixed(1);
      }
      svg.innerHTML =
        '<path d="' + wave + '" fill="none" stroke="var(--wave)" stroke-width="2"/>' +
        '<path d="' + q + '" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"/>';
      out.textContent = bits + "-bit · " + levels + " levels";
      info.textContent = "Mean error " + (err / (N + 1)).toFixed(3) + ". Model weights shrink to " + Math.round(bits / 16 * 100) + "% of FP16.";
    }
    range.addEventListener("input", draw);
    draw();
  }

  /* highlight the nav link of the section in view */
  var links = {};
  document.querySelectorAll(".site-header nav a[href^='#']").forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          Object.keys(links).forEach(function (k) { links[k].classList.toggle("on", k === e.target.id); });
        }
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    Object.keys(links).forEach(function (k) { var el = document.getElementById(k); if (el) io.observe(el); });
  }
})();
