# SeekDeeply-反应体系

> 创意杂烩，技术熔炉

个人博客的源码。基于 [Astro](https://astro.build) 构建，托管在 GitHub Pages。

**线上地址**：<https://seekdeeply.github.io/Blog/>

---

## 这条流水线的规矩

**本地不构建。**

所有构建、检查、索引、发布都在 GitHub Actions 里完成。本地只做一件事：改文件，然后 `git push`。

这么定的理由很简单：构建环境每次都从空镜像开始，结果可复现；出错时能在日志里定位到具体一步；任何一台设备都能发文章。

## 写一篇新文章

1. 在 `src/content/posts/` 下新建 Markdown 文件，文件名就是 URL，例如 `hello-world.md` → `/posts/hello-world/`。
2. 写 frontmatter：

```yaml
---
title: 文章标题
description: 一句话摘要，会出现在列表、RSS 与搜索里
pubDate: 2026-11-12
tags:
  - 科技
---

正文……
```

3. 提交并推送：

```bash
git add .
git commit -m "post: 文章标题"
git push
```

4. 打开仓库的 **Actions** 页面，等 `Deploy` 跑完，几分钟后线上更新。

字段说明：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | 2–80 字 |
| `description` | 是 | 10–160 字，用于列表摘要、meta description、RSS |
| `pubDate` | 是 | `YYYY-MM-DD` |
| `updatedDate` | 否 | 修订日期，页面会显示「修订于」 |
| `tags` | 是 | 至少一个，只能是 `科技` / `生活` / `创意` |
| `draft` | 否 | `true` 时不参与构建 |

也可以在 GitHub 网页上直接新建 Markdown 文件，效果一样——推送即发布。

## 发布流水线做了什么

`push main` 触发 `.github/workflows/deploy.yml`：

1. 检出代码
2. 安装 Node 24，用锁文件恢复依赖（`npm ci`）
3. `astro sync`：生成内容集合的类型
4. `astro check`：类型与模板检查，出错就停
5. `astro build`：生成静态产物到 `dist/`
6. `pagefind --site dist`：在产物上建中文全文索引
7. `node scripts/verify-dist.mjs`：产物断言（见下）
8. 上传产物并部署到 GitHub Pages
9. 部署后自动冒烟：逐条 `curl` 关键路径，任何一个不是 200 就让 workflow 失败

`pull_request` 触发 `.github/workflows/ci.yml`，跑同样的检查但不部署。

## 产物断言在检查什么

`scripts/verify-dist.mjs` 是上线前的最后一道机器闸门：

- 必需产物存在（首页、404、RSS、sitemap、搜索页、Pagefind 索引）
- 所有 HTML 里的站内链接都带 `/Blog` 前缀，并且指向真实存在的产物
- sitemap 里每个 `<loc>` 都以 `https://seekdeeply.github.io/Blog/` 开头
- RSS 可解析，条目链接都是带前缀的绝对地址
- Pagefind 索引语言是 `zh`，且页面数大于 0
- 首页有 `lang="zh-CN"`、唯一的 `<h1>`、非空的 title 与 description、正确的 canonical

任何一条不满足，构建就失败，不会部署。

## 目录结构

```text
src/
  site.config.ts        站点级文案的唯一来源（站名、签名、联系方式、标签）
  consts.ts             派生常量：BASE、p() 链接助手、导航、日期格式
  content.config.ts     文章集合的 schema
  content/posts/        文章 Markdown
  lib/content.ts        取文章、按标签统计、阅读时长
  layouts/              BaseLayout（head/SEO/主题）、PostLayout
  components/           Glyph、Header、Footer、PostCard、TagChips、ThemeToggle
  pages/                首页、文章、标签、关于、搜索、404、rss.xml
  styles/global.css     全部样式，色板来自头像
public/                 favicon.svg、robots.txt、OG 图
scripts/verify-dist.mjs 产物断言
.github/workflows/      deploy.yml、ci.yml
```

## 几个约定

**站内链接一律走 `p()`。** 站点部署在子路径 `/Blog/` 下，所有站内绝对路径都要带前缀。模板里禁止手写 `href="/xxx"`，交给 `p()` 处理：

```ts
p('/')            // → /Blog/
p('/tags')        // → /Blog/tags/
p('/rss.xml')     // → /Blog/rss.xml
```

**站点文案只写在 `site.config.ts`。** 改站名、签名、邮箱，只改这一个文件。

**样式只有一份，色板只有一套。** 浅色：纸底 `#f0f0f0`、墨字 `#16181a`、薄荷 `#8cdfaf`（只做填充，正文链接用加深的 `#176b43` 保证对比度）。深色模式自动跟随系统，也可以手动切换。

## 本地开发（可选）

本地构建被禁止，但如果你想预览，可以自己装依赖：

```bash
npm install
npm run dev
```

注意：本地开发时站内搜索不可用，因为 `pagefind` 索引只在 CI 构建后生成。

---

[![](https://img.shields.io/badge/powered_by-dsh-4D6BFE?style=flat-square&logo=deepseek&logoColor=white)](https://github.com/deepseek-ai/deepseek-harness)
