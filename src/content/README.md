# LouisJiang 写作 Vault

在 Obsidian 里打开这个文件夹：

```text
D:\personal-blog-research-library\src\content
```

这是博客的公开写作区。放进这里并提交到 GitHub 的内容，都有可能出现在网站上。私人笔记、未整理材料、账号信息、API Key、密码、聊天记录原文，不要放进这个文件夹。

线上网站：

```text
https://louisjiang.pages.dev/
```

## 最短发布流程：Obsidian Git 半自动同步

1. 在 Obsidian 里写 Markdown。
2. 正式文章放到 `posts/`。
3. 草稿阶段保持 `draft: true`。
4. 准备发布时改成 `draft: false`。
5. 在 Obsidian 里打开命令面板：

```text
Ctrl + P
```

6. 执行：

```text
Git: Commit-and-sync
```

7. GitHub Actions 会自动检查、构建并部署到 Cloudflare Pages。

Obsidian Git 插件已经按半自动方式配置：

- 不自动提交。
- 不自动推送。
- 手动执行 `Git: Commit-and-sync` 时，会提交、拉取远端更新并推送到 GitHub。
- 默认提交信息是 `content: sync obsidian notes {{date}}`。

如果 Obsidian 没看到 Git 命令，重启 Obsidian 后进入：

```text
设置 -> 第三方插件 -> Git
```

确认插件已启用。

## 常用文件夹

- `posts/`：正式文章、长笔记、学习记录。
- `topics/`：主题页，例如大模型推理、系统工程。
- `series/`：系列页，用来组织一组有顺序的文章。
- `resources/`：论文、书籍、工具、链接和参考资料。
- `pages/`：静态页面，例如 About。
- `templates/`：写作模板，不会发布。

本地草稿和临时收集可以放在这些被 Git 忽略的目录：

- `drafts/`
- `inbox/`
- `.trash/`

## 新建文章

可以复制：

```text
templates/post.md
```

到：

```text
posts/your-note-slug.md
```

文章开头保留 frontmatter：

```yaml
---
title: "文章标题"
date: 2026-06-01
lang: zh
description: "用一句话说明这篇文章写什么。"
tags: ["学习"]
topics: []
series: []
draft: true
featured: false
---
```

常用字段含义：

- `title`：文章标题。
- `date`：发布日期。
- `lang`：`zh` 或 `en`。
- `description`：列表页、搜索和 RSS 里使用的简介。
- `tags`：标签。
- `topics`：关联主题，填写主题文件名，不带 `.md`。
- `series`：关联系列，填写系列文件名，不带 `.md`。
- `draft`：`true` 表示草稿，`false` 表示发布。
- `featured`：是否在首页优先展示。

示例：

```yaml
topics: ["llm-reasoning"]
series: ["llm-notes"]
```

对应文件：

```text
topics/llm-reasoning.md
series/llm-notes.md
```

## 本地预览

如果想先看网页效果：

```powershell
cd D:\personal-blog-research-library
pnpm dev
```

然后打开：

```text
http://127.0.0.1:4324/
```

如果端口不是 `4324`，看终端里显示的 `Local` 地址。

## 发布前检查

发布前至少确认：

- `draft: false` 只出现在准备公开的内容里。
- 标题、日期、简介都正确。
- 图片和链接能打开。
- 关联的 `topics` 和 `series` 文件存在。
- 没有提交私密内容。
- `pnpm test` 通过。
- `pnpm build` 通过。

日常小改动可以直接用 Obsidian Git 同步，让 GitHub Actions 在云端执行检查和构建。改了很多文件、加了图片、或者不确定页面效果时，再手动运行本地预览和构建。

## 自动部署

你不需要手动上传 Cloudflare。

只要在 Obsidian 里执行：

```text
Git: Commit-and-sync
```

流程就是：

```text
GitHub -> GitHub Actions -> pnpm test -> pnpm build -> Cloudflare Pages -> louisjiang.pages.dev
```

部署配置文件：

```text
.github/workflows/deploy-cloudflare-pages.yml
```

更详细的写作说明在：

```text
docs/writing/obsidian-workflow.md
```
