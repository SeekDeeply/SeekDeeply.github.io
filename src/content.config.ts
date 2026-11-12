import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { SITE } from './site.config';

const ALLOWED_TAGS: string[] = SITE.tags.map((tag) => tag.label);

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string().min(2).max(80),
    description: z.string().min(10).max(160),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z
      .array(
        z
          .string()
          .refine((value) => ALLOWED_TAGS.includes(value), {
            message: `标签只能是 ${ALLOWED_TAGS.join(' / ')}`,
          }),
      )
      .min(1),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
