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

// ---------- number counters: count up once when first seen ----------
// Markup already holds the final value, so no-JS and reduced-motion visitors
// see the real number; this only animates toward it.
function setupCounters() {
  const els = document.querySelectorAll("[data-count]");
  if (reduceMotion.matches || !("IntersectionObserver" in window)) return;
  const format = (el, v) => {
    const n = Number(el.dataset.count);
    const value = n >= 1000 ? Math.round(v).toLocaleString("en-US") : Math.round(v);
    return (el.dataset.prefix || "") + value + (el.dataset.suffix || "");
  };
  const run = (el) => {
    const target = Number(el.dataset.count);
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const t = clamp01((now - start) / duration);
      el.textContent = format(el, target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        run(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.6 }
  );
  els.forEach((el) => observer.observe(el));
}

// ---------- Publyq: the record card follows the step in view ----------
// Markup ships the finished record (step 4) so it reads correctly without JS.
function setupRecordScrolly() {
  const record = document.getElementById("record");
  const steps = Array.from(document.querySelectorAll(".step[data-step]"));
  if (!record || !steps.length || !("IntersectionObserver" in window)) return;

  const fields = Array.from(record.querySelectorAll(".f[data-from]"));
  const bars = Array.from(record.querySelectorAll(".record-progress i"));
  const label = record.querySelector("[data-stage-label]");
  const labels = ["Public post", "Raw record", "Placed in a ward", "Accountable record"];

  function setStep(n) {
    const prev = Number(record.dataset.step);
    if (prev === n) return;
    record.dataset.step = String(n);
    fields.forEach((f) => {
      const on = Number(f.dataset.from) <= n;
      const wasOn = !f.classList.contains("is-off");
      f.classList.toggle("is-off", !on);
      f.classList.toggle("is-new", on && !wasOn && !reduceMotion.matches);
    });
    record.classList.toggle("has-ward", n >= 3);
    bars.forEach((b, i) => b.classList.toggle("is-done", i < n));
    if (label) label.textContent = labels[n - 1];
    steps.forEach((s) => s.classList.toggle("is-current", Number(s.dataset.step) === n));
  }

  record.dataset.step = "0";
  setStep(1);
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setStep(Number(entry.target.dataset.step));
      });
    },
    { rootMargin: "-50% 0px -40% 0px" }
  );
  steps.forEach((s) => observer.observe(s));
}

// ---------- Publyq: waffle of 100 records, 58 arriving without a ward ----------
function setupWaffle() {
  const waffle = document.getElementById("waffle");
  const toggle = document.getElementById("waffle-toggle");
  if (!waffle) return;

  const UNPLACED = 58;
  // scatter the 58 unplaced squares so the grid reads as "most of it", not a block
  let seed = 11;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const order = Array.from({ length: 100 }, (_, i) => i).sort(() => rand() - 0.5);
  const unplaced = new Set(order.slice(0, UNPLACED));
  const frag = document.createDocumentFragment();
  const cells = [];
  for (let i = 0; i < 100; i++) {
    const cell = document.createElement("i");
    if (unplaced.has(i)) cell.className = "is-unplaced";
    frag.appendChild(cell);
    cells.push(cell);
  }
  waffle.appendChild(frag);

  const unplacedCells = cells.filter((c) => c.classList.contains("is-unplaced"));
  function setResolved(resolved) {
    if (!reduceMotion.matches) {
      unplacedCells.forEach((c, i) => {
        c.style.transitionDelay = resolved ? i * 14 + "ms" : "0ms";
      });
    }
    waffle.classList.toggle("is-resolved", resolved);
    if (toggle) {
      toggle.setAttribute("aria-pressed", String(resolved));
      toggle.textContent = resolved ? "Show the raw data" : "Place every record";
    }
  }

  let touched = false;
  if (toggle) {
    toggle.addEventListener("click", () => {
      touched = true;
      setResolved(!waffle.classList.contains("is-resolved"));
    });
  }

  // show the raw state first, then resolve once on first view unless the visitor already acted
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();
        setTimeout(() => {
          if (!touched) setResolved(true);
        }, 1400);
      },
      { threshold: 0.7 }
    );
    observer.observe(waffle);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  wireLinks();
  setupNav();
  setupScrollSpy();
  setupReveal();
  setupHeroStage();
  setupCounters();
  setupRecordScrolly();
  setupWaffle();
  startScrollLoop();
});
