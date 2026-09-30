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

  window.__twMotion = true;
  const root = document.documentElement;
  const header = document.querySelector(".site-header");
  const hero = document.querySelector(".hero");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canObserve = "IntersectionObserver" in window;

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = window.scrollY;
      if (header) header.classList.toggle("is-scrolled", y > 24);
      if (hero && !reduce) {
        const progress = Math.min(1, y / (hero.offsetHeight || 1));
        hero.style.setProperty("--p", progress.toFixed(3));
      }
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (reduce || !canObserve) {
    root.classList.remove("js");
    return;
  }

  const heading = document.querySelector(".hero h1");
  if (heading) {
    const words = heading.textContent.trim().split(/\s+/);
    heading.textContent = "";
    words.forEach((word, index) => {
      const span = document.createElement("span");
      span.className = "word";
      span.style.setProperty("--i", String(index));
      span.textContent = word;
      heading.appendChild(span);
      if (index < words.length - 1) heading.appendChild(document.createTextNode(" "));
    });
    const paintWords = () => {
      const box = heading.getBoundingClientRect();
      heading.querySelectorAll(".word").forEach((span) => {
        const rect = span.getBoundingClientRect();
        span.style.backgroundSize = `${box.width}px 100%`;
        span.style.backgroundPosition = `${box.left - rect.left}px 0`;
      });
    };
    paintWords();
    heading.classList.add("is-split");
    window.addEventListener("resize", paintWords);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(paintWords);
  }

  const tickClock = (node) => {
    if (!node) return;
    const target = node.textContent.trim();
    const match = target.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return;
    const total = Number(match[1]) * 60 + Number(match[2]);
    const start = performance.now();
    const duration = 1200;
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(total * eased);
      node.textContent = `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
      if (t < 1) requestAnimationFrame(step);
      else node.textContent = target;
    };
    requestAnimationFrame(step);
  };

  const mark = (selector, type) => {
    document.querySelectorAll(selector).forEach((element) => {
      if (!element.dataset.reveal) element.dataset.reveal = type;
    });
  };

  const staggered = [
    ".steps > .step",
    ".privacy-points > .privacy-point",
    ".difference-grid > .difference-item",
    ".pricing-grid > .pricing-card",
    ".editorial-cards > .editorial-card",
    ".problem-points > .problem-point",
    ".faq-list > details",
    ".verdict-grid > *",
    ".pros-cons-grid > *",
    ".support-grid > *",
    ".trust-row > span",
    ".timeline > .timeline-point",
  ].join(",");
  document.querySelectorAll(staggered).forEach((element) => {
    element.dataset.reveal = element.matches(".timeline-point") ? "dot" : "card";
    const index = Array.prototype.indexOf.call(element.parentElement.children, element);
    element.style.setProperty("--i", String(index % 6));
  });

  mark(".hero .section-heading, .section-heading, .problem-statement > div:first-child, .strict-copy, .privacy-summary-copy, .founder-band > div, .article-body > h2", "lift");
  mark(".commitment-panel, .final-cta, .timeline, .comparison-table-wrap, .direct-answer, .callout, .methodology, .disclosure", "panel");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const element = entry.target;
      element.classList.add("is-in");
      observer.unobserve(element);
      if (element.matches(".problem-point")) tickClock(element.querySelector(".time"));
    });
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0 });

  document.querySelectorAll("[data-reveal]").forEach((element) => observer.observe(element));

  if (window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".editorial-card, .pricing-card, .step, .difference-item").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
        card.style.setProperty("--my", `${event.clientY - rect.top}px`);
      });
    });
  }
})();
