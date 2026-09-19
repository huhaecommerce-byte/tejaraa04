import { createFileRoute } from "@tanstack/react-router";
import { SellerPublicShell } from "@/components/seller/shell/SellerPublicShell";
import { SellerContainer } from "@/components/seller/common/SellerContainer";
import { BlogRegistrationCTA } from "@/components/blog/BlogRegistrationCTA";
import { Link } from "@/lib/router-compat";
import { blogPosts } from "@/data/blogPosts";
import { ArrowRight, BookOpen, Boxes, Globe2, Landmark, Store } from "lucide-react";

const allPosts = blogPosts.map((p) => ({
  slug: p.slug,
  category: p.category,
  title: p.title,
  excerpt: p.excerpt,
}));

const categoryIcons = {
  Sourcing: Globe2,
  Fulfillment: Boxes,
  'Selling Channels': Store,
  Compliance: Landmark,
} as const;

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Tejaraa — E-commerce Guides — Product sourcing, labelling fulfillment and dropshipping for saudi arabia" },
      {
        name: "description",
        content:
          "Practical guides for Saudi sellers. Source, label and fulfill products across Saudi Arabia. Vetted suppliers, bulk and dropshipping, SABER support, warehousing and COD delivery.",
      },
      { property: "og:title", content: "Tejaraa — E-commerce Guides — Product sourcing, labelling fulfillment and dropshipping for saudi arabia" },
      {
        property: "og:description",
        content:
          "Practical guides for Saudi sellers. Source, label and fulfill products across Saudi Arabia. Vetted suppliers, bulk and dropshipping, SABER support, warehousing and COD delivery.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://tejaraa.com/blog" },
    ],
    links: [{ rel: "canonical", href: "https://tejaraa.com/blog" }],
  }),
  component: BlogIndexPage,
});

function BlogIndexPage() {
  const featured = allPosts.slice(0, 2);
  const remaining = allPosts.slice(2);

  return (
    <SellerPublicShell>
      <main className="font-blog-body flex-1 bg-retail-page">
        <section className="hero-surface relative overflow-hidden py-9 text-primary-foreground lg:py-11">
          <div aria-hidden className="hero-grid pointer-events-none absolute inset-0 opacity-15" />
          <SellerContainer className="relative grid items-end gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)] lg:gap-12">
            <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs font-bold uppercase text-retail-gold">
              <BookOpen className="h-3.5 w-3.5 text-retail-gold" aria-hidden />
              Seller resources
            </span>
            <h1 className="font-blog-heading mt-3 text-3xl font-extrabold leading-[1.12] sm:text-4xl lg:text-[2.45rem]">
              Practical guides for Saudi sellers
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-primary-foreground/80">
              Sourcing, customs, marketplaces and fulfillment — practical playbooks for selling online in Saudi Arabia.
            </p>
            </div>
            <div className="grid grid-cols-3 gap-3 border-l border-primary-foreground/20 pl-5">
              <div><strong className="font-blog-heading block text-xl">{allPosts.length}</strong><span className="text-xs text-primary-foreground/65">Guides</span></div>
              <div><strong className="font-blog-heading block text-xl">4</strong><span className="text-xs text-primary-foreground/65">Topics</span></div>
              <div><strong className="font-blog-heading block text-xl">KSA</strong><span className="text-xs text-primary-foreground/65">Focused</span></div>
            </div>
          </SellerContainer>
        </section>

        <section className="py-9 lg:py-11">
          <SellerContainer>
            <div className="flex flex-col justify-between gap-4 border-b border-retail-border pb-5 sm:flex-row sm:items-end">
              <div><p className="text-xs font-bold uppercase text-retail-medium-green">Latest insights</p><h2 className="font-blog-heading mt-1 text-2xl font-extrabold text-retail-dark-green">Start with these guides</h2></div>
              <div className="flex flex-wrap gap-2 text-xs font-bold text-retail-muted"><span className="rounded-md bg-retail-dark-green px-3 py-2 text-primary-foreground">All guides</span><span className="rounded-md border border-retail-border px-3 py-2">Sourcing</span><span className="rounded-md border border-retail-border px-3 py-2">Fulfillment</span><span className="rounded-md border border-retail-border px-3 py-2">Selling channels</span></div>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {featured.map((post) => {
                const Icon = categoryIcons[post.category as keyof typeof categoryIcons] ?? BookOpen;
                return <Link key={post.slug} to={`/blog/${post.slug}`} className="group grid min-h-48 overflow-hidden rounded-lg border border-retail-border bg-retail-card sm:grid-cols-[0.38fr_0.62fr]">
                  <div className="grid min-h-32 place-items-center bg-retail-light-green text-retail-green"><Icon className="h-10 w-10" aria-hidden /></div>
                  <div className="flex flex-col p-5"><span className="text-xs font-bold uppercase text-retail-medium-green">{post.category}</span><h3 className="font-blog-heading mt-2 text-lg font-bold leading-snug text-retail-dark-green group-hover:text-retail-green">{post.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-retail-muted">{post.excerpt}</p><span className="mt-auto pt-3 text-sm font-bold text-retail-green">Read guide <ArrowRight className="ml-1 inline h-3.5 w-3.5" aria-hidden /></span></div>
                </Link>;
              })}
            </div>
            <div className="mt-5 grid overflow-hidden rounded-lg border border-retail-border bg-retail-border sm:grid-cols-2 lg:grid-cols-3">
              {remaining.map((post) => (
                <Link key={post.slug} to={`/blog/${post.slug}`} className="group flex min-h-44 flex-col bg-retail-card p-5 outline outline-1 outline-retail-border transition-colors hover:bg-retail-light-green/40">
                  <span className="text-[0.7rem] font-bold uppercase text-retail-medium-green">{post.category}</span>
                  <h2 className="font-blog-heading mt-2 text-base font-bold leading-snug text-retail-dark-green group-hover:text-retail-green">{post.title}</h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-5 text-retail-muted">{post.excerpt}</p>
                  <span className="mt-auto pt-3 text-xs font-bold text-retail-green">Read guide <ArrowRight className="ml-1 inline h-3.5 w-3.5" aria-hidden /></span>
                </Link>
              ))}
            </div>
          </SellerContainer>
        </section>
        <BlogRegistrationCTA />
      </main>
    </SellerPublicShell>
  );
}
