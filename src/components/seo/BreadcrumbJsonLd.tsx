import { breadcrumbListJsonLd, breadcrumbTrail } from "@/data/breadcrumbs";

/**
 * The page's `BreadcrumbList` as JSON-LD. Renders nothing visible — this site
 * has no breadcrumb navigation — and nothing at all for the landing page or a
 * page with no name (see `breadcrumbTrail`).
 *
 * **One per page.** It is rendered by `ManagedPage` for every hand-written
 * route, by `PostPage` for every blog post, and by the room, experience,
 * legal and CMS catch-all routes themselves — so a route that already goes
 * through one of those must not add a second.
 */
export function BreadcrumbJsonLd({ path, name }: { path: string; name?: string }) {
  const trail = breadcrumbTrail(path, name);
  if (trail.length < 2) return null;

  // `<` is escaped so copy containing `</script>` cannot close the tag early.
  const json = JSON.stringify(breadcrumbListJsonLd(trail)).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
