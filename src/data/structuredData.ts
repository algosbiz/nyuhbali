/**
 * The `@graph` JSON-LD for the three pages that describe the businesses
 * themselves: the landing page, `/ubud` and `/seminyak`. Rendered by
 * `components/seo/JsonLd`, from each of those routes' own `page.tsx` — never
 * from a layout, so the home graph cannot leak onto any other page.
 *
 * **Copied verbatim from the schema brief (Nyuh-Bali-schema-dev-brief.md,
 * November 2026).** Every name, description and URL below is final and was
 * validated before it reached this file. Do not reword, shorten or "improve"
 * any of it — the property names match the Google Maps listings character for
 * character, which is the point of having them here.
 *
 * ## What is deliberately absent
 *
 * No `image`, `logo`, `starRating`, `aggregateRating`, `priceRange`,
 * `parentOrganization` or `subOrganization`. The first ones are not confirmed
 * yet; the last two are wrong for this business. Ubud and Seminyak are two
 * independent, self-managed properties sharing a brand, so each points at the
 * `Organization` with `brand` and nothing else. **No `geo` on Seminyak**,
 * because its map pin has not been verified.
 *
 * ## The one part that is not hardcoded
 *
 * Each `WebPage` node's `name` — and on the landing page its `description` —
 * restates the page's own `<title>` and meta description. Those are editable
 * in the Studio, so each builder takes them as an argument and the route reads
 * them from `resolvePageMetadata`, the same call its `generateMetadata` makes.
 * That is what keeps the two from drifting: there is one source, not two
 * copies of one string. Everything else is fixed.
 *
 * ## The other 70 pages
 *
 * They point at the `@id`s defined here and repeat short copies of these
 * nodes; their schema is built in `data/schema/`. The `@id` values, names and
 * addresses are in `data/schema/shared.ts`, which this file reads too.
 *
 * `/ubud` and `/seminyak` each repeat a short copy of the `WebSite` and
 * `Organization` nodes under the same `@id`s. That is intended: every page
 * stands alone. Do not "deduplicate" them away.
 */

import {
  ADDRESSES,
  ORGANIZATION_ID,
  ORGANIZATION_NODE,
  ORIGIN,
  PROPERTY_NAMES,
  SEMINYAK_HOTEL_ID,
  UBUD_RESORT_ID,
  WEBSITE_ID,
  WEBSITE_NODE,
  openDaily,
} from "./schema/shared";

/** The `WebPage` text that follows the page's own `<title>` / meta description. */
export type WebPageText = { name?: string; description?: string };

/** One amenity, in the shape every `amenityFeature` entry below shares. */
function amenity(name: string) {
  return { "@type": "LocationFeatureSpecification", name, value: true };
}

/** One room as a node of its own, so a later room page can point at it. */
function suite(path: string, name: string) {
  return { "@type": "Suite", "@id": `${ORIGIN}${path}#suite`, name, url: `${ORIGIN}${path}` };
}

// ── Home: https://nyuhbalivillas.com/ ─────────────────────────────────────

/** Five nodes: the website, the brand, the page, and the two properties. */
export function homeJsonLd(page: WebPageText) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: "Nyuh Bali",
        alternateName: "Nyuh Bali Villas",
        url: `${ORIGIN}/`,
        publisher: { "@id": ORGANIZATION_ID },
      },
      {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: "Nyuh Bali",
        alternateName: "Nyuh Bali Villas",
        url: `${ORIGIN}/`,
      },
      {
        "@type": "WebPage",
        "@id": `${ORIGIN}/#webpage`,
        url: `${ORIGIN}/`,
        name: page.name,
        description: page.description,
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": ORGANIZATION_ID },
        mentions: [{ "@id": SEMINYAK_HOTEL_ID }, { "@id": UBUD_RESORT_ID }],
      },
      {
        "@type": "Hotel",
        "@id": SEMINYAK_HOTEL_ID,
        name: PROPERTY_NAMES.seminyak,
        url: `${ORIGIN}/seminyak`,
        brand: { "@id": ORGANIZATION_ID },
      },
      {
        "@type": "Resort",
        "@id": UBUD_RESORT_ID,
        name: PROPERTY_NAMES.ubud,
        url: `${ORIGIN}/ubud`,
        brand: { "@id": ORGANIZATION_ID },
      },
    ],
  };
}

// ── Ubud: https://nyuhbalivillas.com/ubud ─────────────────────────────────

/**
 * Fourteen nodes. The spa and the restaurant are open to the public, so —
 * unlike Seminyak's — they are businesses of their own, named exactly as
 * their Maps listings are being renamed to, with no "at …" wording.
 */
