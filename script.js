// ---------- repo links ----------
// Single source of truth: once Publyq / Kashiq are pushed to GitHub,
// update the two URLs below and both "view repo" links update automatically.
const REPO_LINKS = {
  publyq: "https://publyq.in",
  kashiq: "https://kashiq.in"
};

function wireRepoLinks() {
  const map = [
    { id: "publyq", url: REPO_LINKS.publyq },
    { id: "kashiq", url: REPO_LINKS.kashiq }
  ];

  map.forEach(({ id, url }) => {
    const el = document.getElementById(id);
    if (!el) return;

    if (url) {
      el.href = url;
      el.target = "_blank";
      el.rel = "noopener";

      if (id === "publyq") {
        el.textContent = "view platform →";
      } else if (id === "kashiq") {
        el.textContent = "view landing page →";
      }

      el.classList.remove("is-disabled");
    } else {
      el.removeAttribute("href");
      el.textContent = "coming soon";
      el.classList.add("is-disabled");
    }
  });
}

// ---------- terminal typing animation ----------
// Plays once on load. Respects prefers-reduced-motion by skipping straight
// to the final state instead of animating character-by-character.
function typeTerminal() {
  const body = document.getElementById("term-body");
  if (!body) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const script = [
    { type: "prompt-old", text: "axion-ray:~$ " },
    { type: "text", text: "git log --oneline -3\n" },
    {
      type: "term-comment",
      text:
        "a1c92e3  led 24 analysts, $15M+ in quality losses identified\n" +
        "6fd0a81  cut RCA from days \u2192 hours\n" +
        "3b1de44  scaled platform adoption across 450+ stakeholders\n"
    },
    { type: "prompt-old", text: "axion-ray:~$ " },
    { type: "text", text: "git checkout -b independent-builder\n" },
    { type: "term-comment", text: "Switched to a new branch 'independent-builder'\n" },
    { type: "prompt-new", text: "~/builds$ " },
    { type: "text", text: "ls\n" },
    {
      type: "term-comment",
      text:
        "publyq-civic-intelligence/\n" +
        "kashiq-personal-finance/\n"
    },
    { type: "prompt-new", text: "~/builds$ " }
  ];

  // Build the final static markup up front so reduced-motion users (and
  // anyone whose JS errors out mid-animation) still see the complete block.
  const finalHTML = script
    .map((seg) =>
      seg.type === "text"
        ? escapeHTML(seg.text)
        : `<span class="${seg.type}">${escapeHTML(seg.text)}</span>`
    )
    .join("") +'<span class="cursor"></span>';

  if (reduceMotion) {
    body.innerHTML = wrapLines(finalHTML);
    return;
  }

  body.innerHTML = "";
  const lineWrap = document.createElement("div");
  lineWrap.className = "line";
  body.appendChild(lineWrap);

  let segIndex = 0;
  let charIndex = 0;
  const speed = 14; // ms per character — fast enough not to feel like a gimmick

  function step() {
    if (segIndex >= script.length) {
      const cursor = document.createElement("span");
      cursor.className = "cursor";
      lineWrap.appendChild(cursor);
      return;
    }

    const seg = script[segIndex];
    const span =
      lineWrap.lastChild && lineWrap.lastChild.dataset && lineWrap.lastChild.dataset.seg === String(segIndex)
        ? lineWrap.lastChild
        : (() => {
            const s = document.createElement("span");
            if (seg.type !== "text") s.className = seg.type;
            s.dataset.seg = String(segIndex);
            lineWrap.appendChild(s);
            return s;
          })();

    span.textContent += seg.text[charIndex];
    charIndex++;

    if (charIndex >= seg.text.length) {
      segIndex++;
      charIndex = 0;
    }

    requestAnimationFrame(() => setTimeout(step, speed));
  }

  step();
}

function wrapLines(html) {
  return `<div class="line">${html}</div>`;
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- scroll reveal for build-log commits ----------
function setupScrollReveal() {
  const commits = document.querySelectorAll(".commit");
  if (!commits.length) return;

  if (!("IntersectionObserver" in window)) {
    commits.forEach((c) => c.classList.add("in-view"));
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

  commits.forEach((c) => observer.observe(c));
}

document.addEventListener("DOMContentLoaded", () => {
  wireRepoLinks();
  typeTerminal();
  setupScrollReveal();
});
