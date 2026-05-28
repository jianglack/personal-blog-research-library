# Personal Blog Research Library Design

Date: 2026-05-28

## Summary

Build a personal technical blog inspired by Lilian Weng's long-form writing style, but organized as a research library. The site will use AstroPaper as the visual and technical baseline, with structured content collections for posts, topics, series, and resources. Content will be written in a dedicated public Obsidian vault and deployed as a fully static site on Cloudflare Pages.

## Goals

- Prioritize deep technical reading and long-term knowledge organization.
- Keep the visual style close to AstroPaper: minimal, engineer-oriented, mostly black, white, and gray.
- Support bilingual content where each article is either Chinese or English, not dual-version by default.
- Use a dedicated public Obsidian vault containing only publish-ready content.
- Preserve a long-term free hosting path through static generation and Cloudflare Pages.
- Include a complete first release: home, posts, topics, series, resources, archive, tags, about, search, and RSS.

## Non-Goals

- No comments.
- No login or user accounts.
- No backend API.
- No admin CMS in the first release.
- No access analytics in the first release.
- No commercial functionality.
- No automatic publishing from a private Obsidian vault.
- No required bilingual pair for each post.

## Architecture

The site will be an Astro static site adapted from AstroPaper.

- Framework: Astro.
- Theme baseline: AstroPaper.
- Content source: dedicated public Obsidian vault.
- Content format: Markdown or MDX with frontmatter.
- Deployment target: Cloudflare Pages.
- Runtime model: fully static HTML, CSS, and client-side JavaScript.
- Development workspace: `D:\personal-blog-research-library`.

Astro will read Markdown content collections at build time and generate static pages, RSS, search index data, and a sitemap. Cloudflare Pages will build the site from the Git repository and serve the static output.

The first implementation should keep the public Obsidian vault content inside the site repository under Astro's content directory to reduce sync complexity. AstroPaper v6 stores posts under `src/content/posts/`, so the research-library collections should follow the same convention. A later version can move the vault outside the repository and use a sync script if needed.

The implementation work should move from the temporary Codex workspace into `D:\personal-blog-research-library`, which becomes the durable local project folder for source code, content, and deployment configuration.

## Figma Frontend Design

Before implementing the Astro frontend, create a Figma design file for the first-release user interface.

The Figma design should cover:

- Homepage.
- Post list.
- Post detail page.
- Topic detail page.
- Series detail page.
- Resources list.
- Search page.
- Mobile navigation and mobile article reading.

The Figma direction should stay close to AstroPaper's original visual style: minimal, engineer-oriented, mostly black, white, and gray. The design should add only the structure needed for the research-library pages, not a decorative marketing-style landing page.

Implementation should use the Figma design as the frontend reference, while still preserving AstroPaper conventions where they already solve the same problem cleanly.

## Content Structure

The public Obsidian vault is organized by content type:

```text
src/content/
  posts/
  topics/
  series/
  resources/
  assets/
```

### Posts

`posts/` contains formal articles and long-form learning notes.

Required frontmatter:

```yaml
title: "Test-Time Compute for Large Language Models"
date: 2026-05-28
lang: zh
description: "A survey of methods, benefits, and limits of test-time compute."
tags: ["LLM", "Reasoning"]
topics: ["llm-reasoning"]
series: ["llm-notes"]
draft: false
```

Required fields:

- `title`
- `date`
- `lang`
- `description`
- `draft`

Optional fields:

- `tags`
- `topics`
- `series`
- `updated`
- `featured`
- `cover`

### Topics

`topics/` contains topic landing pages such as `llm-reasoning.md`, `systems.md`, or `reinforcement-learning.md`. A topic page aggregates related posts, series, and resources.

Each topic should include:

- Title.
- Description.
- Optional reading path.
- Optional key questions.
- Optional related resources.

### Series

`series/` contains sequence-based article groups, such as `llm-notes.md`.

A series page should show ordered posts using an explicit `posts` list in the series frontmatter. This keeps ordering local to the series and avoids scattering sequence data across individual posts.

### Resources

`resources/` contains papers, books, tools, links, and other reference entries. Resources can be linked to topics and tags but do not have to be full articles.

### Assets

`assets/` contains public images and attachments used by posts and pages. Obsidian image paths must resolve to public build paths. Private absolute file paths are not allowed.

## Language Strategy

The site supports Chinese and English content, but each article is written in a single language.

- `lang: zh` for Chinese content.
- `lang: en` for English content.
- The homepage, search, archive, and tags can mix languages.
- Language filters can be added to list pages.
- The first release does not require translated article pairs.

## Pages

The first release includes:

