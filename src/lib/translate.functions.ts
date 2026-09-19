import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

const schema = z.object({
  text: z.string().min(1).max(5000),
  from: z.string().default('en'),
  to: z.string().default('ar'),
});

/**
 * Free translation (same public endpoint used by free-translate-api).
 * No API key required.
 */
export const translateText = createServerFn({ method: 'POST' })
  .inputValidator((d) => schema.parse(d))
  .handler(async ({ data }) => {
    const url =
      'https://translate.googleapis.com/translate_a/single?client=gtx' +
      `&sl=${encodeURIComponent(data.from)}&tl=${encodeURIComponent(data.to)}&dt=t&q=${encodeURIComponent(data.text)}`;

    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error(`Translation failed (${res.status})`);

    const json = (await res.json()) as any;
    const chunks: string[] = Array.isArray(json?.[0])
      ? json[0].map((c: any) => (Array.isArray(c) ? c[0] : '')).filter(Boolean)
      : [];
    const translated = chunks.join('');
    if (!translated) throw new Error('Empty translation response');
    return { translated };
  });
