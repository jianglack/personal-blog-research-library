# Personal Blog Research Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully static AstroPaper-based research-library blog sourced from a public Obsidian-style content folder and prepared for Cloudflare Pages.

**Architecture:** Start from the AstroPaper v6 template, keep its minimal reading experience, and add structured research-library collections for posts, topics, series, and resources. Figma design comes first and defines the page layout reference; implementation then adapts AstroPaper routes, utilities, and content schemas while preserving static search, RSS, accessibility, and responsive behavior.

**Tech Stack:** Astro, AstroPaper, TypeScript, Tailwind CSS, Markdown/MDX, Astro content collections, Pagefind, RSS, Vitest, Figma, Cloudflare Pages.

---

## Sources

- Spec: `D:\personal-blog-research-library\docs\superpowers\specs\2026-05-28-personal-blog-research-library-design.md`
- AstroPaper baseline: `pnpm create astro@latest --template satnaing/astro-paper`
- Target project directory: `D:\personal-blog-research-library`

## Scope Check

This is one project with two sequential deliverables:

1. Figma frontend design for the first-release static site.
2. AstroPaper implementation matching that design.

The Figma work is not independent of the implementation because it defines the page layouts the Astro work must follow. Keep it in this plan as Task 1.

## Planned File Structure

The implementation should create or modify these files in `D:\personal-blog-research-library`:

```text
D:\personal-blog-research-library\
  docs\
    design\
      frontend-design-brief.md
    deployment\
      cloudflare-pages.md
    superpowers\
      specs\
        2026-05-28-personal-blog-research-library-design.md
      plans\
        2026-05-28-personal-blog-research-library-implementation.md
  src\
    components\
      ContentList.astro
      ResearchCard.astro
      TopicPillList.astro
    content\
      posts\
        test-time-compute.md
      topics\
        llm-reasoning.md
        systems.md
      series\
        llm-notes.md
      resources\
        tree-of-thoughts.md
      assets\
    layouts\
      ResearchLibraryLayout.astro
    pages\
      archives\
        index.astro
      resources\
        index.astro
        [slug].astro
      series\
        index.astro
        [slug].astro
      tags\
        index.astro
        [tag].astro
      topics\
        index.astro
        [slug].astro
    utils\
      obsidianLinks.test.ts
      obsidianLinks.ts
      researchLibrary.test.ts
      researchLibrary.ts
  astro.config.ts
  astro-paper.config.ts
  package.json
  src\content.config.ts
```

Existing AstroPaper files should remain in place unless a task explicitly changes them.

---

### Task 1: Figma Frontend Design

**Files:**
- Create: `D:\personal-blog-research-library\docs\design\frontend-design-brief.md`
- External: Figma design file named `Personal Blog Research Library`

- [ ] **Step 1: Initialize the project repository**

Run:

```powershell
Set-Location D:\personal-blog-research-library
git init
git add docs\superpowers
git commit -m "docs: add project specification and plan"
```

Expected: initial commit succeeds with the existing spec and implementation plan.

- [ ] **Step 2: Create the design brief file**

Create `docs/design/frontend-design-brief.md` with this content:

```markdown
# Frontend Design Brief

## Product Direction

The site is a personal technical research library. Content discovery and long-form reading are more important than personal branding.

## Visual Direction

- Baseline: AstroPaper original style.
- Palette: mostly black, white, and gray.
- Tone: minimal, engineer-oriented, readable, restrained.
- Avoid: decorative landing-page hero sections, heavy cards, marketing visuals, comments, login UI, dashboards.

## Required Figma Frames

- Desktop / Home / 1440x1100
- Desktop / Posts / 1440x1100
- Desktop / Post Detail / 1440x1600
- Desktop / Topic Detail / 1440x1300
- Desktop / Series Detail / 1440x1300
- Desktop / Resources / 1440x1100
- Desktop / Search / 1440x1100
- Mobile / Home / 390x1200
- Mobile / Post Detail / 390x1600
- Mobile / Navigation / 390x844

## Required Components

- Site header
- Mobile menu
- Content list item
- Research card
- Topic pill
- Tag link
- Table of contents
- Search result row
- Resource row

## Navigation

Posts | Topics | Series | Resources | Archives | About | Search

## Acceptance Criteria

- Desktop and mobile layouts are present.
- Article reading width is comfortable and not card-framed.
- Homepage prioritizes topics, recent posts, resources, and series.
- No UI element requires server-side state.
- Visual style remains close to AstroPaper.
```

- [ ] **Step 3: Create the Figma file**

Use the Figma tool to create a design file named `Personal Blog Research Library`.

Expected Figma structure:

```text
Page: Design System
  Frame: Typography
  Frame: Colors
  Frame: Components

Page: Desktop
  Frame: Desktop / Home / 1440x1100
  Frame: Desktop / Posts / 1440x1100
  Frame: Desktop / Post Detail / 1440x1600
  Frame: Desktop / Topic Detail / 1440x1300
  Frame: Desktop / Series Detail / 1440x1300
  Frame: Desktop / Resources / 1440x1100
  Frame: Desktop / Search / 1440x1100

Page: Mobile
  Frame: Mobile / Home / 390x1200
  Frame: Mobile / Post Detail / 390x1600
  Frame: Mobile / Navigation / 390x844
```

