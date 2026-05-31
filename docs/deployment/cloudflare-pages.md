# Cloudflare Pages Deployment

## Build Settings

- Framework preset: Astro
- Build command: `pnpm build`
- Build output directory: `dist`
- Node.js version: use a version that satisfies `package.json` (`>=22.12.0`)
- Package manager: pnpm

## Repository Flow

1. Push this repository to GitHub.
2. Deploy through one of the supported flows below.

### Direct Upload With GitHub Actions

The current production project was created as a Cloudflare Pages Direct Upload
project. Cloudflare does not allow converting a Direct Upload project into a
Git-connected project in place, so the repository uses GitHub Actions to keep the
same Pages project and URL while still deploying automatically on each push to
`master`.

GitHub Actions workflow:

```text
.github/workflows/deploy-cloudflare-pages.yml
```

Required GitHub repository secret:

```text
CLOUDFLARE_API_TOKEN
```

Create the token in Cloudflare with these account-scoped permissions:

```text
Account > Cloudflare Pages > Edit
Account > Account Settings > Read
```

Limit the resource scope to the production account:

```text
be4769c6896b8ef635e984df24c84e8e
```

The workflow builds the site with `pnpm build`, then runs:

```powershell
wrangler pages deploy dist --project-name=personal-blog-research-library --branch=master
```

### Native Cloudflare Git Integration

Cloudflare can also create a Pages project directly from a GitHub repository via
Workers & Pages > Create application > Pages > Import an existing Git repository.
That flow requires the Cloudflare Workers and Pages GitHub App to be installed on
the GitHub account and granted access to the repository.

Use this only if you are willing to create a new Cloudflare Pages project or
replace the current Direct Upload project. The existing Direct Upload project
cannot be switched to Git source in place.

## Static Site Constraints

- No login.
- No comments.
- No backend API.
- No hosted CMS required for the first release.
- Search runs in the browser through Pagefind.
- RSS, sitemap, pages, and search index are generated at build time.

## Content Publishing Flow

1. Write or edit Markdown/MDX under `src/content/`.
2. Keep only publish-ready public content in this repository-backed vault.
3. Run `pnpm test`.
4. Run `pnpm build`.
5. Commit and push.
6. GitHub Actions builds the site and uploads `dist/` to Cloudflare Pages.

## Obsidian Vault Guidance

The first release keeps the public Obsidian-style vault inside the repository:

```text
src/content/
  posts/
  topics/
  series/
  resources/
  assets/
```

Use this folder only for public material. Do not sync a private vault directly into
the repository, because Cloudflare Pages will deploy whatever is committed.

Detailed writing workflow and templates are documented in
`docs/writing/obsidian-workflow.md`.

## Long-Term Free Operation

This site is designed to stay static, so it does not need a rented server. To keep
the project free-friendly over time:

- Avoid large videos or binary downloads in the repository.
- Optimize images before committing them.
- Keep generated output (`dist/`) out of version control.
- Use external storage later for very large media if needed.
- Watch Cloudflare Pages build, file count, and asset size limits as the site grows.

## Pre-Deploy Checklist

Run these commands before pushing a release branch:

```powershell
pnpm test
pnpm build
```

Expected result:

- Vitest passes.
- Astro check passes.
- Astro build completes.
- Pagefind indexes `dist`.
- `dist/rss.xml` exists.
- `dist/sitemap-index.xml` exists.

## Production URL

The production Cloudflare Pages URL is already configured in
`astro-paper.config.ts`:

```ts
site: {
  url: "https://personal-blog-research-library.pages.dev/",
}
```

If a custom domain is added later, update this value to that final public URL.
It controls canonical URLs, RSS links, Open Graph metadata, and sitemap output.
