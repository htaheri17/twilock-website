(() => {
  const menu = document.querySelector(".mobile-nav");
  if (menu) {
    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => menu.removeAttribute("open"));
    });

    document.addEventListener("click", (event) => {
      if (menu.open && !menu.contains(event.target)) menu.removeAttribute("open");
    });
  }

  document.querySelectorAll("[data-current-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
})();
