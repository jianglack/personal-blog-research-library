# Contributing

This repository is a personal research blog and public Obsidian-style content
vault. It is not maintained as a general-purpose theme project.

## Scope

Useful contributions are limited to:

- fixing broken links, typos, or rendering issues;
- improving project documentation;
- improving the static blog implementation;
- suggesting corrections to published technical content.

Content direction, personal pages, and topic selection are owned by the site
maintainer.

## Local Checks

Before opening a pull request, run:

```powershell
pnpm test
pnpm build
```

Expected result:

- Vitest passes.
- Astro builds successfully.
- Pagefind indexes the generated site.

## Content Changes

Public content lives under `src/content/`.

Do not add private notes, unpublished drafts, large binary files, secrets, access
tokens, or personal data to this repository. Use the templates under
`src/content/templates/` when creating new public Markdown files.

## Deployment

Pushes to `master` are deployed automatically through GitHub Actions and
Cloudflare Pages. Pull requests should keep deployment configuration changes
small and explicit.
