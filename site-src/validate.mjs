import { access, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sourceDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(sourceDir, "..");
const distDir = path.join(projectDir, "dist");

const required = [
  "index.html",
  "twilock-vs-opal/index.html",
  "block-social-media-at-night-iphone/index.html",
  "best-nighttime-app-blockers/index.html",
  "best-strict-app-blockers-iphone/index.html",
  "best-screen-time-apps-iphone/index.html",
  "about/index.html",
  "support/index.html",
  "privacy/index.html",
  "terms/index.html",
  "404.html",
  "robots.txt",
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

const sitemap = await readFile(path.join(projectDir, "sitemap.xml"), "utf8");
for (const canonical of canonicals.keys()) {
  if (!sitemap.includes(`<loc>${canonical}</loc>`)) fail(`sitemap.xml: missing ${canonical}`);
}
if ((sitemap.match(/<url>/g) || []).length !== 10) fail("sitemap.xml: expected 10 URLs");

const robots = await readFile(path.join(projectDir, "robots.txt"), "utf8");
if (!robots.includes("Allow: /") || !robots.includes("Sitemap: https://twilock.app/sitemap.xml")) fail("robots.txt: crawl or sitemap directive is incorrect");

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
