import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { slugifyStr } from "./slugify";

type MarkdownNode = {
  type: string;
  value?: string;
  children?: MarkdownNode[];
  url?: string;
  title?: string | null;
};

type WikiNode =
  | { type: "text"; value: string }
  | {
      type: "link";
      url: string;
      title: null;
      children: Array<{ type: "text"; value: string }>;
    };

type ObsidianLinksOptions = {
  contentRoot?: string;
  knownLinks?: Record<string, string>;
};

const WIKI_LINK_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
const SKIPPED_NODE_TYPES = new Set([
  "code",
  "inlineCode",
  "inlineMath",
  "math",
  "link",
  "linkReference",
]);

export function transformWikiLinks(
  markdown: string,
  knownLinks: Record<string, string>
): string {
  return parseWikiText(markdown, knownLinks)
    .map(node => {
      if (node.type === "text") {
        return node.value;
      }

      const label = escapeMarkdownLabel(node.children[0].value);
      return `[${label}](${node.url})`;
    })
    .join("");
}

export function remarkObsidianLinks(options: ObsidianLinksOptions = {}) {
  const knownLinks = {
    ...buildObsidianLinkMap(options.contentRoot),
    ...options.knownLinks,
  };

  return function transform(tree: MarkdownNode): void {
    transformNode(tree, knownLinks);
  };
}

function transformNode(
  node: MarkdownNode,
  knownLinks: Record<string, string>
): void {
  if (SKIPPED_NODE_TYPES.has(node.type) || !node.children) {
    return;
  }

  node.children = node.children.flatMap(child => {
    if (child.type === "text" && typeof child.value === "string") {
      return parseWikiText(child.value, knownLinks);
    }

    transformNode(child, knownLinks);
    return [child];
  });
}

function parseWikiText(
  text: string,
  knownLinks: Record<string, string>
): WikiNode[] {
  const nodes: WikiNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(WIKI_LINK_RE)) {
    const matchIndex = match.index ?? 0;
    const target = String(match[1]).trim();
    const label = String(match[2] || match[1]).trim();
    const href = knownLinks[target];

    if (matchIndex > lastIndex) {
      nodes.push({ type: "text", value: text.slice(lastIndex, matchIndex) });
    }

    if (href) {
      nodes.push({
        type: "link",
        url: href,
        title: null,
        children: [{ type: "text", value: label }],
      });
    } else {
      nodes.push({ type: "text", value: label });
    }

    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push({ type: "text", value: text.slice(lastIndex) });
  }

  return nodes.length > 0 ? nodes : [{ type: "text", value: text }];
}

function buildObsidianLinkMap(contentRoot = path.join(process.cwd(), "src", "content")) {
  const links: Record<string, string> = {};

  addCollectionLinks(links, path.join(contentRoot, "topics"), "topics");
  addCollectionLinks(links, path.join(contentRoot, "series"), "series");
  addCollectionLinks(links, path.join(contentRoot, "resources"), "resources");
  addCollectionLinks(links, path.join(contentRoot, "posts"), "posts", true);

  return links;
}

function addCollectionLinks(
  links: Record<string, string>,
  directory: string,
  route: string,
  isPost = false
): void {
  if (!existsSync(directory)) {
    return;
  }

  for (const file of getMarkdownFiles(directory)) {
    const relative = stripExtension(path.relative(directory, file)).replace(/\\/g, "/");
    const segments = relative.split("/");
    const basename = segments[segments.length - 1];
    const routeSegments = isPost
      ? [...segments.slice(0, -1).filter(segment => !segment.startsWith("_")), basename]
      : segments;
    const slugPath = routeSegments.map(segment => slugifyStr(segment)).join("/");
    const href = `/${route}/${slugPath}/`;

    for (const key of new Set([relative, basename, slugPath])) {
      links[key] ??= href;
    }
  }
}

function getMarkdownFiles(directory: string): string[] {
  return readdirSync(directory).flatMap(entry => {
    const fullPath = path.join(directory, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      return getMarkdownFiles(fullPath);
    }

    return /\.(md|mdx)$/.test(entry) ? [fullPath] : [];
  });
}

function stripExtension(filePath: string): string {
  return filePath.replace(/\.(md|mdx)$/i, "");
}

function escapeMarkdownLabel(label: string): string {
  return label.replace(/[\\[\]]/g, "\\$&");
}
