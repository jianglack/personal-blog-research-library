# Obsidian Writing Workflow

This project treats `src/content/` as the public Obsidian vault for the blog.
Only put publishable material in this vault. Private notes, raw reading notes,
and unfinished drafts should stay outside the repository or inside ignored local
folders such as `src/content/drafts/` and `src/content/inbox/`.

## Open the Vault

In Obsidian, open this folder as a vault:

```text
D:\personal-blog-research-library\src\content
```

The vault maps directly to the Astro content collections:

```text
posts/       Formal articles and long-form notes
topics/      Topic landing pages
series/      Ordered article series
resources/   Papers, books, tools, links, and reference notes
pages/       Static pages such as About
templates/   Obsidian note templates, not published
```

## Daily Writing Flow

1. Create a note from a template in `templates/`.
2. Keep `draft: true` while writing.
3. Link related topics and series through frontmatter slugs.
4. Preview locally with `pnpm dev` when layout matters.
5. Before publishing, set `draft: false`.
6. In Obsidian, press `Ctrl + Shift + G` to run `Git: Commit-and-sync`.
7. GitHub Actions runs tests, builds the site, and deploys to Cloudflare Pages.

## Obsidian Git Semi-Automatic Publishing

This vault uses the Obsidian Git plugin as the normal publishing path. The
plugin is configured for manual sync:

- Automatic commit interval: `0`
- Automatic push interval: `0`
- Automatic pull interval: `0`
- Push on commit-and-sync: enabled
- Pull on commit-and-sync: enabled
- Commit message: `content: sync obsidian notes {{date}}`

That means Obsidian will not publish while you are still writing. When a note is
ready, set `draft: false`, then manually run:

```text
Ctrl + Shift + G
```

If the shortcut does not work, open the command palette with:

```text
Ctrl + Shift + P -> Git: Commit-and-sync
```

The command stages the content changes, creates a commit, pulls remote updates,
and pushes to GitHub. The existing GitHub Actions workflow then handles the
quality gate and deployment.

Use local commands only when you want extra confidence before syncing:

```powershell
cd D:\personal-blog-research-library
pnpm test
pnpm build
```

## Publishing Rules

- Files under `posts/`, `topics/`, `series/`, `resources/`, and `pages/` are
  part of the public publishing system.
- Files with `draft: true` are valid for local work but should not be treated as
  public release content.
- Files under `templates/` are only writing helpers and are not read by Astro.
- Files under `drafts/` and `inbox/` are ignored by Git and should not be used
  as long-term storage unless backed up elsewhere.
- Do not paste API keys, private account data, unpublished personal notes, or
  large binary files into this vault.

## Frontmatter Conventions

Posts require:

```yaml
title: "Title"
date: 2026-05-31
lang: zh
description: "One sentence summary."
tags: []
topics: []
series: []
draft: true
featured: false
```

Use `lang: zh` for Chinese posts and `lang: en` for English posts. Each article
should be written in one language instead of mixing translated versions in the
same file.

Topics and series are referenced by slug, not display title:

```yaml
topics: ["llm-reasoning"]
series: ["llm-notes"]
```

The slug is the file name without `.md`, for example:

```text
topics/llm-reasoning.md -> llm-reasoning
series/llm-notes.md -> llm-notes
```

## Links and Attachments

Markdown links are the safest format:

```markdown
[Tree of Thoughts](/resources/tree-of-thoughts/)
```

Basic Obsidian wiki links are also supported by the site pipeline:

```markdown
[[test-time-compute]]
[[llm-reasoning|LLM reasoning]]
```

For images, prefer repository-relative public assets and keep them small. Avoid
copying screenshots or PDFs directly into posts unless they are essential and
optimized.

## Pre-Publish Checklist

Before pushing a post:

- `title` is final enough to publish.
- `description` is specific and useful in search/RSS.
- `date` is correct.
- `lang` is `zh` or `en`.
- `draft` is `false` only when the note is ready.
- Referenced `topics` and `series` files exist.
- Images and links work in local preview.
- `pnpm test` passes.
- `pnpm build` passes.

## Automatic Deployment

The repository uses GitHub Actions for automatic deployment:

```text
.github/workflows/deploy-cloudflare-pages.yml
```

Any push to `master` runs tests, builds the Astro site, and uploads `dist/` to
Cloudflare Pages. The live site is:

```text
https://louisjiang.pages.dev/
```