- `/` home.
- `/posts/` post list.
- `/posts/[slug]/` post detail.
- `/topics/` topic list.
- `/topics/[slug]/` topic detail.
- `/series/` series list.
- `/series/[slug]/` series detail.
- `/resources/` resource list.
- `/archives/` chronological archive.
- `/tags/` tag index.
- `/tags/[tag]/` tag detail.
- `/about/` about page.
- `/search/` static search page.
- `/rss.xml` RSS feed.

## Navigation

The main navigation should remain restrained and close to AstroPaper:

```text
Posts | Topics | Series | Resources | Archives | About | Search
```

The navigation should avoid complex dropdowns in the first release. Mobile navigation should be simple and reliable.

## Homepage

The homepage uses a research-library hierarchy while keeping AstroPaper's minimal visual style.

It should include:

- A short site introduction.
- Featured or recent topics.
- Latest posts.
- Recent or highlighted resources.
- Series entry points.

The homepage should not be a personal-brand landing page. Content discovery comes first.

## Article Page

Article pages prioritize long-form reading.

They should include:

- Title.
- Date and optional updated date.
- Language.
- Description.
- Reading time.
- Tags.
- Related topics.
- Related series.
- Table of contents for long posts.
- Code highlighting.
- Math support.
- Correct rendering of images and public assets.

## Search

Search is fully static and runs in the browser.

At build time, the site generates a lightweight search index from:

- Post titles.
- Descriptions.
- Tags.
- Topics.
- Series.
- Resource titles and descriptions.
- Optional body excerpts.

The first version should not require a hosted search service.

## RSS

The site generates `/rss.xml` at build time.

RSS includes:

- Non-draft posts.
- Correct canonical links.
- Titles.
- Dates.
- Descriptions.
- Language metadata if supported by the generator.

Language-specific feeds, such as `/rss.zh.xml` and `/rss.en.xml`, are optional later enhancements.

## Obsidian Compatibility

The first release should support:

- Standard Markdown.
- Frontmatter.
- Code fences.
- Math notation.
- Relative images from `src/content/assets/`.
- Basic Obsidian wiki links.

Wiki link behavior:

- If `[[name]]` resolves to a known post, topic, series, or resource, render it as an internal link.
- If it does not resolve, render it as readable text or a non-breaking fallback link.

Obsidian callouts can be mapped to Astro styles if the selected Markdown pipeline supports them cleanly. If not, callout support can be added after the core site is stable.

## Validation

Build-time validation should catch content errors early.

Validation rules:

- Posts must include required frontmatter.
- `lang` must be `zh` or `en`.
- Draft posts must not appear in public lists, RSS, search, or sitemap.
- Referenced topics must exist.
- Referenced series must exist.
- Asset paths must resolve.
- Series pages must declare an explicit ordered `posts` list, and each listed post must exist.

Invalid content should fail the build or produce a clear actionable error.

## Deployment

Cloudflare Pages is the deployment target.

Expected deployment flow:

1. Push repository to Git.
2. Cloudflare Pages builds the Astro site.
3. Cloudflare Pages serves static output.

This keeps the site free-friendly and avoids running a server.

GitHub Pages remains a possible fallback if `username.github.io` is more important than Cloudflare Pages' larger static hosting limits.

## Testing

Verification should include:

- Content schema validation.
- Page generation for posts, topics, series, resources, archive, tags, about, search, and RSS.
- Search finds titles, descriptions, tags, and topics.
- RSS contains only non-draft posts.
- Obsidian images, code blocks, math, and basic wiki links render correctly.
- Desktop and mobile article pages are readable with no layout overlap.
- Cloudflare Pages build command succeeds.

## Risks and Mitigations

### AstroPaper Customization Drift

AstroPaper may not expose every structure needed for a research library.

Mitigation: keep custom changes isolated in content collections, route pages, and small components instead of deeply rewriting theme internals.

### Obsidian Syntax Differences

Obsidian wiki links, callouts, and image paths may not map directly to Astro.

Mitigation: define a small supported syntax subset for the first release and validate paths at build time.

### Content Model Becoming Too Heavy

The site includes many first-release pages.

Mitigation: build around one simple source of truth: posts, topics, series, and resources. Avoid extra dynamic behavior until the static flow is stable.

### Free Hosting Limits

Cloudflare Pages is strong for large static sites, but still has limits such as build count, file count, and single-file size.

Mitigation: keep large media outside the core repository if needed later, optimize images, and avoid serving video or large binary files directly from the site.

## Implementation Choices

- Use the current AstroPaper starter as the baseline.
- Use AstroPaper's built-in static search direction if it remains compatible with the customization; otherwise use Pagefind.
- Use `remark-math` and `rehype-katex` or the AstroPaper-supported equivalent for math rendering.
- Use a small remark plugin for Obsidian wiki link transformation.
- Store series order in each series document's frontmatter as an explicit `posts` slug list.
