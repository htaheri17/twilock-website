const origin = (process.env.SITE_URL || "https://twilock.com").replace(/\/$/, "");
const failures = [];

const check = async (url, label) => {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: { "user-agent": "Twilock production verifier/1.0" },
    });
    if (!response.ok) failures.push(`${label}: HTTP ${response.status} at ${url}`);
    if (!response.url.startsWith("https://")) failures.push(`${label}: did not finish on HTTPS (${response.url})`);
    return { response, body: await response.text() };
  } catch (error) {
    failures.push(`${label}: ${error.message}`);
    return { response: null, body: "" };
  }
};

const { body: sitemap } = await check(`${origin}/sitemap.xml`, "sitemap.xml");
const { body: robots } = await check(`${origin}/robots.txt`, "robots.txt");
const { body: llms } = await check(`${origin}/llms.txt`, "llms.txt");

if (!robots.includes("Allow: /")) failures.push("robots.txt: missing Allow: /");
if (!robots.includes(`Sitemap: ${origin}/sitemap.xml`)) failures.push("robots.txt: sitemap URL does not match the production origin");
if (!llms.startsWith("# Twilock\n")) failures.push("llms.txt: expected Twilock heading is missing");

const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (sitemapUrls.length !== 16) failures.push(`sitemap.xml: expected 16 canonical URLs, found ${sitemapUrls.length}`);

const internalUrls = new Set([`${origin}/`, `${origin}/robots.txt`, `${origin}/sitemap.xml`]);
for (const url of sitemapUrls) {
  if (!url.startsWith(`${origin}/`)) {
    failures.push(`sitemap.xml: URL is outside ${origin}: ${url}`);
    continue;
  }

  const { body } = await check(url, `page ${url}`);
  const canonical = body.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
  if (canonical !== url) failures.push(`${url}: canonical is ${canonical || "missing"}`);
  if (!body.includes('type="application/ld+json"')) failures.push(`${url}: structured data is missing`);

  for (const match of body.matchAll(/href="([^"]+)"/g)) {
    const href = match[1];
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    const resolved = new URL(href, origin);
    if (resolved.origin === origin) {
      resolved.hash = "";
      internalUrls.add(resolved.href);
    }
  }
}

for (const url of internalUrls) await check(url, `internal link ${url}`);

if (failures.length) {
  console.error(`Production verification failed with ${failures.length} issue(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Verified ${sitemapUrls.length} canonical pages, ${internalUrls.size} internal URLs, HTTPS, structured data, sitemap.xml, and robots.txt at ${origin}.`);
