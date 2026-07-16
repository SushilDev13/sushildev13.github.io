// ---------- repo links ----------
// Single source of truth: once Publyq collateral (demo, case study, architecture
// writeup) and Kashiq are ready, fill in the URLs below and the corresponding
// links wire themselves up / drop their disabled state automatically.
const REPO_LINKS = {
  publyq: "https://publyq.in",
  publyqCaseStudy: null,
  publyqArchitecture: null,
  kashiq: "https://kashiq.in"
};

function wireRepoLinks() {
  const actionMap = [
    { id: "publyq", url: REPO_LINKS.publyq },
    { id: "publyq-case-study", url: REPO_LINKS.publyqCaseStudy },
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
      kashiq.textContent = "view landing page →";
      kashiq.classList.remove("is-disabled");
    } else {
      kashiq.removeAttribute("href");
      kashiq.textContent = "coming soon";
      kashiq.classList.add("is-disabled");
    }
  }
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
  setupScrollReveal();
});
