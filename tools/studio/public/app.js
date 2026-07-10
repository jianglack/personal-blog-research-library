const state = {
  mode: "create",
  filePath: "",
  collection: "posts",
  body: "",
  items: [],
  topics: [],
  topicFilters: [],
  siteUrl: "https://louisjiang.pages.dev",
  localPreviewUrl: "http://127.0.0.1:4326",
  selectedTopicFilter: "all",
  lastOutput: "Ready.",
};

const elements = {
  countPosts: byId("countPosts"),
  countTopics: byId("countTopics"),
  countDrafts: byId("countDrafts"),
  countReady: byId("countReady"),
  topicStrip: byId("topicStrip"),
  optionalToggle: byId("optionalToggle"),
  optionalTypes: byId("optionalTypes"),
  modeOverview: byId("modeOverview"),
  contentHeading: byId("contentHeading"),
  contentHint: byId("contentHint"),
  existingSelect: byId("existingSelect"),
  existingLabel: byId("existingLabel"),
  existingNote: byId("existingNote"),
  reloadBtn: byId("reloadBtn"),
  title: byId("title"),
  titleLabel: byId("titleLabel"),
  titleNote: byId("titleNote"),
  description: byId("description"),
  descriptionLabel: byId("descriptionLabel"),
  descriptionNote: byId("descriptionNote"),
  basicField: byId("basicField"),
  basicLabel: byId("basicLabel"),
  basicNote: byId("basicNote"),
  lang: byId("lang"),
  date: byId("date"),
  topicField: byId("topicField"),
  topicLabel: byId("topicLabel"),
  topicNote: byId("topicNote"),
  topicSelect: byId("topicSelect"),
  topicDetailField: byId("topicDetailField"),
  topicSlug: byId("topicSlug"),
  topicPatterns: byId("topicPatterns"),
  resourceField: byId("resourceField"),
  resourceType: byId("resourceType"),
  resourceUrl: byId("resourceUrl"),
  seriesField: byId("seriesField"),
  seriesPosts: byId("seriesPosts"),
  draft: byId("draft"),
  featured: byId("featured"),
  statusBadge: byId("statusBadge"),
  statusTitle: byId("statusTitle"),
  statusReasons: byId("statusReasons"),
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
  setDefaultContent("posts");
  await loadContent();
  renderAll();
}

