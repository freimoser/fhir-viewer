(function () {
  var d = document.documentElement;
  d.className += " js";
  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.getElementById("menu-btn");
    var nav = document.getElementById("site-nav");
    if (!btn || !nav) return;
    function set(open) {
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
      nav.classList.toggle("open", open);
    }
    btn.addEventListener("click", function () { set(btn.getAttribute("aria-expanded") !== "true"); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") set(false); });
    nav.addEventListener("click", function (e) { if (e.target.tagName === "A") set(false); });
  });
})();
