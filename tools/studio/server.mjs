import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { createReadStream, existsSync } from "node:fs";
import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");
const contentDir = path.join(rootDir, "src", "content");
const publicDir = path.join(__dirname, "public");
const topicCategoriesPath = path.join(rootDir, "src", "data", "topicCategories.json");
const defaultPort = Number.parseInt(process.env.BLOG_STUDIO_PORT ?? "52621", 10);
const siteUrl = process.env.BLOG_STUDIO_SITE_URL ?? "https://louisjiang.pages.dev";
const localPreviewUrl = process.env.BLOG_STUDIO_LOCAL_URL ?? "http://127.0.0.1:4326";

const collections = {
  posts: "posts",
  topics: "topics",
  series: "series",
  resources: "resources",
};

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
]);

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);

    if (url.pathname.startsWith("/api/")) {
      await handleApi(request, response, url);
      return;
    }

    await serveStatic(response, url.pathname);
  } catch (error) {
    sendJson(response, 500, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

listen(defaultPort).catch(error => {
  throw error;
});

async function listen(port) {
  try {
    const actualPort = await tryListen(port);
    console.log(`Blog Studio running at http://127.0.0.1:${actualPort}/`);
  } catch (error) {
    if (error && error.code === "EADDRINUSE" && port < defaultPort + 20) {
      await listen(port + 1);
      return;
    }

    throw error;
  }
}

function tryListen(port) {
  return new Promise((resolve, reject) => {
    const onError = error => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.off("error", onError);
      resolve(port);
    };

    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, "127.0.0.1");
  });
}

