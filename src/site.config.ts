/**
 * 站点级文案的唯一事实源。模板里不要硬编码这些字。
 */
export const SITE = {
  /** 站点全名 */
  name: 'SeekDeeply-反应体系',
  /** 短名 */
  short: '反应体系',
  /** 签名 */
  tagline: '创意杂烩，技术熔炉',
  /** 描述，用于 meta description / RSS */
  description: '创意杂烩，技术熔炉。一个关于科技、生活与创意的个人站点，由 SeekDeeply 维护。',
  /** 站长 */
  author: 'SeekDeeply',
  /** 联系方式 */
  email: 'i9888888885@163.com',
  github: 'https://github.com/SeekDeeply',
  githubName: 'SeekDeeply',
  /** 部署位置：仓库子路径 */
  url: 'https://seekdeeply.github.io',
  base: '/Blog',
  /** 语言 */
  locale: 'zh-CN',
  lang: 'zh',
  /** 首页展示的最新文章数 */
  latestCount: 5,
  /** 固定标签：id 走 URL，label 用于展示与写作 */
  tags: [
    { id: 'tech', label: '科技' },
    { id: 'life', label: '生活' },
    { id: 'idea', label: '创意' },
  ],
} as const;

export type TagDef = (typeof SITE.tags)[number];
export type TagLabel = TagDef['label'];

/** 中文标签 → URL 片段 */
export function tagToSlug(label: string): string {
  const found = SITE.tags.find((tag) => tag.label === label);
  return found ? found.id : encodeURIComponent(label);
}

/** URL 片段 → 中文标签 */
export function slugToTag(slug: string): string {
  const found = SITE.tags.find((tag) => tag.id === slug);
  return found ? found.label : decodeURIComponent(slug);
}
