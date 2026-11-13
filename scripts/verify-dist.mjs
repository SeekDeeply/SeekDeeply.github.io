#!/usr/bin/env node
/**
 * 产物断言：构建完成、Pagefind 索引生成之后运行。
 * 把"上线之后才发现"的问题挪到"上线之前"。
 * 纯 Node，无第三方依赖。
 */
import { readFile, readdir } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';

/** 存在且是普通文件（目录不能算命中） */
function isFile(target) {
  try {
    return statSync(target).isFile();
  } catch {
    return false;
  }
}
import path from 'node:path';

const DIST = process.argv[2] ?? 'dist';
const SITE_URL = 'https://seekdeeply.github.io';
// 用户站部署在根路径；若日后改回子路径，只需改这一个常量
const BASE = '/';
const BASE_TRAILING = BASE;
const ORIGIN = new URL(BASE, SITE_URL).href;

const errors = [];
const warnings = [];
const stats = {
  html: 0,
  posts: 0,
  links: 0,
  sitemapUrls: 0,
  rssItems: 0,
  pages: 0,
};

const fail = (message) => errors.push(message);
const warn = (message) => warnings.push(message);

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

/* ---------- 1. 必需产物 ---------- */
const REQUIRED = [
  'index.html',
  'rss.xml',
  'sitemap-index.xml',
  'favicon.svg',
  'robots.txt',
  'search/index.html',
  'tags/index.html',
  'about/index.html',
  'projects/index.html',
  'friends/index.html',
  'sponsor/index.html',
  'pagefind/pagefind.js',
  'pagefind/pagefind-entry.json',
];

if (!existsSync(DIST)) {
  console.error(`[verify-dist] 产物目录不存在：${DIST}`);
  process.exit(1);
}

for (const file of REQUIRED) {
  if (!existsSync(path.join(DIST, file))) fail(`缺少必需产物：${file}`);
}

// 404 页面：Astro 输出 404.html；GitHub Pages 依赖这个位置
if (!existsSync(path.join(DIST, '404.html')) && !existsSync(path.join(DIST, '404/index.html'))) {
  fail('缺少 404 页面（既没有 404.html 也没有 404/index.html）');
}

const htmlFiles = (await walk(DIST)).filter((file) => file.endsWith('.html'));
stats.html = htmlFiles.length;
stats.posts = htmlFiles.filter((file) => path.relative(DIST, file).split(path.sep)[0] === 'posts').length;

if (errors.length > 0) finish(); // 基本目录都不对，后面的检查没意义

/* ---------- 2. 站内链接：前缀 + 可达性 ---------- */
const ATTR = /\b(href|src|action|poster)\s*=\s*"([^"]*)"/g;
const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

function stripBase(value) {
  if (BASE_TRAILING === '/') {
    // 根路径部署：任何以 '/' 开头的站内路径都是合法的
    return value.startsWith('/') ? value : null;
  }
  if (value === BASE || value + '/' === BASE_TRAILING) return '/';
  if (value.startsWith(BASE_TRAILING)) return value.slice(BASE_TRAILING.length - 1);
  return null;
}

function resolveTarget(cleanPath) {
  const withoutSuffix = cleanPath.split('#')[0].split('?')[0];
  if (withoutSuffix === '' || withoutSuffix === '/') return path.join(DIST, 'index.html');

  const variants = [withoutSuffix];
  try {
    const decoded = decodeURIComponent(withoutSuffix);
    if (decoded !== withoutSuffix) variants.push(decoded);
  } catch {
    /* 非法百分号编码，忽略解码分支 */
  }

  for (const variant of variants) {
    const relative = variant.replace(/^\//, '');
    const candidates = [
      path.join(DIST, relative),
      path.join(DIST, relative, 'index.html'),
      path.join(DIST, relative + '.html'),
    ];
    const hit = candidates.find(isFile);
    if (hit) return hit;
  }

  return null;
}

/**
 * 只扫描真正的标签，跳过注释与 <script>/<style> 内容。
 * 否则正文里出现的 `href="/xxx"` 这类示例代码会被误判成链接。
 */
function extractTags(html) {
  const withoutComments = html.replace(/<!--[\s\S]*?-->/g, '');
  const withoutRawText = withoutComments.replace(
    /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,
    (match) => match.replace(/[^<>]+/g, ''),
  );
  return [...withoutRawText.matchAll(/<[a-zA-Z][^>]*>/g)].map((match) => match[0]);
}

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const page = path.relative(DIST, file);
  const pageDir = path.posix.dirname('/' + page.split(path.sep).join('/'));

  for (const tag of extractTags(html)) {
    for (const match of tag.matchAll(ATTR)) {
      const value = match[2];
      if (!value || EXTERNAL.test(value)) continue;
      if (value.startsWith('#') || value.startsWith('data:')) continue;

      stats.links += 1;

      if (!value.startsWith('/')) {
        const resolved = path.posix.join(pageDir, value);
        if (!resolveTarget(resolved)) fail(`${page}: 相对链接指向不存在的产物 -> ${value}`);
        continue;
      }

      const clean = stripBase(value);
      if (clean === null) {
        fail(`${page}: 站内链接缺少 ${BASE} 前缀 -> ${value}`);
        continue;
      }

      if (!resolveTarget(clean)) fail(`${page}: 站内链接指向不存在的产物 -> ${value}`);
    }
  }
}

