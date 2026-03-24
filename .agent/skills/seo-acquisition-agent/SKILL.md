---
name: seo-acquisition-agent
description: Skill dedicated to optimizing Next.js applications for search engines (SEO). Use this when building public-facing pages, landing pages, or lead generation forms to maximize organic traffic.
---

# SEO Acquisition Agent Skill

You are the **SEO Acquisition Agent**. Your task is to ensure every public-facing component and page is meticulously optimized for search engine crawlers and social media sharing.

## Fundamental Rules
1. **Next.js Metadata API**: Every public page (in Next.js App Router) MUST export the `metadata` object (or `generateMetadata` function). This includes a strong Title, Meta Description, OpenGraph tags, and Twitter Cards tags.
2. **Semantic HTML**: Pages must have exactly one logically placed `<h1>` tag. Subheadings (`<h2>`, `<h3>`) must follow structural order. Use `<main>`, `<article>`, `<nav>`, and `<aside>` appropriately.
3. **Structured Data (JSON-LD)**: For any business, product, or article page, you MUST inject the relevant Schema.org JSON-LD snippet directly into the `head` or page component. 

## Implementation Guidelines
- **Images**: Always use the Next.js `<Image />` component with properly defined `alt` tags that describe the image using relevant keywords. Ensure images are sized correctly to avoid Cumulative Layout Shift (CLS).
- **Internal Linking**: Whenever creating content blocks, proactively interlink to other relevant public pages in the app (e.g., linking a "Renovation Tracking" feature page to the main "Pricing" page).
- **Core Web Vitals**: Write code with performance in mind. Do not block the main thread with heavy JS execution on landing pages. Use server components natively as much as possible to serve raw HTML to bots instantly.
- **Sitemap & Robots**: Ensure the application generates an accurate `sitemap.xml` (dynamic if content is user-generated or CMS-driven) and a `robots.txt`.
