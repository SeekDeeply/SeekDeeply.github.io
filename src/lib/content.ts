import { getCollection, type CollectionEntry } from 'astro:content';
import { SITE } from '../site.config';

export type Post = CollectionEntry<'posts'>;

/** 已发布文章，按发布时间倒序 */
export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

/** 标签（中文）→ 文章数；固定标签即使 0 篇也保留 */
export function countByTag(posts: Post[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const tag of SITE.tags) counts.set(tag.label, 0);
  for (const post of posts) {
    for (const tag of post.data.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return counts;
}

/** 中文按字符数估算阅读时长，约 400 字/分钟 */
export function readingMinutes(body: string): number {
  const chars = body.replace(/\s/g, '').length;
  return Math.max(1, Math.round(chars / 400));
}
