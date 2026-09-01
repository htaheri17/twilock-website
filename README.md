# Twilock website

Production static marketing and SEO site for Twilock, designed for Porkbun Static Hosting.

## Deployment layout

The repository root is the live static site so Porkbun GitHub Connect can publish it directly. Editable source lives in `site-src/`, and `dist/` is a second, upload-ready copy for Porkbun's editor or FTP workflow.

## Build and check

```sh
npm run build
npm run validate
```

To preview locally:

```sh
npm run serve
```

The canonical origin defaults to `https://twilock.app`. Set `SITE_URL` while building if the production domain changes.

## Porkbun handoff

Follow [PORKBUN_DEPLOYMENT.md](./PORKBUN_DEPLOYMENT.md) to connect the repository, publish the `main` branch, and run the post-launch checks. Porkbun needs no build command: the repository root already contains the generated website.

## Verified public facts

Product name, App Store URL, release/version information, supported iOS version, US in-app prices, privacy policy, support email, and feature split were checked on August 31, 2026 against Apple's live listing, the app's shipping source, and the existing Twilock policy/support repositories. Editorial pages link to each competitor's official source.
