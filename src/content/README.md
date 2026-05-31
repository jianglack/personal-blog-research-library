# Public Blog Vault

Open this folder in Obsidian:

```text
D:\personal-blog-research-library\src\content
```

This is the public writing vault for the website. Anything committed under the
published collections can become part of the site, so keep private notes outside
this folder.

## Folders

- `posts/` - formal articles and long-form research notes.
- `topics/` - topic landing pages and reading paths.
- `series/` - ordered article groups.
- `resources/` - papers, tools, books, links, and reference entries.
- `pages/` - static pages.
- `templates/` - Obsidian templates. These are not published.

Ignored local-only folders:

- `drafts/`
- `inbox/`
- `.trash/`

## Publish Flow

1. Start from a template in `templates/`.
2. Write with `draft: true`.
3. Move publish-ready posts into `posts/`.
4. Set `draft: false`.
5. From the project root, run:

```powershell
pnpm test
pnpm build
```

6. Commit and push to `master`.
7. GitHub Actions deploys to Cloudflare Pages.

Full workflow: `docs/writing/obsidian-workflow.md`.
