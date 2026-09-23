// ======================================================
// Route Information
// Original WordPress URLs: post blog dengan prefix /ubud/discoverl/
// (daftar slug dihasilkan dari POSTS di src/data/posts.ts)
//
// Current Next.js Route:
// src/app/ubud/discoverl/[slug]/page.tsx
//
// Kenapa prefix ini punya route sendiri: WordPress menerbitkan post di
// beberapa prefix berbeda (/ubud/discoverl salah satunya). Setiap prefix butuh segmen
// route-nya sendiri agar URL terbit tetap identik dengan situs live.
//
// Jika slug/prefix berubah: ubah field `path` di src/data/posts.ts, lalu
// sesuaikan nama folder route ini.
// ======================================================

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostPage, findPost } from "@/components/property/PostPage";
import { getPostPaths } from "@/sanity/lib/content";
import { resolveDocumentMetadata } from "@/sanity/lib/metadata";

const PREFIX = "/ubud/discoverl";
type Params = { slug: string };

/**
 * Paths come from Sanity when posts are published there and from
 * src/data/posts.ts otherwise — see getPostPaths. This is what is
 * prerendered at build time; `dynamicParams = true` below means a post
 * published after that build still resolves.
 */
export async function generateStaticParams(): Promise<Params[]> {
  const paths = await getPostPaths();
  return paths
    .filter((path) => path.startsWith(PREFIX + "/"))
    .map((path) => ({ slug: path.slice(PREFIX.length + 1) }));
}

/**
 * A slug that was not in the list above is rendered on its first request
 * rather than 404ing, so a post published in the Studio is live without a
 * deploy. `notFound()` below still answers anything that matches no document,
 * so this widens what can render, not what exists.
 */
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  // The published post's own SEO fields win; anything it leaves empty falls
  // back to the live site's title and description in src/data/seo.ts.
  const path = `${PREFIX}/${(await params).slug}`;
  return resolveDocumentMetadata(path, await findPost(path));
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const post = await findPost(`${PREFIX}/${(await params).slug}`);
  if (!post) notFound();
  return <PostPage post={post} />;
}
