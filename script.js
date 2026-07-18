// ---------- repo links ----------
// Single source of truth: once Publyq collateral (demo, architecture writeup)
// and Kashiq are ready, fill in the URLs below and the corresponding links
// wire themselves up / drop their disabled state automatically.
const REPO_LINKS = {
  publyq: "https://publyq.in",
  publyqArchitecture: "https://publyq-kappa.vercel.app",
  kashiq: "https://kashiq.in"
};

function wireRepoLinks() {
  const actionMap = [
    { id: "publyq", url: REPO_LINKS.publyq },
    { id: "publyq-architecture", url: REPO_LINKS.publyqArchitecture }
  ];

  actionMap.forEach(({ id, url }) => {
    const el = document.getElementById(id);
    if (!el) return;

    if (url) {
      el.href = url;
      el.target = "_blank";
      el.rel = "noopener";
      el.classList.remove("is-disabled");
    } else {
      el.removeAttribute("href");
      el.classList.add("is-disabled");
    }
  });

  const kashiq = document.getElementById("kashiq");
  if (kashiq) {
    if (REPO_LINKS.kashiq) {
      kashiq.href = REPO_LINKS.kashiq;
      kashiq.target = "_blank";
      kashiq.rel = "noopener";
      kashiq.textContent = "View Landing Page";
      kashiq.classList.remove("is-disabled");
    } else {
      kashiq.removeAttribute("href");
      kashiq.textContent = "coming soon";
      kashiq.classList.add("is-disabled");
    }
  }
}

// ---------- scroll reveal: build-log cards, section heads, staggered groups ----------
function setupScrollReveal() {
  const targets = document.querySelectorAll(".project-card, .reveal, .reveal-group");
  if (!targets.length) return;

  if (!("IntersectionObserver" in window)) {
    targets.forEach((t) => t.classList.add("in-view"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  targets.forEach((t) => observer.observe(t));
}

// ---------- ambient background tint that drifts with scroll position ----------
// Reinforces the "ideas evolving into software" narrative with a barely-there
// hue shift — skipped entirely under reduced-motion since it's decorative.
function setupScrollTint() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  let ticking = false;
  function update() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
    document.documentElement.style.setProperty("--scroll-progress", progress.toFixed(3));
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true }
  );

  update();
}

// ---------- build log tabs: Overview / Context / Engineering ----------
function setupProjectTabs() {
  const FADE_MS = 160;

  document.querySelectorAll(".tabs").forEach((tablist) => {
    const tabs = Array.from(tablist.querySelectorAll(".tab"));
    const panelsWrap = tablist.nextElementSibling;
    if (!panelsWrap || !panelsWrap.classList.contains("tab-panels")) return;
    const panels = Array.from(panelsWrap.querySelectorAll(".tab-panel"));

    function activate(tab) {
      if (tab.getAttribute("aria-selected") === "true") return;
      const targetPanel = panels.find((p) => p.id === tab.getAttribute("aria-controls"));
      const currentPanel = panels.find((p) => !p.hidden);
      if (!targetPanel || targetPanel === currentPanel) return;

      tabs.forEach((t) => {
        const selected = t === tab;
        t.setAttribute("aria-selected", String(selected));
        t.tabIndex = selected ? 0 : -1;
        t.classList.toggle("is-active", selected);
      });

      const startHeight = panelsWrap.getBoundingClientRect().height;
      panelsWrap.style.height = startHeight + "px";

      if (currentPanel) currentPanel.classList.remove("is-active");

      window.setTimeout(() => {
        if (currentPanel) currentPanel.hidden = true;
        targetPanel.hidden = false;

        const endHeight = targetPanel.scrollHeight;
        panelsWrap.style.height = endHeight + "px";

        // force a reflow so the opacity:0 starting state is committed
        // before the class change, otherwise the fade-in never animates
        void targetPanel.offsetHeight;
        targetPanel.classList.add("is-active");

        window.setTimeout(() => {
          panelsWrap.style.height = "";
        }, FADE_MS + 40);
      }, FADE_MS);
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => activate(tab));
      tab.addEventListener("keydown", (e) => {
        let next = null;
        if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
        else if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = tabs.length - 1;
        if (next !== null) {
          e.preventDefault();
          tabs[next].focus({ preventScroll: true });
          activate(tabs[next]);
        }
      });
    });
  });
}

// ---------- mobile nav: hamburger toggle for the collapsed link list ----------
function setupNavToggle() {
  const toggle = document.getElementById("nav-toggle");
  const links = document.getElementById("nav-links");
  if (!toggle || !links) return;

  function closeMenu() {
    toggle.setAttribute("aria-expanded", "false");
    links.classList.remove("is-open");
  }

  function openMenu() {
    toggle.setAttribute("aria-expanded", "true");
    links.classList.add("is-open");
  }

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  links.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  document.addEventListener("click", (e) => {
    if (toggle.getAttribute("aria-expanded") !== "true") return;
    if (!links.contains(e.target) && !toggle.contains(e.target)) closeMenu();
  });
}

// ---------- cursor-tracked glow: pipeline chips, stack/tech tags ----------
// Tracks pointer position over each matched element as CSS custom properties so the
// glow (defined in styles.css) can follow the cursor. On pointerdown it also toggles
// a class briefly, since touch devices have no hover state to trigger the effect.
function setupPointerGlow(selector, varX, varY, tapDurationMs) {
  document.querySelectorAll(selector).forEach((el) => {
    function setSpot(clientX, clientY) {
      const rect = el.getBoundingClientRect();
      el.style.setProperty(varX, ((clientX - rect.left) / rect.width) * 100 + "%");
      el.style.setProperty(varY, ((clientY - rect.top) / rect.height) * 100 + "%");
    }

    el.addEventListener("pointermove", (e) => setSpot(e.clientX, e.clientY));
    el.addEventListener("pointerleave", () => {
      el.style.setProperty(varX, "50%");
      el.style.setProperty(varY, "50%");
    });
    el.addEventListener("pointerdown", (e) => {
      setSpot(e.clientX, e.clientY);
      el.classList.add("is-glowing");
      window.clearTimeout(el._glowTimer);
      el._glowTimer = window.setTimeout(() => {
        el.classList.remove("is-glowing");
      }, tapDurationMs);
    });
  });
}

function setupGlowEffects() {
  setupPointerGlow(".pipeline-chip", "--chip-x", "--chip-y", 900);
  setupPointerGlow(".stack-flow li", "--tag-x", "--tag-y", 500);
  setupPointerGlow(".btn-secondary", "--btn-x", "--btn-y", 700);
}

document.addEventListener("DOMContentLoaded", () => {
  wireRepoLinks();
  setupScrollReveal();
  setupScrollTint();
  setupProjectTabs();
  setupNavToggle();
  setupGlowEffects();
});
