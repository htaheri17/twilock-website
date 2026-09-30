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
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (reduce || !("IntersectionObserver" in window)) {
    root.classList.remove("js");
    window.addEventListener("scroll", () => {
      if (header) header.classList.toggle("is-scrolled", window.scrollY > 24);
    }, { passive: true });
    return;
  }

  const splitWords = (element) => {
    const words = element.textContent.trim().split(/\s+/);
    element.textContent = "";
    words.forEach((word, index) => {
      const span = document.createElement("span");
      span.className = "word";
      span.style.setProperty("--i", String(index));
      span.textContent = word;
      element.appendChild(span);
      if (index < words.length - 1) element.appendChild(document.createTextNode(" "));
    });
    return element.querySelectorAll(".word");
  };

  document.querySelectorAll(".section-heading h2, .final-cta h2").forEach((heading) => {
    if (heading.children.length) return;
    splitWords(heading);
    heading.classList.add("split", "split-grad");
    if (window.__twWords) window.__twWords(heading);
  });

  document.querySelectorAll(".strict-copy h2, .founder-band h2, .privacy-summary-copy h2, .article-body > h2").forEach((heading) => {
    if (heading.children.length) return;
    splitWords(heading);
    heading.classList.add("split");
  });

  const fills = [];
  document.querySelectorAll(".problem-statement .large-copy, .commitment-panel blockquote").forEach((block) => {
    if (block.children.length) return;
    block.classList.add("fill");
    fills.push({ block, words: splitWords(block) });
  });

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
    ".footer-grid > *",
    ".strict-copy .check-list > li",
    ".source-list > li",
  ].join(",");
  document.querySelectorAll(staggered).forEach((element) => {
    element.dataset.reveal = element.matches(".timeline-point") ? "dot" : "card";
    const index = Array.prototype.indexOf.call(element.parentElement.children, element);
    element.style.setProperty("--i", String(index % 8));
  });

  mark(".section-heading, .problem-statement > div:first-child, .strict-copy, .privacy-summary-copy, .founder-band > div, .article-body > h2, .product-review-header", "lift");
  mark(".commitment-panel, .final-cta, .timeline, .comparison-table-wrap, .direct-answer, .callout, .methodology, .disclosure", "panel");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const element = entry.target;
      if (entry.isIntersecting) {
        if (element.classList.contains("is-in")) return;
        element.classList.add("is-in");
        if (element.matches(".problem-point")) tickClock(element.querySelector(".time"));
      } else if (entry.boundingClientRect.top > 0) {
        element.classList.remove("is-in");
      }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0 });

  document.querySelectorAll("[data-reveal]").forEach((element) => observer.observe(element));

  const progressBar = document.createElement("div");
  progressBar.className = "scroll-progress";
  progressBar.setAttribute("aria-hidden", "true");
  document.body.appendChild(progressBar);

  const stepsList = document.querySelector(".steps");
  let beam = null;
  if (stepsList) {
    beam = document.createElement("div");
    beam.className = "steps-beam";
    beam.setAttribute("aria-hidden", "true");
    stepsList.appendChild(beam);
  }

  document.querySelectorAll(".faq-list details").forEach((item) => {
    const summary = item.querySelector("summary");
    const body = item.querySelector("summary + *");
    if (!summary || !body) return;
    summary.addEventListener("click", (event) => {
      event.preventDefault();
      if (item.dataset.animating) return;
      item.dataset.animating = "1";
      if (!item.open) {
        item.open = true;
        const height = body.scrollHeight;
        body.animate([{ height: "0px", opacity: 0 }, { height: `${height}px`, opacity: 1 }], { duration: 480, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" }).onfinish = () => {
          delete item.dataset.animating;
        };
      } else {
        item.classList.add("is-closing");
        const height = body.scrollHeight;
        body.animate([{ height: `${height}px`, opacity: 1 }, { height: "0px", opacity: 0 }], { duration: 380, easing: "cubic-bezier(0.4, 0, 0.2, 1)" }).onfinish = () => {
          item.open = false;
          item.classList.remove("is-closing");
          delete item.dataset.animating;
        };
      }
    });
  });

  const ambient = document.createElement("div");
  ambient.className = "ambient";
  ambient.setAttribute("aria-hidden", "true");
  ambient.innerHTML = "<span></span><span></span><span></span>";
  document.body.prepend(ambient);
  const orbs = ambient.querySelectorAll("span");

  const layers = [
    [".panel-luno, .final-luno", 0.1],
    [".step-number, .difference-index, .privacy-point-number, .problem-point .time", 0.07],
    [".section-heading .kicker, .section-heading p, .strict-copy > p, .founder-copy", 0.035],
    [".section-heading h2, .strict-copy h2, .privacy-summary-copy h2, .founder-band h2, .final-cta h2", 0.055],
    [".timeline-dot", 0.04],
    [".hero-copy, .hero-actions", -0.06],
  ];
  const drifters = [];
  layers.forEach(([selector, depth]) => {
    document.querySelectorAll(selector).forEach((element) => drifters.push({ element, depth }));
  });

  let lastY = window.scrollY;
  let ticking = false;
  const frame = () => {
    ticking = false;
    const y = window.scrollY;
    const viewport = window.innerHeight;
    const max = Math.max(1, document.documentElement.scrollHeight - viewport);
    progressBar.style.transform = `scaleX(${Math.min(1, y / max).toFixed(4)})`;

    if (header) {
      header.classList.toggle("is-scrolled", y > 24);
      if (y > lastY + 6 && y > 480 && !(menu && menu.open)) header.classList.add("is-hidden");
      if (y < lastY - 6 || y < 480) header.classList.remove("is-hidden");
    }
    lastY = y;

    if (hero) {
      const progress = Math.min(1, y / (hero.offsetHeight || 1));
      hero.style.setProperty("--p", progress.toFixed(3));
    }

    fills.forEach(({ block, words }) => {
      const rect = block.getBoundingClientRect();
      const start = viewport * 0.9;
      const end = viewport * 0.42;
      const progress = Math.min(1, Math.max(0, (start - rect.top) / (start - end)));
      const lit = Math.round(progress * words.length);
      words.forEach((word, index) => word.classList.toggle("lit", index < lit));
    });

    const offsets = drifters.map(({ element }) => {
      const rect = element.getBoundingClientRect();
      if (rect.bottom < -300 || rect.top > viewport + 300) return null;
      return rect.top + rect.height / 2 - viewport / 2;
    });
    drifters.forEach(({ element, depth }, index) => {
      if (offsets[index] === null) return;
      element.style.translate = `0 ${(offsets[index] * -depth).toFixed(1)}px`;
    });

    if (stepsList && beam) {
      const rect = stepsList.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (viewport * 0.6 - rect.top) / rect.height));
      beam.style.transform = `scaleY(${progress.toFixed(4)})`;
      const reach = progress * rect.height;
      stepsList.querySelectorAll(".step").forEach((step) => {
        step.classList.toggle("is-lit", step.offsetTop + 100 <= reach);
      });
    }

    if (orbs.length === 3) {
      orbs[0].style.translate = `${(Math.sin(y / 900) * 140).toFixed(1)}px ${(y * -0.12 % 900).toFixed(1)}px`;
      orbs[1].style.translate = `${(Math.cos(y / 700) * -160).toFixed(1)}px ${(Math.sin(y / 1100) * 180).toFixed(1)}px`;
      orbs[2].style.translate = `${(Math.sin(y / 1300) * 220).toFixed(1)}px ${(Math.cos(y / 800) * 120).toFixed(1)}px`;
      orbs[2].style.scale = (1 + Math.sin(y / 1000) * 0.18).toFixed(3);
    }
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(frame);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  frame();

  if (canHover) {
    document.querySelectorAll(".editorial-card, .pricing-card, .difference-item").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        card.style.setProperty("--mx", `${x}px`);
        card.style.setProperty("--my", `${y}px`);
        card.style.setProperty("--ry", `${((x / rect.width) - 0.5) * 5}deg`);
        card.style.setProperty("--rx", `${(0.5 - (y / rect.height)) * 5}deg`);
      });
      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });

    document.querySelectorAll(".app-store-button").forEach((button) => {
      button.addEventListener("pointermove", (event) => {
        const rect = button.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        button.style.translate = `${(dx * 0.18).toFixed(1)}px ${(dy * 0.28).toFixed(1)}px`;
      });
      button.addEventListener("pointerleave", () => {
        button.style.translate = "0 0";
      });
    });
  }
})();
