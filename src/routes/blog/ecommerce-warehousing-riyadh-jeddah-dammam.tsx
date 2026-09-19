import { createFileRoute } from "@tanstack/react-router";
import { BlogPostLayout } from "@/components/blog/BlogPostLayout";
import { getBlogPost } from "@/data/blogPosts";

const post = getBlogPost("ecommerce-warehousing-riyadh-jeddah-dammam");

export const Route = createFileRoute("/blog/ecommerce-warehousing-riyadh-jeddah-dammam")({
  head: () => ({
    meta: [
      { title: post.metaTitle },
      { name: "description", content: post.metaDescription },
      { property: "og:title", content: post.metaTitle },
      { property: "og:description", content: post.metaDescription },
      { property: "og:type", content: "article" },
      { property: "og:url", content: `https://tejaraa.com/blog/${post.slug}` },
    ],
    links: [{ rel: "canonical", href: `https://tejaraa.com/blog/${post.slug}` }],
  }),
  component: () => <BlogPostLayout post={post} />,
});
