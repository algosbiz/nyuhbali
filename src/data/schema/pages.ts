/**
 * Which schema each hand-written page gets, and what that page contains when
 * Sanity has no document for it.
 *
 * The second half is the same fallback rule every resolver on this site
 * follows: a published `page` document is what renders and what the schema
 * reads, and these constants — the very ones the routes render from — are what
 * both fall back to. Nothing here is written for the schema.
 *
 * Pages backed by their own document (rooms, experiences, posts, the legal
 * pages) are not listed: their routes call the builders directly. The landing
 * page, `/ubud` and `/seminyak` have their own schema in `structuredData.ts`,
 * and the four in-room pages have none by decision.
 */
import type { PropertySlug } from "@/data/properties";
import type { TreatmentMenu } from "./builders";
import { UBUD_ROMANCE_PACKAGES } from "@/data/packages";
import { DINING as SEMINYAK_DINING } from "@/data/pages/seminyak-dining";
import { romanticPackages } from "@/data/pages/seminyak-romance";
import { TREATMENTS as SEMINYAK_TREATMENTS } from "@/data/pages/seminyak-spa";
import { DAY_TRAVELLING, TOURS } from "@/data/pages/seminyak-tour";
import { villas as seminyakVillas } from "@/data/pages/seminyak-villa";
import { ACTIVITIES } from "@/data/pages/ubud-culture";
import { HERO_IMAGES as UBUD_DINING_HERO } from "@/data/pages/ubud-dining";
import { HERO_IMAGES as HOST_HERO } from "@/data/pages/ubud-host-retreat";
import { RETREAT_PACKAGES, WEDDING_HIGHLIGHT } from "@/data/pages/ubud-packages";
import { RETREAT_PROGRAMS } from "@/data/pages/ubud-retreat";
import { PROGRAMS as LUXURY_PROGRAMS } from "@/data/pages/ubud-retreat-luxury";
import { HERO_IMAGES as UBUD_SPA_HERO, TREATMENTS as UBUD_TREATMENTS } from "@/data/pages/ubud-spa";
import { suites as ubudSuites, villas as ubudVillas } from "@/data/pages/ubud-villa";
import { HERO_IMAGES as WEDDING_HERO } from "@/data/pages/ubud-wedding";
import { FACILITIES } from "@/data/pages/ubud-wellness";

export type PageSchema =
  | { kind: "plain"; property: PropertySlug }
  | { kind: "contact"; property: PropertySlug }
  | { kind: "service"; property: PropertySlug }
  | { kind: "blog"; property: PropertySlug }
  | { kind: "hotelSpa"; property: PropertySlug }
  | { kind: "spa" }
  | { kind: "restaurant" }
  | {
      kind: "listing";
      property: PropertySlug;
      /** Pages the listing links to that are not among the things it lists. */
      omit?: string[];
      /** Where its services are defined, when that is another page. */
      servicesPath?: string;
      /** Every service on it is for staying guests only. */
      inHouseOnly?: boolean;
    };

