// ---------- external links ----------
// Single source of truth for every outbound URL. Any element with
// data-link="<key>" picks up its href here; an empty value disables it.
const LINKS = {
  calendly: "https://calendly.com/sushilkumarsenthilnathan/20mins",
  publyq: "https://publyq.in",
  publyqData: "https://publyq.in/data",
  publyqArchitecture: "https://publyq-kappa.vercel.app",
  relmir: "https://relmir.com",
  axionCummins: "https://www.axion.com/news/cummins-ai-transformation-partnering-with-axion-for-customer-uptime-warranty-and-customer-experience",
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

  // the page is dark by default; flip the nav over full-width light or sun sections
  const themed = Array.from(document.querySelectorAll("section[data-theme], article[data-theme], footer[data-theme]"));
  onScrollFrame(() => {
    nav.classList.toggle("is-scrolled", window.scrollY > 24);
    const probe = 32;
    const under = themed.find((s) => {
      const r = s.getBoundingClientRect();
      return r.top <= probe && r.bottom >= probe;
    });
    const theme = under ? under.dataset.theme : "dark";
    nav.classList.toggle("is-light", theme === "light");
    nav.classList.toggle("is-sun", theme === "sun");
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

// ---------- hero: the logo assembles itself out of records ----------
// 826 dots sampled from the road in sushil_logo.png start scattered like raw
// records, then settle into the road as the sun rises behind them. Once formed,
// a pulse travels along the road toward the horizon: data flowing to an answer.
function setupField() {
  const field = document.getElementById("field");
  const canvas = document.getElementById("field-canvas");
  if (!field || !canvas || !window.ROAD_POINTS) return;
  const ctx = canvas.getContext && canvas.getContext("2d");
  if (!ctx) {
    field.classList.add("no-canvas");
    return;
  }

  let seed = 3;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const pts = window.ROAD_POINTS.split(";").map((e) => {
    const [x, y, s] = e.split(",").map(Number);
    return { tx: x, ty: y, s: s / 99, sx: rand() * 512, sy: rand() * 512 };
  });

  const DOT = 2.1;           // dot radius in logo units (grid step is 6)
  const FORM_MS = 2600;
  const SUN = { x: 256, y: 256, r: 236 };
  let size = 0;
  let scale = 1;
  let sunFill = null;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    size = canvas.clientWidth;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    scale = (size * dpr) / 512;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    // same direction as the logo: yellow top-left to pink bottom-right
    sunFill = ctx.createLinearGradient(80, 40, 440, 470);
    sunFill.addColorStop(0, "#FFDF36");
    sunFill.addColorStop(0.42, "#FBA348");
    sunFill.addColorStop(0.72, "#FC785B");
    sunFill.addColorStop(1, "#FC5B6E");
  }

  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const mix = (a, b, k) => Math.round(a + (b - a) * k);

  function draw(t, time) {
    ctx.clearRect(0, 0, 512, 512);

    // the sun rises as the records settle
    const sunK = ease(clamp01((t - 0.15) / 0.6));
    if (sunK > 0) {
      ctx.globalAlpha = sunK;
      ctx.fillStyle = sunFill;
      ctx.beginPath();
      ctx.arc(SUN.x, SUN.y + (1 - sunK) * 40, SUN.r * (0.85 + 0.15 * sunK), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // a pulse runs along the road from the near end to the horizon every few seconds
    const formed = t >= 1;
    const pulse = formed && time != null ? (time / 3400) % 1.3 : -1;

    for (const p of pts) {
      // near end of the road lands first, the horizon last
      const delay = 0.3 * p.s;
      const k = ease(clamp01((t - delay) / 0.7));
      const x = p.sx + (p.tx - p.sx) * k;
      const y = p.sy + (p.ty - p.sy) * k;
      // raw records are pale; settled ones become the road
      let r = mix(214, 8, k), g = mix(214, 8, k), b = mix(210, 8, k);
      let rad = DOT * (0.75 + 0.25 * k);
      if (pulse >= 0) {
        const d = Math.abs(p.s - pulse);
        if (d < 0.06) {
          const w = 1 - d / 0.06;
          rad *= 1 + 0.35 * w;
          r = mix(8, 255, w * 0.85); g = mix(8, 247, w * 0.85); b = mix(8, 230, w * 0.85);
        }
      }
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.globalAlpha = 0.55 + 0.45 * k;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  resize();

  if (reduceMotion.matches) {
    draw(1, null);
    field.classList.add("is-formed");
    window.addEventListener("resize", () => {
      resize();
      draw(1, null);
    });
    return;
  }

  let start = null;
  let raf = null;
  let visible = true;

  function frame(now) {
    if (start === null) start = now;
    const t = clamp01((now - start - 250) / FORM_MS);
    draw(t, t >= 1 ? now - start - 250 - FORM_MS : null);
    if (t >= 1) field.classList.add("is-formed");
    raf = visible && !document.hidden ? requestAnimationFrame(frame) : null;
  }
  const play = () => {
    if (raf === null && visible && !document.hidden) raf = requestAnimationFrame(frame);
  };

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      play();
    }).observe(canvas);
  }
  document.addEventListener("visibilitychange", play);
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 100);
  });
  play();
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

  // Reserve the finished card's height so fields appearing mid-scroll never
  // shift the content below (which would break anchor jumps on mobile).
  const wrap = record.parentElement;
  function reserveHeight() {
    const clone = record.cloneNode(true);
    clone.removeAttribute("id");
    clone.classList.add("has-ward");
    clone.querySelectorAll(".f").forEach((f) => {
      f.classList.remove("is-off", "is-new");
      f.style.transition = "none";
    });
    Object.assign(clone.style, { position: "absolute", visibility: "hidden", width: record.offsetWidth + "px" });
    wrap.appendChild(clone);
    const extra = wrap.offsetHeight - record.offsetHeight;
    wrap.style.minHeight = clone.offsetHeight + extra + "px";
    clone.remove();
  }
  reserveHeight();
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      wrap.style.minHeight = "";
      reserveHeight();
    }, 150);
  });

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

