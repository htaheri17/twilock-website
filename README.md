# Twilock website

Production static marketing and SEO site for Twilock, designed for Porkbun Static Hosting.

## Deployment layout

The repository root is the live static site so Porkbun GitHub Connect can publish it directly. Editable source lives in `site-src/`, and `dist/` mirrors the generated site alongside independently maintained slideshow pages, media, and verification files. Builds update the generated site in place. The validator applies the 40 MB manual upload limit to the generated marketing site and its assets. Slideshow media is deployed through GitHub Connect.

## Build and check

```sh
npm run build
npm run validate
```

To preview locally:

```sh
npm run serve
```

The canonical origin defaults to `https://twilock.com`. Set `SITE_URL` while building if the production domain changes.

## Porkbun handoff

Follow [PORKBUN_DEPLOYMENT.md](./PORKBUN_DEPLOYMENT.md) to connect the repository, publish the `main` branch, and run the post-launch checks. Porkbun needs no build command: the repository root already contains the generated website.

## Verified public facts

Twilock product copy was checked on October 21, 2026 against the released App Store version 1.2.0 and the app source. Night and Morning routines last 15 to 120 minutes and support daily, weekday/weekend, or custom-day schedules. Every enabled routine uses Strict Mode. New users need a subscription or eligible trial; existing users retain permanent full access. US prices are $6.99 monthly or $39.99 annually. Eligible annual subscriptions include a 7 day trial. Existing Lifetime purchases remain supported, but the app offers new users monthly or annual subscriptions.

The privacy policy preserves the policy published October 20, 2026. Competitor research retains its original August 31, 2026 verification date; those products were not retested in this copy update. Editorial pages link to their official sources.
