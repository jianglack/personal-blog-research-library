# LouisJiang

一个基于 AstroPaper 改造的个人研究博客与长期知识库。作者 louis，软件工程背景，正在转向大模型方向。网站以静态方式生成，内容按文章、主题、系列和资源组织，并通过 GitHub Actions 自动部署到 Cloudflare Pages。

线上地址：

```text
https://louisjiang.pages.dev/
```

GitHub 仓库：

```text
https://github.com/jianglack/personal-blog-research-library
```

## 项目定位

- 写长期技术笔记，而不是短动态。
- 记录技术学习、博客写作和自我感想随笔。
- 内容体验优先于个人展示。
- 每篇文章只使用一种语言，支持中文和英文混合归档。
- 使用 `src/content/` 作为公开 Obsidian vault。
- 使用 Pagefind 提供静态搜索。
- 使用 RSS、sitemap 和静态页面，保持长期免费友好。

## 公开信息

- 作者：louis
- 邮箱：zslouis8605@gmail.com
- GitHub：https://github.com/jianglack
- 站点名称：LouisJiang
- 头像：`public/avatar.jpg`，来自 Wikimedia Commons 上的公有领域尼采肖像。

## 内容结构

```text
src/content/
  posts/       正式文章和长笔记
  topics/      主题页
  series/      系列页
  resources/   论文、书籍、工具、链接和参考资料
  pages/       About 等静态页面
  templates/   Obsidian 写作模板，不发布
```

Obsidian 直接打开这个目录：

```text
D:\personal-blog-research-library\src\content
```

写作流程见：

```text
docs/writing/obsidian-workflow.md
```

## 本地开发

安装依赖：

```powershell
pnpm install
```

启动本地预览：

```powershell
pnpm dev
```

运行测试：

```powershell
pnpm test
```

构建静态网站：

```powershell
pnpm build
```

## 发布流程

当前使用 GitHub Actions 自动部署。

```text
git push 到 master
  -> GitHub Actions
  -> pnpm test
  -> pnpm build
  -> wrangler pages deploy dist
  -> Cloudflare Pages
```

自动部署配置：

```text
.github/workflows/deploy-cloudflare-pages.yml
```

Cloudflare Pages 部署说明：

```text
docs/deployment/cloudflare-pages.md
```

## 常用命令

| Command        | Action                                     |
| -------------- | ------------------------------------------ |
| `pnpm dev`     | 启动本地开发服务器                         |
| `pnpm test`    | 运行 Vitest 测试                           |
| `pnpm build`   | 类型检查、构建静态站点并生成 Pagefind 索引 |
| `pnpm preview` | 本地预览构建结果                           |
| `pnpm format`  | 格式化代码                                 |
| `pnpm lint`    | 运行 ESLint                                |

## 技术栈

- Astro
- AstroPaper
- TypeScript
- Tailwind CSS
- Pagefind
- GitHub Actions
- Cloudflare Pages

## 维护原则

- 不把私密笔记同步进 `src/content/`。
- 发布前确认 `draft: false` 只出现在准备公开的内容中。
- 大文件、视频和原始数据不要直接放进仓库。
- 修改文章后推送到 `master` 即会触发自动部署。
- 自定义域名尚未接入；`LouisJiang` 当前作为站点公开名称使用。
- 评论、分析和 CMS 暂不属于当前版本范围。

## License

MIT. This project is adapted from AstroPaper.
