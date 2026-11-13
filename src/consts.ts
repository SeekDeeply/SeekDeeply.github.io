import { SITE } from './site.config';

/** 由 astro.config.mjs 的 base + trailingSlash 推导。根路径部署时就是 '/' */
const rawBase = import.meta.env.BASE_URL ?? '/';
export const BASE = rawBase === '/' ? '/' : rawBase.replace(/\/*$/, '/');

export const HOME = BASE;
export const FEED = BASE + 'rss.xml';
export const SITEMAP = BASE + 'sitemap-index.xml';

/**
 * 站内路径 → 可用的 href。模板里禁止手写 href="/xxx"。
 *   p('/')          -> '/'
 *   p('/tags')      -> '/tags/'
 *   p('/rss.xml')   -> '/rss.xml'
 *   p('/tags/#top') -> '/tags/#top'
 *   外链与 mailto 原样返回
 */
export function p(input = '/'): string {
  if (!input || input === '/') return BASE;
  if (/^[a-z][a-z0-9+.-]*:/i.test(input) || input.startsWith('//')) return input;

  const clean = input.startsWith('/') ? input.slice(1) : input;
  const match = clean.match(/^([^?#]*)([?#].*)?$/);
  const pathname = match?.[1] ?? '';
  const suffix = match?.[2] ?? '';

  if (!pathname) return BASE + suffix;

  const isFile = /\.[a-z0-9]{1,8}$/i.test(pathname);
  const normalized = isFile || pathname.endsWith('/') ? pathname : pathname + '/';
  return BASE + normalized + suffix;
}

/** 绝对地址：canonical / OG / RSS */
export function abs(input = '/'): string {
  return new URL(p(input), SITE.url).href;
}

export const NAV = [
  { label: '首页', path: '/' },
  { label: '标签', path: '/tags' },
  { label: '搜索', path: '/search' },
  { label: '关于', path: '/about' },
] as const;

/** 2026年11月12日 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/** 2026-11-12 */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
