const state = {
  mode: "create",
  filePath: "",
  collection: "posts",
  body: "",
  items: [],
  topics: [],
  siteUrl: "https://louisjiang.pages.dev",
  localPreviewUrl: "http://127.0.0.1:4326",
  bodyTouched: false,
};

const elements = {
  countPosts: byId("countPosts"),
  countTopics: byId("countTopics"),
  countDrafts: byId("countDrafts"),
  countReady: byId("countReady"),
  optionalToggle: byId("optionalToggle"),
  optionalTypes: byId("optionalTypes"),
  existingSelect: byId("existingSelect"),
  reloadBtn: byId("reloadBtn"),
  title: byId("title"),
  description: byId("description"),
  lang: byId("lang"),
  date: byId("date"),
  topicSelect: byId("topicSelect"),
  resourceField: byId("resourceField"),
  resourceType: byId("resourceType"),
  resourceUrl: byId("resourceUrl"),
  seriesField: byId("seriesField"),
  seriesPosts: byId("seriesPosts"),
  draft: byId("draft"),
  featured: byId("featured"),
  filePath: byId("filePath"),
  localUrl: byId("localUrl"),
  publicUrl: byId("publicUrl"),
  markdownEditor: byId("markdownEditor"),
  output: byId("output"),
  saveBtn: byId("saveBtn"),
  checkBtn: byId("checkBtn"),
  publishBtn: byId("publishBtn"),
  localBtn: byId("localBtn"),
  onlineBtn: byId("onlineBtn"),
};

const typeButtons = Array.from(document.querySelectorAll(".type-btn"));

init();

async function init() {
  wireEvents();
  setDefaultPost();
  await loadContent();
  renderAll();
}

function wireEvents() {
  elements.optionalToggle.addEventListener("click", () => {
    elements.optionalTypes.classList.toggle("open");
  });

  for (const button of typeButtons) {
    button.addEventListener("click", () => {
      startNew(button.dataset.type);
    });
  }

  for (const input of [
    elements.title,
    elements.description,
    elements.lang,
    elements.date,
    elements.topicSelect,
    elements.resourceType,
    elements.resourceUrl,
    elements.seriesPosts,
    elements.draft,
    elements.featured,
  ]) {
    input.addEventListener("input", renderFromFields);
    input.addEventListener("change", renderFromFields);
  }

  elements.markdownEditor.addEventListener("input", () => {
    state.bodyTouched = true;
    state.body = getMarkdownBody(elements.markdownEditor.value);
  });

  elements.existingSelect.addEventListener("change", async () => {
    const filePath = elements.existingSelect.value;
    if (filePath) await openExisting(filePath);
  });

  elements.reloadBtn.addEventListener("click", loadAndRender);
  elements.saveBtn.addEventListener("click", () => save("save"));
  elements.checkBtn.addEventListener("click", () => save("check"));
  elements.publishBtn.addEventListener("click", () => save("publish"));
  elements.localBtn.addEventListener("click", () => window.open(currentRoute().localPreviewUrl, "_blank"));
  elements.onlineBtn.addEventListener("click", () => window.open(currentRoute().publicUrl, "_blank"));
}

async function loadAndRender() {
  await loadContent();
  renderAll();
}

async function loadContent() {
  const response = await api("/api/content");
  state.items = response.items;
  state.topics = response.topics;
  state.siteUrl = response.siteUrl;
  state.localPreviewUrl = response.localPreviewUrl;
  elements.countPosts.textContent = response.counts.posts;
  elements.countTopics.textContent = response.counts.topics;
  elements.countDrafts.textContent = response.counts.drafts;
  elements.countReady.textContent = response.counts.ready;
  renderExistingSelect();
  renderTopicSelect();
}

function renderExistingSelect() {
  elements.existingSelect.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "选择已有内容";
  elements.existingSelect.append(placeholder);

  for (const item of state.items) {
    const option = document.createElement("option");
    option.value = item.path;
    option.textContent = `${labelCollection(item.collection)} / ${item.title}`;
    elements.existingSelect.append(option);
  }

  elements.existingSelect.value = state.filePath;
}