- [ ] **Step 4: Review Figma against the brief**

Check these items manually in Figma:

```text
Home shows intro, featured topics, latest posts, recent resources, and series.
Post detail shows title, metadata, tags, related topic/series links, table of contents, and readable body.
Topic detail shows topic description, reading path, related posts, series, and resources.
Series detail shows ordered posts.
Resources page shows resource type, title, description, topics, tags, and external link target.
Mobile navigation is simple and does not use multi-level dropdowns.
```

- [ ] **Step 5: Commit the design brief**

Run:

```powershell
git add docs\design\frontend-design-brief.md
git commit -m "docs: add frontend design brief"
```

Expected: commit succeeds.

---

### Task 2: Scaffold AstroPaper in the D Drive Project

**Files:**
- Modify: `D:\personal-blog-research-library\package.json`
- Modify: `D:\personal-blog-research-library\astro.config.ts`
- Modify: `D:\personal-blog-research-library\astro-paper.config.ts`
- Modify: `D:\personal-blog-research-library\src\content.config.ts`

- [ ] **Step 1: Scaffold AstroPaper**

Run from `D:\personal-blog-research-library`:

```powershell
pnpm create astro@latest . --template satnaing/astro-paper
```

When prompted:

```text
How would you like to start your new project? Use template files
Install dependencies? Yes
Initialize a new git repository? No
```

Expected: AstroPaper files are created in the existing project directory without deleting `docs/`.

- [ ] **Step 2: Install test dependencies**

Run:

```powershell
pnpm add -D vitest @vitest/ui
```

Expected: `package.json` gains `vitest` dev dependencies.

- [ ] **Step 3: Add test scripts**

Modify `package.json` scripts to include:

```json
{
  "scripts": {
    "dev": "astro dev",
    "start": "astro dev",
    "build": "astro check && astro build && pagefind --site dist",
    "preview": "astro preview",
    "sync": "astro sync",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

Preserve any additional AstroPaper scripts that already exist.

- [ ] **Step 4: Verify the baseline**

Run:

```powershell
pnpm test
pnpm build
```

Expected: Vitest exits without failures and `pnpm build` completes successfully, writing `dist/`.

- [ ] **Step 5: Commit the scaffold**

Run:

```powershell
git add .
git commit -m "chore: scaffold AstroPaper site"
```

Expected: commit succeeds.

---

### Task 3: Add Research Library Utilities with Tests

**Files:**
- Create: `D:\personal-blog-research-library\src\utils\researchLibrary.test.ts`
- Create: `D:\personal-blog-research-library\src\utils\researchLibrary.ts`

- [ ] **Step 1: Write failing tests**

Create `src/utils/researchLibrary.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  assertKnownReferences,
  filterPublicEntries,
  getSeriesEntries,
  sortByDateDesc,
} from "./researchLibrary";

const entries = [
  {
    id: "older",
    data: { title: "Older", date: new Date("2026-01-01"), draft: false },
  },
  {
    id: "draft",
    data: { title: "Draft", date: new Date("2026-05-01"), draft: true },
  },
  {
    id: "newer",
    data: { title: "Newer", date: new Date("2026-05-28"), draft: false },
  },
];

