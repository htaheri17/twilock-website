import { access, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sourceDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(sourceDir, "..");
const distDir = path.join(projectDir, "dist");

const required = [
  "index.html",
  "how-to-block-apps-on-iphone/index.html",
  "how-to-limit-screen-time-on-iphone/index.html",
  "twilock-vs-opal/index.html",
  "block-social-media-at-night-iphone/index.html",
  "stop-doomscrolling-at-night-iphone/index.html",
  "make-iphone-screen-time-harder-to-bypass/index.html",
  "stop-checking-phone-first-thing-morning/index.html",
  "best-nighttime-app-blockers/index.html",
  "best-strict-app-blockers-iphone/index.html",
  "best-screen-time-apps-iphone/index.html",
  "about/index.html",
  "support/index.html",
  "privacy/index.html",
  "terms/index.html",
  "404.html",
  "robots.txt",
  "llms.txt",
  "sitemap.xml",
  "site.webmanifest",
  "assets/site.css",
  "assets/site.js",
  "assets/twilock-icon.png",
];

const failures = [];
const titles = new Map();
const descriptions = new Map();
const canonicals = new Map();

const fail = (message) => failures.push(message);
const visibleDashPattern = /[-‐‑‒–—]/;

for (const relative of required) {
  for (const base of [projectDir, distDir]) {
    try {
      await access(path.join(base, relative));
    } catch {
      fail(`Missing ${path.relative(projectDir, path.join(base, relative))}`);
    }
  }
}

const htmlFiles = required.filter((file) => file.endsWith(".html"));
for (const relative of htmlFiles) {
  const filePath = path.join(projectDir, relative);
  const html = await readFile(filePath, "utf8");
  const label = relative;

  const h1Count = (html.match(/<h1\b/g) || []).length;
  if (h1Count !== 1) fail(`${label}: expected one H1, found ${h1Count}`);

  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = html.match(/<meta name="description" content="([^"]+)">/)?.[1];
  const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
  if (!title) fail(`${label}: missing title`);
  if (!description) fail(`${label}: missing meta description`);
  if (!canonical) fail(`${label}: missing canonical URL`);

  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]+>/g, "").trim();
  if (title && h1 && title.toLowerCase() === h1.toLowerCase()) fail(`${label}: title and H1 should not be identical`);

  if (relative !== "404.html") {
    if (titles.has(title)) fail(`${label}: duplicate title with ${titles.get(title)}`);
    if (descriptions.has(description)) fail(`${label}: duplicate description with ${descriptions.get(description)}`);
    if (canonicals.has(canonical)) fail(`${label}: duplicate canonical with ${canonicals.get(canonical)}`);
    titles.set(title, label);
    descriptions.set(description, label);
    canonicals.set(canonical, label);
  }

  for (const requiredMeta of ["og:title", "og:description", "og:url", "og:image", "twitter:card"]) {
    if (!html.includes(`content=\"`) || !html.includes(requiredMeta)) fail(`${label}: missing ${requiredMeta}`);
  }

  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(match[1]);
    } catch (error) {
      fail(`${label}: invalid JSON-LD (${error.message})`);
    }
  }

  for (const match of html.matchAll(/<img\b([^>]+)>/g)) {
    const attrs = match[1];
    const src = attrs.match(/src="([^"]+)"/)?.[1];
    if (src !== "/assets/twilock-icon.png") fail(`${label}: unapproved image source ${src || "missing"}`);
    if (!/\bwidth="\d+"/.test(attrs) || !/\bheight="\d+"/.test(attrs)) fail(`${label}: image missing intrinsic dimensions`);
    if (!/\balt="[^"]*"/.test(attrs)) fail(`${label}: image missing alt text`);
  }

  const forbidden = [/\bTODO\b/i, /\bYOUR [A-Z]/, /placeholder/i, /lorem ipsum/i];
  for (const pattern of forbidden) if (pattern.test(html)) fail(`${label}: contains unfinished copy matching ${pattern}`);

  const withoutScripts = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  const visibleText = [...withoutScripts.matchAll(/>([^<]+)</g)].map((match) => match[1]).join(" ");
  const accessibleText = [...withoutScripts.matchAll(/\b(?:aria-label|alt|title)="([^"]*)"/g)].map((match) => match[1]).join(" ");
  const metadataText = [title, description,
    html.match(/<meta property="og:title" content="([^"]*)">/)?.[1],
    html.match(/<meta property="og:description" content="([^"]*)">/)?.[1],
    html.match(/<meta name="twitter:title" content="([^"]*)">/)?.[1],
    html.match(/<meta name="twitter:description" content="([^"]*)">/)?.[1],
  ].filter(Boolean).join(" ");
  if (visibleDashPattern.test(`${visibleText} ${accessibleText} ${metadataText}`)) {
    fail(`${label}: user-visible text contains a hyphen or dash`);
  }

  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const href = match[1];
    if (!href.startsWith("/")) continue;
    const clean = href.split("#")[0].split("?")[0];
    if (!clean) continue;
    let target;
    if (clean === "/") target = path.join(projectDir, "index.html");
    else if (path.extname(clean)) target = path.join(projectDir, clean);
    else target = path.join(projectDir, clean, "index.html");
    try {
      await access(target);
    } catch {
      fail(`${label}: broken internal link ${href}`);
    }
  }
}