function wireEvents() {
  elements.optionalToggle.addEventListener("click", () => {
    elements.optionalTypes.classList.toggle("open");
  });

  for (const button of typeButtons) {
    button.addEventListener("click", () => startNew(button.dataset.type));
  }

  for (const input of [
    elements.title,
    elements.description,
    elements.lang,
    elements.date,
    elements.topicSelect,
    elements.topicSlug,
    elements.topicPatterns,
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
    state.body = getMarkdownBody(elements.markdownEditor.value);
    renderRouteAndStatus();
  });

  elements.existingSelect.addEventListener("change", async () => {
    const filePath = elements.existingSelect.value;
    if (filePath) await openExisting(filePath);
  });

  elements.topicStrip.addEventListener("click", event => {
    const button = event.target.closest("[data-topic-filter]");
    if (!button) return;
    state.selectedTopicFilter = button.dataset.topicFilter || "all";
    renderTopicStrip();
    renderModeOverview();
    renderRouteAndStatus();
  });

  elements.modeOverview.addEventListener("click", async event => {
    const button = event.target.closest("[data-open-path]");
    if (!button) return;
    await openExisting(button.dataset.openPath);
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
  state.topicFilters = response.topicFilters;
  state.siteUrl = response.siteUrl;
  state.localPreviewUrl = response.localPreviewUrl;

  elements.countPosts.textContent = response.counts.posts;
  elements.countTopics.textContent = response.counts.topics;
  elements.countDrafts.textContent = response.counts.drafts;
  elements.countReady.textContent = response.counts.ready;
}

function renderAll() {
  syncActiveType();
  syncModeCopy();
  syncVisibility();
  renderTopicStrip();
  renderExistingSelect();
  renderTopicSelect();
  renderModeOverview();
  renderEditor();
  renderOutput();
}

function renderFromFields() {
  state.body = getMarkdownBody(elements.markdownEditor.value);
  renderAll();
}

function renderRouteAndStatus() {
  const route = currentRoute();
  elements.filePath.textContent = route.path;
  elements.localUrl.textContent = route.localPreviewUrl;
  elements.publicUrl.textContent = route.publicUrl;
  renderStatus();
}

function syncActiveType() {
  for (const button of typeButtons) {
    button.classList.toggle("active", button.dataset.type === state.collection);
  }
}

function syncModeCopy() {
  const copy = modeCopy();
  elements.contentHeading.textContent = copy.heading;
  elements.contentHint.textContent = copy.hint;
  elements.existingLabel.textContent = copy.existingLabel;
  elements.existingNote.textContent = copy.existingNote;
  elements.titleLabel.textContent = copy.titleLabel;
  elements.titleNote.textContent = copy.titleNote;
  elements.descriptionLabel.textContent = copy.descriptionLabel;
  elements.descriptionNote.textContent = copy.descriptionNote;
  elements.basicLabel.textContent = copy.basicLabel;
  elements.basicNote.textContent = copy.basicNote;
  elements.topicLabel.textContent = copy.topicLabel;
  elements.topicNote.textContent = copy.topicNote;
}

function modeCopy() {
  const copies = {
    posts: {
      heading: "New Article",
      hint: "文章是博客主体。选择一个主题分类，正文在右侧 Markdown 编辑器里写。",
      existingLabel: "Open Article",
      existingNote: "选择已有文章继续编辑，或保持为空新建。",
      titleLabel: "Title",
      titleNote: "文章标题，也是新建文件名来源。",
      descriptionLabel: "Description",
      descriptionNote: "列表摘要、搜索结果和分享描述。",
      basicLabel: "Basic",
      basicNote: "文章需要语言和发布日期。",
      topicLabel: "Topic",
      topicNote: "选择 AI / SYSTEMS / WRITING / PLANNING 这类主题。",
    },
    topics: {
      heading: "New Topic",
      hint: "主题就是博客首页那排分类按钮。这里管理 AI、SYSTEMS、WRITING、PLANNING 这类主题。",
      existingLabel: "Topic Library",
      existingNote: "打开已有主题分类，编辑显示名、slug、描述和匹配关键词。",
      titleLabel: "Topic Label",
      titleNote: "显示在博客首页主题按钮和 /topics 页面。",
      descriptionLabel: "Topic Description",
      descriptionNote: "说明这个主题分类包含什么内容。",
      basicLabel: "Not Used",
      basicNote: "主题分类不需要语言和日期。",
      topicLabel: "",
      topicNote: "",
    },
    series: {
      heading: "New Series",
      hint: "系列是有顺序的阅读路径，和主题分类是两种不同东西。",
      existingLabel: "Open Series",
      existingNote: "打开已有系列，维护文章顺序。",
      titleLabel: "Series Name",
      titleNote: "系列页标题。",
      descriptionLabel: "Series Goal",
      descriptionNote: "说明这个系列解决什么问题，适合怎样阅读。",
      basicLabel: "Language",
      basicNote: "系列页语言，不需要日期。",
      topicLabel: "",
      topicNote: "",
    },
    resources: {
      heading: "New Resource",
      hint: "资源是论文、书籍、工具和链接收藏，和主题分类不同。",
      existingLabel: "Open Resource",
      existingNote: "打开已有资源继续补充说明。",
      titleLabel: "Resource Title",
      titleNote: "资源名称，例如论文名、书名或工具名。",
      descriptionLabel: "Why Keep It",
      descriptionNote: "说明为什么值得收藏。",
      basicLabel: "Basic",
      basicNote: "资源可以记录语言和日期。",
      topicLabel: "",
      topicNote: "",
    },
  };

  return copies[state.collection] ?? copies.posts;
}

function syncVisibility() {
  elements.topicField.classList.toggle("is-hidden", state.collection !== "posts");
  elements.topicDetailField.classList.toggle("is-hidden", state.collection !== "topics");
  elements.seriesField.classList.toggle("is-hidden", state.collection !== "series");
  elements.resourceField.classList.toggle("is-hidden", state.collection !== "resources");
  elements.basicField.classList.toggle("is-hidden", state.collection === "topics");
  elements.date.style.display = state.collection === "posts" || state.collection === "resources" ? "" : "none";
}

function renderTopicStrip() {
  const filters = state.topicFilters.length > 0 ? state.topicFilters : [{ slug: "all", title: "All", count: 0 }];
  elements.topicStrip.innerHTML = filters
    .map(filter => {
      const active = filter.slug === state.selectedTopicFilter;
      return `
        <button class="topic-filter" type="button" data-topic-filter="${escapeHtml(filter.slug)}" data-active="${active}">
          <span>${escapeHtml(filter.title).toUpperCase()}</span>
          <span class="topic-filter-count">${filter.count}</span>
        </button>
      `;
    })
    .join("");
}

function renderExistingSelect() {
  const current = state.filePath;
  const items = state.collection === "topics"
    ? state.topics
    : state.items.filter(item => item.collection === state.collection);

  elements.existingSelect.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = `选择已有${labelCollectionZh(state.collection)}`;
  elements.existingSelect.append(placeholder);

  for (const item of items) {
    const option = document.createElement("option");
    option.value = item.path;
    option.textContent = `${item.title}  |  ${item.path}`;
    elements.existingSelect.append(option);
  }

  elements.existingSelect.value = items.some(item => item.path === current) ? current : "";
}

function renderTopicSelect() {
  const current = elements.topicSelect.value;
  elements.topicSelect.innerHTML = "";

  const none = document.createElement("option");
  none.value = "";
  none.textContent = "选择主题分类";
  elements.topicSelect.append(none);

  for (const topic of state.topics) {
    const option = document.createElement("option");
    option.value = topic.slug;
    option.textContent = `${topic.title} (${topic.posts.length})`;
    elements.topicSelect.append(option);
  }

  elements.topicSelect.value = state.topics.some(topic => topic.slug === current) ? current : "";
}

function renderModeOverview() {
  if (state.collection === "topics") {
    renderTopicOverview();
    return;
  }
  if (state.collection === "series") {
    renderSeriesOverview();
    return;
  }
  if (state.collection === "resources") {
    renderResourceOverview();
    return;
  }
  renderArticleOverview();
}

function renderArticleOverview() {
  const posts = state.items
    .filter(item => item.collection === "posts")
    .filter(item => state.selectedTopicFilter === "all" || item.category === state.selectedTopicFilter);
  const label = state.selectedTopicFilter === "all"
    ? "全部文章"
    : `当前分类：${filterTitle(state.selectedTopicFilter)}`;
  const statusText = publishSummary(posts);

  elements.modeOverview.innerHTML = `
    <div class="overview-head">
      <h3>Article Queue</h3>
      <span>${escapeHtml(label)} / ${posts.length} 篇 / ${escapeHtml(statusText)}</span>
    </div>
    <div class="overview-grid">
      ${posts.length ? posts.map(renderMiniContentCard).join("") : `<div class="empty-note">这个主题分类下还没有文章。</div>`}
    </div>
  `;
}

function renderTopicOverview() {
  elements.modeOverview.innerHTML = `
    <div class="overview-head">
      <h3>Topic Map</h3>
      <span>这些就是博客首页上方的主题按钮</span>
    </div>
    <div class="overview-grid">
      ${
        state.topics.length
          ? state.topics.map(topic => `
              <article class="overview-card">
                <div>
                  <strong>${escapeHtml(topic.title)}</strong>
                  <div class="mini-meta">${escapeHtml(topic.slug)} / ${topic.posts.length} posts / keywords: ${escapeHtml((topic.patterns ?? []).join(", "))}</div>
                  <div class="pill-row">
                    ${
                      topic.posts.length
                        ? topic.posts.map(post => `<span class="mini-pill">${escapeHtml(post.title)}</span>`).join("")
                        : `<span class="mini-pill">暂无文章</span>`
                    }
                  </div>
                </div>
                <button class="mini-action" type="button" data-open-path="${escapeHtml(topic.path)}">Open</button>
              </article>
            `).join("")
          : `<div class="empty-note">还没有主题分类。新建 Topic 后会写入 src/data/topicCategories.json。</div>`
      }
    </div>
  `;
}

function renderSeriesOverview() {
  const series = state.items.filter(item => item.collection === "series");
  elements.modeOverview.innerHTML = `
    <div class="overview-head">
      <h3>Series Paths</h3>
      <span>系列只负责文章顺序，不属于主题分类</span>
    </div>
    <div class="overview-grid">
      ${
        series.length
          ? series.map(item => `
              <article class="overview-card">
                <div>
                  <strong>${escapeHtml(item.title)}</strong>
                  <div class="mini-meta">${item.posts.length} posts / ${escapeHtml(item.path)}</div>
                  <div class="pill-row">${item.posts.map(post => `<span class="mini-pill">${escapeHtml(post)}</span>`).join("") || `<span class="mini-pill">暂无顺序</span>`}</div>
                </div>
                <button class="mini-action" type="button" data-open-path="${escapeHtml(item.path)}">Open</button>
              </article>
            `).join("")
          : `<div class="empty-note">还没有系列。只有需要顺序阅读时才创建。</div>`
      }
    </div>
  `;
}

function renderResourceOverview() {
  const resources = state.items.filter(item => item.collection === "resources");
  elements.modeOverview.innerHTML = `
    <div class="overview-head">
      <h3>Resource Shelf</h3>
      <span>资源是独立收藏，不属于主题分类</span>
    </div>
    <div class="overview-grid">
      ${
        resources.length
          ? resources.map(item => `
              <article class="overview-card">
                <div>
                  <strong>${escapeHtml(item.title)}</strong>
                  <div class="mini-meta">${escapeHtml(item.resourceType)} / ${escapeHtml(item.url || item.path)}</div>
                  <div class="overview-note">${escapeHtml(item.description || "没有描述")}</div>
                </div>
                <button class="mini-action" type="button" data-open-path="${escapeHtml(item.path)}">Open</button>
              </article>
            `).join("")
          : `<div class="empty-note">还没有资源。资源用于论文、书、工具和链接。</div>`
      }
    </div>
  `;
}

function renderMiniContentCard(item) {
  const publish = normalizedPublishState(item);
  const topic = item.category ? filterTitle(item.category) : "未选择主题分类";
  return `
    <article class="overview-card">
      <div>
        <div class="card-title-row">
          <strong>${escapeHtml(item.title)}</strong>
          <span class="publish-pill ${escapeHtml(publish.kind)}">${escapeHtml(publish.label)}</span>
        </div>
        <div class="mini-meta">${escapeHtml(topic)} / ${escapeHtml(item.path)}</div>
        <div class="mini-meta">${escapeHtml(publish.detail)}</div>
        <div class="overview-note">${escapeHtml(item.description || "没有描述")}</div>
      </div>
      <button class="mini-action" type="button" data-open-path="${escapeHtml(item.path)}">Open</button>
    </article>
  `;
}

function publishSummary(items) {
  const counts = items.reduce((result, item) => {
    const kind = normalizedPublishState(item).kind;
    result[kind] = (result[kind] ?? 0) + 1;
    return result;
  }, {});

  return [
    counts.published ? `已发布 ${counts.published}` : "",
    counts.unpublished ? `未发布 ${counts.unpublished}` : "",
    counts.staged ? `已暂存 ${counts.staged}` : "",
    counts.changed ? `有修改 ${counts.changed}` : "",
    counts.draft ? `草稿 ${counts.draft}` : "",
  ].filter(Boolean).join(" / ") || "无文章";
}

function normalizedPublishState(item) {
  if (item.publishState) return item.publishState;
  if (item.draft) {
    return {
      kind: "draft",
      label: "DRAFT",
      detail: "草稿不会出现在公开博客里。",
    };
  }
  return {
    kind: "unknown",
    label: "UNKNOWN",
    detail: "还没有读取到 Git 发布状态。",
  };
}

function startNew(collection) {
  setDefaultContent(collection);
  renderAll();
}

function setDefaultContent(collection) {
  state.mode = "create";
  state.filePath = "";
  state.collection = collection || "posts";
  state.body = defaultBody(state.collection);

  elements.title.value = "";
  elements.description.value = "";
  elements.lang.value = "zh";
  elements.date.value = today();
  elements.topicSelect.value = "";
  elements.topicSlug.value = "";
  elements.topicPatterns.value = "";
  elements.resourceType.value = "link";
  elements.resourceUrl.value = "";
  elements.seriesPosts.value = "";
  elements.draft.checked = true;
  elements.featured.checked = false;
  elements.existingSelect.value = "";
  state.lastOutput = `New ${labelCollection(state.collection)} ready.`;
}

async function openExisting(filePath) {
  const response = await api(`/api/item?path=${encodeURIComponent(filePath)}`);
  const item = response.item;

  state.mode = "edit";
  state.filePath = item.path;
  state.collection = item.collection;
  state.body = item.body ?? "";

  elements.title.value = item.title;
  elements.description.value = item.description;
  elements.lang.value = item.lang || "zh";
  elements.date.value = item.date || today();
  elements.topicSelect.value = item.topics?.[0] ?? "";
  elements.topicSlug.value = item.slug ?? "";
  elements.topicPatterns.value = (item.patterns ?? []).join("\n");
  elements.resourceType.value = item.resourceType || "link";
  elements.resourceUrl.value = item.url || "";
  elements.seriesPosts.value = (item.posts ?? []).join("\n");
  elements.draft.checked = item.draft;
  elements.featured.checked = item.featured;
  state.lastOutput = `Opened ${item.path}`;

  renderAll();
}

function renderEditor() {
  renderRouteAndStatus();
  elements.markdownEditor.value = `${frontmatter()}\n\n${state.body || defaultBody(state.collection)}`;
}

function renderStatus() {
  const status = inspectCurrent();
  elements.statusBadge.textContent = status.label;
  elements.statusBadge.className = `status-badge ${status.kind}`;
  elements.statusTitle.textContent = status.title;
  elements.statusReasons.innerHTML = status.reasons.map(reason => `<li>${escapeHtml(reason)}</li>`).join("");
}

function renderOutput() {
  elements.output.textContent = state.lastOutput || "Ready.";
}

function inspectCurrent() {
  const data = currentData();
  const errors = [];
  const warnings = [];
  const notes = [];

  if (!data.title) errors.push("缺少标题，无法生成稳定标题。");
  if (!data.description) errors.push("缺少描述，列表、搜索和分享信息会不完整。");

  if (data.collection === "posts") {
    if (!data.date) errors.push("文章缺少发布日期。");
    if (data.topics.length === 0) warnings.push("文章未选择主题分类，首页主题按钮不会收录它。");
  }

  if (data.collection === "topics") {
    if (!data.slug && !data.title) errors.push("主题缺少 slug，无法生成 /topics 路径。");
    if (data.patterns.length === 0) warnings.push("主题还没有匹配关键词；文章可能无法自动归类。");
    notes.push("主题保存后会出现在博客首页筛选区和 /topics 页面。");
  }

  if (data.collection === "series" && data.posts.length === 0) {
    warnings.push("系列还没有文章顺序；保存可以，但页面内容会偏空。");
  }

  if (data.collection === "resources" && data.resourceType !== "note" && !data.url) {
    warnings.push("该资源没有 URL；如果只是普通笔记，可以把类型改成 note。");
  }

  if (data.collection !== "topics" && data.draft) {
    warnings.push("Draft 已开启。保存可以，但线上博客默认不会展示；正式发布前请取消 Draft。");
  }

  if (state.mode === "edit" && state.filePath) {
    notes.push(`正在编辑 ${state.filePath}`);
  } else {
    notes.push(`将创建 ${currentRoute().path}`);
  }

  if (errors.length > 0) {
    return {
      kind: "blocked",
      label: "FIX",
      title: "暂时不能发布",
      reasons: [...errors, ...warnings, ...notes],
    };
  }

  if (data.collection !== "topics" && data.draft) {
    return {
      kind: "draft",
      label: "DRAFT",
      title: "可以保存，暂不建议发布",
      reasons: [...warnings, ...notes],
    };
  }

  return {
    kind: "ready",
    label: "READY",
    title: warnings.length > 0 ? "可以发布，但有可优化项" : "可以发布",
    reasons: [...warnings, ...notes, "运行 Publish 后会保存、测试、构建、提交并推送到 GitHub。"],
  };
}

function currentData() {
  return {
    collection: state.collection,
    slug: elements.topicSlug.value.trim(),
    title: elements.title.value.trim(),
    description: elements.description.value.trim(),
    lang: elements.lang.value,
    date: elements.date.value.trim() || today(),
    topics: state.collection === "posts" && elements.topicSelect.value ? [elements.topicSelect.value] : [],
    series: [],
    posts: splitLines(elements.seriesPosts.value),
    patterns: splitLines(elements.topicPatterns.value),
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
    lines.push(`slug: ${data.slug || slugify(data.title)}`);
    lines.push(`label: "${escapeYaml(data.title)}"`);
    pushArray(lines, "patterns", data.patterns);
  } else if (data.collection === "series") {
    pushArray(lines, "posts", data.posts);
    lines.push(`draft: ${data.draft}`);
  } else {
    lines.push(`type: ${data.resourceType}`);
    if (data.url) lines.push(`url: "${escapeYaml(data.url)}"`);
    lines.push(`date: ${data.date}`);
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
  for (const value of values) lines.push(`  - "${escapeYaml(value)}"`);
}

function currentRoute() {
  const collection = state.collection;
  if (collection === "topics") {
    const slug = elements.topicSlug.value.trim() || slugify(elements.title.value);
    const publicPath = `/topics/${slug || "untitled"}/`;
    return {
      path: `topic:${slug || "untitled"}`,
      publicPath,
      publicUrl: `${state.siteUrl.replace(/\/+$/, "")}${encodePublicPath(publicPath)}`,
      localPreviewUrl: `${state.localPreviewUrl.replace(/\/+$/, "")}${encodePublicPath(publicPath)}`,
    };
  }

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
  const status = inspectCurrent();
  if (status.kind === "blocked") {
    state.lastOutput = status.reasons.join("\n");
    renderOutput();
    renderStatus();
    return;
  }

  if (action === "publish" && state.collection !== "topics" && elements.draft.checked) {
    state.lastOutput = "当前仍是 Draft。请取消 Draft 后再发布，否则线上博客不会显示。";
    renderOutput();
    renderStatus();
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
        data: currentData(),
        body: getMarkdownBody(elements.markdownEditor.value),
      }),
    });

    if (response.item) {
      state.mode = "edit";
      state.filePath = response.item.path;
      state.body = response.item.body ?? state.body;
      await loadContent();
    }

    state.lastOutput = response.output || response.message || (response.ok ? "Done." : response.error);
    if (!response.ok && response.error && response.output) {
      state.lastOutput = `${response.error}\n\n${response.output}`;
    }
    renderAll();
  } catch (error) {
    state.lastOutput = error instanceof Error ? error.message : String(error);
    renderOutput();
  } finally {
    setBusy(false);
  }
}

