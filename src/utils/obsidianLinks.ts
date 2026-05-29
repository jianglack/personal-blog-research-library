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
