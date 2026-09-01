import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sourceDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(sourceDir, "..");
const distDir = path.join(projectDir, "dist");
const siteUrl = (process.env.SITE_URL || "https://twilock.app").replace(/\/$/, "");
const appStoreUrl = "https://apps.apple.com/us/app/twilock-screen-time-blocker/id6786474238";
const checkedDate = "August 31, 2026";
const isoDate = "2026-08-31";
const visibleDashPattern = /[-‐‑‒–—]/g;

const cleanUserCopy = (value) => value.replace(visibleDashPattern, " ").replace(/ {2,}/g, " ");

const cleanVisibleMarkup = (markup) => markup
  .replace(/>([^<]+)</g, (_, text) => `>${cleanUserCopy(text)}<`)
  .replace(/\b(aria-label|alt|title)="([^"]*)"/g, (_, attribute, value) => `${attribute}="${cleanUserCopy(value)}"`);

const cleanSchemaCopy = (value) => {
  if (Array.isArray(value)) return value.map(cleanSchemaCopy);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cleanSchemaCopy(item)]));
  }
  if (typeof value !== "string" || /^https?:\/\//.test(value) || /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return cleanUserCopy(value);
};

const routes = [
  "",
  "twilock-vs-opal",
  "block-social-media-at-night-iphone",
  "best-nighttime-app-blockers",
  "best-strict-app-blockers-iphone",
  "best-screen-time-apps-iphone",
  "about",
  "support",
  "privacy",
  "terms",
];

const appStoreButton = (compact = false) => `
  <a class="app-store-button${compact ? " compact" : ""}" href="${appStoreUrl}" aria-label="Download Twilock on the App Store">
    <span class="store-copy"><small>Download on the</small><strong>App Store</strong></span>
  </a>`;

const canonicalFor = (route) => `${siteUrl}/${route ? `${route}/` : ""}`;

const breadcrumbSchema = (route, label) => ({
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Twilock", item: `${siteUrl}/` },
    { "@type": "ListItem", position: 2, name: label, item: canonicalFor(route) },
  ],
});

const articleSchema = (route, headline, description) => ({
  "@type": "Article",
  headline,
  description,
  datePublished: isoDate,
  dateModified: isoDate,
  mainEntityOfPage: canonicalFor(route),
  author: { "@type": "Person", name: "Hussain Taheri", url: `${siteUrl}/about/` },
  publisher: { "@type": "Organization", name: "Twilock", url: `${siteUrl}/` },
});

const breadcrumbs = (label) => `
  <nav class="breadcrumbs" aria-label="Breadcrumb">
    <a href="/">Twilock</a><span aria-hidden="true">/</span><span aria-current="page">${label}</span>
  </nav>`;

const disclosure = () => `
  <aside class="disclosure" aria-label="Publisher disclosure">
    <p><strong>Publisher disclosure:</strong> Twilock publishes this page. We compare products against their official pages and help documentation, include drawbacks, and link the sources so you can verify the details yourself.</p>
  </aside>`;

const articleAside = (copy = "Twilock focuses on the two windows around sleep, with Strict Mode when you want your earlier choice to hold.") => `
  <aside class="article-aside" aria-label="About Twilock">
    <div>
      <h2>Protect tonight.</h2>
      <p>${copy}</p>
    </div>
    ${appStoreButton()}
  </aside>`;

const nav = (route) => {
  const link = (href, label, activeRoutes = []) => `<a class="nav-link" href="${href}"${activeRoutes.includes(route) ? ' aria-current="page"' : ""}>${label}</a>`;
  return `
    <header class="site-header">
      <div class="shell nav-row">
        <a class="brand" href="/" aria-label="Twilock home"><img src="/assets/twilock-icon.png" width="34" height="34" alt=""><span>Twilock</span></a>
        <nav class="desktop-nav" aria-label="Primary navigation">
          ${link("/#how-it-works", "How it works")}
          ${link("/twilock-vs-opal/", "Compare", ["twilock-vs-opal"])}
          ${link("/best-nighttime-app-blockers/", "Guides", ["block-social-media-at-night-iphone", "best-nighttime-app-blockers", "best-strict-app-blockers-iphone", "best-screen-time-apps-iphone"])}
          ${link("/about/", "About", ["about"])}
          ${appStoreButton(true)}
        </nav>
        <details class="mobile-nav">
          <summary>Menu</summary>
          <nav class="mobile-panel" aria-label="Mobile navigation">
            <a href="/#how-it-works">How it works</a>
            <a href="/twilock-vs-opal/">Twilock vs Opal</a>
            <a href="/best-nighttime-app-blockers/">Nighttime blocker guide</a>
            <a href="/best-strict-app-blockers-iphone/">Strict blocker guide</a>
            <a href="/about/">About</a>
            <a href="/support/">Support</a>
            ${appStoreButton()}
          </nav>
        </details>
      </div>
    </header>`;
};

const footer = () => `
  <footer class="site-footer">
    <div class="shell">
      <div class="footer-grid">
        <div class="footer-brand">
          <a class="brand" href="/"><img src="/assets/twilock-icon.png" width="34" height="34" alt=""><span>Twilock</span></a>
          <p>A focused iPhone screen-time blocker for the hours before sleep and after waking.</p>
        </div>
        <div class="footer-column"><h2>Product</h2><a href="/#how-it-works">How it works</a><a href="/#strict-mode">Strict Mode</a><a href="/#pricing">Pricing</a><a href="${appStoreUrl}">App Store</a></div>
        <div class="footer-column"><h2>Learn</h2><a href="/twilock-vs-opal/">Twilock vs Opal</a><a href="/block-social-media-at-night-iphone/">Block social media at night</a><a href="/best-nighttime-app-blockers/">Nighttime app blockers</a><a href="/best-screen-time-apps-iphone/">Screen-time apps</a></div>
        <div class="footer-column"><h2>Company</h2><a href="/about/">About</a><a href="/support/">Support</a><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a></div>
      </div>
      <div class="footer-bottom"><span>© <span data-current-year>2026</span> Twilock. Built by Hussain Taheri.</span><span>Twilock is not affiliated with Apple or the products compared on this site.</span></div>
    </div>
  </footer>`;

const renderPage = ({ route, title, description, body, type = "website", schema = [], bodyClass = "" }) => {
  const canonical = canonicalFor(route);
  const cleanTitle = cleanUserCopy(title);
  const cleanDescription = cleanUserCopy(description);
  const graph = [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: `${siteUrl}/`,
      name: "Twilock",
      description: "A focused iPhone screen-time blocker for the hours before sleep and after waking.",
    },
    ...schema,
  ];
  const visiblePage = cleanVisibleMarkup(`
  <a class="skip-link" href="#main-content">Skip to content</a>
  ${nav(route)}
  <main id="main-content">${body}</main>
  ${footer()}`);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${cleanTitle}</title>
  <meta name="description" content="${cleanDescription}">
  <meta name="theme-color" content="#050817">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <meta name="apple-itunes-app" content="app-id=6786474238">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" href="/assets/twilock-icon.png" type="image/png">
  <link rel="apple-touch-icon" href="/assets/twilock-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="stylesheet" href="/assets/site.css">
  <meta property="og:type" content="${type}">
  <meta property="og:site_name" content="Twilock">
  <meta property="og:title" content="${cleanTitle}">
  <meta property="og:description" content="${cleanDescription}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${siteUrl}/assets/twilock-icon.png">
  <meta property="og:image:width" content="1024">
  <meta property="og:image:height" content="1024">
  <meta property="og:image:alt" content="Twilock moon and lock app icon">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${cleanTitle}">
  <meta name="twitter:description" content="${cleanDescription}">
  <meta name="twitter:image" content="${siteUrl}/assets/twilock-icon.png">
  <script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": cleanSchemaCopy(graph) })}</script>
  <script defer src="/assets/site.js"></script>
</head>
<body class="${bodyClass}">
  ${visiblePage}