function setBusy(value) {
  for (const button of [elements.saveBtn, elements.checkBtn, elements.publishBtn]) {
    button.disabled = value;
  }
}

function defaultBody(collection) {
  if (collection === "topics") {
    return "";
  }
  if (collection === "series") {
    return ["## 系列说明", "", "说明这个系列适合怎样阅读，以及每篇文章之间的顺序关系。", "", "## 阅读顺序", "", "- ", ""].join("\n");
  }
  if (collection === "resources") {
    return ["## 资源说明", "", "说明这个资源是什么，为什么值得保存。", "", "## 备注", "", "- ", ""].join("\n");
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

function splitLines(value) {
  return String(value)
    .split(/[\n,，]/)
    .map(item => item.trim())
    .filter(Boolean);
}

function slugify(value) {
  return (
    String(value)
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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function today() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function topicTitle(slug) {
  return filterTitle(slug);
}

function filterTitle(slug) {
  if (!slug || slug === "all") return "All";
  return state.topicFilters.find(filter => filter.slug === slug)?.title ?? slug;
}

function labelCollection(collection) {
  if (collection === "posts") return "Article";
  if (collection === "topics") return "Topic";
  if (collection === "series") return "Series";
  return "Resource";
}

function labelCollectionZh(collection) {
  if (collection === "posts") return "文章";
  if (collection === "topics") return "主题";
  if (collection === "series") return "系列";
  return "资源";
}

function byId(id) {
  return document.getElementById(id);
}