function renderTopicSelect() {
  const current = elements.topicSelect.value;
  elements.topicSelect.innerHTML = "";
  const none = document.createElement("option");
  none.value = "";
  none.textContent = "不关联主题";
  elements.topicSelect.append(none);

  for (const topic of state.topics) {
    const option = document.createElement("option");
    option.value = topic.slug;
    option.textContent = `${topic.title} (${topic.slug})`;
    elements.topicSelect.append(option);
  }

  elements.topicSelect.value = current;
}

function startNew(collection) {
  state.mode = "create";
  state.filePath = "";
  state.collection = collection;
  state.bodyTouched = false;

  elements.title.value = "";
  elements.description.value = "";
  elements.lang.value = "zh";
  elements.date.value = today();
  elements.topicSelect.value = "";
  elements.resourceType.value = "link";
  elements.resourceUrl.value = "";
  elements.seriesPosts.value = "";
  elements.draft.checked = true;
  elements.featured.checked = false;
  state.body = defaultBody(collection);
  elements.existingSelect.value = "";

  renderAll();
}

async function openExisting(filePath) {
  const response = await api(`/api/item?path=${encodeURIComponent(filePath)}`);
  const item = response.item;
  state.mode = "edit";
  state.filePath = item.path;
  state.collection = item.collection;
  state.body = item.body ?? "";
  state.bodyTouched = false;

  elements.title.value = item.title;
  elements.description.value = item.description;
  elements.lang.value = item.lang;
  elements.date.value = item.date || today();
  elements.topicSelect.value = item.topics[0] ?? "";
  elements.resourceType.value = item.resourceType || "link";
  elements.resourceUrl.value = item.url || "";
  elements.seriesPosts.value = item.posts.join("\n");
  elements.draft.checked = item.draft;
  elements.featured.checked = item.featured;
  elements.existingSelect.value = item.path;

  renderAll();
  writeOutput(`Opened ${item.path}`);
}

function renderAll() {
  syncActiveType();
  syncVisibility();
  renderEditor();
}

function renderFromFields() {
  state.body = getMarkdownBody(elements.markdownEditor.value);
  renderAll();
}

function syncActiveType() {
  for (const button of typeButtons) {
    button.classList.toggle("active", button.dataset.type === state.collection);
  }
}

function syncVisibility() {
  const isTopic = state.collection === "topics";
  elements.date.disabled = state.collection !== "posts";
  byId("topicField").classList.toggle("is-hidden", isTopic);
  elements.resourceField.classList.toggle("is-hidden", state.collection !== "resources");
  elements.seriesField.classList.toggle("is-hidden", state.collection !== "series");
}

function renderEditor() {
  const route = currentRoute();
  elements.filePath.textContent = route.path;
  elements.localUrl.textContent = route.localPreviewUrl;
  elements.publicUrl.textContent = route.publicUrl;
  elements.markdownEditor.value = `${frontmatter()}\n\n${state.body || defaultBody(state.collection)}`;
}

function currentData() {
  return {
    collection: state.collection,
    title: elements.title.value.trim(),
    description: elements.description.value.trim(),
    lang: elements.lang.value,
    date: elements.date.value.trim() || today(),
    topics: elements.topicSelect.value ? [elements.topicSelect.value] : [],
    series: [],
    posts: splitLines(elements.seriesPosts.value),
    resourceType: elements.resourceType.value,
    url: elements.resourceUrl.value.trim(),
    draft: elements.draft.checked,
    featured: elements.featured.checked,
  };
}

function frontmatter() {
  const data = currentData();
  const lines = ["---"];
  lines.push(`title: "${escapeYaml(data.title)}"`);
  lines.push(`description: "${escapeYaml(data.description)}"`);
  lines.push(`lang: ${data.lang}`);

  if (data.collection === "posts") {
    lines.push(`date: ${data.date}`);
    pushArray(lines, "topics", data.topics);
    lines.push("series: []");
    lines.push(`draft: ${data.draft}`);
    lines.push(`featured: ${data.featured}`);
  } else if (data.collection === "topics") {
    lines.push(`featured: ${data.featured}`);
    lines.push("readingPath: []");
    lines.push("keyQuestions: []");
    lines.push(`draft: ${data.draft}`);
  } else if (data.collection === "series") {
    pushArray(lines, "posts", data.posts);
    pushArray(lines, "topics", data.topics);
    lines.push(`draft: ${data.draft}`);
  } else {
    lines.push(`type: ${data.resourceType}`);
    if (data.url) lines.push(`url: "${escapeYaml(data.url)}"`);
    pushArray(lines, "topics", data.topics);
    lines.push(`draft: ${data.draft}`);
  }

  lines.push("---");
  return lines.join("\n");
}