describe("research library utilities", () => {
  it("filters draft entries", () => {
    expect(filterPublicEntries(entries).map(entry => entry.id)).toEqual([
      "older",
      "newer",
    ]);
  });

  it("sorts entries by date descending", () => {
    expect(sortByDateDesc(filterPublicEntries(entries)).map(entry => entry.id)).toEqual([
      "newer",
      "older",
    ]);
  });

  it("returns series entries in explicit order", () => {
    const ordered = getSeriesEntries(["newer", "older"], entries);
    expect(ordered.map(entry => entry.id)).toEqual(["newer", "older"]);
  });

  it("throws when a series references a missing post", () => {
    expect(() => getSeriesEntries(["missing"], entries)).toThrow(
      "Series references missing post: missing"
    );
  });

  it("throws when an entry references an unknown topic", () => {
    expect(() =>
      assertKnownReferences({
        entryId: "post-a",
        fieldName: "topics",
        referencedSlugs: ["llm-reasoning", "missing-topic"],
        knownSlugs: ["llm-reasoning"],
      })
    ).toThrow("post-a references unknown topics: missing-topic");
  });
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```powershell
pnpm test src\utils\researchLibrary.test.ts
```

Expected: FAIL because `src/utils/researchLibrary.ts` does not exist.

- [ ] **Step 3: Implement utilities**

Create `src/utils/researchLibrary.ts`:

```ts
type EntryWithDraft = {
  id: string;
  data: {
    draft?: boolean;
    date?: Date;
  };
};

export function filterPublicEntries<T extends EntryWithDraft>(entries: T[]): T[] {
  return entries.filter(entry => entry.data.draft !== true);
}

export function sortByDateDesc<T extends EntryWithDraft>(entries: T[]): T[] {
  return [...entries].sort((a, b) => {
    const left = a.data.date?.getTime() ?? 0;
    const right = b.data.date?.getTime() ?? 0;
    return right - left;
  });
}

export function getSeriesEntries<T extends { id: string }>(
  orderedPostIds: string[],
  entries: T[]
): T[] {
  const byId = new Map(entries.map(entry => [entry.id, entry]));

  return orderedPostIds.map(postId => {
    const entry = byId.get(postId);
    if (!entry) {
      throw new Error(`Series references missing post: ${postId}`);
    }
    return entry;
  });
}

export function assertKnownReferences({
  entryId,
  fieldName,
  referencedSlugs,
  knownSlugs,
}: {
  entryId: string;
  fieldName: string;
  referencedSlugs: string[];
  knownSlugs: string[];
}): void {
  const known = new Set(knownSlugs);
  const missing = referencedSlugs.filter(slug => !known.has(slug));

  if (missing.length > 0) {
    throw new Error(
      `${entryId} references unknown ${fieldName}: ${missing.join(", ")}`
    );
  }
}
```

- [ ] **Step 4: Verify tests pass**

Run:

```powershell
pnpm test src\utils\researchLibrary.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit utilities**

Run:

```powershell
git add src\utils\researchLibrary.ts src\utils\researchLibrary.test.ts
git commit -m "feat: add research library utilities"
```

Expected: commit succeeds.

---

### Task 4: Define Content Collections and Seed Content

**Files:**
- Modify: `D:\personal-blog-research-library\src\content.config.ts`
- Create: `D:\personal-blog-research-library\src\content\posts\test-time-compute.md`
- Create: `D:\personal-blog-research-library\src\content\topics\llm-reasoning.md`
- Create: `D:\personal-blog-research-library\src\content\topics\systems.md`
- Create: `D:\personal-blog-research-library\src\content\series\llm-notes.md`
- Create: `D:\personal-blog-research-library\src\content\resources\tree-of-thoughts.md`

- [ ] **Step 1: Replace content config with research-library collections**

Replace `src/content.config.ts` with this file so it exports post, page, topic, series, and resource collections:

```ts
import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

const langSchema = z.enum(["zh", "en"]);

const posts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    lang: langSchema,
    description: z.string(),
    tags: z.array(z.string()).default([]),
    topics: z.array(z.string()).default([]),
    series: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    cover: z.string().optional(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const topics = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/topics" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    lang: langSchema.default("en"),
    featured: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    readingPath: z.array(z.string()).default([]),
    keyQuestions: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const series = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/series" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    lang: langSchema.default("en"),
    posts: z.array(z.string()).default([]),
    topics: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const resources = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/resources" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    lang: langSchema.default("en"),
    type: z.enum(["paper", "book", "tool", "link", "note"]),
    url: z.string().url().optional(),
    topics: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    date: z.coerce.date().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  posts,
  pages,
  topics,
  series,
  resources,
};
```

- [ ] **Step 2: Add seed topic content**

Create `src/content/topics/llm-reasoning.md`:

```markdown
---
title: "LLM Reasoning"
description: "Notes on reasoning, search, verification, and test-time compute for language models."
lang: en
featured: true
tags: ["LLM", "Reasoning"]
readingPath:
  - "Start with test-time compute."
  - "Compare sampling, search, and verifier-based methods."
  - "Track open questions around cost and reliability."
keyQuestions:
  - "When does more inference-time compute improve answer quality?"
  - "How should reasoning traces be evaluated?"
draft: false
---

This topic collects long-form notes and resources about language model reasoning.
```

Create `src/content/topics/systems.md`:

```markdown
---
title: "Systems"
description: "Engineering notes on inference, performance, tooling, and static publishing systems."
lang: en
featured: true
tags: ["Systems", "Engineering"]
readingPath:
  - "Understand the shape of the system."
  - "Measure constraints before optimizing."
keyQuestions:
  - "Where does complexity enter the system?"
draft: false
---

This topic collects practical systems and engineering notes.
```

- [ ] **Step 3: Add seed post content**

Create `src/content/posts/test-time-compute.md`:

```markdown
---
title: "Test-Time Compute for Large Language Models"
date: 2026-05-28
lang: en
description: "A structured note on methods, benefits, and limits of test-time compute."
tags: ["LLM", "Reasoning"]
topics: ["llm-reasoning"]
series: ["llm-notes"]
draft: false
featured: true
---

## Summary

Test-time compute describes techniques that spend more inference-time work to improve model outputs.

## Methods

- Sampling more candidates.
- Searching over reasoning paths.
- Verifying candidate answers.

## Open Questions

- When does extra compute stop helping?
- How should reasoning quality be measured?
- What is the right tradeoff between latency and reliability?
```

- [ ] **Step 4: Add seed series content**

Create `src/content/series/llm-notes.md`:

```markdown
---
title: "LLM Notes"
description: "A sequence of long-form notes about language models, reasoning, and systems."
lang: en
posts:
  - "test-time-compute"
topics:
  - "llm-reasoning"
draft: false
---

This series collects notes that build a working understanding of modern language models.
```

- [ ] **Step 5: Add seed resource content**

Create `src/content/resources/tree-of-thoughts.md`:

```markdown
---
title: "Tree of Thoughts"
description: "A paper and method family for deliberate problem solving with language models."
lang: en
type: "paper"
url: "https://arxiv.org/abs/2305.10601"
topics: ["llm-reasoning"]
tags: ["LLM", "Reasoning", "Search"]
date: 2023-05-17
draft: false
---

Tree of Thoughts is a useful reference for search-style reasoning with language models.
```

- [ ] **Step 6: Verify content schema**

Run:

```powershell
pnpm astro sync
pnpm build
```

Expected: both commands pass.

- [ ] **Step 7: Commit content model**

Run:

```powershell
git add src\content.config.ts src\content
git commit -m "feat: add research library content model"
```

Expected: commit succeeds.

---

### Task 5: Add Research Library Pages and Components

**Files:**
- Create: `D:\personal-blog-research-library\src\components\ContentList.astro`
- Create: `D:\personal-blog-research-library\src\components\ResearchCard.astro`
- Create: `D:\personal-blog-research-library\src\components\TopicPillList.astro`
- Create: `D:\personal-blog-research-library\src\layouts\ResearchLibraryLayout.astro`
- Create: `D:\personal-blog-research-library\src\pages\topics\index.astro`
- Create: `D:\personal-blog-research-library\src\pages\topics\[slug].astro`
- Create: `D:\personal-blog-research-library\src\pages\series\index.astro`
- Create: `D:\personal-blog-research-library\src\pages\series\[slug].astro`
- Create: `D:\personal-blog-research-library\src\pages\resources\index.astro`
- Create: `D:\personal-blog-research-library\src\pages\resources\[slug].astro`
- Create: `D:\personal-blog-research-library\src\pages\archives\index.astro`
- Create: `D:\personal-blog-research-library\src\pages\tags\index.astro`
- Create: `D:\personal-blog-research-library\src\pages\tags\[tag].astro`

- [ ] **Step 1: Create shared card component**

Create `src/components/ResearchCard.astro`:

```astro
---
interface Props {
  href: string;
  title: string;
  description: string;
  meta?: string;
}

const { href, title, description, meta } = Astro.props;
---

<article class="border-b border-skin-line py-4">
  <a class="inline-block text-lg font-semibold underline-offset-4 hover:underline" href={href}>
    {title}
  </a>
  <p class="mt-1 text-sm text-skin-base">{description}</p>
  {meta && <p class="mt-2 text-xs opacity-75">{meta}</p>}
</article>
```

- [ ] **Step 2: Create content list component**

Create `src/components/ContentList.astro`:

```astro
---
import ResearchCard from "./ResearchCard.astro";

interface Item {
  href: string;
  title: string;
  description: string;
  meta?: string;
}

interface Props {
  items: Item[];
  emptyText?: string;
}

const { items, emptyText = "No entries yet." } = Astro.props;
---

{
  items.length > 0 ? (
    <div class="divide-y divide-skin-line">
      {items.map(item => <ResearchCard {...item} />)}
    </div>
  ) : (
    <p class="text-sm opacity-75">{emptyText}</p>
  )
}
```

- [ ] **Step 3: Create topic pill component**

Create `src/components/TopicPillList.astro`:

```astro
---
interface Props {
  topics: string[];
}

const { topics } = Astro.props;
---

{
  topics.length > 0 && (
    <ul class="flex flex-wrap gap-2">
      {topics.map(topic => (
        <li>
          <a
            class="rounded border border-skin-line px-2 py-1 text-xs hover:bg-skin-card"
            href={`/topics/${topic}/`}
          >
            {topic}
          </a>
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 4: Create research library layout wrapper**

Create `src/layouts/ResearchLibraryLayout.astro`:

```astro
---
import Layout from "./Layout.astro";

interface Props {
  title: string;
  description?: string;
}

const { title, description } = Astro.props;
---

<Layout title={title} description={description}>
  <main id="main-content" class="mx-auto max-w-3xl px-4 py-8">
    <header class="mb-8">
      <h1 class="text-3xl font-bold">{title}</h1>
      {description && <p class="mt-2 text-skin-base opacity-80">{description}</p>}
    </header>
    <slot />
  </main>
</Layout>
```

This wrapper assumes the AstroPaper base layout is `src/layouts/Layout.astro`.

- [ ] **Step 5: Add topic list page**

Create `src/pages/topics/index.astro`:

```astro
---
import { getCollection } from "astro:content";
import ContentList from "../../components/ContentList.astro";
import ResearchLibraryLayout from "../../layouts/ResearchLibraryLayout.astro";
import { filterPublicEntries } from "../../utils/researchLibrary";

const topics = filterPublicEntries(await getCollection("topics")).map(topic => ({
  href: `/topics/${topic.id}/`,
  title: topic.data.title,
  description: topic.data.description,
  meta: topic.data.tags.join(" / "),
}));
---

<ResearchLibraryLayout title="Topics" description="Long-running research areas and learning paths.">
  <ContentList items={topics} emptyText="No topics yet." />
</ResearchLibraryLayout>
```

- [ ] **Step 6: Add topic detail page**

Create `src/pages/topics/[slug].astro`:

```astro
---
import { getCollection } from "astro:content";
import ContentList from "../../components/ContentList.astro";
import ResearchLibraryLayout from "../../layouts/ResearchLibraryLayout.astro";
import { filterPublicEntries, sortByDateDesc } from "../../utils/researchLibrary";

export async function getStaticPaths() {
  const topics = filterPublicEntries(await getCollection("topics"));
  return topics.map(topic => ({ params: { slug: topic.id }, props: { topic } }));
}

const { topic } = Astro.props;
const posts = sortByDateDesc(filterPublicEntries(await getCollection("posts")))
  .filter(post => post.data.topics.includes(topic.id))
  .map(post => ({
    href: `/posts/${post.id}/`,
    title: post.data.title,
    description: post.data.description,
    meta: post.data.tags.join(" / "),
  }));

const resources = filterPublicEntries(await getCollection("resources"))
  .filter(resource => resource.data.topics.includes(topic.id))
  .map(resource => ({
    href: `/resources/${resource.id}/`,
    title: resource.data.title,
    description: resource.data.description,
    meta: resource.data.type,
  }));
---

<ResearchLibraryLayout title={topic.data.title} description={topic.data.description}>
  {topic.data.readingPath.length > 0 && (
    <section class="mb-8">
      <h2 class="mb-3 text-xl font-semibold">Reading Path</h2>
      <ol class="list-decimal space-y-2 pl-5">
        {topic.data.readingPath.map(item => <li>{item}</li>)}
      </ol>
    </section>
  )}

  <section class="mb-8">
    <h2 class="mb-3 text-xl font-semibold">Posts</h2>
    <ContentList items={posts} emptyText="No posts for this topic yet." />
  </section>

  <section>
    <h2 class="mb-3 text-xl font-semibold">Resources</h2>
    <ContentList items={resources} emptyText="No resources for this topic yet." />
  </section>
</ResearchLibraryLayout>
```

- [ ] **Step 7: Add series list page**

Create `src/pages/series/index.astro`:

```astro
---
import { getCollection } from "astro:content";
import ContentList from "../../components/ContentList.astro";
import ResearchLibraryLayout from "../../layouts/ResearchLibraryLayout.astro";
import { filterPublicEntries } from "../../utils/researchLibrary";

const series = filterPublicEntries(await getCollection("series")).map(item => ({
  href: `/series/${item.id}/`,
  title: item.data.title,
  description: item.data.description,
  meta: `${item.data.posts.length} posts`,
}));
---

<ResearchLibraryLayout title="Series" description="Ordered learning paths and long-form note sequences.">
  <ContentList items={series} emptyText="No series yet." />
</ResearchLibraryLayout>
```

- [ ] **Step 8: Add series detail page**

Create `src/pages/series/[slug].astro`:

```astro
---
import { getCollection } from "astro:content";
import ContentList from "../../components/ContentList.astro";
import ResearchLibraryLayout from "../../layouts/ResearchLibraryLayout.astro";
import { filterPublicEntries, getSeriesEntries } from "../../utils/researchLibrary";

export async function getStaticPaths() {
  const series = filterPublicEntries(await getCollection("series"));
  return series.map(item => ({ params: { slug: item.id }, props: { item } }));
}

const { item } = Astro.props;
const posts = filterPublicEntries(await getCollection("posts"));
const orderedPosts = getSeriesEntries(item.data.posts, posts).map(post => ({
  href: `/posts/${post.id}/`,
  title: post.data.title,
  description: post.data.description,
  meta: post.data.tags.join(" / "),
}));
---

<ResearchLibraryLayout title={item.data.title} description={item.data.description}>
  <ContentList items={orderedPosts} emptyText="No posts in this series yet." />
</ResearchLibraryLayout>
```

- [ ] **Step 9: Add resources list page**

Create `src/pages/resources/index.astro`:

```astro
---
import { getCollection } from "astro:content";
import ContentList from "../../components/ContentList.astro";
import ResearchLibraryLayout from "../../layouts/ResearchLibraryLayout.astro";
import { filterPublicEntries } from "../../utils/researchLibrary";

const resources = filterPublicEntries(await getCollection("resources")).map(resource => ({
  href: `/resources/${resource.id}/`,
  title: resource.data.title,
  description: resource.data.description,
  meta: `${resource.data.type}${resource.data.tags.length ? ` / ${resource.data.tags.join(" / ")}` : ""}`,
}));
---

<ResearchLibraryLayout title="Resources" description="Papers, books, tools, links, and reference notes.">
  <ContentList items={resources} emptyText="No resources yet." />
</ResearchLibraryLayout>
```

- [ ] **Step 10: Add resource detail page**

Create `src/pages/resources/[slug].astro`:

```astro
---
import { getCollection, render } from "astro:content";
import ResearchLibraryLayout from "../../layouts/ResearchLibraryLayout.astro";
import TopicPillList from "../../components/TopicPillList.astro";
import { filterPublicEntries } from "../../utils/researchLibrary";

export async function getStaticPaths() {
  const resources = filterPublicEntries(await getCollection("resources"));
  return resources.map(resource => ({
    params: { slug: resource.id },
    props: { resource },
  }));
}

const { resource } = Astro.props;
const { Content } = await render(resource);
---

<ResearchLibraryLayout title={resource.data.title} description={resource.data.description}>
  <div class="mb-6 space-y-3 text-sm">
    <p>Type: {resource.data.type}</p>
    {resource.data.url && (
      <p>
        Source: <a class="underline" href={resource.data.url}>{resource.data.url}</a>
      </p>
    )}
    <TopicPillList topics={resource.data.topics} />
  </div>
  <article class="prose prose-skin max-w-none">
    <Content />
  </article>
</ResearchLibraryLayout>
```

- [ ] **Step 11: Add archive page**

Create `src/pages/archives/index.astro`:

```astro
---
import { getCollection } from "astro:content";
import ResearchLibraryLayout from "../../layouts/ResearchLibraryLayout.astro";
import { filterPublicEntries, sortByDateDesc } from "../../utils/researchLibrary";

const posts = sortByDateDesc(filterPublicEntries(await getCollection("posts")));
const postsByYear = posts.reduce<Record<string, typeof posts>>((groups, post) => {
  const year = String(post.data.date.getFullYear());
  groups[year] = groups[year] ?? [];
  groups[year].push(post);
  return groups;
}, {});
---

<ResearchLibraryLayout title="Archives" description="Posts grouped by publication year.">
  <div class="space-y-8">
    {Object.entries(postsByYear).map(([year, yearPosts]) => (
      <section>
        <h2 class="mb-3 text-xl font-semibold">{year}</h2>
        <ul class="space-y-2">
          {yearPosts.map(post => (
            <li>
              <a class="underline-offset-4 hover:underline" href={`/posts/${post.id}/`}>
                {post.data.title}
              </a>
            </li>
          ))}
        </ul>
      </section>
    ))}
  </div>
</ResearchLibraryLayout>
```

- [ ] **Step 12: Add tag index page**

Create `src/pages/tags/index.astro`:

```astro
---
import { getCollection } from "astro:content";
import ResearchLibraryLayout from "../../layouts/ResearchLibraryLayout.astro";
import { filterPublicEntries } from "../../utils/researchLibrary";

const posts = filterPublicEntries(await getCollection("posts"));
const resources = filterPublicEntries(await getCollection("resources"));
const tags = Array.from(
  new Set([
    ...posts.flatMap(post => post.data.tags),
    ...resources.flatMap(resource => resource.data.tags),
  ])
).sort((a, b) => a.localeCompare(b));
---

<ResearchLibraryLayout title="Tags" description="Browse posts and resources by tag.">
  <ul class="flex flex-wrap gap-2">
    {tags.map(tag => (
      <li>
        <a class="rounded border border-skin-line px-2 py-1 text-sm hover:bg-skin-card" href={`/tags/${encodeURIComponent(tag)}/`}>
          {tag}
        </a>
      </li>
    ))}
  </ul>
</ResearchLibraryLayout>
```

- [ ] **Step 13: Add tag detail page**

Create `src/pages/tags/[tag].astro`:

```astro
---
import { getCollection } from "astro:content";
import ContentList from "../../components/ContentList.astro";
import ResearchLibraryLayout from "../../layouts/ResearchLibraryLayout.astro";
import { filterPublicEntries, sortByDateDesc } from "../../utils/researchLibrary";

export async function getStaticPaths() {
  const posts = filterPublicEntries(await getCollection("posts"));
  const resources = filterPublicEntries(await getCollection("resources"));
  const tags = Array.from(
    new Set([
      ...posts.flatMap(post => post.data.tags),
      ...resources.flatMap(resource => resource.data.tags),
    ])
  );

  return tags.map(tag => ({ params: { tag: encodeURIComponent(tag) }, props: { tag } }));
}

const { tag } = Astro.props;
const posts = sortByDateDesc(filterPublicEntries(await getCollection("posts")))
  .filter(post => post.data.tags.includes(tag))
  .map(post => ({
    href: `/posts/${post.id}/`,
    title: post.data.title,
    description: post.data.description,
    meta: "Post",
  }));

const resources = filterPublicEntries(await getCollection("resources"))
  .filter(resource => resource.data.tags.includes(tag))
  .map(resource => ({
    href: `/resources/${resource.id}/`,
    title: resource.data.title,
    description: resource.data.description,
    meta: `Resource / ${resource.data.type}`,
  }));
---

<ResearchLibraryLayout title={`Tag: ${tag}`} description="Posts and resources with this tag.">
  <section class="mb-8">
    <h2 class="mb-3 text-xl font-semibold">Posts</h2>
    <ContentList items={posts} emptyText="No posts for this tag." />
  </section>
  <section>
    <h2 class="mb-3 text-xl font-semibold">Resources</h2>
    <ContentList items={resources} emptyText="No resources for this tag." />
  </section>
</ResearchLibraryLayout>
```

- [ ] **Step 14: Verify pages build**

Run:

```powershell
pnpm build
```

Expected: build succeeds and generated routes include `topics`, `series`, `resources`, `archives`, and `tags`.

- [ ] **Step 15: Commit pages**

Run:

```powershell
git add src\components src\layouts\ResearchLibraryLayout.astro src\pages
git commit -m "feat: add research library pages"
```

Expected: commit succeeds.

---

### Task 6: Add Obsidian Wiki Link Support

**Files:**
- Create: `D:\personal-blog-research-library\src\utils\obsidianLinks.test.ts`
- Create: `D:\personal-blog-research-library\src\utils\obsidianLinks.ts`
- Modify: `D:\personal-blog-research-library\astro.config.ts`

- [ ] **Step 1: Write failing tests**

Create `src/utils/obsidianLinks.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { transformWikiLinks } from "./obsidianLinks";

describe("transformWikiLinks", () => {
  it("converts known wiki links to markdown links", () => {
    expect(
      transformWikiLinks("Read [[llm-reasoning]].", {
        "llm-reasoning": "/topics/llm-reasoning/",
      })
    ).toBe("Read [llm-reasoning](/topics/llm-reasoning/).");
  });

  it("uses aliases when provided", () => {
    expect(
      transformWikiLinks("Read [[llm-reasoning|LLM reasoning]].", {
        "llm-reasoning": "/topics/llm-reasoning/",
      })
    ).toBe("Read [LLM reasoning](/topics/llm-reasoning/).");
  });

  it("keeps missing wiki links readable", () => {
    expect(transformWikiLinks("Read [[missing-note]].", {})).toBe(
      "Read missing-note."
    );
  });
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```powershell
pnpm test src\utils\obsidianLinks.test.ts
```

Expected: FAIL because `obsidianLinks.ts` does not exist.

- [ ] **Step 3: Implement wiki link helper**

Create `src/utils/obsidianLinks.ts`:

```ts
export function transformWikiLinks(
  markdown: string,
  knownLinks: Record<string, string>
): string {
  return markdown.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, target, alias) => {
    const slug = String(target).trim();
    const label = String(alias || target).trim();
    const href = knownLinks[slug];

    if (!href) {
      return label;
    }

    return `[${label}](${href})`;
  });
}
```

- [ ] **Step 4: Verify tests pass**

Run:

```powershell
pnpm test src\utils\obsidianLinks.test.ts
```

Expected: PASS.

- [ ] **Step 5: Add remark integration**

Modify `astro.config.ts` to add math Markdown processing. Keep existing AstroPaper integrations and add this `markdown` property inside the exported `defineConfig` object:

```ts
import { defineConfig } from "astro/config";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
});
```

- [ ] **Step 6: Install math packages**

Run:

```powershell
pnpm add remark-math rehype-katex katex
```

Expected: packages install and `pnpm-lock.yaml` updates.

- [ ] **Step 7: Verify build**

Run:

```powershell
pnpm test src\utils\obsidianLinks.test.ts
pnpm build
```

Expected: tests and build pass.

- [ ] **Step 8: Commit Obsidian support**

Run:

```powershell
git add astro.config.ts package.json pnpm-lock.yaml src\utils\obsidianLinks.ts src\utils\obsidianLinks.test.ts
git commit -m "feat: add Obsidian link and math support"
```

Expected: commit succeeds.

---

### Task 7: Configure Site Metadata, Navigation, Search, and RSS

**Files:**
- Modify: `D:\personal-blog-research-library\astro-paper.config.ts`
- Modify: `D:\personal-blog-research-library\src\config.ts`
- Modify: `D:\personal-blog-research-library\src\pages\index.astro`

- [ ] **Step 1: Update AstroPaper root config**

Replace `astro-paper.config.ts` with this config:

```ts
import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://example.pages.dev/",
    title: "Research Notes",
    description: "Long-form technical notes, topics, series, and resources.",
    author: "Research Notes",
    profile: "https://example.pages.dev/",
    ogImage: "default-og.jpg",
    lang: "en",
    timezone: "Asia/Shanghai",
    dir: "ltr",
  },
  posts: {
    perPage: 8,
    perIndex: 6,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: true,
    showBackButton: true,
    editPost: {
      enabled: false,
      url: "",
    },
    search: "pagefind",
  },
  socials: [],
  shareLinks: [
    { name: "mail", url: "mailto:?subject=See%20this%20post&body=" },
  ],
});
```

- [ ] **Step 2: Update legacy site config**

Replace `src/config.ts` with this config:

```ts
export const SITE = {
  website: "https://example.pages.dev/",
  author: "Research Notes",
  profile: "https://example.pages.dev/",
  desc: "Long-form technical notes, topics, series, and resources.",
  title: "Research Notes",
  ogImage: "default-og.jpg",
  lightAndDarkMode: true,
  postPerIndex: 6,
  postPerPage: 8,
  scheduledPostMargin: 15 * 60 * 1000,
  showArchives: true,
  showBackButton: true,
  editPost: {
    enabled: false,
    text: "Edit page",
    url: "",
  },
  dynamicOgImage: true,
  dir: "ltr",
  lang: "en",
  timezone: "Asia/Shanghai",
} as const;
```

- [ ] **Step 3: Update navigation**

Set the header links to:

```ts
[
  { text: "Posts", href: "/posts/" },
  { text: "Topics", href: "/topics/" },
  { text: "Series", href: "/series/" },
  { text: "Resources", href: "/resources/" },
  { text: "Archives", href: "/archives/" },
  { text: "About", href: "/about/" },
  { text: "Search", href: "/search/" },
]
```

- [ ] **Step 4: Update homepage**

Modify `src/pages/index.astro` to show:

```text
Short introduction
Featured topics
Latest posts
Recent resources
Series entry points
```

Use existing AstroPaper layout and typography classes. Do not add a marketing hero or decorative background.

- [ ] **Step 5: Verify search index generation**

Run:

```powershell
pnpm build
```

Expected:

```text
pagefind
```

appears in the build output or `public/pagefind/` is updated by AstroPaper's build script.

- [ ] **Step 6: Verify RSS**

Run:

```powershell
pnpm build
```

Then check that `dist\rss.xml` exists:

```powershell
Test-Path dist\rss.xml
```

Expected:

```text
True
```

- [ ] **Step 7: Commit metadata and discovery**

Run:

```powershell
git add astro-paper.config.ts src\config.ts src\pages\index.astro
git commit -m "feat: configure research library discovery"
```

Expected: commit succeeds.

---

### Task 8: Add Deployment Documentation

**Files:**
- Create: `D:\personal-blog-research-library\docs\deployment\cloudflare-pages.md`

- [ ] **Step 1: Create Cloudflare Pages deployment guide**

Create `docs/deployment/cloudflare-pages.md`:

```markdown
# Cloudflare Pages Deployment

