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
    const items = addPostCategories(await listAllContent());
    const topics = makeTopicSummaries(items);
    sendJson(response, 200, {
      ok: true,
      items,
      topics,
      topicFilters: makeCategoryFilters(items),
      counts: makeCounts(items),
      siteUrl,
      localPreviewUrl,
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/item") {
    const filePath = url.searchParams.get("path");
    if (!filePath) throw new Error("Missing path.");
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

    const relativeToRoot = path.relative(rootDir, path.join(contentDir, saved.path));
    const branch = (await runCommand("git", ["branch", "--show-current"])).stdout.trim() || "master";
    const commitMessage = `content: publish ${saved.title}`;
    const git = await runCommands([
      ["git", ["add", "--", relativeToRoot]],
      ["git", ["diff", "--cached", "--quiet"], { allowFailure: true }],
    ]);

    if (git.output.includes("exit 1")) {
      const publish = await runCommands([
        ["git", ["commit", "-m", commitMessage]],
        ["git", ["push", "origin", branch]],
      ]);
      sendJson(response, 200, {
        ok: publish.ok,
        item: saved,
        output: `${check.output}\n${publish.output}`,
        error: publish.ok ? undefined : "Git publish failed.",
      });
      return;
    }

    sendJson(response, 200, {
      ok: true,
      item: saved,
      output: `${check.output}\nNo content changes to commit.`,
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
  return summarizeSource(toContentRelative(absolute), await readFile(absolute, "utf8"), true);
}

async function saveContent(payload) {
  const data = normalizeContentData(payload.data);
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
    title: String(input.title ?? "").trim(),
    description: String(input.description ?? "").trim(),
    lang: input.lang === "en" ? "en" : "zh",
    date: String(input.date ?? today()).trim(),
    topics: asStringArray(input.topics),
    series: asStringArray(input.series),
    posts: asStringArray(input.posts),
    readingPath: asStringArray(input.readingPath),
    keyQuestions: asStringArray(input.keyQuestions),
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

function makeCounts(items) {
  return {
    posts: items.filter(item => item.collection === "posts").length,
    topics: items.filter(item => item.collection === "topics").length,
    series: items.filter(item => item.collection === "series").length,
    resources: items.filter(item => item.collection === "resources").length,
    drafts: items.filter(item => item.draft).length,
    ready: items.filter(item => !item.draft).length,
  };
}

function makeTopicSummaries(items) {
  const posts = items.filter(item => item.collection === "posts");
  const resources = items.filter(item => item.collection === "resources");

  return items
    .filter(item => item.collection === "topics")
    .map(topic => ({
      slug: topic.slug,
      path: topic.path,
      title: topic.title,
      description: topic.description,
      draft: topic.draft,
      featured: topic.featured,
      readingPath: topic.readingPath,
      keyQuestions: topic.keyQuestions,
      posts: posts
        .filter(post => post.topics.includes(topic.slug))
        .map(post => ({
          path: post.path,
          title: post.title,
          date: post.date,
          draft: post.draft,
        })),
      resources: resources
        .filter(resource => resource.topics.includes(topic.slug))
        .map(resource => ({
          path: resource.path,
          title: resource.title,
          type: resource.resourceType,
          draft: resource.draft,
        })),
    }));
}

function addPostCategories(items) {
  return items.map(item =>
    item.collection === "posts" ? { ...item, category: getPostCategory(item) } : item,
  );
}

function makeCategoryFilters(items) {
  const posts = items.filter(item => item.collection === "posts");
  const categories = [
    { slug: "ai", title: "AI" },
    { slug: "systems", title: "Systems" },
    { slug: "writing", title: "Writing" },
    { slug: "planning", title: "Planning" },
  ];

  return [
    { slug: "all", title: "All", count: posts.length },
    ...categories.map(category => ({
      ...category,
      count: posts.filter(post => post.category === category.slug).length,
    })),
  ];
}

function getPostCategory(post) {
  const text = [
    post.title,
    post.description,
    ...(post.tags ?? []),
    ...(post.topics ?? []),
  ]
    .join(" ")
    .toLowerCase();

  if (/llm|ai|大模型|推理|reasoning|compute/.test(text)) return "ai";
  if (/system|systems|工程|架构|cloudflare|astro/.test(text)) return "systems";
  if (/planning|规划|复盘|plan|人生/.test(text)) return "planning";
  return "writing";
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
    const child = spawn(command, args, {
      cwd: rootDir,
      shell: process.platform === "win32",
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
    child.on("close", code => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}
