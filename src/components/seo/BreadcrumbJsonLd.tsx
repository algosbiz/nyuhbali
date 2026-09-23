import { breadcrumbListJsonLd, breadcrumbTrail } from "@/data/breadcrumbs";
import { getExperiences, getRooms } from "@/sanity/lib/content";

/**
 * Every detail page that can sit *above* another page in a URL — a room
 * (`/ubud/villa/honeymoon` above `/ubud/villa/honeymoon/pool`) or an
 * experience (`/ubud/wellness/yoga` above the yoga retreat post) — keyed by
 * path. Read from the same resolvers the routes render, so a room renamed in
 * the Studio is renamed in every breadcrumb that passes through it.
 */
async function detailPageNames(): Promise<Record<string, string>> {
  const [rooms, experiences] = await Promise.all([getRooms(), getExperiences()]);
  const names: Record<string, string> = {};
  for (const room of rooms) names[`/${room.property}/villa/${room.slug}`] = room.title;
  for (const item of experiences) names[`/ubud/${item.slug}`] = item.title;
  return names;
}

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
export async function BreadcrumbJsonLd({ path, name }: { path: string; name?: string }) {
  const trail = breadcrumbTrail(path, name, await detailPageNames());
  if (trail.length < 2) return null;

  // `<` is escaped so copy containing `</script>` cannot close the tag early.
  const json = JSON.stringify(breadcrumbListJsonLd(trail)).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