for (const [canonical, label] of canonicals) {
  const pathname = new URL(canonical).pathname;
  if (pathname === "/") continue;
  let incomingLinks = 0;
  for (const relative of htmlFiles.filter((file) => file !== "404.html" && file !== label)) {
    const html = await readFile(path.join(projectDir, relative), "utf8");
    if (html.includes(`href="${pathname}"`)) incomingLinks += 1;
  }
  if (incomingLinks === 0) fail(`${label}: canonical page has no incoming internal links`);
}

const home = await readFile(path.join(projectDir, "index.html"), "utf8");
const homeSchemaText = home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
const homeSchema = homeSchemaText ? JSON.parse(homeSchemaText) : null;
const softwareApp = homeSchema?.["@graph"]?.find((item) => item["@type"] === "SoftwareApplication");
if (!softwareApp?.offers || !softwareApp?.aggregateRating) {
  fail("index.html: SoftwareApplication requires visible offer and verified rating data");
}

const sitemap = await readFile(path.join(projectDir, "sitemap.xml"), "utf8");
for (const canonical of canonicals.keys()) {
  if (!sitemap.includes(`<loc>${canonical}</loc>`)) fail(`sitemap.xml: missing ${canonical}`);
}
if ((sitemap.match(/<url>/g) || []).length !== 15) fail("sitemap.xml: expected 15 URLs");

const robots = await readFile(path.join(projectDir, "robots.txt"), "utf8");
if (!robots.includes("Allow: /") || !robots.includes("Sitemap: https://twilock.com/sitemap.xml")) fail("robots.txt: crawl or sitemap directive is incorrect");

const llms = await readFile(path.join(projectDir, "llms.txt"), "utf8");
if (!llms.startsWith("# Twilock\n") || !llms.includes("https://twilock.com/stop-doomscrolling-at-night-iphone/")) {
  fail("llms.txt: title or primary guide links are missing");
}

const css = await readFile(path.join(projectDir, "assets/site.css"), "utf8");
for (const match of css.matchAll(/content:\s*["']([^"']*)["']/g)) {
  if (visibleDashPattern.test(match[1])) fail("assets/site.css: generated user-visible content contains a hyphen or dash");
}
if (css.trim().includes("\n")) fail("assets/site.css: production CSS is not minified");
const js = await readFile(path.join(projectDir, "assets/site.js"), "utf8");
if (js.trim().includes("\n")) fail("assets/site.js: production JavaScript is not minified");

const walkSize = async (directory) => {
  let total = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    total += entry.isDirectory() ? await walkSize(fullPath) : (await stat(fullPath)).size;
  }
  return total;
};
const bytes = await walkSize(distDir);
if (bytes > 40 * 1024 * 1024) fail(`dist exceeds Porkbun's 40 MB upload limit (${bytes} bytes)`);

if (failures.length) {
  console.error(`Validation failed with ${failures.length} issue(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Validated ${htmlFiles.length} HTML files, ${canonicals.size} canonical pages, all internal links, approved imagery, JSON-LD, sitemap, robots.txt, and a ${(bytes / 1024 / 1024).toFixed(2)} MB Porkbun deployment.`);
