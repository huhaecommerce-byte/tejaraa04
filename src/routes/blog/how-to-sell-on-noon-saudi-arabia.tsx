import { createFileRoute } from "@tanstack/react-router";
import { BlogPostLayout } from "@/components/blog/BlogPostLayout";
import { getBlogPost } from "@/data/blogPosts";

const post = getBlogPost("how-to-sell-on-noon-saudi-arabia");

export const Route = createFileRoute("/blog/how-to-sell-on-noon-saudi-arabia")({
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
