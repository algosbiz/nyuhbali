import { SITE_ORIGIN } from "./origin";

/**
 * Breadcrumb trails for the `BreadcrumbList` structured data every page
 * except the landing page carries. There is no *visible* breadcrumb on this
 * site and this adds none — it is JSON-LD only, rendered by
 * `components/seo/BreadcrumbJsonLd`.
 *
 * ## How a trail is built
 *
 * Walk the page's URL upwards and keep every ancestor that is a hub page
 * listed in `HUB_NAMES`, then put Home first and the page itself last. So
 * `/ubud/retreat/luxury/anti-aging` is Home › Ubud › Retreat › Luxury Retreat ›
 * the programme, and a blog post at `/ubud/spa/flower-bath` is Home › Ubud ›
 * SPA › the post.
 *
 * **Only hub pages become ancestors, never a detail page.** Room, experience
 * and post slugs nest (`honeymoon/pool` sits under `honeymoon`, the yoga
 * retreat post under the Yoga class), but those are siblings that happen to
 * share a WordPress parent, not a real hierarchy — every room is a child of
 * Stay, not of another room. A segment that is not a hub (`/ubud/villa/honeymoon`
 * on the way to the Romance page, the misspelt `/ubud/discoverl`) is skipped
 * rather than named, so every `item` in a trail is a page that answers 200.
 *
 * **`PARENT` overrides the URL where it points at the wrong parent.** Google
 * asks for the path a visitor would take, not a mirror of the URL, and most
 * URLs here are that path. The exceptions are the root-level slugs that
 * belong to a property (`/complimentary-services` is in Ubud's own menu) and
 * the two offers pages, whose URLs run *through* the villas listing and a
 * room while the menu files them under Offers.
 *
 * ## Names
 *
 * Hub names are the site's own navigation labels ("Stay", "Villas", "Our
 * Blog") — the same rule the redesign followed for eyebrows and footer
 * headings, so no new wording. The last item's name is the page's own title
 * (a room's, an experience's, a post's), passed in by the route.
 */

/** Every hub page — a page other pages can sit beneath — and its name. */
const HUB_NAMES: Record<string, string> = {
  "/": "Home",

  "/seminyak": "Seminyak",
  "/seminyak/villa": "Villas",
  "/seminyak/villa/honeymoon/packages": "Offers",
  "/seminyak/dining": "Dining",
  "/seminyak/spa": "SPA",
  "/seminyak/tour": "Explore Bali",
  "/seminyak/contact": "Contact Us",
  "/seminyak/discover": "Our Blog",

  "/ubud": "Ubud",
  "/ubud/villa": "Stay",
  "/ubud/packages": "Offers",
  "/ubud/villa/honeymoon/packages": "Romance",
  "/ubud/retreat": "Retreat",
  "/ubud/retreat/luxury": "Luxury Retreat",
  "/ubud/retreat/host-your-own": "Host Your Retreat",
  "/ubud/wedding": "Wedding",
  "/ubud/wellness": "Wellness",
  "/ubud/spa": "SPA",
  "/ubud/dining": "Dining",
  "/ubud/balinese-culture": "Culture",
  "/ubud/contact": "Contact Us",
  "/ubud/discover": "Our Blog",

  "/complimentary-services": "Services",
  "/terms-conditions": "Terms & Conditions",
  "/privacy-policy": "Privacy Policy",

  "/seminyak-directory": "Seminyak Directory",
  "/ubud-directory": "Ubud Directory",
  "/suite-directory": "Suite Directory",
  "/welcomeaboard": "Welcome Aboard",
  "/spa-reservation-seminyak": "SPA Booking Form",
  "/ubud-spa-booking-form": "SPA Booking Form",
  "/ubud-personalize-your-retreat": "Personalize Your Retreat",
};

/**
 * Where the URL's own parent is not the page's real one. Keyed by the path of
 * the page (or of a URL prefix, for `/ubud/discoverl`); the value is the hub
 * the trail continues from.
 */
const PARENT: Record<string, string> = {
  // Root-level slugs that belong to a property.
  "/complimentary-services": "/ubud",
  "/seminyak-directory": "/seminyak",
  "/ubud-directory": "/ubud",
  "/suite-directory": "/ubud",
  "/spa-reservation-seminyak": "/seminyak/spa",
  "/ubud-spa-booking-form": "/ubud/spa",
  "/ubud-personalize-your-retreat": "/ubud/retreat",
  // Filed under Offers in the menu; the URL runs through Stay/Villas instead.
  "/ubud/villa/honeymoon/packages": "/ubud/packages",
  "/seminyak/villa/honeymoon/packages": "/seminyak",
  // "Home Gym" is a wellness class that WordPress published at /ubud/fitness.
  "/ubud/fitness": "/ubud/wellness",
  // The live site's misspelt blog prefix; its posts belong to the blog.
  "/ubud/discoverl": "/ubud/discover",
};

export type BreadcrumbItem = { name: string; path: string };

function parentOf(path: string): string {
  if (PARENT[path]) return PARENT[path];
  const cut = path.lastIndexOf("/");
  return cut <= 0 ? "/" : path.slice(0, cut);
}

function normalize(path: string): string {
  const trimmed = path.replace(/\/+$/, "");
  return trimmed.startsWith("/") ? trimmed || "/" : `/${trimmed}`;
}

/**
 * The trail for `path`, Home first and the page itself last. `name` is the
 * page's own title; a hub page may omit it and use its entry in `HUB_NAMES`.
 *
 * Returns `[]` for the landing page and for a page with no name to give it —
 * a one-item breadcrumb says nothing, and an unnamed item is invalid.
 */
export function breadcrumbTrail(path: string, name?: string): BreadcrumbItem[] {
  const self = normalize(path);
  const selfName = name?.trim() || HUB_NAMES[self];
  if (self === "/" || !selfName) return [];

  const ancestors: BreadcrumbItem[] = [];
  // Bounded by the path's depth; the guard only protects against a cycle
  // written into PARENT by mistake.
  for (let at = parentOf(self), steps = 0; at !== "/" && steps < 12; steps++) {
    if (HUB_NAMES[at]) ancestors.unshift({ name: HUB_NAMES[at], path: at });
    at = parentOf(at);
  }

  return [{ name: HUB_NAMES["/"], path: "/" }, ...ancestors, { name: selfName, path: self }];
}

/** Schema.org `BreadcrumbList` for a trail, with absolute URLs. */
export function breadcrumbListJsonLd(trail: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.path === "/" ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${item.path}`,
    })),
  };
}
