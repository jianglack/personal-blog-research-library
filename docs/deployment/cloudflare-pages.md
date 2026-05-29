# Cloudflare Pages Deployment

## Build Settings

- Framework preset: Astro
- Build command: `pnpm build`
- Build output directory: `dist`
- Node.js version: use a version that satisfies `package.json` (`>=22.12.0`)
- Package manager: pnpm

## Repository Flow

1. Push this repository to GitHub.
2. Create a Cloudflare Pages project from the GitHub repository.
3. Set the framework preset to Astro.
4. Set the build command to `pnpm build`.
5. Set the output directory to `dist`.
6. Deploy.

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
6. Cloudflare Pages builds and publishes the static site.

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

Before the first public deployment, replace the placeholder site URL in
`astro-paper.config.ts`:

```ts
site: {
  url: "https://your-domain.pages.dev/",
}
```

Use the final Cloudflare Pages URL or your custom domain. This value controls
canonical URLs, RSS links, Open Graph metadata, and sitemap output.