export const PAGE_SCHEMAS: Record<string, PageSchema> = {
  "/seminyak/villa": { kind: "listing", property: "seminyak" },
  "/seminyak/villa/honeymoon/packages": { kind: "listing", property: "seminyak" },
  "/seminyak/tour": { kind: "listing", property: "seminyak" },
  "/seminyak/dining": { kind: "listing", property: "seminyak", inHouseOnly: true },
  "/seminyak/spa": { kind: "hotelSpa", property: "seminyak" },
  "/seminyak/discover": { kind: "blog", property: "seminyak" },
  "/seminyak/contact": { kind: "contact", property: "seminyak" },
  "/spa-reservation-seminyak": { kind: "plain", property: "seminyak" },

  "/ubud/villa": { kind: "listing", property: "ubud" },
  // The same three packages as the romance page, under that page's `@id`s.
  "/ubud/packages": {
    kind: "listing",
    property: "ubud",
    servicesPath: "/ubud/villa/honeymoon/packages",
  },
  "/ubud/villa/honeymoon/packages": { kind: "listing", property: "ubud" },
  // Links to the wellness facilities as well, which are part of a stay rather
  // than a retreat to choose.
  "/ubud/retreat": { kind: "listing", property: "ubud", omit: ["/ubud/wellness"] },
  "/ubud/retreat/luxury": { kind: "listing", property: "ubud" },
  // The home gym is a facility with a page, not a class.
  "/ubud/wellness": { kind: "listing", property: "ubud", omit: ["/ubud/fitness"] },
  "/ubud/balinese-culture": { kind: "listing", property: "ubud" },
  "/ubud/retreat/host-your-own": { kind: "service", property: "ubud" },
  "/ubud/wedding": { kind: "service", property: "ubud" },
  "/ubud/spa": { kind: "spa" },
  "/ubud/dining": { kind: "restaurant" },
  "/ubud/discover": { kind: "blog", property: "ubud" },
  "/ubud/contact": { kind: "contact", property: "ubud" },
  "/ubud/fitness": { kind: "plain", property: "ubud" },
  "/complimentary-services": { kind: "plain", property: "ubud" },
  "/ubud-personalize-your-retreat": { kind: "plain", property: "ubud" },
  "/ubud-spa-booking-form": { kind: "plain", property: "ubud" },
};

/** The parts of a page its schema is built from. */
export type PageContent = {
  /** The hero's heading: the page's `<h1>`. */
  title?: string;
  /** The hero's first photograph. */
  image?: string | null;
  rooms?: { name: string; detailsHref?: string }[];
  bands?: {
    heading?: string;
    packages: {
      name: string;
      meta?: { label: string; value: string }[] | null;
      ctas?: { href?: string }[] | null;
    }[];
  }[];
  menu?: TreatmentMenu;
};

// The booking link is an argument of the functions below because the rooms'
// own buttons need it; the schema does not read it.
const NO_BOOKING = "";

export const PAGE_CONTENT: Record<string, PageContent> = {
  "/seminyak/villa": { rooms: seminyakVillas(NO_BOOKING) },
  "/seminyak/villa/honeymoon/packages": {
    bands: [{ packages: romanticPackages(NO_BOOKING) }],
  },
  "/seminyak/tour": { bands: [{ packages: DAY_TRAVELLING }, { packages: TOURS }] },
  "/seminyak/dining": { bands: [{ heading: "Dining Experience", packages: SEMINYAK_DINING }] },
  "/seminyak/spa": { menu: SEMINYAK_TREATMENTS },

  "/ubud/villa": { rooms: [...ubudSuites(NO_BOOKING), ...ubudVillas(NO_BOOKING)] },
  "/ubud/packages": {
    bands: [
      { packages: UBUD_ROMANCE_PACKAGES },
      { packages: RETREAT_PACKAGES },
      { packages: WEDDING_HIGHLIGHT },
    ],
  },
  "/ubud/villa/honeymoon/packages": { bands: [{ packages: UBUD_ROMANCE_PACKAGES }] },
  "/ubud/retreat": { bands: [{ packages: RETREAT_PROGRAMS }] },
  "/ubud/retreat/luxury": {
    title: "Personalised Luxury Retreat in Ubud",
    bands: [{ packages: LUXURY_PROGRAMS }],
  },
  "/ubud/retreat/host-your-own": { title: "Host your Retreat in Ubud", image: HOST_HERO[0] },
  "/ubud/wellness": { bands: [{ packages: FACILITIES }] },
  "/ubud/balinese-culture": { bands: [{ packages: ACTIVITIES }] },
  "/ubud/wedding": { title: "Wedding", image: WEDDING_HERO[0] },
  "/ubud/spa": { image: UBUD_SPA_HERO[0], menu: UBUD_TREATMENTS },
  "/ubud/dining": { image: UBUD_DINING_HERO[0] },
};