export function ubudJsonLd(page: WebPageText) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${ORIGIN}/ubud#webpage`,
        url: `${ORIGIN}/ubud`,
        name: page.name,
        mainEntity: { "@id": UBUD_RESORT_ID },
        isPartOf: { "@id": WEBSITE_ID },
      },
      WEBSITE_NODE,
      ORGANIZATION_NODE,
      {
        "@type": "Resort",
        "@id": UBUD_RESORT_ID,
        name: PROPERTY_NAMES.ubud,
        url: `${ORIGIN}/ubud`,
        description:
          "Nyuh Bali provides luxury villas in Ubud for couples and families. Inspired by coconut philosophy, wellness activities are also available.",
        brand: { "@id": ORGANIZATION_ID },
        address: ADDRESSES.ubud,
        geo: { "@type": "GeoCoordinates", latitude: -8.5585306, longitude: 115.2664113 },
        telephone: "+62 853 3377 9779",
        email: "info@ubudnyuhbali.com",
        checkinTime: "14:00",
        checkoutTime: "12:00",
        hasMap: "https://maps.google.com/?cid=9616170279382705739",
        sameAs: [
          "https://maps.google.com/?cid=9616170279382705739",
          "https://www.facebook.com/nyuhbaliubud/",
          "https://www.instagram.com/nyuhbaliubud/",
        ],
        award: [
          "World Luxury Hotel Awards 2023: Luxury Boutique Retreat, Asia",
          "World Luxury Hotel Awards 2023: Luxury Wellness Resort, Asia",
          "World Luxury Hotel Awards 2023: Luxury Yoga & Wellness Retreat, Asia",
        ],
        amenityFeature: [
          amenity("Lobby with waiting area"),
          amenity("Onsite car park"),
          amenity("Home gym"),
          amenity("16 hours room service"),
          amenity("Bale Lotus (picnic area)"),
          amenity("Guest concierge"),
          amenity("Two main pools"),
          amenity("Free yoga"),
          amenity("Two yoga venues"),
          amenity("Wedding venue"),
          amenity("24 hours reception and security"),
          amenity("Free daily activity"),
          amenity("Laundry service"),
        ],
        containsPlace: [
          { "@id": `${ORIGIN}/ubud/villa/1-bedroom-pool-deluxe#suite` },
          { "@id": `${ORIGIN}/ubud/villa/1-bedroom-pool-royal#suite` },
          { "@id": `${ORIGIN}/ubud/villa/2-bedroom-pool#suite` },
          { "@id": `${ORIGIN}/ubud/villa/3-bedroom-pool#suite` },
          { "@id": `${ORIGIN}/ubud/villa/4-bedroom-pool#suite` },
          { "@id": `${ORIGIN}/ubud/villa/honeymoon#suite` },
          { "@id": `${ORIGIN}/ubud/villa/honeymoon/pool#suite` },
          { "@id": `${ORIGIN}/ubud/villa/suite#suite` },
          { "@id": `${ORIGIN}/ubud/spa#spa` },
          { "@id": `${ORIGIN}/ubud/dining#restaurant` },
        ],
      },
      suite("/ubud/villa/1-bedroom-pool-deluxe", "One Bedroom Deluxe Pool Villa"),
      suite("/ubud/villa/1-bedroom-pool-royal", "One Bedroom Royal Pool Villa"),
      suite("/ubud/villa/2-bedroom-pool", "Two Bedroom Pool Villa"),
      suite("/ubud/villa/3-bedroom-pool", "Three Bedroom Pool Villa"),
      suite("/ubud/villa/4-bedroom-pool", "Four-Bedroom Pool Villa"),
      suite("/ubud/villa/honeymoon", "Honeymoon Pool Villa"),
      suite("/ubud/villa/honeymoon/pool", "Honeymoon Suite"),
      suite("/ubud/villa/suite", "Nyuh Suite"),
      {
        "@type": "DaySpa",
        "@id": `${ORIGIN}/ubud/spa#spa`,
        name: "Mahamaya Spa",
        url: `${ORIGIN}/ubud/spa`,
      },
      {
        "@type": "Restaurant",
        "@id": `${ORIGIN}/ubud/dining#restaurant`,
        name: "Lumbini Restaurant",
        url: `${ORIGIN}/ubud/dining`,
      },
    ],
  };
}

// ── Seminyak: https://nyuhbalivillas.com/seminyak ─────────────────────────

/**
 * Six nodes. Seminyak's spa and restaurant are for guests only and have no
 * names of their own, so they are amenities of the hotel rather than
 * separate businesses — and the spa's hours ride on its amenity entry.
 */
export function seminyakJsonLd(page: WebPageText) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${ORIGIN}/seminyak#webpage`,
        url: `${ORIGIN}/seminyak`,
        name: page.name,
        mainEntity: { "@id": SEMINYAK_HOTEL_ID },
        isPartOf: { "@id": WEBSITE_ID },
      },
      WEBSITE_NODE,
      ORGANIZATION_NODE,
      {
        "@type": "Hotel",
        "@id": SEMINYAK_HOTEL_ID,
        name: PROPERTY_NAMES.seminyak,
        url: `${ORIGIN}/seminyak`,
        description:
          "Romanticise in luxury Seminyak villas, blending Balinese tradition and wellness activities. Enjoy candle lit dinners with your very own chef.",
        brand: { "@id": ORGANIZATION_ID },
        address: ADDRESSES.seminyak,
        telephone: "+62 361 738920",
        email: "reservation@nyuhbalivillas.com",
        checkinTime: "14:00",
        checkoutTime: "12:00",
        hasMap: "https://maps.google.com/?cid=15669995729819704885",
        sameAs: [
          "https://maps.google.com/?cid=15669995729819704885",
          "https://www.facebook.com/nyuhbalivillas/",
          "https://www.instagram.com/nyuhbalivillas/",
        ],
        amenityFeature: [
          {
            ...amenity("Onsite day spa"),
            hoursAvailable: openDaily("09:00", "17:00"),
          },
          amenity("Onsite restaurant"),
          amenity("Lobby with waiting area"),
          amenity("Guest concierge"),
          amenity("24 hours reception and security"),
          amenity("Laundry service and dry cleaning"),
          amenity("15 hours room service"),
          amenity("Onsite car park"),
          amenity("Complimentary Wi-Fi"),
        ],
        containsPlace: [
          { "@id": `${ORIGIN}/seminyak/villa/honeymoon#suite` },
          { "@id": `${ORIGIN}/seminyak/villa/honeymoon/pool#suite` },
        ],
      },
      suite("/seminyak/villa/honeymoon", "Honeymoon Suite Pool Villa"),
      suite("/seminyak/villa/honeymoon/pool", "One Bedroom Pool Villa"),
    ],
  };
}
