import { JsonLd } from '@/components/JsonLd';
import { SellerPublicShell } from '@/components/seller/shell/SellerPublicShell';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Link } from '@/lib/router-compat';
import { CheckCircle2, ArrowRight, BookOpen, Table2 } from 'lucide-react';
import { SellerContainer } from '@/components/seller/common/SellerContainer';
import { SellerSectionHeading } from '@/components/seller/common/SellerSectionHeading';
import { BlogArticleHero } from './BlogArticleHero';
import { BlogRegistrationCTA } from './BlogRegistrationCTA';
import type { BlogPost } from '@/data/blogPosts';

export function BlogPostLayout({ post }: { post: BlogPost }) {
  const url = `https://tejaraa.com/blog/${post.slug}`;

  return (
    <SellerPublicShell>
      <JsonLd data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Article',
              headline: post.title,
              description: post.metaDescription,
              author: { '@type': 'Organization', name: 'Tejaraa.com' },
              publisher: { '@type': 'Organization', name: 'Tejaraa.com' },
              datePublished: post.date,
              dateModified: post.date,
              mainEntityOfPage: { '@type': 'WebPage', '@id': url },
            },
            {
              '@type': 'FAQPage',
              mainEntity: post.faqs.map((faq) => ({
                '@type': 'Question',
                name: faq.q,
                acceptedAnswer: { '@type': 'Answer', text: faq.a },
              })),
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tejaraa.com/' },
                { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://tejaraa.com/blog' },
                { '@type': 'ListItem', position: 3, name: post.title, item: url },
              ],
            },
          ],
        }} />
      <main className="font-blog-body flex-1 bg-retail-page">
        <BlogArticleHero icon={BookOpen} category={post.category} title={post.title} excerpt={post.excerpt} date={post.date} />

        <section className="py-9 lg:py-11">
          <SellerContainer className="max-w-5xl space-y-8">
          {post.sections.map((section, i) => (
            <article key={section.heading} className="grid gap-4 border-t border-retail-border pt-6 md:grid-cols-[0.34fr_0.66fr] md:gap-8">
              <div><span className="text-xs font-extrabold text-retail-medium-green">0{i + 1}</span><h2 className="font-blog-heading mt-1 text-xl font-bold text-retail-dark-green">{section.heading}</h2></div>
              <div className="space-y-3 text-sm leading-6 text-retail-muted">
                {section.paragraphs.map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
                {section.bullets && (
                  <ul className="grid gap-2 pt-2 sm:grid-cols-2">
                    {section.bullets.map((b, k) => (
                      <li key={k} className="flex items-start gap-2.5">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-retail-green" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {section.table && (
                  <div className="overflow-hidden rounded-md border border-retail-border pt-1">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[600px] text-sm">
                        <thead>
                          <tr className="bg-retail-light-green">
                            {section.table.headers.map((h, hi) => (
                              <th key={hi} className="px-4 py-3 text-left font-semibold text-retail-dark-green">
                                <span className="inline-flex items-center gap-1.5">
                                  <Table2 className="h-3.5 w-3.5 text-retail-green" />
                                  {h}
                                </span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {section.table.rows.map((row, ri) => (
                            <tr key={ri} className={ri % 2 === 1 ? 'bg-retail-light-green/30' : 'bg-retail-card'}>
                              {row.map((cell, ci) => (
                                <td
                                  key={ci}
                                  className={`px-4 py-3 align-top ${ci === 0 ? 'font-medium text-retail-text' : 'text-retail-muted'}`}
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))}
          </SellerContainer>
        </section>
        <section className="border-t border-retail-border py-8 lg:py-9">
          <SellerContainer className="max-w-4xl">
            <SellerSectionHeading eyebrow="FAQ" title="Frequently asked questions" align="center" />
            <Accordion type="single" collapsible className="w-full">
              {post.faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left text-sm font-bold text-retail-dark-green">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-sm leading-6 text-retail-muted">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </SellerContainer>
        </section>
        <BlogRegistrationCTA />
        <section className="border-t border-retail-border bg-retail-page py-7"><SellerContainer className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase text-retail-medium-green">Keep learning</p><h2 className="font-blog-heading mt-1 text-xl font-bold text-retail-dark-green">More seller guides</h2></div><Link to="/blog" className="inline-flex items-center gap-1 text-sm font-bold text-retail-green">View all <ArrowRight className="h-4 w-4" aria-hidden /></Link></SellerContainer></section>
      </main>
    </SellerPublicShell>
  );
}
