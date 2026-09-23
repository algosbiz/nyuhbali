// ======================================================
// Route Information
// WordPress slug:        /sitemap_index.xml  (Yoast, split into
//                        /page-sitemap.xml + /post-sitemap.xml)
// Current Next.js Route: /sitemap.xml
//
// Next's own file convention serves one flat sitemap rather than Yoast's
// index-of-two. 71 live URLs do not need splitting — Google's limit is 50,000
// — and one file means one URL to submit and one place to look. The three old
// Yoast paths redirect here permanently (see next.config.ts), so a crawler or
// a Search Console property that still knows them is not left on a 404.
// ======================================================

import type { MetadataRoute } from "next";
import { ROUTE_SEO, SITE_ORIGIN } from "@/data/seo";
import { ROUTE_LASTMOD } from "@/data/sitemap";
import { getPostPaths, getSanityPagePaths } from "@/sanity/lib/content";

/**
 * Prefixes under which a blog post has a route to be served by.
 *
 * Posts are published at several unrelated prefixes on the live site, and each
 * one has its own thin route wrapping `PostPage` (`/ubud/discover/[slug]`,
 * `/seminyak/discover/[slug]`, the misspelt `/ubud/discoverl/[slug]`, and
 * `/ubud/spa/[slug]`). A post published in the Studio under any other path has
 * nowhere to render — the root catch-all answers `page` documents, not posts,
 * so any other prefix is a 404 — so it must not be advertised here. The two posts that live outside these prefixes
 * (`/ubud/retreat/detox` and `/ubud/wellness/yoga/retreat`) have standalone
 * route files and are already in `ROUTE_SEO`, so they are covered by the base
 * list below.
 *
 * A third used to: the bare `/life-coach-retreat-benefits`. WordPress now
 * 301s it to `/ubud/wellness/life-coach`, so this build redirects it too and
 * it is out of `ROUTE_SEO` — which is the whole of what keeps it out of this
 * file, since it matches no prefix above either. Yoast still lists it in the
 * live `/post-sitemap.xml`; that is the live site's own loose end, not one to
 * copy.
 */
const POST_ROUTE_PREFIXES = [
  "/ubud/discover/",
  "/seminyak/discover/",
  "/ubud/discoverl/",
  "/ubud/spa/",
];

/**
 * The four routes this site serves but does not advertise.
 *
 * Three are the in-room directories and one is staff onboarding. A guest
 * reaches a directory by scanning the QR code on the card beside the bed, and
 * a new employee is sent the onboarding link directly; nothing on the site
 * links to any of them, and none of the four is in the live site's sitemap
 * either. They are built so those QR codes and links keep resolving — that is
 * the whole reason — and listing them would be inviting a crawl of pages that
 * exist to be arrived at, not found.
 *
 * This is the one exception to the rule below, and it is stated as four
 * literal paths rather than a pattern so it cannot quietly grow.
 */
const UNLISTED = new Set([
  "/seminyak-directory",
  "/ubud-directory",
  "/suite-directory",
  "/welcomeaboard",
]);

/**
 * Every page this site publishes, as absolute URLs with the live site's own
 * `<lastmod>`.
 *
 * **The rule is: every route this build serves, minus `UNLISTED`.** That is
 * the one formulation that cannot quietly drift, because a new route is in the
 * sitemap the moment it exists unless someone names it above.
 *
 * It comes to 74 against the live sitemap's 71. Six of ours are missing from
 * nyuhbalivillas.com's — the two legal pages, `/complimentary-services`, and
 * the three standalone booking forms — while three of the live site's are
 * pages this project deliberately does not build (`/seminyak-honeymoon`,
 * `/ubud-spa-and-medical-aesthetic` and a `/ubud-backup/...` draft, all
 * superseded duplicates, all redirected in next.config.ts). Neither set is a
 * reason to copy the live file's membership: `/complimentary-services` is in
 * Ubud's own navigation, and its absence there reads as an oversight rather
 * than a decision. The four `UNLISTED` routes are the opposite case — the live
 * site omits those deliberately, and so does this.
 *
 * **No `<priority>` and no `<changefreq>`.** The live sitemap emits neither,
 * Google ignores both, and a made-up priority is one more number to keep
 * truthful for no gain.
 *
 * Sanity paths are unioned in so a page or post created in the Studio appears
 * without a code change — the same two queries the catch-all route and the
 * blog routes build from, so the sitemap lists what Next actually prerenders.
 * Both return `[]` until Sanity is configured, which leaves the 74 below.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = new Set(Object.keys(ROUTE_SEO));

  // A `page` document always has a route: its own file if one exists, and the
  // `[...slug]` catch-all otherwise. Nothing to filter.
  for (const path of await getSanityPagePaths()) paths.add(path);

  // A `post` document only renders under a prefix that has a route file.
  for (const path of await getPostPaths()) {
    if (POST_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix))) {
      paths.add(path);
    }
  }

  // The landing page is listed as `https://nyuhbalivillas.com/`, with the
  // slash, exactly as the live sitemap has it — while its own canonical tag
  // reads `https://nyuhbalivillas.com` without one. That is not an oversight
  // and it is not worth chasing: Next normalizes the trailing slash off a
  // resolved metadata URL and does so even when the canonical is written
  // absolutely, so the tag cannot be made to carry it. The two strings are the
  // same URL — an empty path means "/" — and every crawler treats them as one.
  return [...paths]
    .filter((path) => !UNLISTED.has(path))
    .sort()
    .map((path) => ({
      url: `${SITE_ORIGIN}${path}`,
      lastModified: ROUTE_LASTMOD[path],
    }));
}
