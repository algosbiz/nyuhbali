// ======================================================
// Route Information
// CMS-authored pages. This route has no WordPress equivalent — it exists so
// an editor can publish a page in /studio that no hand-written route covers.
//
// Current Next.js Route:
// src/app/[...slug]/page.tsx  (catch-all, prerendered via generateStaticParams
// from `page` documents in Sanity)
//
// Why a catch-all, and why it is safe next to the other 44 routes: Next.js
// gives a static route priority over a catch-all, so every existing page —
// /ubud, /seminyak/spa, /terms-conditions — keeps serving its own file. This
// only ever answers paths nothing else claims. `/` is excluded too, because
// `[...slug]` (not `[[...slug]]`) requires at least one segment.
//
// If a CMS path later gains its own route file, that file wins automatically
// and the document keeps working through ManagedPage instead.
// ======================================================

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PropertyHeader } from "@/components/property/PropertyHeader";
import { PropertyFooter } from "@/components/property/PropertyFooter";
import { DirectBookingDeals } from "@/components/property/DirectBookingDeals";
import PageBuilder from "@/components/sanity/PageBuilder";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { getPropertySite, getSanityPage, getSanityPagePaths } from "@/sanity/lib/content";
import { ROUTE_SEO, seo } from "@/data/seo";
import { resolveDocumentMetadata } from "@/sanity/lib/metadata";

type Params = { slug: string[] };

/**
 * Only paths that no hand-written route already owns. A `page` document
 * published at, say, `/ubud/spa` is not listed here — that route has its own
 * file, which Next.js prefers anyway — so the two can never fight over it.
 */
export async function generateStaticParams(): Promise<Params[]> {
  const paths = await getSanityPagePaths();
  return paths
    .filter((path) => path !== "/")
    // A path a hand-written route already owns is skipped rather than
    // prerendered twice. Next.js prefers the static route either way, so this
    // is not a correctness fix — it stops the catch-all building pages nothing
    // can ever reach, now that existing routes take their content from a `page`
    // document through `ManagedPage`. `ROUTE_SEO` is the list of published
    // paths this project ships, which is exactly the set to exclude.
    .filter((path) => !(path in ROUTE_SEO))
    .map((path) => ({ slug: path.slice(1).split("/") }));
}

/**
 * A path that was not in the list above is rendered on its first request
 * rather than 404ing, so a page the client publishes in the Studio is live
 * without a deploy — which is what this route was built for. `notFound()`
 * below still answers any path with no `page` document behind it.
 *
 * The cost is that an unmatched URL is computed rather than served from a
 * prebuilt 404, and this catch-all sits at the root, so every stray request
 * on the site reaches it. Cloudflare caches that 404 like any other response
 * and a publish purges the zone — so a path that 404s today and is created
 * tomorrow goes live with the publish, not on the next deploy.
 */
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const path = `/${(await params).slug.join("/")}`;
  const page = await getSanityPage(path);
  // `seo(path)` finds nothing for a path only Sanity knows about — that is the
  // whole point of this route — but it still supplies the canonical link and
  // the Open Graph block for it, which a CMS-authored page needs as much as a
  // hand-written one. The document's own title fills the one field `ROUTE_SEO`
  // cannot.
  return resolveDocumentMetadata(path, page, {
    ...seo(path),
    title: page?.title,
  });
}

export default async function CmsPage({ params }: { params: Promise<Params> }) {
  const path = `/${(await params).slug.join("/")}`;
  const page = await getSanityPage(path);
  if (!page) notFound();

  // Chrome is per property, not per page — the same reason the legal pages
  // hard-code Ubud's rather than taking it as content. An editor picks which
  // property a page belongs to; everything else follows from that.
  const site = await getPropertySite(page.property ?? "ubud");

  return (
    <>
      <PropertyHeader site={site} activeHref={path} />
      <main>
        <BreadcrumbJsonLd path={path} name={page.title} />
        <PageBuilder sections={page.sections} site={site} />
      </main>
      <PropertyFooter site={site} />
      <DirectBookingDeals bookingHref={site.bookingHref} />
    </>
  );
}
