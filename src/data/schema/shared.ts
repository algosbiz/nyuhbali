import type { PropertySlug } from "@/data/properties";

/**
 * Everything the site's structured data says that is not in the CMS: the
 * business names, addresses, `@id` values, opening hours, Maps links and the
 * audience wording. One file, so a fact is stated once and every page's
 * schema restates the same one.
 *
 * Copied from the schema briefs (November 2026) and final. The property names
 * match the Google Maps listings character for character — do not shorten
 * "Ubud Nyuh Bali Resort & Spa" to the label the navigation uses.
 *
 * ## Why the origin is a literal and not `SITE_ORIGIN`
 *
 * The `@id` values are identifiers, not links: 73 pages point at
 * `https://nyuhbalivillas.com/ubud#resort` and mean one business.
 * `SITE_ORIGIN` follows `SITE_URL`, so a deployment configured with any other
 * host would publish a second set of identities for the same places. These
 * must not move with the environment.
 *
 * ## Two rules that are easy to break by "improving" this
 *
 * - The two properties are separate, self-managed businesses sharing a brand.
 *   Each links to the `Organization` with `brand` and nothing else — never
 *   `parentOrganization` or `subOrganization`.
 * - Seminyak's spa and restaurant serve guests only and have no names of their
 *   own, so they are not businesses: no `DaySpa` or `Restaurant` anywhere
 *   under `/seminyak`.
 */

export type SchemaNode = Record<string, unknown>;

export const ORIGIN = "https://nyuhbalivillas.com";

export const ORGANIZATION_ID = `${ORIGIN}/#organization`;
export const WEBSITE_ID = `${ORIGIN}/#website`;
export const UBUD_RESORT_ID = `${ORIGIN}/ubud#resort`;
export const SEMINYAK_HOTEL_ID = `${ORIGIN}/seminyak#hotel`;
export const UBUD_SPA_ID = `${ORIGIN}/ubud/spa#spa`;
export const UBUD_RESTAURANT_ID = `${ORIGIN}/ubud/dining#restaurant`;

export const PROPERTY_IDS: Record<PropertySlug, string> = {
  ubud: UBUD_RESORT_ID,
  seminyak: SEMINYAK_HOTEL_ID,
};

/** The properties' full names, as their Maps listings have them. Also what a
 *  blog post shows as its author. */
export const PROPERTY_NAMES: Record<PropertySlug, string> = {
  ubud: "Ubud Nyuh Bali Resort & Spa",
  seminyak: "Nyuh Bali Luxury Villas Seminyak",
};

export const ADDRESSES: Record<PropertySlug, SchemaNode> = {
  ubud: {
    "@type": "PostalAddress",
    streetAddress: "Jl. Raya Silungan, Lodtunduh",
    addressLocality: "Ubud",
    addressRegion: "Bali",
    postalCode: "80571",
    addressCountry: "ID",
  },
  seminyak: {
    "@type": "PostalAddress",
    streetAddress: "Jl. Bali Deli No. 99",
    addressLocality: "Seminyak",
    addressRegion: "Bali",
    postalCode: "80361",
    addressCountry: "ID",
  },
};

// ── The short copies every page repeats ───────────────────────────────────
//
// Repeated on purpose, under the same `@id`s: a crawler reads one page at a
// time, so every reference has to resolve on the page it is made from. Do not
// "deduplicate" them away.

export const WEBSITE_NODE: SchemaNode = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: "Nyuh Bali",
  url: `${ORIGIN}/`,
};

export const ORGANIZATION_NODE: SchemaNode = {
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: "Nyuh Bali",
  url: `${ORIGIN}/`,
};

export const PROPERTY_NODES: Record<PropertySlug, SchemaNode> = {
  ubud: {
    "@type": "Resort",
    "@id": UBUD_RESORT_ID,
    name: PROPERTY_NAMES.ubud,
    url: `${ORIGIN}/ubud`,
    address: ADDRESSES.ubud,
    brand: { "@id": ORGANIZATION_ID },
  },
  seminyak: {
    "@type": "Hotel",
    "@id": SEMINYAK_HOTEL_ID,
    name: PROPERTY_NAMES.seminyak,
    url: `${ORIGIN}/seminyak`,
    address: ADDRESSES.seminyak,
    brand: { "@id": ORGANIZATION_ID },
  },
};