async function handleApi(request, response, url) {
  if (request.method === "GET" && url.pathname === "/api/content") {
    const categories = await loadTopicCategories();
    const gitStatus = await getGitStatusMap();
    const items = addPublishStates(
      addPostCategories(await listAllContent(), categories),
      gitStatus,
    );
    const topics = makeTopicSummaries(items, categories, gitStatus);
    sendJson(response, 200, {
      ok: true,
      items,
      topics,
      topicFilters: makeCategoryFilters(items, categories),
      counts: makeCounts(items, topics),
      siteUrl,
      localPreviewUrl,
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/item") {
    const filePath = url.searchParams.get("path");
    if (!filePath) throw new Error("Missing path.");
    if (filePath.startsWith("topic:")) {
      const categories = await loadTopicCategories();
      const gitStatus = await getGitStatusMap();
      const items = addPublishStates(
        addPostCategories(await listAllContent(), categories),
        gitStatus,
      );
      const slug = filePath.slice("topic:".length);
      const topic = makeTopicSummaries(items, categories, gitStatus).find(item => item.slug === slug);
      if (!topic) throw new Error("Topic category not found.");
      sendJson(response, 200, { ok: true, item: topic });
      return;
    }
    sendJson(response, 200, {
      ok: true,
      item: await readContentItem(filePath),
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/preview") {
    const payload = await readJsonBody(request);
    const data = normalizeContentData(payload.data);
    sendJson(response, 200, {
      ok: true,
      route: makeRoute(data, payload.mode === "edit" ? payload.filePath : undefined),
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/save") {
    const payload = await readJsonBody(request);
    const saved = await saveContent(payload);
    sendJson(response, 200, {
      ok: true,
      item: saved,
      message: `Saved ${saved.path}`,
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/check") {
    const payload = await readJsonBody(request);
    const saved = await saveContent(payload);
    const result = await runCommands([["pnpm", ["test"]], ["pnpm", ["build"]]]);
    sendJson(response, 200, {
      ok: result.ok,
      item: saved,
      output: result.output,
      error: result.ok ? undefined : "Check failed.",
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/publish") {
    const payload = await readJsonBody(request);
    const saved = await saveContent(payload);
    const check = await runCommands([["pnpm", ["test"]], ["pnpm", ["build"]]]);
    if (!check.ok) {
      sendJson(response, 200, {
        ok: false,
        item: saved,
        output: check.output,
        error: "Check failed. Nothing was pushed.",
      });
      return;
    }

    const relativeToRoot = saved.gitPath ?? path.relative(rootDir, path.join(contentDir, saved.path));
    const branch = (await runCommand("git", ["branch", "--show-current"])).stdout.trim() || "master";
    const commitMessage = `content: publish ${saved.title}`;
    const git = await runCommands([["git", ["add", "--", relativeToRoot]]]);
    if (!git.ok) {
      sendJson(response, 200, {
        ok: false,
        item: saved,
        output: `${check.output}\n${git.output}`,
        error: "Git add failed.",
      });
      return;
    }

    const diff = await runCommand("git", ["diff", "--cached", "--quiet", "--", relativeToRoot]);
    const diffOutput = `$ git diff --cached --quiet -- ${relativeToRoot}\n${diff.stdout}${diff.stderr}\n`;

    if (diff.code === 1) {
      const publish = await runCommands([
        ["git", ["commit", "-m", commitMessage, "--", relativeToRoot]],
        ["git", ["push", "origin", branch]],
      ]);
      sendJson(response, 200, {
        ok: publish.ok,
        item: saved,
        output: `${check.output}\n${git.output}${diffOutput}${publish.output}`,
        error: publish.ok ? undefined : "Git publish failed.",
      });
      return;
    }

    if (diff.code !== 0) {
      sendJson(response, 200, {
        ok: false,
        item: saved,
        output: `${check.output}\n${git.output}${diffOutput}`,
        error: "Git diff failed.",
      });
      return;
    }

    sendJson(response, 200, {
      ok: true,
      item: saved,
      output: `${check.output}\n${git.output}${diffOutput}No content changes to commit for ${relativeToRoot}.`,
    });
    return;
  }

  sendJson(response, 404, { ok: false, error: "API route not found." });
}

async function serveStatic(response, requestPath) {
  const cleanPath = decodeURIComponent(requestPath.split("?")[0] || "/");
  const filePath = cleanPath === "/" ? "index.html" : cleanPath.replace(/^\/+/, "");
  const absolute = safeJoin(publicDir, filePath);

  try {
    await access(absolute);
    const extension = path.extname(absolute).toLowerCase();
    response.writeHead(200, {
      "Content-Type": mimeTypes.get(extension) ?? "application/octet-stream",
    });
    createReadStream(absolute).pipe(response);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}

async function listAllContent() {
  const groups = await Promise.all(Object.keys(collections).map(collection => listCollection(collection)));
  return groups.flat().sort((left, right) => {
    const byCollection = left.collection.localeCompare(right.collection);
    if (byCollection !== 0) return byCollection;
    return left.title.localeCompare(right.title, "zh-CN");
  });
}

async function listCollection(collection) {
  const folder = path.join(contentDir, collections[collection]);
  const files = await walkMarkdown(folder).catch(() => []);
  return Promise.all(
    files.map(async absolute => {
      const relative = toContentRelative(absolute);
      return summarizeSource(relative, await readFile(absolute, "utf8"));
    }),
  );
}

async function readContentItem(filePath) {
  const absolute = contentPath(filePath);
  return addPublishState(
    summarizeSource(toContentRelative(absolute), await readFile(absolute, "utf8"), true),
    await getGitStatusMap(),
  );
}

async function saveContent(payload) {
  const data = normalizeContentData(payload.data);
  if (data.collection === "topics") {
    return saveTopicCategory(data, payload.mode === "edit" ? payload.filePath : undefined);
  }

  const route = makeRoute(data, payload.mode === "edit" ? payload.filePath : undefined);
  const absolute = contentPath(route.path);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, buildMarkdown(data, payload.body ?? ""), "utf8");
  return readContentItem(route.path);
}

function summarizeSource(filePath, source, includeBody = false) {
  const { data, body } = parseMarkdown(source);
  const collection = getCollectionFromPath(filePath);
  const route = makeRoute({ ...data, collection }, filePath);
  const title = String(data.title ?? path.basename(filePath, path.extname(filePath)));
  const item = {
    path: filePath,
    collection,
    slug: path.basename(filePath, path.extname(filePath)),
    title,
    description: String(data.description ?? ""),
    lang: data.lang === "en" ? "en" : "zh",
    date: String(data.date ?? ""),
    tags: asStringArray(data.tags),
    topics: asStringArray(data.topics),
    series: asStringArray(data.series),
    posts: asStringArray(data.posts),
    readingPath: asStringArray(data.readingPath),
    keyQuestions: asStringArray(data.keyQuestions),
    resourceType: String(data.type ?? "link"),
    url: String(data.url ?? ""),
    draft: data.draft === true,
    featured: data.featured === true,
    body: includeBody ? body : undefined,
    source: includeBody ? source : undefined,
    route,
  };

  if (collection === "posts") {
    item.category = getPostCategory(item);
  }

  return item;
}

function parseMarkdown(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return { data: {}, body: source };
  }

  const data = parseFrontmatter(match[1]);
  return {
    data: data && typeof data === "object" && !Array.isArray(data) ? data : {},
    body: source.slice(match[0].length).replace(/^\r?\n/, ""),
  };
}

function buildMarkdown(data, body) {
  const frontmatter = stringifyFrontmatter(buildFrontmatter(data)).trimEnd();
  return `---\n${frontmatter}\n---\n\n${String(body).replace(/^\s+/, "")}`;
}

function parseFrontmatter(source) {
  const data = {};
  let currentArrayKey = "";

  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const listMatch = line.match(/^\s*-\s*(.*)$/);
    if (listMatch && currentArrayKey) {
      data[currentArrayKey].push(parseScalar(listMatch[1]));
      continue;
    }

    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;

    const key = match[1];
    const value = match[2].trim();
    currentArrayKey = "";

    if (value === "") {
      data[key] = [];
      currentArrayKey = key;
    } else if (value === "[]") {
      data[key] = [];
    } else {
      data[key] = parseScalar(value);
    }
  }

  return data;
}

function parseScalar(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  return value;
}

function stringifyFrontmatter(data) {
  const lines = [];
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${key}: []`);
      } else {
        lines.push(`${key}:`);
        for (const item of value) lines.push(`  - ${formatYamlScalar(item)}`);
      }
    } else {
      lines.push(`${key}: ${formatYamlScalar(value)}`);
    }
  }
  return lines.join("\n");
}

function formatYamlScalar(value) {
  if (typeof value === "boolean") return String(value);
  const text = String(value);
  if (/^[a-zA-Z0-9_-]+$/.test(text)) return text;
  return JSON.stringify(text);
}

function buildFrontmatter(data) {
  const common = {
    title: data.title,
    description: data.description,
    lang: data.lang,
    draft: Boolean(data.draft),
  };

  if (data.collection === "posts") {
    return {
      ...common,
      date: data.date,
      topics: data.topics,
      series: data.series,
      featured: Boolean(data.featured),
    };
  }

  if (data.collection === "topics") {
    return {
      ...common,
      featured: Boolean(data.featured),
      readingPath: data.readingPath,
      keyQuestions: data.keyQuestions,
    };
  }

  if (data.collection === "series") {
    return {
      ...common,
      posts: data.posts,
      topics: data.topics,
    };
  }

  return {
    ...common,
    type: data.resourceType,
    url: data.url || undefined,
    topics: data.topics,
    date: data.date || undefined,
  };
}

function normalizeContentData(input = {}) {
  const collection = Object.hasOwn(collections, input.collection) ? input.collection : "posts";
  return {
    collection,
    slug: String(input.slug ?? "").trim(),
    title: String(input.title ?? "").trim(),
    description: String(input.description ?? "").trim(),
    lang: input.lang === "en" ? "en" : "zh",
    date: String(input.date ?? today()).trim(),
    topics: asStringArray(input.topics),
    series: asStringArray(input.series),
    posts: asStringArray(input.posts),
    readingPath: asStringArray(input.readingPath),
    keyQuestions: asStringArray(input.keyQuestions),
    patterns: asStringArray(input.patterns ?? input.readingPath),
    resourceType: String(input.resourceType ?? input.type ?? "link").trim() || "link",
    url: String(input.url ?? "").trim(),
    draft: input.draft === true,
    featured: input.featured === true,
  };
}

function makeRoute(data, existingPath) {
  const collection = Object.hasOwn(collections, data.collection) ? data.collection : "posts";
  const filePath = existingPath && isContentPath(existingPath)
    ? normalizeSlash(existingPath)
    : uniqueContentPath(collection, data.title);
  const slugPath = filePath
    .replace(new RegExp(`^${collection === "posts" ? "posts" : collection}/`), "")
    .replace(/\.(md|mdx)$/i, "");
  const publicPath = `/${collection}/${slugPath}/`;

  return {
    path: filePath,
    publicPath,
    publicUrl: `${siteUrl.replace(/\/+$/, "")}${encodePublicPath(publicPath)}`,
    localPreviewUrl: `${localPreviewUrl.replace(/\/+$/, "")}${encodePublicPath(publicPath)}`,
  };
}

function uniqueContentPath(collection, title) {
  const folder = collections[collection] ?? "posts";
  const slug = slugify(title);
  let candidate = `${folder}/${slug}.md`;
  let index = 2;

  while (contentExistsSync(candidate)) {
    candidate = `${folder}/${slug}-${index}.md`;
    index += 1;
  }

  return candidate;
}

function contentExistsSync(filePath) {
  try {
    const absolute = contentPath(filePath);
    return existsSync(absolute);
  } catch {
    return false;
  }
}

function getCollectionFromPath(filePath) {
  const first = normalizeSlash(filePath).split("/")[0];
  return Object.hasOwn(collections, first) ? first : "posts";
}

function contentPath(filePath) {
  if (!isContentPath(filePath)) {
    throw new Error("Path must be inside a content collection.");
  }
  return safeJoin(contentDir, filePath);
}

function isContentPath(filePath) {
  const normalized = normalizeSlash(String(filePath ?? ""));
  const first = normalized.split("/")[0];
  return Object.hasOwn(collections, first) && /\.(md|mdx)$/i.test(normalized);
}

function safeJoin(base, target) {
  const absolute = path.resolve(base, target);
  const relative = path.relative(base, absolute);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Unsafe path.");
  }
  return absolute;
}

async function walkMarkdown(folder) {
  const entries = await readdir(folder, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async entry => {
      const absolute = path.join(folder, entry.name);
      if (entry.isDirectory()) return walkMarkdown(absolute);
      if (entry.isFile() && /\.(md|mdx)$/i.test(entry.name)) return [absolute];
      return [];
    }),
  );
  return files.flat();
}

function toContentRelative(absolute) {
  return normalizeSlash(path.relative(contentDir, absolute));
}

function makeCounts(items, topics = []) {
  return {
    posts: items.filter(item => item.collection === "posts").length,
    topics: topics.length,
    series: items.filter(item => item.collection === "series").length,
    resources: items.filter(item => item.collection === "resources").length,
    drafts: items.filter(item => item.draft).length,
    ready: items.filter(item => !item.draft).length,
  };
}

async function loadTopicCategories() {
  const raw = await readFile(topicCategoriesPath, "utf8");
  const parsed = JSON.parse(raw);
  const categories = Array.isArray(parsed.categories) ? parsed.categories : [];
  return categories.map(category => ({
    slug: slugify(category.slug || category.label),
    label: String(category.label ?? category.slug ?? "").trim(),
    description: String(category.description ?? "").trim(),
    patterns: asStringArray(category.patterns),
  })).filter(category => category.slug && category.label);
}

async function saveTopicCategory(data, existingPath) {
  const categories = await loadTopicCategories();
  const oldSlug = existingPath?.startsWith("topic:") ? existingPath.slice("topic:".length) : "";
  const slug = slugify(data.slug || data.title);

  if (!slug) throw new Error("Topic requires a slug.");
  if (!data.title) throw new Error("Topic requires a label.");
  if (!data.description) throw new Error("Topic requires a description.");

  const nextCategory = {
    slug,
    label: data.title,
    description: data.description,
    patterns: data.patterns.length > 0 ? data.patterns : [slug, data.title],
  };
  const existingIndex = categories.findIndex(category =>
    oldSlug ? category.slug === oldSlug : category.slug === slug,
  );
  const nextCategories = [...categories];

  if (existingIndex >= 0) {
    nextCategories[existingIndex] = nextCategory;
  } else {
    nextCategories.push(nextCategory);
  }

  await writeFile(
    topicCategoriesPath,
    `${JSON.stringify({ categories: nextCategories }, null, 2)}\n`,
    "utf8",
  );

  const gitStatus = await getGitStatusMap();
  const items = addPublishStates(
    addPostCategories(await listAllContent(), nextCategories),
    gitStatus,
  );
  return makeTopicSummaries(items, nextCategories, gitStatus).find(topic => topic.slug === slug);
}

function makeTopicSummaries(items, categories, gitStatus = new Map()) {
  const posts = items.filter(item => item.collection === "posts");

  return categories
    .map(category => {
      const gitPath = normalizeSlash(path.relative(rootDir, topicCategoriesPath));
      return {
        path: `topic:${category.slug}`,
        gitPath,
        collection: "topics",
        slug: category.slug,
        title: category.label,
        description: category.description,
        patterns: category.patterns,
        draft: false,
        featured: false,
        body: "",
        publishState: makePublishState(gitPath, false, gitStatus),
        route: {
          path: `topic:${category.slug}`,
          publicPath: `/topics/${category.slug}/`,
          publicUrl: `${siteUrl.replace(/\/+$/, "")}/topics/${encodeURIComponent(category.slug)}/`,
          localPreviewUrl: `${localPreviewUrl.replace(/\/+$/, "")}/topics/${encodeURIComponent(category.slug)}/`,
        },
        posts: posts
          .filter(post => post.category === category.slug)
          .map(post => ({
            path: post.path,
            title: post.title,
            date: post.date,
            draft: post.draft,
            publishState: post.publishState,
          })),
        resources: [],
      };
    });
}

function addPostCategories(items, categories) {
  return items.map(item =>
    item.collection === "posts" ? { ...item, category: getPostCategory(item, categories) } : item,
  );
}

function addPublishStates(items, gitStatus) {
  return items.map(item => addPublishState(item, gitStatus));
}

function addPublishState(item, gitStatus) {
  const gitPath = contentGitPath(item.path);
  return {
    ...item,
    publishState: makePublishState(gitPath, item.draft, gitStatus),
  };
}

function makePublishState(gitPath, draft, gitStatus) {
  const normalized = normalizeSlash(gitPath);
  const code = gitStatus.get(normalized) ?? "";

  if (draft) {
    return {
      kind: "draft",
      label: "DRAFT",
      detail: "草稿不会出现在公开博客里。",
      gitPath: normalized,
      gitCode: code,
    };
  }

  if (!code) {
    return {
      kind: "published",
      label: "PUBLISHED",
      detail: "已提交，当前本地没有未发布改动。",
      gitPath: normalized,
      gitCode: code,
    };
  }

  if (code === "??") {
    return {
      kind: "unpublished",
      label: "NOT PUBLISHED",
      detail: "新文件还没有提交和推送。",
      gitPath: normalized,
      gitCode: code,
    };
  }

  if (code[0] !== " ") {
    return {
      kind: "staged",
      label: "STAGED",
      detail: "已暂存，但 commit/push 没有完成。",
      gitPath: normalized,
      gitCode: code,
    };
  }

  return {
    kind: "changed",
    label: "CHANGED",
    detail: "本地有修改，还没有提交和推送。",
    gitPath: normalized,
    gitCode: code,
  };
}

async function getGitStatusMap() {
  const result = await runCommand("git", ["status", "--porcelain=v1", "-z", "--untracked-files=all"]);
  if (result.code !== 0) return new Map();
  return parseGitStatus(result.stdout);
}

function parseGitStatus(output) {
  const status = new Map();
  const entries = output.split("\0").filter(Boolean);

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const code = entry.slice(0, 2);
    const filePath = normalizeSlash(entry.slice(3));
    status.set(filePath, code);

    if (code[0] === "R" || code[0] === "C") {
      index += 1;
    }
  }

  return status;
}

function contentGitPath(filePath) {
  return normalizeSlash(path.relative(rootDir, path.join(contentDir, filePath)));
}

function makeCategoryFilters(items, categories) {
  const posts = items.filter(item => item.collection === "posts");
  return [
    { slug: "all", title: "All", count: posts.length },
    ...categories.map(category => ({
      slug: category.slug,
      title: category.label,
      count: posts.filter(post => post.category === category.slug).length,
    })),
  ];
}

function getPostCategory(post, categories = []) {
  const text = [
    post.title,
    post.description,
    ...(post.tags ?? []),
    ...(post.topics ?? []),
  ]
    .join(" ")
    .toLowerCase();

  const matched = categories.find(category =>
    category.patterns.some(pattern => text.includes(pattern.toLowerCase())),
  );

  return matched?.slug ?? categories.find(category => category.slug === "writing")?.slug ?? "writing";
}

function slugify(value) {
  const slug = String(value ?? "")
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\\/:*?"<>|#^[\]{}]/g, " ")
    .replace(/[']/g, "")
    .replace(/&/g, " and ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return slug || "untitled";
}

function asStringArray(value) {
  if (Array.isArray(value)) return value.map(item => String(item)).filter(Boolean);
  if (typeof value === "string") {
    const text = value.trim();
    const source = text.startsWith("[") && text.endsWith("]")
      ? text.slice(1, -1)
      : text;

    return source
      .split(/[\n,，]/)
      .map(item => item.trim())
      .map(item => item.replace(/^["']|["']$/g, ""))
      .map(item => item.replace(/\\"/g, '"').replace(/\\\\/g, "\\"))
      .filter(Boolean);
  }
  return [];
}

function today() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function normalizeSlash(value) {
  return value.replace(/\\/g, "/").replace(/^\/+/, "");
}

function encodePublicPath(value) {
  return value
    .split("/")
    .map((segment, index) => (index === 0 ? "" : encodeURIComponent(segment)))
    .join("/");
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

async function runCommands(commands) {
  let output = "";
  for (const [command, args, options = {}] of commands) {
    const result = await runCommand(command, args);
    output += `$ ${command} ${args.join(" ")}\n${result.stdout}${result.stderr}\n`;
    if (result.code !== 0 && !options.allowFailure) {
      return { ok: false, output };
    }
    if (result.code !== 0 && options.allowFailure) {
      output += `exit ${result.code}\n`;
    }
  }
  return { ok: true, output };
}

function runCommand(command, args) {
  return new Promise(resolve => {
    const useWindowsCmd = process.platform === "win32" && command === "pnpm";
    const executable = useWindowsCmd ? process.env.ComSpec || "cmd.exe" : command;
    const commandArgs = useWindowsCmd
      ? ["/d", "/s", "/c", "pnpm.cmd", ...args]
      : args;
    const child = spawn(executable, commandArgs, {
      cwd: rootDir,
      shell: false,
      env: process.env,
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", chunk => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", chunk => {
      stderr += chunk.toString();
    });
    child.on("error", error => {
      resolve({ code: 1, stdout, stderr: `${stderr}${error.message}` });
    });
    child.on("close", code => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}
