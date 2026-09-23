import { PropertyHeader } from "@/components/property/PropertyHeader";
import { PropertyFooter } from "@/components/property/PropertyFooter";
import { DirectBookingDeals } from "@/components/property/DirectBookingDeals";
import { PropertyHero } from "@/components/property/PropertyHero";
import { PostBody } from "@/components/property/PostBody";
import { PostGrid } from "@/components/property/PostGrid";
import { ReadingProgress } from "@/components/property/ReadingProgress";
import { AwardsRow } from "@/components/property/AwardsRow";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { getPostByPath, getPosts, getPropertySite, getSiteLabels } from "@/sanity/lib/content";
import type { ResolvedPost } from "@/sanity/lib/content";

type PostPageProps = { post: ResolvedPost };

/**
 * A whole blog-post page — chrome, hero, body and "more from the blog".
 *
 * The live site scatters posts across several URL prefixes (/ubud/discover/,
 * /ubud/spa/, /ubud/retreat/ and even a misspelt /ubud/discoverl/). Each of
 * those needs its own Next.js route segment to keep the published URL
 * identical, so the *page* lives here once and every route file is a thin
 * wrapper that looks the post up and renders this.
 *
 * There was a fifth, the bare /life-coach-retreat-benefits/. WordPress retired
 * that URL — it 301s to /ubud/wellness/life-coach — so it is a redirect in
 * next.config.ts now rather than a route.
 *
 * It resolves its own chrome and related posts rather than taking them as
 * props, so the five route files that render it did not each have to learn
 * how to ask Sanity for them.
 */
export async function PostPage({ post }: PostPageProps) {
  const site = await getPropertySite(post.property);
  const labels = await getSiteLabels();

  // Three more posts from the same property, newest first, excluding this one.
  const related = (await getPosts(post.property))
    .filter((item) => item.path !== post.path)
    .slice(0, 3);

  return (
    <>
      <PropertyHeader site={site} activeHref={`/${post.property}/discover`} />
      {/* Article pages only — it would be meaningless on a listing page. */}
      <ReadingProgress />
      <main>
        <BreadcrumbJsonLd path={post.path} name={post.title} />
        <PropertyHero
          images={[post.image]}
          alt={post.title}
          eyebrow={labels.blog}
          title={post.title}
        />

        <PostBody post={post} blogLabel={labels.blog} />

        {related.length ? (
          // `featured={false}`: this is a "more from the blog" footer, so the
          // three cards stay an even row. Leading one of them at full width
          // would out-shout the article the reader is already on.
          <PostGrid
            heading={labels.blog}
            posts={related}
            tone="sand-deep"
            featured={false}
          />
        ) : null}

        <AwardsRow variant={site.awards.variant} badges={site.awards.badges} />
      </main>
      <PropertyFooter site={site} />
      <DirectBookingDeals bookingHref={site.bookingHref} />
    </>
  );
}

/**
 * Shared lookup so every post route resolves paths the same way. Prefers a
 * published Sanity post and falls back to src/data/posts.ts.
 */
export function findPost(path: string) {
  return getPostByPath(path);
}