## Build Settings

- Framework preset: Astro
- Build command: `pnpm build`
- Build output directory: `dist`
- Node.js version: use the version supported by the project lockfile

## Repository Flow

1. Push the repository to GitHub.
2. Create a Cloudflare Pages project from the repository.
3. Set the build command to `pnpm build`.
4. Set output directory to `dist`.
5. Deploy.

## Static Site Constraints

- No login.
- No comments.
- No backend API.
- Search runs in the browser.
- RSS is generated at build time.

## Content Publishing Flow

1. Write or edit Markdown in `src/content/`.
2. Run `pnpm test`.
3. Run `pnpm build`.
4. Commit and push.
5. Cloudflare Pages builds and publishes the site.
```

- [ ] **Step 2: Commit deployment docs**

Run:

```powershell
git add docs\deployment\cloudflare-pages.md
git commit -m "docs: add Cloudflare Pages deployment guide"
```

Expected: commit succeeds.

---

### Task 9: Final Local Verification

**Files:**
- No new files expected.

- [ ] **Step 1: Run full test suite**

Run:

```powershell
pnpm test
```

Expected: all Vitest tests pass.

- [ ] **Step 2: Run production build**

Run:

```powershell
pnpm build
```

Expected: Astro build, Pagefind indexing, RSS generation, and sitemap generation all complete successfully.

- [ ] **Step 3: Start preview server**

Run:

```powershell
pnpm preview --host 127.0.0.1
```

Expected: preview server starts and prints a localhost URL.

- [ ] **Step 4: Browser QA**

Open the preview URL and verify:

```text
/ loads and shows research-library homepage sections.
/posts/ lists seed post.
/posts/test-time-compute/ renders long-form article layout.
/topics/ lists seed topics.
/topics/llm-reasoning/ shows related post and resource.
/series/ lists LLM Notes.
/series/llm-notes/ shows test-time-compute in order.
/resources/ lists Tree of Thoughts.
/archives/ shows the 2026 post.
/tags/ includes LLM and Reasoning.
/search/ can find "test-time".
/rss.xml loads.
Mobile width 390px has no text overlap or broken navigation.
```

- [ ] **Step 5: Stop preview server**

Press `Ctrl+C` in the preview terminal.

- [ ] **Step 6: Record final git state**

Run:

```powershell
git status --short
```

Expected after successful verification:

```text
```

When verification changes files, commit the verified fixes with:

```powershell
git add .
git commit -m "fix: complete local verification"
```

Expected: commit succeeds after fixes are made.

---

## Plan Self-Review

- Spec coverage: Figma design, D drive workspace, AstroPaper baseline, Obsidian content source, content collections, pages, static search, RSS, Cloudflare Pages, no comments/login/backend, and validation are covered.
- Red-flag scan: no unfinished requirement markers are used. The example site URL is a default config value that must be replaced before production launch.
- Type consistency: utilities use `id`, `data.draft`, `data.date`, and explicit series `posts` arrays consistently across tests and page tasks.
