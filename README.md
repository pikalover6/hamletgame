# hamletgame

Inside Hamlet's Mind is a small Three.js prototype.

## Run

```bash
npm install
npm run dev
```

> The project loads `/public/a_man_in_suit.glb` for all three characters.
> If the asset is missing, a built-in low-poly fallback is used.

## Cloudflare Pages deployment

This repository includes a GitHub Actions workflow at
`/.github/workflows/deploy-cloudflare-pages.yml` that builds and deploys to Cloudflare Pages on pushes to `main`.

Set these repository secrets before using the workflow:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Optionally set this repository variable:

- `CLOUDFLARE_PAGES_PROJECT` (defaults to `hamletgame`)
