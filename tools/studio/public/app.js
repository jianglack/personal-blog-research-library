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
  readingPath: byId("readingPath"),
  keyQuestions: byId("keyQuestions"),
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
    elements.readingPath,
    elements.keyQuestions,
    elements.resourceType,
    elements.resourceUrl,
    elements.seriesPosts,
    elements.draft,
    elements.featured,
  ]) {
    input.addEventListener("input", () => renderFromFields());
    input.addEventListener("change", () => renderFromFields());
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
  const copy = {
    posts: {
      heading: "New Article",
      hint: "文章是博客主体。写标题、描述、归属主题，正文在右侧 Markdown 编辑器里写。",
      existingLabel: "Open Article",
      existingNote: "选择已有文章继续编辑，或保持为空新建。",
      titleLabel: "Title",
      titleNote: "文章标题，也是新建文件名来源。",
      descriptionLabel: "Description",
      descriptionNote: "列表摘要、搜索结果和分享描述。",
      basicLabel: "Basic",
      basicNote: "文章需要语言和发布日期。",
      topicLabel: "Topic",
      topicNote: "选择文章归属的主题；首页会自动归类到对应主题按钮。",
    },
    topics: {
      heading: "New Topic",
      hint: "主题用于长期归类。这里可以看到现有主题、每个主题下的文章，并新增主题。",
      existingLabel: "Topic Library",
      existingNote: "打开已有主题编辑边界、阅读路径和关键问题。",
      titleLabel: "Topic Name",
      titleNote: "显示在博客首页主题按钮和主题页标题。",
      descriptionLabel: "Boundary",
      descriptionNote: "说明这个主题收集什么，不收集什么。",
      basicLabel: "Language",
      basicNote: "主题页语言，不需要日期。",
      topicLabel: "Parent Topic",
      topicNote: "",
    },
    series: {
      heading: "New Series",
      hint: "系列用于有顺序的学习路径。只有需要连续阅读时再创建。",
      existingLabel: "Open Series",
      existingNote: "打开已有系列，维护文章顺序。",
      titleLabel: "Series Name",
      titleNote: "系列页标题。",
      descriptionLabel: "Series Goal",
      descriptionNote: "说明这个系列解决什么问题，适合怎样阅读。",
      basicLabel: "Language",
      basicNote: "系列页语言，不需要日期。",
      topicLabel: "Related Topic",
      topicNote: "可选：把系列挂到一个主题下。",
    },
    resources: {
      heading: "New Resource",
      hint: "资源用于论文、书、工具和链接。它们是参考材料，不和文章混在一起。",
      existingLabel: "Open Resource",
      existingNote: "打开已有资源继续补充说明。",
      titleLabel: "Resource Title",
      titleNote: "资源名称，例如论文名、书名或工具名。",
      descriptionLabel: "Why Keep It",
      descriptionNote: "说明为什么值得收藏，以及和哪个问题有关。",
      basicLabel: "Basic",
      basicNote: "资源可以记录语言和日期。",
      topicLabel: "Related Topic",
      topicNote: "可选：把资源挂到一个主题下。",
    },
  }[state.collection];

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

function syncVisibility() {
  elements.topicField.classList.toggle("is-hidden", state.collection === "topics");
  elements.topicDetailField.classList.toggle("is-hidden", state.collection !== "topics");
  elements.seriesField.classList.toggle("is-hidden", state.collection !== "series");
  elements.resourceField.classList.toggle("is-hidden", state.collection !== "resources");
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
  const items = state.items.filter(item => item.collection === state.collection);
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
  none.textContent = "不关联主题";
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

  elements.modeOverview.innerHTML = `
    <div class="overview-head">
      <h3>Article Queue</h3>
      <span>${escapeHtml(label)} / ${posts.length} 篇</span>
    </div>
    <div class="overview-grid">
      ${posts.length ? posts.map(renderMiniContentCard).join("") : `<div class="empty-note">这个主题下还没有文章。新建文章并选择该主题后，首页会自动归类。</div>`}
    </div>
  `;
}

function renderTopicOverview() {
  elements.modeOverview.innerHTML = `
    <div class="overview-head">
      <h3>Topic Map</h3>
      <span>主题会变成博客首页上方的筛选按钮</span>
    </div>
    <div class="overview-grid">
      ${
        state.topics.length
          ? state.topics.map(topic => `
              <article class="overview-card">
                <div>
                  <strong>${escapeHtml(topic.title)}</strong>
                  <div class="mini-meta">${escapeHtml(topic.slug)} / ${topic.posts.length} 篇文章 / ${topic.resources.length} 个资源</div>
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
          : `<div class="empty-note">还没有主题。先建一个主题，再给文章选择这个主题。</div>`
      }
    </div>
  `;
}

function renderSeriesOverview() {
  const series = state.items.filter(item => item.collection === "series");
  elements.modeOverview.innerHTML = `
    <div class="overview-head">
      <h3>Series Paths</h3>
      <span>只有需要顺序阅读时才使用</span>
    </div>
    <div class="overview-grid">
      ${
        series.length
          ? series.map(item => `
              <article class="overview-card">
                <div>
                  <strong>${escapeHtml(item.title)}</strong>
                  <div class="mini-meta">${item.posts.length} 篇文章 / ${item.topics.map(topicTitle).join(", ") || "未关联主题"}</div>
                  <div class="pill-row">${item.posts.map(post => `<span class="mini-pill">${escapeHtml(post)}</span>`).join("") || `<span class="mini-pill">暂无顺序</span>`}</div>
                </div>
                <button class="mini-action" type="button" data-open-path="${escapeHtml(item.path)}">Open</button>
              </article>
            `).join("")
          : `<div class="empty-note">还没有系列。系列适合课程式、路径式内容，不需要时可以不建。</div>`
      }
    </div>
  `;
}

function renderResourceOverview() {
  const resources = state.items.filter(item => item.collection === "resources");
  elements.modeOverview.innerHTML = `
    <div class="overview-head">
      <h3>Resource Shelf</h3>
      <span>论文、书籍、工具、链接和参考材料</span>
    </div>
    <div class="overview-grid">
      ${
        resources.length
          ? resources.map(item => `
              <article class="overview-card">
                <div>
                  <strong>${escapeHtml(item.title)}</strong>
                  <div class="mini-meta">${escapeHtml(item.resourceType)} / ${item.topics.map(topicTitle).join(", ") || "未关联主题"}</div>
                  <div class="overview-note">${escapeHtml(item.description || "没有描述")}</div>
                </div>
                <button class="mini-action" type="button" data-open-path="${escapeHtml(item.path)}">Open</button>
              </article>
            `).join("")
          : `<div class="empty-note">还没有资源。资源不会打扰文章列表，只在资源页和主题页里辅助阅读。</div>`
      }
    </div>
  `;
}

function renderMiniContentCard(item) {
  const status = item.draft ? "draft" : "ready";
  const topics = item.topics.map(topicTitle).join(", ") || "未关联主题";
  return `
    <article class="overview-card">
      <div>
        <strong>${escapeHtml(item.title)}</strong>
        <div class="mini-meta">${escapeHtml(status)} / ${escapeHtml(topics)} / ${escapeHtml(item.path)}</div>
        <div class="overview-note">${escapeHtml(item.description || "没有描述")}</div>
      </div>
      <button class="mini-action" type="button" data-open-path="${escapeHtml(item.path)}">Open</button>
    </article>
  `;
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
  elements.readingPath.value = "";
  elements.keyQuestions.value = "";
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
  elements.lang.value = item.lang;
  elements.date.value = item.date || today();
  elements.topicSelect.value = item.topics[0] ?? "";
  elements.readingPath.value = (item.readingPath ?? []).join("\n");
  elements.keyQuestions.value = (item.keyQuestions ?? []).join("\n");
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

  if (!data.title) errors.push("缺少标题，无法生成稳定文件名和页面标题。");
  if (!data.description) errors.push("缺少描述，列表、搜索和分享信息会不完整。");

  if (data.collection === "posts") {
    if (!data.date) errors.push("文章缺少发布日期。");
    if (data.topics.length === 0) warnings.push("文章未选择主题，首页主题按钮不会收录它。");
  }

  if (data.collection === "topics") {
    if (data.readingPath.length === 0) warnings.push("主题还没有阅读路径；可以之后补。");
    if (data.keyQuestions.length === 0) warnings.push("主题还没有关键问题；可以之后补。");
    notes.push("主题保存后会出现在博客首页的主题筛选区。");
  }

  if (data.collection === "series" && data.posts.length === 0) {
    warnings.push("系列还没有文章顺序；保存可以，但页面内容会偏空。");
  }

  if (data.collection === "resources" && data.resourceType !== "note" && !data.url) {
    warnings.push("该资源没有 URL；如果只是普通笔记，可以把类型改成 note。");
  }

  if (data.draft) {
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

  if (data.draft) {
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
    title: elements.title.value.trim(),
    description: elements.description.value.trim(),
    lang: elements.lang.value,
    date: elements.date.value.trim() || today(),
    topics: elements.topicSelect.value ? [elements.topicSelect.value] : [],
    series: [],
    posts: splitLines(elements.seriesPosts.value),
    readingPath: splitLines(elements.readingPath.value),
    keyQuestions: splitLines(elements.keyQuestions.value),
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
    pushArray(lines, "readingPath", data.readingPath);
    pushArray(lines, "keyQuestions", data.keyQuestions);
    lines.push(`draft: ${data.draft}`);
  } else if (data.collection === "series") {
    pushArray(lines, "posts", data.posts);
    pushArray(lines, "topics", data.topics);
    lines.push(`draft: ${data.draft}`);
  } else {
    lines.push(`type: ${data.resourceType}`);
    if (data.url) lines.push(`url: "${escapeYaml(data.url)}"`);
    pushArray(lines, "topics", data.topics);
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

  if (action === "publish" && elements.draft.checked) {
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
    return ["这个主题用于长期收集同一类问题下的文章、资源和思考。", "", "## 主题说明", "", "说明这个主题为什么重要，以及它和其他主题的边界。", ""].join("\n");
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
  if (!slug || slug === "all") return "All";
  return state.topics.find(topic => topic.slug === slug)?.title ?? slug;
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
