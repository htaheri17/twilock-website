# Publish Twilock on Porkbun

The production origin is configured as `https://twilock.app`. The site is fully static and the repository root is the publishable output; there is no build command, framework server, database, or environment secret.

## Connect the repository

1. Sign in to Porkbun and open **Domain Management** for `twilock.app`.
2. Open **Static Hosting** for the domain. Start or activate Porkbun Static Hosting if it is not already active.
3. Choose **GitHub Connect**, then connect GitHub when Porkbun prompts.
4. During GitHub authorization, grant Porkbun access only to the dedicated `htaheri17/twilock-website` repository.
5. Return to Porkbun, select the `htaheri17/twilock-website` repository and the `main` branch, then save the connection.
6. Wait for Porkbun to report a successful deployment and for the included SSL certificate to become active.

Official Porkbun instructions: [connect Static Hosting to GitHub](https://kb.porkbun.com/article/145-how-to-connect-static-hosting-to-github) and [set up Static Hosting](https://kb.porkbun.com/article/137-how-to-set-up-static-hosting).

## Verify the launch

Open each of these in a private browser window:

- `https://twilock.app/`
- `https://twilock.app/twilock-vs-opal/`
- `https://twilock.app/best-strict-app-blockers-iphone/`
- `https://twilock.app/privacy/`
- `https://twilock.app/robots.txt`
- `https://twilock.app/sitemap.xml`

Confirm that the browser shows HTTPS without a certificate warning, the App Store buttons open Twilock's live listing, and navigation works on both a phone and desktop browser.

The automated verification command below checks the live domain, representative pages, HTTPS responses, canonical URLs, internal links, structured data, the sitemap, and `robots.txt`:

```sh
npm run verify:production
```

Run it only after `https://twilock.app` resolves publicly.

## Submit the sitemap

In Google Search Console, add or select the `twilock.app` property and submit:

`https://twilock.app/sitemap.xml`

Request indexing for the home page after the first successful crawl. The comparison and guide URLs are already discoverable from the sitemap and internal links.
