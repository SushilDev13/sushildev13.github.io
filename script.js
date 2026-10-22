// ---------- external links ----------
// Single source of truth for every outbound URL. Any element with
// data-link="<key>" picks up its href here; an empty value disables it.
const LINKS = {
  calendly: "https://calendly.com/sushilkumarsenthilnathan/20mins",
  publyq: "https://publyq.in",
  publyqData: "https://publyq.in/data",
  publyqArchitecture: "https://publyq-kappa.vercel.app",
  relmir: "https://relmir.com",
  kashiq: "https://kashiq.in",
  linkedin: "https://linkedin.com/in/sushilkumar-s/",
  github: "https://github.com/SushilDev13",
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function wireLinks() {
  document.querySelectorAll("[data-link]").forEach((el) => {
    const url = LINKS[el.dataset.link];
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
}

// ---------- one rAF-throttled scroll loop shared by every scroll-driven effect ----------
const scrollTasks = [];
function onScrollFrame(fn) {
  scrollTasks.push(fn);
}
function startScrollLoop() {
  let ticking = false;
  const run = () => {
    scrollTasks.forEach((fn) => fn());
    ticking = false;
  };
  const request = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(run);
    }
  };
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  run();
}

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// ---------- nav: solid on scroll, inverts over dark chapters, mobile menu ----------
function setupNav() {
  const nav = document.getElementById("site-nav");
  const toggle = document.getElementById("nav-toggle");
  const links = document.getElementById("nav-links");
  if (!nav) return;

  const darkSections = Array.from(document.querySelectorAll("[data-theme='dark']"));
  onScrollFrame(() => {
    nav.classList.toggle("is-scrolled", window.scrollY > 24);
    const probe = 32;
    const overDark = darkSections.some((s) => {
      const r = s.getBoundingClientRect();
      return r.top <= probe && r.bottom >= probe;
    });
    nav.classList.toggle("is-dark", overDark);
  });

  if (!toggle || !links) return;
  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    links.classList.toggle("is-open", open);
    nav.classList.toggle("is-open", open);
  };
  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  links.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      setOpen(false);
      toggle.focus();
    }
  });
  document.addEventListener("click", (e) => {
    if (toggle.getAttribute("aria-expanded") !== "true") return;
    if (!links.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
  });
}

// ---------- scroll spy: highlight the nav link for the section in view ----------
function setupScrollSpy() {
  const links = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
  if (!links.length || !("IntersectionObserver" in window)) return;

  const linkForSection = new Map();
  links.forEach((link) => {
    const section = document.querySelector(link.getAttribute("href"));
    if (section) linkForSection.set(section, link);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const active = linkForSection.get(entry.target);
        links.forEach((l) => l.classList.toggle("is-active", l === active));
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  linkForSection.forEach((_l, section) => observer.observe(section));
}

// ---------- reveal on enter; also triggers in-view state for charts ----------
function setupReveal() {
  const targets = document.querySelectorAll(".reveal, [data-inview]");
  if (!("IntersectionObserver" in window)) {
    targets.forEach((t) => t.classList.add("in-view"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in-view");
        entry.target.dispatchEvent(new CustomEvent("inview"));
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
  );
  targets.forEach((t) => observer.observe(t));
}

// ---------- hero: scattered fragments resolve into three ordered systems ----------
// The stage's static grid is the "legible" end state. We measure each chip's
// resting position, give it a scattered offset, and scale that offset down to
// zero as the visitor scrolls, so the layout itself tells the story.
function setupHeroStage() {
  const hero = document.getElementById("top");
  const stage = document.getElementById("stage");
  if (!hero || !stage) return;
  const chips = Array.from(stage.querySelectorAll(".chip"));
  const status = stage.querySelector("[data-state]");
  const messy = status ? status.textContent : "";
  const legible = "3 systems · every fragment has a place";
  const pinned = window.matchMedia("(min-width: 961px) and (min-height: 701px)");

  // deterministic pseudo-random so the "mess" looks the same on every visit
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const scatter = chips.map(() => ({ x: rand(), y: rand(), r: (rand() - 0.5) * 22 }));

  function layout() {
    const box = stage.getBoundingClientRect();
    chips.forEach((chip, i) => {
      chip.style.setProperty("--q", 0);
      const c = chip.getBoundingClientRect();
      const s = scatter[i];
      const spreadX = box.width * 1.05;
      const spreadY = box.height * 1.1;
      const tx = (s.x - 0.5) * spreadX + box.width / 2 - (c.left - box.left) - c.width / 2;
      const ty = (s.y - 0.5) * spreadY + box.height / 2 - (c.top - box.top) - c.height / 2;
      chip.style.setProperty("--dx", tx.toFixed(1) + "px");
      chip.style.setProperty("--dy", ty.toFixed(1) + "px");
      chip.style.setProperty("--dr", s.r.toFixed(1) + "deg");
    });
  }

  function progress() {
    if (pinned.matches) {
      const range = hero.offsetHeight - window.innerHeight;
      return range > 0 ? clamp01(-hero.getBoundingClientRect().top / (range * 0.8)) : 1;
    }
    const top = stage.getBoundingClientRect().top;
    const vh = window.innerHeight;
    return clamp01((vh * 0.92 - top) / (vh * 0.5));
  }

  let lastLegible = null;
  function render(p) {
    chips.forEach((chip, i) => {
      const local = clamp01(p * 1.35 - (i % 6) * 0.05);
      chip.style.setProperty("--q", (1 - easeInOut(local)).toFixed(3));
    });
    stage.style.setProperty("--assembled", clamp01((p - 0.55) / 0.35).toFixed(3));
    hero.style.setProperty("--hero-p", p.toFixed(3));
    const isLegible = p > 0.92;
    if (isLegible !== lastLegible) {
      stage.classList.toggle("is-legible", isLegible);
      if (status) status.textContent = isLegible ? legible : messy;
      lastLegible = isLegible;
    }
  }

  if (reduceMotion.matches) {
    render(1);
    return;
  }

  layout();
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      layout();
      render(progress());
    }, 120);
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      layout();
      render(progress());
    });
  }
  onScrollFrame(() => render(progress()));
}

document.addEventListener("DOMContentLoaded", () => {
  wireLinks();
  setupNav();
  setupScrollSpy();
  setupReveal();
  setupHeroStage();
  startScrollLoop();
});