/** Mahamaya Spa, short: what its three service pages repeat, and what the
 *  spa's own page builds on. */
export const UBUD_SPA_NODE: SchemaNode = {
  "@type": "DaySpa",
  "@id": UBUD_SPA_ID,
  name: "Mahamaya Spa",
  url: `${ORIGIN}/ubud/spa`,
  address: ADDRESSES.ubud,
  containedInPlace: { "@id": UBUD_RESORT_ID },
};

// ── Facts about the two Ubud businesses that are open to the public ───────

const EVERY_DAY = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/** Opening hours that are the same every day of the week. */
export function openDaily(opens: string, closes: string): SchemaNode {
  return { "@type": "OpeningHoursSpecification", dayOfWeek: EVERY_DAY, opens, closes };
}

const SPA_MAP = "https://maps.google.com/?cid=8037841617663010093";
const RESTAURANT_MAP = "https://maps.google.com/?cid=1960521726814719162";

/** What `/ubud/spa` adds to `UBUD_SPA_NODE`. */
export const UBUD_SPA_FACTS: SchemaNode = {
  email: "spa@ubudnyuhbali.com",
  openingHoursSpecification: openDaily("09:00", "21:00"),
  hasMap: SPA_MAP,
  sameAs: [
    SPA_MAP,
    "https://www.fresha.com/a/mahamaya-spa-at-ubud-nyuh-bali-resort-bali-lodtunduh-gianyar-regency-jalan-raya-silungan-kgeujm85",
  ],
};

export const UBUD_RESTAURANT_NAME = "Lumbini Restaurant";

export const UBUD_RESTAURANT_FACTS: SchemaNode = {
  address: ADDRESSES.ubud,
  telephone: "+62 853 3377 9779",
  openingHoursSpecification: openDaily("06:30", "22:00"),
  servesCuisine: ["Balinese", "Western"],
  hasMap: RESTAURANT_MAP,
  sameAs: [RESTAURANT_MAP],
  containedInPlace: { "@id": UBUD_RESORT_ID },
};

// ── In-house guests only ──────────────────────────────────────────────────

export const IN_HOUSE_GUESTS: SchemaNode = {
  "@type": "Audience",
  audienceType: "In-house guests",
};

/**
 * The experiences only a staying guest can book. An exact list, not a rule
 * about the "wellness" group: a class added in the Studio is open to everyone
 * until someone says otherwise. Every service on `/seminyak/spa` and
 * `/seminyak/dining` is in-house too; those two pages say so in
 * `PAGE_SCHEMAS`.
 */
export const IN_HOUSE_EXPERIENCES = new Set([
  "balinese-culture/melukat-purification-ceremony",
  "wellness/body-tone-flow",
  "wellness/breathwork",
  "wellness/chakra-healing",
  "wellness/life-coach",
  "wellness/reiki-healing",
  "wellness/sound-healing",
  "wellness/yoga",
]);

// ── Rooms ─────────────────────────────────────────────────────────────────

/**
 * Rooms whose schema name is not their page title. The Ubud suite is titled
 * "Suite" on the page, which names nothing on its own; the schema on `/ubud`
 * has called it "Nyuh Suite" since November 2026 and one `@id` should not
 * carry two names.
 */
export const ROOM_SCHEMA_NAMES: Record<string, string> = {
  "/ubud/villa/suite": "Nyuh Suite",
};

/**
 * Rooms whose size is published two ways, so the schema states none. The
 * Three Bedroom Pool Villa's own page says 450 sqm and the villa list says
 * 540. Remove the entry once the client confirms which is right and both
 * places agree.
 */
export const ROOM_SIZE_UNCONFIRMED = new Set(["/ubud/villa/3-bedroom-pool"]);
