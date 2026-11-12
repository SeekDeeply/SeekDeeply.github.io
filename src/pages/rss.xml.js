import rss from '@astrojs/rss';
import { SITE } from '../site.config';
import { abs } from '../consts';
import { getPublishedPosts } from '../lib/content';

export async function GET() {
  const posts = await getPublishedPosts();
  const items = posts.slice(0, 20);

  return rss({
    title: SITE.name,
    description: SITE.description,
    // @astrojs/rss 不会自动补 base，channel 与 item 的 link 一律给带前缀的绝对地址
    site: abs('/'),
    customData: '<language>zh-cn</language>',
    items: items.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: abs(`/posts/${post.id}`),
      categories: [...post.data.tags],
    })),
  });
}