/* ---------- 3. sitemap ---------- */
const sitemapParts = (await walk(DIST)).filter((file) => /^sitemap-\d+\.xml$/.test(path.basename(file)));
if (sitemapParts.length === 0) fail('没有找到 sitemap-N.xml');

for (const file of sitemapParts) {
  const xml = await readFile(file, 'utf8');
  for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const loc = match[1].trim();
    stats.sitemapUrls += 1;
    if (!loc.startsWith(ORIGIN)) fail(`sitemap: <loc> 前缀错误 -> ${loc}`);
  }
}

if (stats.sitemapUrls === 0) fail('sitemap 中没有任何 <loc>');

/* ---------- 4. RSS ---------- */
const rssPath = path.join(DIST, 'rss.xml');
if (existsSync(rssPath)) {
  const xml = await readFile(rssPath, 'utf8');

  if (!/<rss[^>]+version="2\.0"/.test(xml)) fail('rss.xml 不是合法的 RSS 2.0');

  const channel = xml.match(/<channel>[\s\S]*?<link>([^<]+)<\/link>/);
  if (!channel) fail('rss.xml 缺少 channel/link');
  else if (!channel[1].trim().startsWith(ORIGIN)) fail(`rss.xml: channel/link 前缀错误 -> ${channel[1]}`);

  const links = [...xml.matchAll(/<link>([^<]+)<\/link>/g)].map((m) => m[1].trim());
  const itemLinks = links.filter((link) => !link.startsWith(ORIGIN + 'rss.xml') && !link.startsWith(SITE_URL + BASE));
  stats.rssItems = (xml.match(/<item>/g) ?? []).length;

  if (stats.rssItems === 0) fail('rss.xml 没有任何 <item>');

  for (const match of xml.matchAll(/<item>[\s\S]*?<link>([^<]+)<\/link>/g)) {
    const link = match[1].trim();
    if (!link.startsWith(ORIGIN)) fail(`rss.xml: item link 不是带前缀的绝对地址 -> ${link}`);
  }

  void itemLinks;
}

/* ---------- 5. Pagefind ---------- */
const entryPath = path.join(DIST, 'pagefind/pagefind-entry.json');
if (existsSync(entryPath)) {
  const entry = JSON.parse(await readFile(entryPath, 'utf8'));
  const languages = entry.languages ?? {};
  const keys = Object.keys(languages);

  const hasChinese = keys.some((key) => key.toLowerCase().startsWith('zh'));
  if (!hasChinese) fail(`pagefind: 期望中文索引，实际为 ${keys.join(', ') || '(空)'}`);

  stats.pages = keys.reduce((sum, key) => sum + (languages[key]?.page_count ?? 0), 0);
  if (stats.pages <= 0) fail('pagefind: 索引里没有任何页面');
}

/* ---------- 6. 首页 SEO / 无障碍 ---------- */
const homePath = path.join(DIST, 'index.html');
if (existsSync(homePath)) {
  const html = await readFile(homePath, 'utf8');

  if (!/<html[^>]+lang="zh-CN"/.test(html)) fail('首页缺少 <html lang="zh-CN">');

  const h1Count = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1Count !== 1) fail(`首页应有且只有一个 <h1>，实际 ${h1Count} 个`);

  if (!/<title>[^<]{2,}<\/title>/.test(html)) fail('首页 <title> 为空');
  if (!/<meta\s+name="description"\s+content="[^"]{10,}"/.test(html)) fail('首页缺少有效的 meta description');
  if (!/<link\s+rel="canonical"\s+href="https:\/\/seekdeeply\.github\.io\/"/.test(html)) {
    fail('首页 canonical 不是 https://seekdeeply.github.io/');
  }
}

if (stats.posts === 0) warn('产物中没有任何文章页');

/* ---------- 7. 各页面标题与描述 ---------- */
for (const file of htmlFiles) {
  const page = path.relative(DIST, file).split(path.sep).join('/');
  if (page.startsWith('pagefind/')) continue;

  const html = await readFile(file, 'utf8');

  if (!/<title>[^<]{2,}<\/title>/.test(html)) fail(`${page}: <title> 为空`);
  if (!/<meta\s+name="description"\s+content="[^"]{10,}"/.test(html)) {
    fail(`${page}: 缺少 meta description`);
  }

  const headings = (html.match(/<h1[\s>]/g) ?? []).length;
  if (headings !== 1) fail(`${page}: 应有且只有一个 <h1>，实际 ${headings} 个`);
}

finish();

function finish() {
  for (const message of warnings) console.warn('[verify-dist] 警告：' + message);

  if (errors.length > 0) {
    console.error(`\n[verify-dist] 失败，共 ${errors.length} 个问题：`);
    for (const message of errors.slice(0, 60)) console.error('  x ' + message);
    if (errors.length > 60) console.error(`  ... 还有 ${errors.length - 60} 个`);
    process.exit(1);
  }

  console.log('[verify-dist] 通过');
  console.log(`  HTML 页面 ${stats.html} / 文章页 ${stats.posts}`);
  console.log(`  检查链接 ${stats.links} 条`);
  console.log(`  sitemap URL ${stats.sitemapUrls} 条`);
  console.log(`  RSS 条目 ${stats.rssItems} 条`);
  console.log(`  Pagefind 页面 ${stats.pages} 个`);
  process.exit(0);
}
