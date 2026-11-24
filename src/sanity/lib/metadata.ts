import type { Metadata } from "next";
import { seo } from "@/data/seo";
import { getSanityPage, getSiteSettings } from "@/sanity/lib/content";
import { sanityImageUrl } from "@/sanity/lib/image";
import type { SanitySeo } from "@/sanity/types";

/**
 * One SEO block laid over a route's existing metadata, field by field.
 *
 * Field-level rather than document-level, for the same reason
 * `getPropertySite` falls back per field: an editor who fills in a social
 * description and nothing else should not lose the title the route already
 * publishes. Every route can adopt this without changing a byte of what it
 * emits today.
 *
 * The Open Graph pair falls back to the search pair, which is what the live
 * site publishes — Yoast sends the same string to both. `og:image` stays
 * absent unless someone sets one, because the live site publishes none and
 * picking a photograph to stand for the whole business is a brand decision,
 * not a default to invent.
 */
function applySeo(fallback: Metadata, document: SanitySeo | undefined, path: string): Metadata {
  if (!document) return fallback;

  const title = document.title;
  const description = document.description || fallback.description;
  const image = sanityImageUrl(document.image);
  const ogTitle = document.ogTitle || title || fallback.openGraph?.title;
  const ogDescription =
    document.ogDescription ||
    (typeof description === "string" ? description : undefined);

  return {
    ...fallback,
    title: title ? { absolute: title } : fallback.title,
    description,
    // A canonical is written as a path and resolved against `metadataBase`,
    // exactly as `seo()` writes it. An absolute URL typed in the Studio is
    // for the one case that needs it — this page handing its ranking to
    // another — so it is passed through as given.
    alternates: { canonical: document.canonicalUrl || path },
    robots: document.noIndex ? { index: false, follow: false } : fallback.robots,
    openGraph: {
      ...fallback.openGraph,
      title: ogTitle,
      description: ogDescription,
      url: document.canonicalUrl || path,
      images: image
        ? [{ url: image, alt: document.image?.alt || title || "Nyuh Bali Villas" }]
        : fallback.openGraph?.images,
    },
  };
}

/**
 * Uses Sanity SEO only when a published page exists; otherwise preserves the
 * route's own metadata from src/data/seo.ts.
 */
export async function resolvePageMetadata(
  path: string,
  fallback: Metadata = seo(path),
): Promise<Metadata> {
  const page = await getSanityPage(path);
  if (!page) return fallback;
  return applySeo(fallback, page.seo, page.path);
}

/**
 * The page's `<title>` and meta description as plain strings, for a JSON-LD
 * `WebPage` node to restate.
 *
 * Read through `resolvePageMetadata` — the same call the route's
 * `generateMetadata` makes — rather than from the Sanity document directly,
 * so the structured data cannot disagree with the head: a title set in the
 * Studio wins in both, and an empty one falls back to `src/data/seo.ts` in
 * both. Publishing revalidates the page's tag, so the two change together.
 */
export async function resolveWebPageText(
  path: string,
): Promise<{ name?: string; description?: string }> {
  return metadataText(await resolvePageMetadata(path));
}

/** The same two strings out of metadata that has already been resolved — for
 *  the routes backed by their own document rather than by a `page`. */
export function metadataText({ title, description }: Metadata): {
  name?: string;
  description?: string;
} {
  let name: string | undefined;
  if (typeof title === "string") name = title;
  else if (title && "absolute" in title) name = title.absolute;
  else if (title && "default" in title) name = title.default;
  return {
    name,
    description: typeof description === "string" ? description : undefined,
  };
}

/**
 * For routes backed by their own document type (post, room, experience,
 * legal page) rather than by a `page`. The document's own SEO wins, then the
 * route's existing metadata fills the rest.
 */
export function resolveDocumentMetadata(
  path: string,
  document: { seo?: SanitySeo } | null,
  fallback: Metadata = seo(path),
): Metadata {
  return applySeo(fallback, document?.seo, path);
}

/**
 * The site-wide defaults, for the root layout.
 *
 * Only the pages with no `seo.ts` entry of their own reach these — Next's
 * `/_not-found` and `/_global-error` — because every content route states its
 * own title and description. It is still worth reading from the CMS: the site
 * name here is what `og:site_name` carries on every page, and an editor
 * renaming the business should not need a deploy to do it.
 */
export async function resolveSiteMetadata(fallback: Metadata): Promise<Metadata> {
  const settings = await getSiteSettings();
  if (!settings) return fallback;

  const favicon = sanityImageUrl(settings.favicon, 180);
  const description =
    settings.defaultSeo?.description || settings.description || fallback.description;
  // The **default SEO title**, not the site name. They are different things
  // and the document has a field for each: "Nyuh Bali Villas" is what
  // `og:site_name` says, while a browser tab wants the full published title.
  // Taking the site name here would have retitled the 404 page.
  const title = settings.defaultSeo?.title;

  return {
    ...fallback,
    title: title ? { absolute: title } : fallback.title,
    description,
    openGraph: settings.title
      ? { ...fallback.openGraph, siteName: settings.title }
      : fallback.openGraph,
    icons: favicon ? { icon: favicon } : fallback.icons,
  };
}