function pushArray(lines, name, values) {
  if (values.length === 0) {
    lines.push(`${name}: []`);
    return;
  }

  lines.push(`${name}:`);
  for (const value of values) lines.push(`  - ${value}`);
}

function currentRoute() {
  const collection = state.collection;
  const path = state.mode === "edit" && state.filePath
    ? state.filePath
    : `${collection}/${slugify(elements.title.value)}.md`;
  const slug = path.replace(new RegExp(`^${collection}/`), "").replace(/\.(md|mdx)$/i, "");
  const publicPath = `/${collection}/${slug}/`;
  return {
    path,
    publicPath,
    publicUrl: `${state.siteUrl.replace(/\/+$/, "")}${encodePublicPath(publicPath)}`,
    localPreviewUrl: `${state.localPreviewUrl.replace(/\/+$/, "")}${encodePublicPath(publicPath)}`,
  };
}

async function save(action) {
  const data = currentData();
  if (!data.title) {
    writeOutput("请先填写标题。");
    return;
  }
  if (!data.description) {
    writeOutput("请先填写描述。");
    return;
  }

  setBusy(true);
  try {
    const route = action === "save" ? "/api/save" : action === "check" ? "/api/check" : "/api/publish";
    const response = await api(route, {
      method: "POST",
      body: JSON.stringify({
        mode: state.mode,
        filePath: state.filePath,
        data,
        body: getMarkdownBody(elements.markdownEditor.value),
      }),
    });

    if (response.item) {
      state.mode = "edit";
      state.filePath = response.item.path;
      await loadContent();
      elements.existingSelect.value = state.filePath;
    }

    writeOutput(response.output || response.message || (response.ok ? "Done." : response.error));
  } catch (error) {
    writeOutput(error instanceof Error ? error.message : String(error));
  } finally {
    setBusy(false);
  }
}

function setDefaultPost() {
  state.collection = "posts";
  elements.title.value = "";
  elements.description.value = "";
  elements.lang.value = "zh";
  elements.date.value = today();
  elements.draft.checked = true;
  elements.featured.checked = false;
  state.body = defaultBody("posts");
}

function defaultBody(collection) {
  if (collection === "topics") {
    return ["## 主题说明", "", "说明这个主题为什么重要，以及它和其他主题的边界。", "", "## 关键问题", "", "- ", "", "## 阅读路径", "", "- ", ""].join("\n");
  }
  if (collection === "series") {
    return ["## 系列说明", "", "说明这个系列面向什么问题，适合按什么顺序阅读。", "", "## 文章顺序", "", "- ", ""].join("\n");
  }
  if (collection === "resources") {
    return ["## 资源说明", "", "说明这个资源是什么，为什么值得收藏。", "", "## 链接", "", "- ", "", "## 备注", "", "- ", ""].join("\n");
  }
  return ["## 摘要", "", "在这里写 3-5 句话概括文章。", "", "## 背景", "", "说明为什么要写这篇文章。", "", "## 主要内容", "", "- ", "", "## 参考", "", "- ", ""].join("\n");
}

function getMarkdownBody(source) {
  return source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").replace(/^\r?\n/, "");
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const payload = await response.json();
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }
  return payload;
}

function setBusy(value) {
  for (const button of [elements.saveBtn, elements.checkBtn, elements.publishBtn]) {
    button.disabled = value;
  }
}

function writeOutput(value) {
  elements.output.textContent = value || "Done.";
}

function splitLines(value) {
  return value
    .split(/[\n,，]/)
    .map(item => item.trim())
    .filter(Boolean);
}

function slugify(value) {
  return (
    value
      .trim()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\\/:*?"<>|#^[\]{}]/g, " ")
      .replace(/[']/g, "")
      .replace(/&/g, " and ")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "untitled"
  );
}

function encodePublicPath(value) {
  return value
    .split("/")
    .map((segment, index) => (index === 0 ? "" : encodeURIComponent(segment)))
    .join("/");
}

function escapeYaml(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function today() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function labelCollection(collection) {
  if (collection === "posts") return "Article";
  if (collection === "topics") return "Topic";
  if (collection === "series") return "Series";
  return "Resource";
}

function byId(id) {
  return document.getElementById(id);
}