</body>
</html>`;
};

const homeBody = `
  <section class="hero">
    <div class="shell hero-grid">
      <div>
        <span class="eyebrow">Night and morning screen-time blocker</span>
        <h1>Your phone can wait. <span class="moonlit">Your night can’t.</span></h1>
        <p class="hero-copy">Twilock shields the apps that pull you in before sleep and after waking. Choose your apps, set two focused windows, and let Strict Mode make your earlier decision harder to undo.</p>
        <div class="hero-actions">
          ${appStoreButton()}
          <p class="hero-note">Free to download<br>Designed for iPhone · iOS 16+</p>
        </div>
      </div>
      <div class="hero-visual" aria-label="Twilock app icon">
        <div class="hero-icon-wrap"><img class="hero-icon" src="/assets/twilock-icon.png" width="1024" height="1024" alt="Twilock moon and lock app icon" fetchpriority="high"></div>
      </div>
    </div>
  </section>

  <div class="shell trust-row" aria-label="Product summary">
    <span><strong>Focused scope</strong> · Up to two hours at night, plus a morning window on Pro</span>
    <span><strong>Private core</strong> · Screen Time and app-usage data stay on your device</span>
    <span><strong>Built for commitment</strong> · Strict Mode is a Pro feature</span>
  </div>

  <section class="section" aria-labelledby="problem-title">
    <div class="shell problem-statement">
      <div>
        <span class="kicker">The actual problem</span>
        <p class="large-copy" id="problem-title">You rarely plan to scroll in bed. The decision happens after your guard is already down.</p>
      </div>
      <div class="problem-points">
        <div class="problem-point"><span class="time">11:04</span><p>You open one app for a minute. The stopping point keeps moving.</p></div>
        <div class="problem-point"><span class="time">12:17</span><p>The rule you set earlier suddenly feels negotiable.</p></div>
        <div class="problem-point"><span class="time">7:06</span><p>The same loop gets first claim on your morning.</p></div>
      </div>
    </div>
  </section>

  <section class="section" id="how-it-works" aria-labelledby="how-title">
    <div class="shell">
      <div class="section-heading centered"><span class="kicker">How it works</span><h2 id="how-title">Three decisions, made before temptation.</h2><p>Twilock is deliberately smaller than an all-day productivity system. Set the boundary you actually need, then get on with your life.</p></div>
      <div class="steps">
        <article class="step"><span class="step-number">01</span><h3>Choose the apps</h3><p>Use Apple’s Screen Time picker to select the apps or categories that tend to steal your night.</p></article>
        <article class="step"><span class="step-number">02</span><h3>Choose your windows</h3><p>Set a Night window of up to two hours. Pro adds a second focused window for the morning.</p></article>
        <article class="step"><span class="step-number">03</span><h3>Let Twilock enforce them</h3><p>When a window starts, your chosen apps are shielded. Strict Mode adds stronger commitment when you need it.</p></article>
      </div>
    </div>
  </section>

  <section class="section-tight privacy-section" aria-labelledby="privacy-summary-title">
    <div class="shell privacy-summary">
      <div class="privacy-summary-copy">
        <span class="kicker">Privacy at a glance</span>
        <h2 id="privacy-summary-title">What Twilock can and cannot see.</h2>
        <p>Twilock needs Apple’s Screen Time authorization to apply the shields you schedule. Apple keeps your selections private, and Twilock keeps the core data on your iPhone.</p>
        <div class="privacy-summary-links">
          <a class="text-link" href="https://developer.apple.com/documentation/FamilyControls/FamilyActivitySelection">Read Apple’s Screen Time documentation</a>
          <a class="text-link" href="/privacy/">Read Twilock’s privacy policy</a>
        </div>
      </div>
      <div class="privacy-points">
        <article class="privacy-point"><span class="privacy-point-number">01</span><h3>You approve access</h3><p>Twilock asks for Screen Time authorization before it can apply a shield. You can revoke that access in iPhone Settings, which stops the protection.</p></article>
        <article class="privacy-point"><span class="privacy-point-number">02</span><h3>Your choices are opaque</h3><p>Apple represents the apps and categories you choose with opaque values. Twilock can apply your shield without receiving readable app identities.</p></article>
        <article class="privacy-point"><span class="privacy-point-number">03</span><h3>Core data stays on your iPhone</h3><p>Your selected apps, raw Screen Time activity, and Night or Morning window settings stay on your device. Optional account and social data is covered separately in the privacy policy.</p></article>
      </div>
    </div>
  </section>

  <section class="section" id="strict-mode" aria-labelledby="strict-title">
    <div class="shell strict-layout">
      <div class="strict-copy">
        <span class="kicker">Strict Mode</span>
        <h2 id="strict-title">A promise that is harder to renegotiate at midnight.</h2>
        <p>Normal blocking helps when you want a reminder. Strict Mode is for the nights when you already know a five-second settings change will win.</p>
        <ul class="check-list"><li>Available with Twilock Pro</li><li>Protects an active window from impulsive edits</li><li>Stops Twilock from being deleted mid-session</li><li>Always leaves a recovery path for genuine need</li></ul>
        <p class="price-fineprint">Strict Mode is a commitment tool, not parental-control software or an emergency service. Leave essential apps outside your blocked set.</p>
      </div>
      <div class="commitment-panel">
        <div class="lock-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <rect x="5" y="10" width="14" height="10" rx="3"></rect>
            <path d="M8 10V7a4 4 0 0 1 8 0v3"></path>
            <circle cx="12" cy="15" r="1.5"></circle>
          </svg>
        </div>
        <blockquote>“I made this rule while I was thinking clearly. Keep it.”</blockquote>
        <p>That is the whole idea: your earlier decision gets more weight than the impulse that arrives later.</p>
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="timeline-title">
    <div class="shell">
      <div class="section-heading centered"><span class="kicker">Night to morning</span><h2 id="timeline-title">Protection at the edges of sleep.</h2><p>A sample schedule—not a prescription. You choose the times that fit your life, with each window capped at two hours.</p></div>
      <div class="timeline" role="list" aria-label="Example Twilock schedule from night to morning">
        <div class="timeline-point" role="listitem"><span class="timeline-dot"></span><span class="timeline-time">9:30 PM</span><span class="timeline-label">Wind-down begins</span></div>
        <div class="timeline-point" role="listitem"><span class="timeline-dot"></span><span class="timeline-time">10:00 PM</span><span class="timeline-label">Night window starts</span></div>
        <div class="timeline-point" role="listitem"><span class="timeline-dot"></span><span class="timeline-time">12:00 AM</span><span class="timeline-label">Night window ends</span></div>
        <div class="timeline-point" role="listitem"><span class="timeline-dot"></span><span class="timeline-time">7:00 AM</span><span class="timeline-label">Morning window starts</span></div>
        <div class="timeline-point" role="listitem"><span class="timeline-dot"></span><span class="timeline-time">8:00 AM</span><span class="timeline-label">Start the day on purpose</span></div>
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="different-title">
    <div class="shell">
      <div class="section-heading"><span class="kicker">Why Twilock is different</span><h2 id="different-title">A focused blocker, not a productivity universe.</h2><p>Twilock does not try to manage every minute of your day. It concentrates on the two recurring moments when scrolling is most likely to take more than you intended.</p></div>
      <div class="difference-grid">
        <article class="difference-item"><span class="difference-index">01</span><div><h3>Two named windows</h3><p>Night and Morning make the job obvious. No elaborate rule system is required to protect the hours around sleep.</p></div></article>
        <article class="difference-item"><span class="difference-index">02</span><div><h3>Commitment without shame</h3><p>The product adds friction to a choice you already made; it does not pretend that distraction is a character flaw.</p></div></article>
        <article class="difference-item"><span class="difference-index">03</span><div><h3>Useful free tier</h3><p>The Night window, streaks, badges, milestone Streak Freezes, weekly Snooze Token, friends, leaderboard, and reclaimed-hours count are free.</p></div></article>
        <article class="difference-item"><span class="difference-index">04</span><div><h3>Private Screen Time data</h3><p>The app cannot see which apps you picked or how long you use them; that Screen Time data stays on your device.</p></div></article>
      </div>
    </div>
  </section>

  <section class="section" id="pricing" aria-labelledby="pricing-title">
    <div class="shell">
      <div class="section-heading"><span class="kicker">Pricing</span><h2 id="pricing-title">Start with your nights. Add more commitment when you need it.</h2><p>Current U.S. App Store prices checked ${checkedDate}. Apple may show different prices by storefront or tax region.</p></div>
      <div class="pricing-grid">
        <article class="pricing-card"><span class="plan-label">Free</span><div class="price-line"><strong>$0</strong><span>to start</span></div><ul class="check-list"><li>Night window</li><li>Streaks and badges</li><li>Milestone Streak Freezes</li><li>One weekly Snooze Token</li><li>Friends and leaderboard</li><li>Time reclaimed</li></ul>${appStoreButton()}</article>
        <article class="pricing-card pro"><span class="plan-label">Twilock Pro</span><div class="price-line"><strong>$39.99</strong><span>per year</span></div><p class="price-options">Or $4.99 monthly · $79.99 one-time Lifetime purchase</p><ul class="check-list"><li>Everything in Free</li><li>Morning window</li><li>Strict Mode</li><li>Streak Repair</li><li>Deeper insights</li></ul>${appStoreButton()}<p class="price-fineprint">Subscriptions renew automatically unless canceled through your App Store account. Lifetime is a one-time in-app purchase.</p></article>
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="guides-title">
    <div class="shell">
      <div class="section-heading"><span class="kicker">Practical guides</span><h2 id="guides-title">Choose a blocker with your real failure mode in mind.</h2><p>These guides compare scope, strictness, price, and platform fit using current official sources.</p></div>
      <div class="editorial-cards">
        <a class="editorial-card" href="/block-social-media-at-night-iphone/"><div><span class="card-type">Practical guide</span><h3>How to block social media at night on iPhone</h3><p>A setup that keeps essential apps available and avoids an overly ambitious first schedule.</p></div><span class="read-link">Read the guide →</span></a>
        <a class="editorial-card" href="/twilock-vs-opal/"><div><span class="card-type">Honest comparison</span><h3>Twilock vs Opal</h3><p>Focused night-and-morning protection versus a broader, cross-platform attention system.</p></div><span class="read-link">Compare the apps →</span></a>
        <a class="editorial-card" href="/best-strict-app-blockers-iphone/"><div><span class="card-type">Category guide</span><h3>Strict app blockers for iPhone</h3><p>What “strict” actually means across Twilock, Opal, Jomo, one sec, ScreenZen, and Freedom.</p></div><span class="read-link">See the comparison →</span></a>
      </div>
    </div>
  </section>

  <section class="section-tight" aria-labelledby="founder-title">
    <div class="shell founder-band">
      <div><span class="kicker">Independent product</span><h2 id="founder-title">Built by the person who needed it.</h2></div>
      <div class="founder-copy"><p>Twilock is built by Hussain Taheri, a University of Florida computer science student. It started with a narrow problem: knowing exactly what a screen-time blocker should do at night, then turning it off anyway.</p><a class="text-link" href="/about/">Read the founder story</a></div>
    </div>
  </section>

  <section class="section" aria-labelledby="faq-title">
    <div class="reading-shell">
      <div class="section-heading"><span class="kicker">FAQ</span><h2 id="faq-title">Before you set your first window.</h2></div>
      <div class="faq-list">
        <details><summary>What does Twilock block?</summary><div>Twilock uses Apple’s Screen Time framework to shield the apps or app categories you choose during your scheduled Night or Morning window.</div></details>
        <details><summary>Is Twilock free?</summary><div>Twilock is free to download. The Night window and core streak features are free. Morning windows, Strict Mode, Streak Repair, and deeper insights require Twilock Pro.</div></details>
        <details><summary>Can I block apps all day?</summary><div>Twilock is intentionally not an all-day blocker. Each Night or Morning window is capped at two hours. If you need workday rules, usage budgets, or cross-device blocking, a broader tool may fit better.</div></details>
        <details><summary>Can Strict Mode be turned off during a window?</summary><div>Strict Mode is designed to stop impulsive edits and prevent deletion of Twilock during an active session. It still includes a recovery path for genuine need.</div></details>
        <details><summary>Does Twilock upload my Screen Time data?</summary><div>No. Your chosen apps and raw Screen Time or app-usage data stay on your device. Optional account and social features use limited server-side data as described in the <a href="/privacy/">privacy policy</a>.</div></details>
        <details><summary>What iPhone version do I need?</summary><div>The current App Store listing requires iOS 16.0 or later.</div></details>
      </div>
    </div>
  </section>

  <section class="section-tight">
    <div class="shell final-cta"><span class="kicker">Tonight is enough</span><h2>Set one boundary before the scroll begins.</h2><p>Choose the apps, choose the window, and give your earlier decision a fair chance to win.</p>${appStoreButton()}</div>
  </section>`;

const softwareSchema = {
  "@type": "SoftwareApplication",
  name: "Twilock: Screen Time Blocker",
  operatingSystem: "iOS 16.0 or later",
  applicationCategory: "ProductivityApplication",
  description: "An iPhone screen-time blocker focused on the periods before sleep and after waking.",
  url: `${siteUrl}/`,
  installUrl: appStoreUrl,
  image: `${siteUrl}/assets/twilock-icon.png`,
  softwareVersion: "1.0",
  author: { "@type": "Person", name: "Hussain Taheri" },
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free download with optional in-app purchases" },
};

const pages = [
  {
    route: "",
    title: "Twilock — Block Nighttime & Morning Scrolling on iPhone",
    description: "Twilock shields distracting iPhone apps before sleep and after waking. Set focused windows and use Strict Mode when your earlier choice needs to hold.",
    body: homeBody,
    schema: [softwareSchema],
  },
];

const twilockVsOpalRoute = "twilock-vs-opal";
pages.push({
  route: twilockVsOpalRoute,
  title: "Twilock vs Opal: Which iPhone App Blocker Fits You?",
  description: "An honest Twilock vs Opal comparison covering nighttime focus, strict blocking, schedules, platforms, pricing, drawbacks, and who each app suits.",
  type: "article",
  body: `
    <header class="page-hero">
      <div class="shell">
        ${breadcrumbs("Twilock vs Opal")}
        <span class="eyebrow">Honest comparison</span>
        <h1>Twilock vs Opal: narrow nighttime focus or an all-day system?</h1>
        <p class="page-deck">Both apps can block distracting iPhone apps. The real difference is scope: Twilock is built around Night and Morning windows, while Opal is a broader attention platform with flexible rules, timers, and cross-platform support.</p>
        <div class="page-meta"><span>By Hussain Taheri</span><span>Updated ${checkedDate}</span><span>8 minute read</span></div>
      </div>
    </header>
    <div class="shell article-layout">
      <article class="article-body">
        ${disclosure()}
        <div class="direct-answer"><p><strong>Short answer:</strong> Choose Twilock if your main problem is scrolling before sleep or immediately after waking and you want a smaller, lower-priced system built around those two moments. Choose Opal if you want flexible rules across the whole day, more blocking modes, and support for iPhone, Mac, and Android.</p></div>

        <h2>Twilock and Opal at a glance</h2>
        <div class="comparison-table-wrap" tabindex="0" role="region" aria-label="Twilock and Opal comparison table">
          <table class="comparison-table">
            <caption>Features and U.S. list pricing checked ${checkedDate}</caption>
            <thead><tr><th scope="col">Category</th><th scope="col">Twilock</th><th scope="col">Opal</th></tr></thead>
            <tbody>
              <tr><th scope="row">Primary job</th><td>Protect Night and Morning windows</td><td>Manage focus and app access across the day</td></tr>
              <tr><th scope="row">Platforms</th><td>iPhone</td><td>iPhone, Mac, and Android</td></tr>
              <tr><th scope="row">Free tier</th><td>Night window plus core streak and social features</td><td>Free plan with limited rules and basic blocking</td></tr>
              <tr><th scope="row">Recurring schedules</th><td class="yes">Yes — Night and Morning</td><td class="yes">Yes — flexible Rules and Schedules</td></tr>
              <tr><th scope="row">Strict option</th><td>Strict Mode on Pro; protects the active window and prevents deleting Twilock mid-session</td><td>Hard Mode / No Unblocks on Pro; one Emergency Pass per week</td></tr>
              <tr><th scope="row">Allow-only mode</th><td>No</td><td class="yes">Yes on Pro</td></tr>
              <tr><th scope="row">Window length</th><td>Up to two hours per Night or Morning window</td><td>Flexible schedules, sessions, limits, and timers</td></tr>
              <tr><th scope="row">Progress</th><td>Streaks, badges, reclaimed time, and optional check-ins</td><td>Opal Score, history, and Focus Gems</td></tr>
              <tr><th scope="row">U.S. annual price</th><td>$39.99</td><td>$99.99 on Opal’s website</td></tr>
              <tr><th scope="row">U.S. lifetime price</th><td>$79.99</td><td>$399 on Opal’s website</td></tr>
            </tbody>
          </table>
        </div>
        <p class="quiet">Prices can vary by storefront, tax region, promotion, and purchase channel. Confirm the amount shown before purchase.</p>

        <h2>The biggest difference is not strictness. It is scope.</h2>
        <p>Opal is designed to cover many kinds of attention problems: scheduled Rules, immediate Sessions, Timers, Time Limits, Open Limits, Allow Only, and cross-platform blocking. That range is useful if your phone, computer, and workday all need one system.</p>
        <p>Twilock starts with a narrower question: <strong>which apps take more than you intended at night and in the morning?</strong> Its schedule model makes those periods the product rather than one possible configuration among many.</p>
        <div class="callout"><p>Neither approach is universally better. A smaller system can be easier to keep using; a broader system can replace several tools when your distraction is not limited to bedtime.</p></div>

        <h2>How strict blocking compares</h2>
        <h3>Twilock Strict Mode</h3>
        <p>Twilock’s current App Store listing says Strict Mode stops you deleting Twilock mid-session while still leaving a way out. In the app’s current feature split, Strict Mode is part of Pro. It is designed around a scheduled Night or Morning window rather than arbitrary all-day rules.</p>
        <h3>Opal Hard Mode</h3>
        <p>Opal’s official schedule guide describes Hard Mode as “No Unblocks”: you cannot unblock or leave early during the Rule. Opal also provides one Emergency Pass per week, which cancels current rules for one hour. Hard Mode and unlimited Rules are Pro features.</p>
        <p>If you want a strict bedtime boundary with a very small setup surface, Twilock is the clearer fit. If you need strict sessions, schedules, time limits, open limits, or an allow-only “brick phone” configuration, Opal has substantially more range.</p>

        <h2>Free plans and pricing</h2>
        <p>Twilock’s free tier includes the Night window, streaks, badges, milestone-granted Streak Freezes, one weekly Snooze Token, friends, a leaderboard, and reclaimed-hours tracking. Pro adds the Morning window, Strict Mode, Streak Repair, and deeper insights.</p>
        <p>Opal offers a free tier with limits on rules and history. Its current website lists Pro at $19.99 monthly, $99.99 billed annually, or $399 as a one-time purchase. Twilock’s U.S. App Store listing shows $4.99 monthly, $39.99 annual, and $79.99 Lifetime.</p>

        <h2>Advantages and drawbacks</h2>
        <div class="pros-cons-grid">
          <section class="pros-cons"><h3>Twilock</h3><ul><li><strong>Advantage:</strong> a faster mental model for bedtime and morning protection.</li><li><strong>Advantage:</strong> lower current U.S. list prices.</li><li><strong>Advantage:</strong> Night window and core streak tools are free.</li><li><strong>Drawback:</strong> iPhone only.</li><li><strong>Drawback:</strong> two-hour cap and no general workday rule engine.</li><li><strong>Drawback:</strong> Morning and Strict Mode require Pro.</li></ul></section>
          <section class="pros-cons"><h3>Opal</h3><ul><li><strong>Advantage:</strong> much broader rule types and flexible schedules.</li><li><strong>Advantage:</strong> iPhone, Mac, and Android support.</li><li><strong>Advantage:</strong> Allow Only, time limits, open limits, and longer-term history.</li><li><strong>Drawback:</strong> more configuration than a bedtime-only use case needs.</li><li><strong>Drawback:</strong> strict controls and unlimited rules require Pro.</li><li><strong>Drawback:</strong> higher current list prices.</li></ul></section>
        </div>

        <h2>Which should you choose?</h2>
        <div class="verdict-grid">
          <section class="verdict"><h3>Choose Twilock if…</h3><ul><li>Your problem is concentrated before sleep or after waking.</li><li>You want two obvious windows instead of a full rule system.</li><li>You value a lower-priced lifetime option.</li><li>You only need iPhone support.</li></ul></section>
          <section class="verdict"><h3>Choose Opal if…</h3><ul><li>You need blocks throughout work, study, and leisure time.</li><li>You want iPhone, Mac, and Android support.</li><li>You need Allow Only, Time Limits, Open Limits, or many Rules.</li><li>You prefer one broader system even at a higher price.</li></ul></section>
        </div>

        <h2>Methodology</h2>
        <div class="methodology"><p>We compared each product’s public feature set, current official pricing, schedule model, strict-mode behavior, platform support, and free-tier limits. Twilock facts were checked against its live U.S. App Store listing and shipping source. Opal facts were checked against Opal’s pricing page and current help center. We did not use review averages or vendor-reported outcome statistics to decide the recommendation.</p></div>

        <h2>Sources</h2>
        <ul class="source-list">
          <li><a href="${appStoreUrl}">Twilock’s live U.S. App Store listing</a> — features, compatibility, privacy language, and in-app purchase prices.</li>
          <li><a href="https://opalapp.com/pricing">Opal official pricing</a> — free and Pro plan details.</li>
          <li><a href="https://help.opalapp.com/article/how-to-use-schedules">Opal official schedule guide</a> — Hard Mode, No Unblocks, and Emergency Pass behavior.</li>
          <li><a href="https://help.opalapp.com/article/how-to-use-allow-only">Opal official Allow Only guide</a> — allow-list behavior and limitations.</li>
        </ul>

        <h2>Frequently asked questions</h2>
        <div class="faq-list">
          <details><summary>Is Twilock better than Opal?</summary><div>Not overall. Twilock is the more focused choice for a narrow night-and-morning use case. Opal is the more capable choice when you need broad rules, multiple platforms, or many blocking modes.</div></details>
          <details><summary>Which app is cheaper?</summary><div>At the U.S. list prices checked ${checkedDate}, Twilock is cheaper monthly, annually, and for lifetime access. Prices and promotions can change.</div></details>
          <details><summary>Can both apps block social media at night?</summary><div>Yes. Twilock makes Night a first-class window. Opal can create a scheduled Rule for the same period.</div></details>
          <details><summary>Which has stronger emergency access?</summary><div>They take different approaches. Opal documents one Emergency Pass per week for Hard Mode. Twilock documents that Strict Mode always leaves a recovery path. Review each app’s current in-product explanation before committing.</div></details>
        </div>
      </article>
      ${articleAside()}
    </div>`,
  schema: [articleSchema(twilockVsOpalRoute, "Twilock vs Opal: Which iPhone App Blocker Fits You?", "An honest comparison of Twilock and Opal for nighttime blocking, strictness, scope, platforms, and price."), breadcrumbSchema(twilockVsOpalRoute, "Twilock vs Opal")],
});

const nightGuideRoute = "block-social-media-at-night-iphone";
pages.push({
  route: nightGuideRoute,
  title: "How to Block Social Media at Night on iPhone",
  description: "A practical, step-by-step guide to blocking social media at night on iPhone using Screen Time or a dedicated app blocker—without blocking essentials.",
  type: "article",
  body: `
    <header class="page-hero">
      <div class="reading-shell">
        ${breadcrumbs("Block social media at night")}
        <span class="eyebrow">Practical iPhone guide</span>
        <h1>How to block social media at night on iPhone</h1>
        <p class="page-deck">Start with the smallest schedule you will keep. Protect the apps that actually pull you in, leave essential tools available, and decide your escape rule before the block begins.</p>
        <div class="page-meta"><span>By Hussain Taheri</span><span>Updated ${checkedDate}</span><span>7 minute read</span></div>
      </div>
    </header>
    <div class="shell article-layout">
      <article class="article-body">
        <div class="direct-answer"><p><strong>Quick setup:</strong> On iPhone, you can use Settings → Screen Time → Downtime for a broad nightly schedule, or App Limits for selected categories. A dedicated blocker such as Twilock is useful when you want a named Night window and stronger commitment controls. Whichever method you choose, keep Phone, Messages, Maps, authentication, and other essential apps available.</p></div>

        <h2>First, define the problem precisely</h2>
        <p>“Use my phone less” is too vague to configure. A useful nighttime rule has three concrete parts:</p>
        <ol><li><strong>The apps:</strong> the two or three apps you open without a clear intention.</li><li><strong>The window:</strong> a specific start and end time that matches when scrolling usually begins.</li><li><strong>The exception:</strong> what counts as a real reason to regain access.</li></ol>
        <p>If your first rule blocks everything from dinner until morning, you are more likely to dismantle it the first time you need a boarding pass, a two-factor code, or directions. Start narrower.</p>

        <h2>Option 1: use Apple Screen Time</h2>
        <h3>Use Downtime for a broad nightly schedule</h3>
        <ol><li>Open <strong>Settings</strong> and choose <strong>Screen Time</strong>.</li><li>Turn on App &amp; Website Activity if it is not already enabled.</li><li>Choose <strong>Downtime</strong>, then set a schedule for the period you want protected.</li><li>Review <strong>Always Allowed</strong> and keep essential communication, navigation, health, and authentication tools available.</li><li>Use <strong>Block at Downtime</strong> if you want the limit enforced rather than shown as a reminder.</li></ol>
        <h3>Use App Limits for selected categories or apps</h3>
        <ol><li>In <strong>Settings → Screen Time</strong>, open <strong>App Limits</strong>.</li><li>Choose <strong>Add Limit</strong>, then select the distracting apps or categories.</li><li>Set the time allowance and customize days if needed.</li><li>Turn on <strong>Block at End of Limit</strong>.</li></ol>
        <div class="callout"><p>Apple’s built-in tools are free and already on your phone. Their main drawback for self-control is also obvious: because you own the settings, you can often change the rule when the urge arrives.</p></div>

        <h2>Option 2: use a dedicated nighttime blocker</h2>
        <p>A dedicated blocker can make the schedule easier to understand or harder to reverse. Twilock is built specifically around a Night window, with a Morning window and Strict Mode on Pro.</p>
        <ol><li>Download Twilock from the App Store and grant Screen Time access.</li><li>Choose the apps or categories that are actually part of the nighttime loop.</li><li>Set a Night window of up to two hours.</li><li>Run the schedule normally for several nights to make sure essential apps are excluded.</li><li>If you keep editing or deleting the rule while it is active, consider Strict Mode.</li></ol>
        <p>Other apps can also do this with general-purpose schedules. See our <a href="/best-nighttime-app-blockers/">nighttime app blocker comparison</a> if you need cross-platform support, more schedules, or a free strict option.</p>

        <h2>Close the common loopholes</h2>
        <h3>Keep essentials outside the block</h3>
        <p>Do not include apps you might need for safety, travel, medication, work authentication, or urgent communication. A targeted block is easier to trust.</p>
        <h3>Choose strictness after testing the schedule</h3>
        <p>Strict modes can make an active rule difficult or impossible to leave early. Test your app selection and timing first. A strict mistake at 11:00 PM is still a mistake.</p>
        <h3>Move the phone, too</h3>
        <p>Software removes access; distance removes the cue. Charging your phone outside arm’s reach can help the schedule feel less like an argument you revisit every few minutes.</p>
        <h3>Do not turn one slip into a redesign</h3>
        <p>If you bypass a rule once, adjust the specific weak point. Do not add more apps, longer hours, and harsher settings all at once.</p>

        <h2>A seven-night starter plan</h2>
        <div class="comparison-table-wrap" tabindex="0" role="region" aria-label="Seven-night starter plan table">
          <table class="comparison-table">
            <caption>A small rollout that tests the schedule before adding strictness</caption>
            <thead><tr><th scope="col">Night</th><th scope="col">What to do</th><th scope="col">What to notice</th></tr></thead>
            <tbody>
              <tr><th scope="row">1–2</th><td>Block only the top two distracting apps for 45–60 minutes.</td><td>Did you need an app you blocked?</td></tr>
              <tr><th scope="row">3–4</th><td>Adjust the start time to match when scrolling really begins.</td><td>Was the rule early, late, or about right?</td></tr>
              <tr><th scope="row">5–6</th><td>Keep the schedule stable. Avoid adding new rules.</td><td>Are you editing or bypassing it impulsively?</td></tr>
              <tr><th scope="row">7</th><td>Decide whether normal blocking is enough or stricter commitment would help.</td><td>Which loophole actually remained?</td></tr>
            </tbody>
          </table>
        </div>

        <h2>Which method should you use?</h2>
        <div class="verdict-grid">
          <section class="verdict"><h3>Use Apple Screen Time if…</h3><ul><li>You want a free built-in option.</li><li>A reminder is usually enough.</li><li>You are setting limits for a child through Family Sharing.</li><li>You do not want another app.</li></ul></section>
          <section class="verdict"><h3>Use a dedicated blocker if…</h3><ul><li>You repeatedly change your own Screen Time settings.</li><li>You want a clearer nightly routine.</li><li>You want interventions, streaks, or stricter commitment.</li><li>You need more flexible rules or cross-device support.</li></ul></section>
        </div>

        <h2>Frequently asked questions</h2>
        <div class="faq-list">
          <details><summary>Can iPhone automatically block social media at bedtime?</summary><div>Yes. Screen Time Downtime can run on a schedule, and third-party blockers can create scheduled windows using Apple’s Screen Time APIs.</div></details>
          <details><summary>Can I block social media but keep messages and maps?</summary><div>Yes. Select only the distracting apps, or add essentials to Always Allowed. Review the list before enabling any strict mode.</div></details>
          <details><summary>Why can I still tap “Ignore Limit”?</summary><div>Some Screen Time configurations act more like reminders unless Block at End of Limit or a Screen Time passcode is used. A dedicated blocker may offer additional friction.</div></details>
          <details><summary>Should I block my phone for the entire night?</summary><div>Not necessarily. Start with the period when the unwanted behavior actually happens. A shorter rule you keep is more useful than an ambitious one you immediately disable.</div></details>
          <details><summary>Does blocking social media improve sleep?</summary><div>This guide does not make a medical claim. It is a practical way to make late-night access less automatic. If sleep problems persist, discuss them with a qualified clinician.</div></details>
        </div>

        <h2>Sources</h2>
        <ul class="source-list"><li><a href="https://support.apple.com/en-us/108806">Apple: Use Screen Time on iPhone and iPad</a> — current Downtime, App Limits, and Always Allowed guidance.</li><li><a href="${appStoreUrl}">Twilock on the App Store</a> — current feature scope, compatibility, and pricing.</li></ul>
      </article>
      ${articleAside("Twilock gives nighttime blocking a simple home: one Night window, the apps you choose, and optional Strict Mode on Pro.")}
    </div>`,
  schema: [articleSchema(nightGuideRoute, "How to Block Social Media at Night on iPhone", "A practical guide to scheduling nighttime social-media blocks on iPhone while keeping essential apps available."), breadcrumbSchema(nightGuideRoute, "Block social media at night")],
});

const productReview = ({ name, bestFor, summary, advantages, drawbacks, choose }) => `
  <section class="product-review">
    <div class="product-review-header"><h3>${name}</h3><span class="best-for">Best for: ${bestFor}</span></div>
    <p>${summary}</p>
    <p><strong>Advantages:</strong> ${advantages}</p>
    <p><strong>Drawbacks:</strong> ${drawbacks}</p>
    <p><strong>Choose it if:</strong> ${choose}</p>
  </section>`;

const nighttimeBlockersRoute = "best-nighttime-app-blockers";
pages.push({
  route: nighttimeBlockersRoute,
  title: "Best Nighttime App Blockers for iPhone in 2026",
  description: "Compare the best nighttime app blockers for iPhone by schedule fit, strictness, free plan, price, platform support, advantages, and drawbacks.",
  type: "article",
  body: `
    <header class="page-hero">
      <div class="shell">
        ${breadcrumbs("Best nighttime app blockers")}
        <span class="eyebrow">2026 category comparison</span>
        <h1>The best nighttime app blockers for iPhone</h1>
        <p class="page-deck">There is no best blocker for everyone. The useful question is whether you need a simple bedtime schedule, free customization, stronger commitment, or one system across every device.</p>
        <div class="page-meta"><span>By Hussain Taheri</span><span>Last checked ${checkedDate}</span><span>11 minute read</span></div>
      </div>
    </header>
    <div class="shell article-layout">
      <article class="article-body">
        ${disclosure()}
        <div class="direct-answer"><p><strong>Direct answer:</strong> Twilock is the strongest fit for a narrow Night-and-Morning routine. ScreenZen is the standout free option. Opal and Jomo suit people who want a broader rule system. one sec is best when you want a pause before opening apps, and Apple Screen Time is the sensible built-in starting point.</p></div>

        <h2>Our picks by use case</h2>
        <div class="comparison-table-wrap" tabindex="0" role="region" aria-label="Nighttime app blockers comparison table">
          <table class="comparison-table">
            <caption>Official features and pricing checked ${checkedDate}</caption>
            <thead><tr><th scope="col">App</th><th scope="col">Best for</th><th scope="col">Night schedule</th><th scope="col">Strict option</th><th scope="col">Current price signal</th></tr></thead>
            <tbody>
              <tr><th scope="row">Twilock</th><td>Focused night and morning protection</td><td class="yes">Dedicated Night window</td><td>Strict Mode on Pro</td><td>Free; Pro $39.99/year in U.S.</td></tr>
              <tr><th scope="row">ScreenZen</th><td>A free, highly configurable blocker</td><td class="yes">Scheduled blocks</td><td>Lock mode / strict block</td><td>Free, donation-supported</td></tr>
              <tr><th scope="row">Opal</th><td>Broad automation and multiple platforms</td><td class="yes">Flexible Schedules</td><td>Hard Mode / No Unblocks on Pro</td><td>Free; Pro $99.99/year on web</td></tr>
              <tr><th scope="row">Jomo</th><td>Deep customization and varied unlock rules</td><td class="yes">Scheduled Sessions</td><td>Strict Mode on Plus</td><td>Free; Plus $29.99/year</td></tr>
              <tr><th scope="row">one sec</th><td>Interrupting automatic app opens</td><td class="yes">Recurring Blocks on Pro</td><td>Strict Block on Pro</td><td>Free for one app; Pro pricing varies</td></tr>
              <tr><th scope="row">Apple Screen Time</th><td>A built-in first step</td><td class="yes">Downtime</td><td>Screen Time passcode</td><td>Included with iPhone</td></tr>
            </tbody>
          </table>
        </div>

        <h2>1. Twilock — best for a focused night-and-morning routine</h2>
        ${productReview({name:"Twilock",bestFor:"people whose scrolling clusters around sleep",summary:"Twilock makes Night and Morning the core schedule instead of treating bedtime as one possible rule. The Night window and core streak features are free; Pro adds Morning, Strict Mode, Streak Repair, and deeper insights.",advantages:"Fast setup, clear two-window model, lower current U.S. pricing, and Screen Time/app-usage data that stay on device.",drawbacks:"iPhone only, each window is capped at two hours, and the morning window plus Strict Mode require Pro.",choose:"you want a small system that is obvious every evening rather than a general productivity suite."})}

        <h2>2. ScreenZen — best free option</h2>
        ${productReview({name:"ScreenZen",bestFor:"free customization",summary:"ScreenZen combines scheduled blocks, limits, open delays, interventions, strict blocking, streaks, and multi-platform availability. Its official site describes the software as completely free and donation-supported.",advantages:"No subscription, many configuration options, app and website blocking, and support for iOS, macOS, Windows, and Android.",drawbacks:"The setup surface is more complex than a two-window routine, and its breadth can take time to tune.",choose:"cost is the deciding factor and you are willing to configure the behavior you want."})}

        <h2>3. Opal — best for broad automation</h2>
        ${productReview({name:"Opal",bestFor:"many rules across phone and computer",summary:"Opal offers Schedules, Sessions, Timers, Time Limits, Open Limits, Allow Only, scoring, and cross-platform apps. It can reproduce a bedtime block and also manage workday focus.",advantages:"Flexible rule types, iPhone/Mac/Android support, polished progress features, and a documented weekly Emergency Pass for Hard Mode.",drawbacks:"Pro is substantially more expensive than Twilock or Jomo at current web prices, and the system is larger than a bedtime-only use case needs.",choose:"you want one mature, broad attention system across multiple contexts and devices."})}

        <h2>4. Jomo — best for customization</h2>
        ${productReview({name:"Jomo",bestFor:"custom rules and unlock conditions",summary:"Jomo supports scheduled Sessions, app groups, Screen Time budgets, Strict Mode, and a wide set of unlock actions. Its pricing page lists a free tier, $29.99 annual Plus plan, and $99.99 single purchase.",advantages:"Strong feature-to-price ratio, iPhone and Mac support, many session types, and unusually varied unlock controls.",drawbacks:"More setup and choice than a simple bedtime blocker, and several strict/custom capabilities require Plus.",choose:"you enjoy tuning rules and want more flexibility than Twilock without Opal’s current price."})}

        <h2>5. one sec — best for interrupting the reflex</h2>
        ${productReview({name:"one sec",bestFor:"adding a pause before an automatic open",summary:"one sec is known for an intervention before selected apps open, and its Pro plan also includes scheduled and strict Block Sessions. The free version covers one app.",advantages:"A distinctive intervention-first approach, free trial on one app, scheduled blocks, and broad platform availability for its core intervention system.",drawbacks:"Unlimited apps, recurring blocks, and strict block sessions require Pro; not every feature is available on every platform.",choose:"your main issue is opening an app without thinking, not only staying in it too long."})}

        <h2>6. Apple Screen Time — best built-in starting point</h2>
        ${productReview({name:"Apple Screen Time",bestFor:"trying a scheduled block without another app",summary:"Downtime can schedule a broad low-access period, App Limits can cap selected apps or categories, and Always Allowed protects essentials.",advantages:"Free, built into iOS, works with Family Sharing, and needs no extra account.",drawbacks:"Self-managed limits can be easy to change or ignore, and the interface is not centered on a nightly commitment ritual.",choose:"you want to test the habit first or you are configuring a child’s device through Apple’s family controls."})}

        <h2>How to choose</h2>
        <div class="verdict-grid">
          <section class="verdict"><h3>Choose Twilock if…</h3><ul><li>Your unwanted use clusters around sleep.</li><li>You want two named windows and minimal setup.</li><li>You prefer lower current U.S. Pro pricing.</li></ul></section>
          <section class="verdict"><h3>Choose an alternative if…</h3><ul><li>Choose ScreenZen for a free configurable system.</li><li>Choose Opal or Jomo for many rule types.</li><li>Choose one sec for opening interventions.</li><li>Choose Screen Time for a built-in first test.</li></ul></section>
        </div>

        <h2>Methodology</h2>
        <div class="methodology"><p>This is a source-tested editorial comparison, not a claim that we ran every app in a controlled lab. We checked current official sites, help centers, and App Store information for five factors: nighttime scheduling, strength/escape behavior, free-tier usefulness, current price, and platform scope. We do not use vendor outcome claims, review counts, or affiliate commissions to rank the products.</p></div>

        <h2>Sources</h2>
        <ul class="source-list">
          <li><a href="${appStoreUrl}">Twilock on the App Store</a></li>
          <li><a href="https://screenzen.co/">ScreenZen official site</a></li>
          <li><a href="https://opalapp.com/pricing">Opal official pricing</a> and <a href="https://help.opalapp.com/article/how-to-use-schedules">schedule guide</a></li>
          <li><a href="https://jomo.so/pricing">Jomo official pricing</a> and <a href="https://jomo.so/features">features</a></li>
          <li><a href="https://tutorials.one-sec.app/en/articles/3035522">one sec recurring blocks guide</a> and <a href="https://tutorials.one-sec.app/en/articles/3036418">Pro comparison</a></li>
          <li><a href="https://support.apple.com/en-us/108806">Apple Screen Time guide</a></li>
        </ul>

        <h2>Frequently asked questions</h2>
        <div class="faq-list">
          <details><summary>What is the best free nighttime app blocker?</summary><div>ScreenZen offers the broadest free third-party feature set in this comparison. Apple Screen Time is the best built-in option. Twilock’s Night window is also free if you want a more focused routine.</div></details>
          <details><summary>Which blocker is hardest to bypass?</summary><div>“Strict” means different things across apps and iOS versions. Review the exact exit, emergency, uninstall, and Screen Time permission behavior before committing. Our <a href="/best-strict-app-blockers-iphone/">strict blocker guide</a> compares those differences.</div></details>
          <details><summary>Can these apps block websites as well as apps?</summary><div>Opal, Jomo, ScreenZen, one sec, Freedom, and Apple Screen Time offer website controls in at least some configurations. Twilock is positioned around the apps or categories selected with Apple’s Screen Time picker.</div></details>
          <details><summary>Do I need to pay for a bedtime schedule?</summary><div>No. Apple Screen Time, ScreenZen, and Twilock’s Night window provide free ways to schedule nighttime protection.</div></details>
        </div>
      </article>
      ${articleAside()}
    </div>`,
  schema: [articleSchema(nighttimeBlockersRoute, "The Best Nighttime App Blockers for iPhone", "A source-checked comparison of nighttime iPhone app blockers by schedule fit, strictness, pricing, and platform support."), breadcrumbSchema(nighttimeBlockersRoute, "Best nighttime app blockers")],
});

const strictBlockersRoute = "best-strict-app-blockers-iphone";
pages.push({
  route: strictBlockersRoute,
  title: "Best Strict App Blockers for iPhone in 2026",
  description: "Compare strict iPhone app blockers by edit protection, early exit, emergency access, uninstall protection, schedules, pricing, advantages, and drawbacks.",
  type: "article",
  body: `
    <header class="page-hero">
      <div class="shell">
        ${breadcrumbs("Best strict app blockers")}
        <span class="eyebrow">Strict blocking, explained</span>
        <h1>The best strict app blockers for iPhone</h1>
        <p class="page-deck">A strict label is not enough. Compare what happens when you try to edit the rule, leave early, delete the app, disable Screen Time access, or handle a genuine exception.</p>
        <div class="page-meta"><span>By Hussain Taheri</span><span>Last checked ${checkedDate}</span><span>12 minute read</span></div>
      </div>
    </header>
    <div class="shell article-layout">
      <article class="article-body">
        ${disclosure()}
        <div class="direct-answer"><p><strong>Direct answer:</strong> Choose Twilock for strict Night and Morning windows, Opal for a polished multi-rule system with a documented weekly Emergency Pass, Jomo for highly configurable strict sessions, one sec for strict blocks plus interventions, ScreenZen for free strict controls, and Freedom when cross-device locked sessions matter most.</p></div>

        <h2>What “strict” should mean</h2>
        <p>Strictness has several layers. A product can prevent an early exit but still let you edit a future schedule. It can protect a rule inside the app while leaving the Screen Time permission exposed in Settings. It can prevent uninstalling itself while still offering an emergency path.</p>
        <p>Before enabling any strict mode, check five things:</p>
        <ol><li>Can the active rule be edited or deleted?</li><li>Can the session end early?</li><li>What happens if you try to delete the blocker?</li><li>Can Screen Time permission be disabled?</li><li>What is the emergency or recovery path?</li></ol>

        <h2>Strict-mode comparison</h2>
        <div class="comparison-table-wrap" tabindex="0" role="region" aria-label="Strict iPhone app blockers comparison table">
          <table class="comparison-table">
            <caption>Behavior described by each product’s current official sources</caption>
            <thead><tr><th scope="col">App</th><th scope="col">Active-rule protection</th><th scope="col">Emergency path</th><th scope="col">Uninstall / permission protection</th><th scope="col">Plan</th></tr></thead>
            <tbody>
              <tr><th scope="row">Twilock</th><td>Strict Mode protects active Night/Morning window</td><td>Recovery path remains available</td><td>Prevents deleting Twilock mid-session</td><td>Pro</td></tr>
              <tr><th scope="row">Opal</th><td>Hard Mode can allow no unblocks or early exit</td><td>One Emergency Pass per week</td><td>Additional uninstall/Screen Time protections documented</td><td>Pro for No Unblocks</td></tr>
              <tr><th scope="row">Jomo</th><td>Strict Mode says rules cannot be deleted or bypassed</td><td>Depends on the Rule and unlock configuration</td><td>May require companion iOS/Shortcuts setup for Settings protection</td><td>Plus</td></tr>
              <tr><th scope="row">one sec</th><td>Strict Blocks cannot be paused or left early</td><td>Review each block before starting</td><td>Official iOS 26.4 guide documents Screen Time permission lock</td><td>Pro</td></tr>
              <tr><th scope="row">ScreenZen</th><td>Strict blocks and lock mode protect common loopholes</td><td>Configurable lock/reset behavior</td><td>Official site says uninstall can be prevented</td><td>Free</td></tr>
              <tr><th scope="row">Freedom</th><td>Locked Mode prevents quitting a session</td><td>Depends on session configuration and platform</td><td>Focused on session quitting rather than iOS-only uninstall claims</td><td>Premium</td></tr>
            </tbody>
          </table>
        </div>
        <p class="quiet">iOS capabilities and exact settings can change. Test a short block with essential apps excluded before committing to a long strict session.</p>

        <h2>1. Twilock — strict protection around sleep</h2>
        ${productReview({name:"Twilock",bestFor:"strict Night and Morning windows",summary:"Twilock’s Strict Mode is part of Pro and is tied to its focused schedule model. The live App Store listing says it stops you deleting Twilock mid-session while always leaving a way out.",advantages:"Very clear use case, minimal schedule complexity, active uninstall protection, and lower current U.S. pricing than several premium competitors.",drawbacks:"Only two window types, a two-hour cap per window, iPhone only, and Strict Mode is not in the free tier.",choose:"your main bypass happens at bedtime or on waking and you do not want a general-purpose rule engine."})}

        <h2>2. Opal — strictness inside a broad system</h2>
        ${productReview({name:"Opal",bestFor:"many strict rule types",summary:"Opal’s Pro Hard Mode can run with No Unblocks, preventing an early exit or edit. Its official help center documents one Emergency Pass each week, plus additional steps for uninstall and Screen Time protection.",advantages:"Clear emergency policy, flexible Schedules and Sessions, multiple rule types, Allow Only, and cross-platform support.",drawbacks:"Higher current web price, more setup, and some foolproof configurations require additional iOS settings.",choose:"you need strict rules for work, study, bedtime, app opens, and usage limits in one product."})}

        <h2>3. Jomo — strict rules with the most knobs</h2>
        ${productReview({name:"Jomo",bestFor:"custom strict sessions and unlocks",summary:"Jomo’s official features page describes Strict Mode as making rules unbreakable so they cannot be deleted or bypassed. Its help center also documents the iOS limitations and extra Settings/Shortcuts setup that can strengthen protection.",advantages:"Many rule types and unlock actions, solid current annual price, iPhone and Mac support, and rich customization.",drawbacks:"The number of options takes more learning, and the strongest Settings protection may require extra setup outside Jomo.",choose:"you want to design your own strict system and care more about flexibility than minimalism."})}

        <h2>4. one sec — strict blocks plus opening interventions</h2>
        ${productReview({name:"one sec",bestFor:"strict sessions and app-opening friction",summary:"one sec Pro offers Strict Block Sessions and recurring blocks. Its current guide says a strict block cannot be paused or left before the time ends, and its iOS 26.4 documentation describes locking Screen Time permission with a code.",advantages:"Combines strict blocking with the app-opening intervention that made one sec distinctive; supports scheduled blocks and multiple platforms.",drawbacks:"Strict sessions and unlimited apps require Pro, and features differ by platform.",choose:"you want both hard blocks and a daily pause that interrupts automatic app opens."})}

        <h2>5. ScreenZen — best free strict option</h2>
        ${productReview({name:"ScreenZen",bestFor:"strict controls without a subscription",summary:"ScreenZen’s site describes a lock mode that protects common loopholes and can prevent uninstalling, while the App Store listing documents strict blocks for time ranges, open counts, or Screen Time.",advantages:"Free and donation-supported, highly configurable, broad platform support, and no Pro gate for core strict tools.",drawbacks:"More configuration than a focused schedule and less concise public documentation about one universal emergency model.",choose:"you want the strongest free feature set and are comfortable tuning it yourself."})}

        <h2>6. Freedom — best for locked sessions across devices</h2>
        ${productReview({name:"Freedom",bestFor:"cross-device sessions",summary:"Freedom Premium adds scheduling, recurring sessions, longer sessions, and Locked Mode. One account can include iPhone, Android, Mac, Windows, and Chromebook in the same blocking system.",advantages:"Excellent platform coverage, cross-device sync, website and app blocking, and a lifetime plan.",drawbacks:"Its strict story is centered on not quitting a session, not a narrow iPhone bedtime commitment, and Premium is required for Locked Mode and recurring schedules.",choose:"the loophole is switching from your phone to a computer when a block starts."})}

        <h2>Choose by the loophole you actually use</h2>
        <div class="verdict-grid">
          <section class="verdict"><h3>Choose Twilock if…</h3><ul><li>You delete or edit the blocker during a bedtime window.</li><li>You only need Night and Morning.</li><li>You want a clear recovery path rather than a sprawling settings system.</li></ul></section>
          <section class="verdict"><h3>Choose an alternative if…</h3><ul><li>Opal: many strict rule types and a documented weekly pass.</li><li>Jomo: deep custom rules and unlocks.</li><li>one sec: strict blocks plus interventions.</li><li>ScreenZen: free strict controls.</li><li>Freedom: cross-device locked sessions.</li></ul></section>
        </div>

        <h2>Methodology</h2>
        <div class="methodology"><p>We reviewed official product pages and help documentation for active-rule editing, early exit, emergency access, uninstall or permission protection, schedule flexibility, platform support, and current pricing. We did not assign a universal “hardest to bypass” winner because iOS version, Screen Time configuration, Family Sharing, and each user’s chosen escape path materially change the result.</p></div>

        <h2>Sources</h2>
        <ul class="source-list">
          <li><a href="${appStoreUrl}">Twilock App Store listing</a></li>
          <li><a href="https://help.opalapp.com/article/how-to-use-schedules">Opal Schedules and Hard Mode</a> and <a href="https://help.opalapp.com/article/how-do-i-make-opal-foolproof">foolproof setup</a></li>
          <li><a href="https://jomo.so/features">Jomo features</a> and <a href="https://help.jomo.so/fr/article/comment-bloquer-lapp-reglages-quand-le-mode-strict-est-actif-nm5ljj/">Jomo Settings protection guide</a></li>
          <li><a href="https://tutorials.one-sec.app/en/articles/3035522">one sec recurring blocks</a> and <a href="https://one-sec.app/ko/blog/lock-screen-time-permission/">Screen Time permission lock</a></li>
          <li><a href="https://screenzen.co/">ScreenZen official site</a></li>
          <li><a href="https://freedom.to/premium">Freedom Premium and Locked Mode</a></li>
        </ul>

        <h2>Frequently asked questions</h2>
        <div class="faq-list">
          <details><summary>Can an iPhone app blocker be impossible to bypass?</summary><div>No honest comparison should promise that in every setup. iOS permissions, device version, passcodes, Family Sharing, emergency paths, and physical access all matter. Aim for enough friction to interrupt your own common bypass.</div></details>
          <details><summary>What is the best free strict app blocker?</summary><div>ScreenZen offers the clearest free strict-blocking feature set in this group. Apple Screen Time with a passcode can also be effective, especially when another trusted person controls the code.</div></details>
          <details><summary>Should strict mode have an emergency exit?</summary><div>That is a personal trade-off. A recovery path reduces the risk of being locked out of something genuinely needed; a faster exit also becomes a loophole. Read the exact behavior and test a short block first.</div></details>
          <details><summary>Can a strict blocker stop me deleting it?</summary><div>Some products document uninstall protection in certain modes or iOS configurations. Twilock specifically says Strict Mode stops deletion mid-session. ScreenZen, Opal, Jomo, and one sec document additional protection paths with varying setup.</div></details>
        </div>
      </article>
      ${articleAside()}
    </div>`,
  schema: [articleSchema(strictBlockersRoute, "The Best Strict App Blockers for iPhone", "A source-checked comparison of strict iPhone app blockers by early exit, emergency access, uninstall protection, and price."), breadcrumbSchema(strictBlockersRoute, "Best strict app blockers")],
});

const screenTimeAppsRoute = "best-screen-time-apps-iphone";
pages.push({
  route: screenTimeAppsRoute,
  title: "Best Screen Time Apps for iPhone in 2026",
  description: "Compare the best iPhone screen-time apps for bedtime blocking, free limits, strict mode, app-opening friction, cross-device focus, and family controls.",
  type: "article",
  body: `
    <header class="page-hero">
      <div class="shell">
        ${breadcrumbs("Best screen time apps")}
        <span class="eyebrow">Broader iPhone roundup</span>
        <h1>The best screen-time apps for iPhone depend on what breaks your plan</h1>
        <p class="page-deck">Some people need a bedtime boundary. Others need a pause before opening an app, a hard work session, a free flexible limit, or parental controls. Match the tool to the failure mode.</p>
        <div class="page-meta"><span>By Hussain Taheri</span><span>Last checked ${checkedDate}</span><span>13 minute read</span></div>
      </div>
    </header>
    <div class="shell article-layout">
      <article class="article-body">
        ${disclosure()}
        <div class="direct-answer"><p><strong>Direct answer:</strong> Start with Apple Screen Time if your needs are basic. Choose ScreenZen for a free third-party system, Twilock for the hours around sleep, one sec for app-opening friction, Opal for polished all-day automation, Jomo for customization, and Freedom for cross-device blocking.</p></div>

        <h2>Best iPhone screen-time apps by job</h2>
        <div class="comparison-table-wrap" tabindex="0" role="region" aria-label="Best iPhone screen time apps table">
          <table class="comparison-table">
            <caption>Use-case fit based on official sources checked ${checkedDate}</caption>
            <thead><tr><th scope="col">App</th><th scope="col">Best use</th><th scope="col">Free option</th><th scope="col">Strict control</th><th scope="col">Platforms</th></tr></thead>
            <tbody>
              <tr><th scope="row">Apple Screen Time</th><td>Built-in limits and family controls</td><td class="yes">Included</td><td>Passcode / family organizer</td><td>Apple devices</td></tr>
              <tr><th scope="row">ScreenZen</th><td>Free customization</td><td class="yes">Complete software is free</td><td>Strict blocks and lock mode</td><td>iOS, macOS, Windows, Android</td></tr>
              <tr><th scope="row">Twilock</th><td>Night and Morning windows</td><td class="yes">Night and core progress</td><td>Strict Mode on Pro</td><td>iPhone</td></tr>
              <tr><th scope="row">one sec</th><td>Pause before opening apps</td><td>One app</td><td>Strict Block on Pro</td><td>iOS, Android, browser, Mac</td></tr>
              <tr><th scope="row">Opal</th><td>All-day rules and polish</td><td>Limited free plan</td><td>Hard Mode on Pro</td><td>iPhone, Mac, Android</td></tr>
              <tr><th scope="row">Jomo</th><td>Flexible rule and unlock design</td><td>Limited free plan</td><td>Strict Mode on Plus</td><td>iPhone, iPad, Mac</td></tr>
              <tr><th scope="row">Freedom</th><td>Cross-device focus sessions</td><td>Start Now sessions</td><td>Locked Mode on Premium</td><td>iOS, Android, Mac, Windows, Chromebook</td></tr>
            </tbody>
          </table>
        </div>

        <h2>Apple Screen Time — best built-in choice</h2>
        ${productReview({name:"Apple Screen Time",bestFor:"basic limits and family management",summary:"Screen Time includes Downtime, App Limits, Always Allowed, reports, Communication Limits, and Family Sharing controls.",advantages:"Already installed, free, integrated with iOS, and well suited to a parent or family organizer managing a child’s limits.",drawbacks:"A self-managed adult can often override or change the settings, and the experience is a system settings panel rather than a motivating routine.",choose:"you need straightforward limits, want to test the idea, or are using Family Sharing."})}

        <h2>ScreenZen — best free third-party app</h2>
        ${productReview({name:"ScreenZen",bestFor:"people who want many controls without a subscription",summary:"ScreenZen provides delays, limits, scheduled blocks, strict blocks, website blocking, streaks, and tracking while remaining donation-supported.",advantages:"Very broad free feature set, good platform coverage, many ways to tune friction, and no recurring fee for the software.",drawbacks:"The many options require more setup, and the product is less opinionated about one specific routine.",choose:"price matters and you are willing to experiment with settings."})}

        <h2>Twilock — best for night and morning</h2>
        ${productReview({name:"Twilock",bestFor:"bedtime and wake-up scrolling",summary:"Twilock organizes blocking around a free Night window and a Pro Morning window. Strict Mode, also on Pro, gives the earlier schedule more weight when an active session begins.",advantages:"Focused scope, fast setup, lower current U.S. prices, strong privacy for Screen Time data, and free core streak/social features.",drawbacks:"iPhone only, two-hour caps, and not intended for arbitrary workday schedules.",choose:"your screen-time problem is concentrated around sleep and you want the smallest system that addresses it."})}

        <h2>one sec — best for automatic app opens</h2>
        ${productReview({name:"one sec",bestFor:"interrupting the tap-open-scroll loop",summary:"one sec places an intervention before selected apps open. Pro expands beyond one app and adds scheduling, block sessions, strict blocks, tracking, and more intervention types.",advantages:"Distinct behavior-change mechanism, usable free test on one app, and a growing set of blockers and platform integrations.",drawbacks:"The free plan is narrow, and feature availability differs by platform.",choose:"you often notice the problem at the moment of opening an app rather than at a predictable time."})}

        <h2>Opal — best polished all-day system</h2>
        ${productReview({name:"Opal",bestFor:"a comprehensive attention system",summary:"Opal offers multiple rule types, flexible schedules, focus timers, Allow Only, scores, history, and cross-platform support.",advantages:"Polished product, many rule types, strong progress layer, and support across phone and computer.",drawbacks:"Higher current Pro pricing and more system than a narrow limit or bedtime routine needs.",choose:"you want one broad product for work sessions, app limits, scheduled rules, and progress."})}

        <h2>Jomo — best for designing your own rules</h2>
        ${productReview({name:"Jomo",bestFor:"highly customized blocking",summary:"Jomo combines sessions, actions, limits, Screen Time budgets, reports, app groups, Strict Mode, and many unlock conditions.",advantages:"Excellent flexibility, comparatively low annual Plus price, and support across Apple devices.",drawbacks:"More concepts to learn and tune; several advanced capabilities are paid.",choose:"you want the blocker to adapt to many situations and enjoy configuring the details."})}

        <h2>Freedom — best cross-device blocker</h2>
        ${productReview({name:"Freedom",bestFor:"blocking across phone, computer, and browser",summary:"Freedom can sync a session across multiple device types. Premium adds schedules, recurring sessions, Locked Mode, and longer sessions.",advantages:"Widest platform coverage in this group, cross-device sessions, app and website blocking, and a one-time purchase option.",drawbacks:"Less focused on iPhone-specific habit design; recurring schedules and Locked Mode require Premium.",choose:"moving to another screen is your usual escape from a phone block."})}

        <h2>How to make the choice in two minutes</h2>
        <ol><li><strong>Name the moment:</strong> bedtime, opening an app, work, all day, or across devices.</li><li><strong>Name the loophole:</strong> ignore, edit, delete, disable permission, or switch devices.</li><li><strong>Choose the smallest tool that closes that loophole.</strong></li><li><strong>Run a short test before turning on the strictest mode.</strong></li></ol>
        <div class="callout"><p>A long feature list is not automatically better. Every extra control is another decision to configure and maintain. The best screen-time app is the one you will still understand when you are tired.</p></div>

        <h2>Methodology</h2>
        <div class="methodology"><p>We reviewed current official product pages, pricing, App Store information, and help documentation. We compared the job each app is designed to do, free-tier usefulness, schedule types, strict controls, platform coverage, and current price. We did not use vendor-reported time-saved statistics, testimonials, or raw rating counts to select these use-case winners.</p></div>

        <h2>Sources</h2>
        <ul class="source-list"><li><a href="https://support.apple.com/en-us/108806">Apple Screen Time</a></li><li><a href="https://screenzen.co/">ScreenZen</a></li><li><a href="${appStoreUrl}">Twilock App Store listing</a></li><li><a href="https://tutorials.one-sec.app/en/articles/3036418">one sec Pro comparison</a></li><li><a href="https://opalapp.com/pricing">Opal pricing</a> and <a href="https://help.opalapp.com/">help center</a></li><li><a href="https://jomo.so/pricing">Jomo pricing</a> and <a href="https://jomo.so/features">features</a></li><li><a href="https://freedom.to/premium">Freedom Premium</a></li></ul>

        <h2>Frequently asked questions</h2>
        <div class="faq-list">
          <details><summary>What is the best screen-time app for iPhone?</summary><div>For basic limits, start with Apple Screen Time. For a focused bedtime use case, choose Twilock. For free customization, ScreenZen. For broad premium automation, Opal or Jomo. For opening friction, one sec. For multiple devices, Freedom.</div></details>
          <details><summary>Are third-party screen-time apps safe?</summary><div>Review the developer, privacy policy, App Store privacy label, and requested permissions. iOS screen-time blockers use Apple’s frameworks, but their account, analytics, and support data practices can differ.</div></details>
          <details><summary>Can these apps see which apps I use?</summary><div>Apple’s Screen Time frameworks use privacy-preserving selection and activity APIs, but each product’s broader data practices differ. Twilock states that selected apps and raw app-usage data stay on device.</div></details>
          <details><summary>Is a paid screen-time app worth it?</summary><div>Pay when a specific paid feature closes your real loophole: strict mode, more schedules, cross-device sync, unlimited apps, or deeper controls. A free tool is enough if it reliably changes the behavior you care about.</div></details>
        </div>
      </article>
      ${articleAside()}
    </div>`,
  schema: [articleSchema(screenTimeAppsRoute, "The Best Screen Time Apps for iPhone", "A source-checked roundup of iPhone screen-time apps by job, free tier, strictness, platforms, and price."), breadcrumbSchema(screenTimeAppsRoute, "Best screen time apps")],
});

pages.push({
  route: "about",
  title: "About Twilock and Founder Hussain Taheri",
  description: "Why Hussain Taheri built Twilock as a focused iPhone blocker for nighttime and morning scrolling instead of another oversized productivity platform.",
  body: `
    <header class="page-hero">
      <div class="reading-shell">
        ${breadcrumbs("About")}
        <span class="eyebrow">Founder story</span>
        <h1>A smaller answer to a very specific problem.</h1>
        <p class="page-deck">Twilock exists because the hours around sleep do not need another dashboard. They need one clear boundary that still makes sense when you are tired.</p>
      </div>
    </header>
    <div class="shell article-layout">
      <article class="article-body">
        <div class="direct-answer"><p><strong>Twilock is built by Hussain Taheri</strong>, a University of Florida computer science student who wanted a screen-time blocker focused on the moments when his own rules were easiest to renegotiate.</p></div>
        <h2>Why night and morning?</h2>
        <p>General productivity apps tend to grow toward more rules, more modes, and more analytics. Those tools can be useful, but they also ask you to design a whole system.</p>
        <p>Twilock begins with a narrower observation: for many people, unwanted scrolling is not evenly distributed across the day. It clusters before sleep, when “one minute” expands, and after waking, when the first app sets the tone for the next hour.</p>
        <p>That led to two named windows, each capped at two hours, and a product that gets out of the way outside them.</p>

        <h2>Why Strict Mode?</h2>
        <p>A block is not very useful if the same tired version of you who wants to scroll can remove it in seconds. Strict Mode gives more weight to the decision made earlier, while retaining a recovery path for genuine need.</p>
        <p>The goal is not punishment. It is commitment: a little distance between impulse and action, applied only where you asked for it.</p>

        <h2>What Twilock values</h2>
        <div class="difference-grid">
          <article class="difference-item"><span class="difference-index">01</span><div><h3>Focus over feature count</h3><p>Twilock is not trying to become a task manager, calendar, timer, and wellness platform at once.</p></div></article>
          <article class="difference-item"><span class="difference-index">02</span><div><h3>Privacy in the core loop</h3><p>Your selected apps and raw Screen Time usage stay on your device.</p></div></article>
          <article class="difference-item"><span class="difference-index">03</span><div><h3>Honest trade-offs</h3><p>A two-hour cap and iPhone-only scope are constraints, not hidden weaknesses. Broader blockers fit broader needs.</p></div></article>
          <article class="difference-item"><span class="difference-index">04</span><div><h3>Calm commitment</h3><p>The product should protect a choice without shaming the person who needed help keeping it.</p></div></article>
        </div>

        <h2>Built in Gainesville, used wherever the night scroll begins</h2>
        <p>Hussain studies computer science at the University of Florida and builds Twilock independently. Product questions, bug reports, and honest feedback are welcome at <a href="mailto:twilockapp@gmail.com">twilockapp@gmail.com</a>.</p>
        <div class="callout"><p>If Twilock is too narrow for your needs, our comparison guides say so. The point is to help you choose a boundary you can live with—not to turn every screen-time problem into a Twilock-shaped one.</p></div>
      </article>
      ${articleAside("Twilock is an independent iPhone app built around one clear job: protect the hours before sleep and after waking.")}
    </div>`,
  schema: [breadcrumbSchema("about", "About"), { "@type": "AboutPage", name: "About Twilock", url: `${siteUrl}/about/`, mainEntity: { "@type": "Person", name: "Hussain Taheri", affiliation: { "@type": "CollegeOrUniversity", name: "University of Florida" } } }],
});

pages.push({
  route: "support",
  title: "Twilock Support — Help, Purchases, and Account Deletion",
  description: "Get accurate Twilock support for Screen Time access, app shields, subscriptions, purchase restoration, account deletion, privacy, and bug reports.",
  body: `
    <header class="page-hero">
      <div class="reading-shell">
        ${breadcrumbs("Support")}
        <span class="eyebrow">Twilock support</span>
        <h1>Help when the shield or schedule does not behave as expected.</h1>
        <p class="page-deck">Email <a href="mailto:twilockapp@gmail.com">twilockapp@gmail.com</a> for help, bug reports, or feedback. We aim to reply within a few days.</p>
      </div>
    </header>
    <div class="reading-shell">
      <div class="support-grid">
        <section class="support-card"><h2>Screen Time access</h2><p>Open iPhone Settings → Screen Time and confirm Twilock has access. Then check that your chosen apps are still selected and that the current time is inside your configured window.</p></section>
        <section class="support-card"><h2>Cancel or change Pro</h2><p>Apple manages subscriptions. Open iPhone Settings → your name → Subscriptions, choose Twilock, and update or cancel the plan there.</p></section>
        <section class="support-card"><h2>Restore a purchase</h2><p>Open Twilock’s paywall on the device using the same Apple Account and choose Restore Purchases.</p></section>
        <section class="support-card"><h2>Delete your account</h2><p>Open Twilock → Settings → Delete Account. This permanently removes your profile, synced progress, and friend connections from Twilock’s servers.</p></section>
      </div>
      <section class="section-tight">
        <div class="article-body">
          <h2>Before emailing support</h2>
          <p>Include what you were doing, what you expected, and what happened instead. If safe to share, attach a screenshot. Twilock’s in-app support email can include non-sensitive diagnostics that help identify the app version and schedule state.</p>
          <h3>The shield is not appearing</h3>
          <ul><li>Confirm the selected window is currently active.</li><li>Confirm the affected app is still selected.</li><li>Check Screen Time access in iPhone Settings.</li><li>Open Twilock once after an iOS update or device restart.</li></ul>
          <h3>I need access during Strict Mode</h3>
          <p>Use the recovery path shown inside Twilock. Support cannot remotely bypass an active iPhone Screen Time shield.</p>
          <h3>Privacy questions</h3>
          <p>Read the <a href="/privacy/">Twilock Privacy Policy</a>. Questions about privacy or your data can also be sent to <a href="mailto:hussaint786@icloud.com">hussaint786@icloud.com</a>, the address in the published policy.</p>
          <h3>Billing and refunds</h3>
          <p>Apple processes Twilock purchases. Use <a href="https://reportaproblem.apple.com/">Apple’s Report a Problem service</a> for refund requests.</p>
          <div class="final-cta"><span class="kicker">Still stuck?</span><h2>Email Twilock support.</h2><p>Tell us what happened and we will help you work through it.</p><a class="app-store-button" href="mailto:twilockapp@gmail.com"><span class="store-copy"><small>Contact</small><strong>twilockapp@gmail.com</strong></span></a></div>
        </div>
      </section>
    </div>`,
  schema: [breadcrumbSchema("support", "Support"), { "@type": "ContactPage", name: "Twilock Support", url: `${siteUrl}/support/`, mainEntity: { "@type": "Organization", name: "Twilock", email: "twilockapp@gmail.com" } }],
});

pages.push({
  route: "privacy",
  title: "Twilock Privacy Policy",
  description: "Twilock’s privacy policy explains on-device Screen Time data, optional accounts and social features, analytics, purchases, retention, deletion, and contact details.",
  bodyClass: "legal-page",
  body: `
    <header class="page-hero">
      <div class="reading-shell">
        ${breadcrumbs("Privacy Policy")}
        <span class="eyebrow">Legal</span>
        <h1>Twilock Privacy Policy</h1>
        <p class="page-deck">Last updated: August 8, 2026</p>
      </div>
    </header>
    <div class="shell article-layout">
      <article class="article-body">
        <p>Twilock ("we," "us," or "the app") helps you stop doomscrolling during your chosen night and morning windows. We built Twilock to protect your attention, and we take the same care with your privacy. This policy explains what data the app handles, why, and the choices you have.</p>
        <div class="direct-answer"><p><strong>Our core principle:</strong> your Screen Time and app usage data never leaves your device. We do not sell your data, we do not use it for advertising, and we do not share it with data brokers.</p></div>

        <section><h2>Data that stays only on your device</h2><ul>
          <li><strong>Screen Time &amp; app usage data.</strong> Twilock uses Apple's Family Controls / Screen Time framework to shield the apps you select during your no scroll windows. This usage data is processed entirely on your device and is <strong>never uploaded to us or anyone else</strong>. We cannot see which apps you use or how long you use them.</li>
          <li><strong>Your no scroll windows &amp; app selection.</strong> The times you set and the apps you choose to shield are stored locally on your device.</li>
          <li><strong>Self reported check ins.</strong> Any sleep, energy, or mood ratings you enter are stored on your device only and are not uploaded.</li>
        </ul></section>

        <section><h2>Data stored to power accounts &amp; the social features</h2><p>These features are optional. Onboarding offers sign in, but includes a "Skip" option, creating an account is only actually required if you want to use the Friends tab. If you do sign in, we store the minimum needed, via our backend provider, Supabase:</p><ul>
          <li><strong>Account.</strong> You can sign in with Sign in with Apple, Sign in with Google, or email/password. Depending on the method, this gives us your email address (or, with Apple, a private relay address if you choose to hide your email from us) and a unique account identifier, which our authentication provider, Supabase, stores to keep you signed in. If Apple or Google shares your name on first sign in, we store an editable display name too. We never see your Apple ID password, your Google password, or (for email sign in) your password in plain text, Supabase stores only a salted hash of it.</li>
          <li><strong>Profile &amp; progress.</strong> To show you on your friends' leaderboard, we store your display name, invite code, current streak, and longest streak. We also sync a day by day record of your no scroll windows, the date, which window (night or morning), the outcome (clean, frozen, or violated), and your device's time zone, so your streak and history stay consistent across devices. We do <strong>not</strong> store which apps you shield, your raw app usage data, your check ins, or your earned badges on our servers, those stay on your device only.</li>
          <li><strong>Friends.</strong> Friend connections and pending friend requests you create (via invite codes) are stored so the social and leaderboard features work.</li>
        </ul></section>

        <section><h2>Product analytics</h2><p>We use PostHog to understand how the app is used overall, for example how many people complete onboarding, which screens are visited, whether a purchase was made, and when streak features are used, such as a badge being earned, a Streak Freeze consumed, Streak Repair used, a Snooze Token redeemed, Strict Mode turned on or off, or a window postponed. These events do not include which apps you shield, your Screen Time or app usage data, your check ins, or your no scroll window settings, all of which stay on your device as described above. Analytics events are tied to an anonymous identifier rather than your name or email, and we do not use them for advertising or share them with advertisers or data brokers.</p></section>

        <section><h2>Purchases</h2><p>Subscriptions and the lifetime purchase are processed by <strong>Apple</strong>. We use <strong>RevenueCat</strong> to verify your purchase and manage your subscription status, this involves RevenueCat processing your purchase/transaction history to confirm your entitlement. We do not receive or store your payment card details; Apple handles all billing.</p></section>

        <section><h2>What we do NOT do</h2><ul><li>We do not sell or rent your personal data.</li><li>We do not use your Screen Time or usage data for advertising or advertising measurement, and we do not share it with any data broker.</li><li>We do not track you across other apps or websites.</li></ul></section>

        <section><h2>Third party services</h2><ul>
          <li><strong>Apple:</strong> Sign in with Apple, Screen Time / Family Controls, and in app purchases. See Apple's Privacy Policy.</li>
          <li><strong>Google:</strong> Sign in with Google, if you choose that option. Google receives your request to authenticate and returns an identity token confirming who you are; see Google's Privacy Policy.</li>
          <li><strong>Supabase:</strong> stores your account, profile, progress (including your day by day no scroll history), and friend connections for the social features.</li>
          <li><strong>RevenueCat:</strong> manages your subscription status.</li>
          <li><strong>PostHog:</strong> processes anonymous product analytics events, such as app opens and onboarding completion, to help us understand usage and improve the app.</li>
        </ul></section>

        <section><h2>Data retention &amp; deletion</h2><p>You can delete your account and all associated server side data at any time from <strong>Settings → Delete Account</strong> inside the app. This permanently removes your profile, progress, and friend connections from our servers. Data stored only on your device is removed when you delete the app.</p></section>

        <section><h2>Children</h2><p>Twilock is rated 13+ and is not directed to children under 13. We do not knowingly collect personal information from children under 13.</p></section>

        <section><h2>Changes to this policy</h2><p>We may update this policy from time to time. Material changes will be reflected here with an updated date.</p></section>

        <section><h2>Contact</h2><p>Questions about this policy or your data? Contact us at <a href="mailto:hussaint786@icloud.com">hussaint786@icloud.com</a>.</p></section>

        <p class="quiet">Twilock is operated by Hussain Taheri. This document reflects Twilock's actual data practices as of the date above. It is not legal advice; if you have specific compliance obligations (e.g. GDPR, CCPA) beyond what's described here, have it reviewed by counsel.</p>
      </article>
      <aside class="article-aside"><div><h2>Need help?</h2><p>For product support, bug reports, or account-deletion help, visit Twilock Support.</p></div><a class="text-link" href="/support/">Open support</a></aside>
    </div>`,
  schema: [breadcrumbSchema("privacy", "Privacy Policy"), { "@type": "WebPage", name: "Twilock Privacy Policy", url: `${siteUrl}/privacy/`, dateModified: "2026-08-08" }],
});

pages.push({
  route: "terms",
  title: "Twilock Terms of Use",
  description: "Twilock uses Apple’s Standard End User License Agreement. Read the official agreement and learn how App Store subscriptions and purchases are managed.",
  bodyClass: "legal-page",
  body: `
    <header class="page-hero">
      <div class="reading-shell">
        ${breadcrumbs("Terms of Use")}
        <span class="eyebrow">Legal</span>
        <h1>Twilock Terms of Use</h1>
        <p class="page-deck">Twilock uses Apple’s Standard End User License Agreement (EULA). Twilock does not currently publish a separate custom terms agreement.</p>
      </div>
    </header>
    <div class="shell article-layout">
      <article class="article-body">
        <div class="direct-answer"><p><strong>Official agreement:</strong> Your use of Twilock is governed by <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/">Apple’s Standard Licensed Application End User License Agreement</a>.</p></div>
        <section><h2>Subscriptions and purchases</h2><p>Twilock Pro is offered as a monthly or annual auto-renewing subscription, or as a one-time Lifetime purchase. Prices are shown before you buy. Subscriptions renew automatically unless canceled at least 24 hours before the end of the current period.</p></section>
        <section><h2>Managing a subscription</h2><p>Apple processes Twilock purchases. Manage or cancel a subscription from iPhone Settings → your name → Subscriptions. Use <a href="https://reportaproblem.apple.com/">Apple’s Report a Problem service</a> for refund requests.</p></section>
        <section><h2>Privacy</h2><p>The <a href="/privacy/">Twilock Privacy Policy</a> describes the data the app handles, what stays on device, optional account and social data, analytics, purchases, retention, and deletion.</p></section>
        <section><h2>Contact</h2><p>Questions about Twilock can be sent to <a href="mailto:twilockapp@gmail.com">twilockapp@gmail.com</a>.</p></section>
      </article>
      <aside class="article-aside"><div><h2>Read the exact EULA</h2><p>The controlling agreement is hosted and maintained by Apple.</p></div><a class="text-link" href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/">Open Apple’s EULA</a></aside>
    </div>`,
  schema: [breadcrumbSchema("terms", "Terms of Use"), { "@type": "WebPage", name: "Twilock Terms of Use", url: `${siteUrl}/terms/` }],
});

const routeSet = new Set(pages.map((page) => page.route));
if (routeSet.size !== pages.length || routes.some((route) => !routeSet.has(route))) {
  throw new Error("The generated page list does not match the required route list.");
}

const writeDeploymentFile = async (relativePath, content) => {
  const rootPath = path.join(projectDir, relativePath);
  const distPath = path.join(distDir, relativePath);
  await mkdir(path.dirname(rootPath), { recursive: true });
  await mkdir(path.dirname(distPath), { recursive: true });
  await Promise.all([writeFile(rootPath, content), writeFile(distPath, content)]);
};

const build = async () => {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });

  for (const page of pages) {
    const outputPath = page.route ? `${page.route}/index.html` : "index.html";
    await writeDeploymentFile(outputPath, renderPage(page));
  }

  const css = await readFile(path.join(sourceDir, "styles.css"), "utf8");
  const js = await readFile(path.join(sourceDir, "site.js"), "utf8");
  await writeDeploymentFile("assets/site.css", css);
  await writeDeploymentFile("assets/site.js", js);
  await mkdir(path.join(distDir, "assets"), { recursive: true });
  await copyFile(path.join(projectDir, "assets/twilock-icon.png"), path.join(distDir, "assets/twilock-icon.png"));

  const manifest = {
    name: "Twilock: Screen Time Blocker",
    short_name: "Twilock",
    description: "Protect the hours before sleep and after waking.",
    start_url: "/",
    display: "browser",
    background_color: "#050817",
    theme_color: "#050817",
    icons: [{ src: "/assets/twilock-icon.png", sizes: "1024x1024", type: "image/png", purpose: "any maskable" }],
  };
  await writeDeploymentFile("site.webmanifest", `${JSON.stringify(manifest, null, 2)}\n`);

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map((route) => `  <url><loc>${canonicalFor(route)}</loc><lastmod>${isoDate}</lastmod></url>`).join("\n")}
</urlset>\n`;
  await writeDeploymentFile("sitemap.xml", sitemap);
  await writeDeploymentFile("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
  await writeDeploymentFile("humans.txt", "Twilock is designed and built by Hussain Taheri.\nWebsite last verified: August 31, 2026.\n");

  const notFound = renderPage({
    route: "404",
    title: "Page Not Found — Twilock",
    description: "The requested Twilock page could not be found.",
    body: `<section class="page-hero"><div class="reading-shell"><span class="eyebrow">404</span><h1>This page drifted past its window.</h1><p class="page-deck">The link may be old or mistyped. Head back to Twilock or browse the current guides.</p><div class="hero-actions"><a class="app-store-button" href="/"><span class="store-copy"><small>Return to</small><strong>Twilock home</strong></span></a><a class="text-link" href="/best-nighttime-app-blockers/">Browse guides</a></div></div></section>`,
    schema: [],
  }).replace('content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"', 'content="noindex,follow"');
  await writeDeploymentFile("404.html", notFound);

  console.log(`Built ${pages.length} crawlable pages for ${siteUrl}`);
};

await build();