// ---------- tabs (Relmir production timeline): click + arrow/Home/End keys ----------
function setupTabs() {
  document.querySelectorAll('[role="tablist"]').forEach((tablist) => {
    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));

    // on narrow screens the stage list scrolls sideways; keep the active stage in view
    function reveal(tab) {
      if (tablist.scrollWidth <= tablist.clientWidth) return;
      tablist.scrollTo({ left: Math.max(0, tab.offsetLeft - 24), behavior: reduceMotion.matches ? "auto" : "smooth" });
    }

    function activate(tab) {
      reveal(tab);
      tabs.forEach((t) => {
        const selected = t === tab;
        t.setAttribute("aria-selected", String(selected));
        t.tabIndex = selected ? 0 : -1;
        const panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !selected;
      });
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => activate(tab));
      tab.addEventListener("keydown", (e) => {
        let next = null;
        if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
        else if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = tabs.length - 1;
        if (next === null) return;
        e.preventDefault();
        tabs[next].focus({ preventScroll: true });
        activate(tabs[next]);
      });
    });

    const selected = tabs.find((t) => t.getAttribute("aria-selected") === "true");
    if (selected) tablist.scrollLeft = Math.max(0, selected.offsetLeft - 24);
  });
}

// ---------- copy-to-clipboard (email, Discord), announced to screen readers ----------
function setupCopyButtons() {
  const status = document.getElementById("copy-status");
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    const hint = btn.querySelector(".copy-hint");
    const defaultHint = hint ? hint.textContent : "";

    btn.addEventListener("click", async () => {
      const value = btn.dataset.copy;
      let ok = false;
      try {
        await navigator.clipboard.writeText(value);
        ok = true;
      } catch (_) {
        // clipboard blocked (insecure context, permissions): fall back to a hidden textarea
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { ok = document.execCommand("copy"); } catch (_e) { ok = false; }
        ta.remove();
      }
      if (status) status.textContent = ok ? `Copied ${value}` : `Copy failed. ${value}`;
      if (!hint) return;
      hint.textContent = ok ? "Copied" : "Copy failed";
      btn.classList.toggle("is-copied", ok);
      clearTimeout(btn._copyTimer);
      btn._copyTimer = setTimeout(() => {
        hint.textContent = defaultHint;
        btn.classList.remove("is-copied");
      }, 1800);
    });
  });
}

// ---------- contact: the logo's road draws in from the horizon as you arrive ----------
function setupRoad() {
  const road = document.getElementById("road");
  if (!road || reduceMotion.matches) return;
  onScrollFrame(() => {
    const r = road.getBoundingClientRect();
    const vh = window.innerHeight;
    // 0 when the road's top enters the viewport, 1 once most of it is visible
    const p = clamp01((vh - r.top) / (r.height * 0.9));
    road.style.setProperty("--road-p", easeInOut(p).toFixed(3));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  wireLinks();
  setupNav();
  setupScrollSpy();
  setupReveal();
  setupField();
  setupCounters();
  setupRecordScrolly();
  setupWaffle();
  setupTabs();
  setupCopyButtons();
  setupRoad();
  startScrollLoop();
});
