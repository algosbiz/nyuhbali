/**
 * One builder per kind of page, for the 70 pages below the three that
 * describe the businesses themselves (those are `structuredData.ts`).
 *
 * A builder takes what the page displays — already resolved, from Sanity or
 * from `src/data` — and returns one `@graph`. It knows no paths of its own and
 * fetches nothing; `sanity/lib/pageSchema.ts` decides which builder a page
 * gets and hands it the content.
 *
 * What every graph has in common: the page itself first, then what it is
 * about, then short copies of the website, the brand and (except on the two
 * legal pages) the property, so that every `@id` referenced is also defined on
 * the same page.
 *
 * **Deliberately absent, do not add:** `starRating`, `aggregateRating`,
 * `review`, `FAQPage`, `priceRange`, and any description of a treatment.
 */
import type { PropertySlug } from "@/data/properties";
import {
  IN_HOUSE_GUESTS,
  ORGANIZATION_ID,
  ORGANIZATION_NODE,
  ORIGIN,
  PROPERTY_IDS,
  PROPERTY_NAMES,
  PROPERTY_NODES,
  UBUD_RESTAURANT_FACTS,
  UBUD_RESTAURANT_ID,
  UBUD_RESTAURANT_NAME,
  UBUD_SPA_FACTS,
  UBUD_SPA_ID,
  UBUD_SPA_NODE,
  WEBSITE_ID,
  WEBSITE_NODE,
  type SchemaNode,
} from "./shared";
import {
  bedroomsFromName,
  fragment,
  menuHeading,
  parseAdults,
  parsePrice,
  parseSquareMetres,
  parseTreatmentOption,
  schemaImage,
  type Price,
} from "./parse";

/** The page's `<title>` and meta description, as the head states them. */
export type PageText = { name?: string; description?: string };

type PageInput = { path: string; text: PageText };

const ref = (id: string) => ({ "@id": id });

function webPage(
  { path, text }: PageInput,
  relations: { type?: string; about?: string; mainEntity?: string },
): SchemaNode {
  return {
    "@type": relations.type ?? "WebPage",
    "@id": `${ORIGIN}${path}#webpage`,
    url: `${ORIGIN}${path}`,
    name: text.name,
    description: text.description,
    isPartOf: ref(WEBSITE_ID),
    ...(relations.about ? { about: ref(relations.about) } : {}),
    ...(relations.mainEntity ? { mainEntity: ref(relations.mainEntity) } : {}),
  };
}

/** The page's own nodes, followed by the short copies it has to repeat. */
function graph(nodes: SchemaNode[], property?: PropertySlug): SchemaNode {
  return {
    "@context": "https://schema.org",
    "@graph": [
      ...nodes,
      WEBSITE_NODE,
      ORGANIZATION_NODE,
      ...(property ? [PROPERTY_NODES[property]] : []),
    ],
  };
}

/**
 * "++" means tax and service are added on top, and is the only thing that
 * puts `valueAddedTaxIncluded` here: a price written without it says nothing
 * about tax, so neither does this.
 */
function priceSpecification(price: Price): SchemaNode {
  return {
    "@type": "UnitPriceSpecification",
    price: price.amount,
    priceCurrency: "IDR",
    ...(price.plusPlus
      ? { valueAddedTaxIncluded: false, description: "Plus tax and service charge" }
      : {}),
    ...(price.unit ? { unitText: price.unit } : {}),
  };
}

const offer = (price: Price): SchemaNode => ({
  "@type": "Offer",
  priceSpecification: priceSpecification(price),
});

// ── Plain and contact pages ───────────────────────────────────────────────

/** Without a property — the two legal pages — the page is about the brand. */
export function buildPlainSchema(input: PageInput & { property?: PropertySlug }) {
  const about = input.property ? PROPERTY_IDS[input.property] : ORGANIZATION_ID;
  return graph([webPage(input, { about })], input.property);
}

export function buildContactSchema(input: PageInput & { property: PropertySlug }) {
  const id = PROPERTY_IDS[input.property];
  return graph(
    [webPage(input, { type: "ContactPage", about: id, mainEntity: id })],
    input.property,
  );
}

// ── Villas and suites ─────────────────────────────────────────────────────

export type VillaInput = PageInput & {
  property: PropertySlug;
  name: string;
  image?: string | null;
  /** The label/value rows of the page's own Details block. */
  details: { label: string; value: string }[];
  amenities: string[];
  /** True when the published sizes disagree; see `ROOM_SIZE_UNCONFIRMED`. */
  omitSize?: boolean;
};

export function buildVillaSchema(input: VillaInput) {
  const { path, text, property, name, details } = input;
  const id = `${ORIGIN}${path}#suite`;

  const row = (matches: (label: string) => boolean) =>
    details.find((detail) => matches(detail.label.trim().toLowerCase()))?.value?.trim();
  // "Pool Size" is a row of its own, so "size" alone is not enough to go on.
  const size = row((label) => label.includes("size") && !/pool|bed/.test(label));
  const bed = row((label) => label.includes("bed") && !label.includes("bedroom"));
  const occupancy = row((label) => label.includes("occupancy"));

  const squareMetres = input.omitSize ? undefined : parseSquareMetres(size);
  const bedrooms = bedroomsFromName(name);
  const adults = parseAdults(occupancy);

  const suite: SchemaNode = {
    "@type": "Suite",
    "@id": id,
    name,
    url: `${ORIGIN}${path}`,
    description: text.description,
    image: schemaImage(input.image, ORIGIN),
    containedInPlace: ref(PROPERTY_IDS[property]),
    ...(squareMetres
      ? { floorSize: { "@type": "QuantitativeValue", value: squareMetres, unitCode: "MTK" } }
      : {}),
    ...(bedrooms ? { numberOfBedrooms: bedrooms } : {}),
    ...(bed ? { bed } : {}),
    ...(adults
      ? {
          occupancy: {
            "@type": "QuantitativeValue",
            maxValue: adults,
            unitText: "adults",
            description: occupancy,
          },
        }
      : {}),
    ...(input.amenities.length
      ? {
          amenityFeature: input.amenities.map((amenity) => ({
            "@type": "LocationFeatureSpecification",
            name: amenity,
            value: true,
          })),
        }
      : {}),
  };

  return graph([webPage(input, { mainEntity: id }), suite], property);
}

// ── A page that sells one service ─────────────────────────────────────────

export type ServiceInput = PageInput & {
  property: PropertySlug;
  name: string;
  image?: string | null;
  /** The sentence the page prints its price in, if it prints one. */
  price?: string;
  inHouseOnly?: boolean;
  /** Provided by Mahamaya Spa rather than by the resort itself. */
  bySpa?: boolean;
};

export function buildServiceSchema(input: ServiceInput) {
  const { path, text, property } = input;
  const id = `${ORIGIN}${path}#service`;
  const price = parsePrice(input.price);

  const service: SchemaNode = {
    "@type": "Service",
    "@id": id,
    name: input.name,
    url: `${ORIGIN}${path}`,
    description: text.description,
    image: schemaImage(input.image, ORIGIN),
    provider: ref(input.bySpa ? UBUD_SPA_ID : PROPERTY_IDS[property]),
    ...(input.inHouseOnly ? { audience: IN_HOUSE_GUESTS } : {}),
    ...(price ? { offers: offer(price) } : {}),
  };

  return graph(
    [webPage(input, { mainEntity: id }), service, ...(input.bySpa ? [UBUD_SPA_NODE] : [])],
    property,
  );
}

// ── Pages that list things: villas, programmes, packages, tours, dinners ──

export type ListedItem =
  /** Something with a page of its own. */
  | { kind: "page"; name: string; path: string }
  /** Something sold on the listing itself. */
  | { kind: "service"; name: string; price?: Price };

export type ListingInput = PageInput & {
  property: PropertySlug;
  items: ListedItem[];
  inHouseOnly?: boolean;
  /** Where the services are defined, when that is another page — the two Ubud
   *  romance pages list the same packages under one set of `@id`s. */
  servicesPath?: string;
};

export function buildListingSchema(input: ListingInput) {
  const { path, property } = input;
  const about = PROPERTY_IDS[property];
  const listId = `${ORIGIN}${path}#list`;
  const servicesBase = `${ORIGIN}${input.servicesPath ?? path}`;
  const serviceId = (name: string) => `${servicesBase}#${fragment(name)}`;

  if (!input.items.length) {
    return graph([webPage(input, { type: "CollectionPage", about })], property);
  }

  const list: SchemaNode = {
    "@type": "ItemList",
    "@id": listId,
    itemListElement: input.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      ...(item.kind === "page"
        ? { name: item.name, url: `${ORIGIN}${item.path}` }
        : { item: ref(serviceId(item.name)) }),
    })),
  };

  const services = input.items.flatMap((item): SchemaNode[] =>
    item.kind === "page"
      ? []
      : [
          {
            "@type": "Service",
            "@id": serviceId(item.name),
            name: item.name,
            provider: ref(PROPERTY_IDS[property]),
            ...(input.inHouseOnly ? { audience: IN_HOUSE_GUESTS } : {}),
            ...(item.price ? { offers: offer(item.price) } : {}),
          },
        ],
  );

  return graph(
    [webPage(input, { type: "CollectionPage", about, mainEntity: listId }), list, ...services],
    property,
  );
}

// ── The two spa menus ─────────────────────────────────────────────────────

export type TreatmentMenu = {
  name: string;
  treatments: { name: string; options: { label: string }[] }[];
}[];

/** Those treatments are a separate clinic's, not the spa's. */
const isMediFacial = (category: string) => /medi[\s-]*facial/i.test(category);

/** Name, duration and price only — treatments carry no description here. */
function treatmentCatalog(
  id: string,
  name: string,
  menu: TreatmentMenu,
  service: SchemaNode,
): SchemaNode {
  return {
    "@type": "OfferCatalog",
    "@id": id,
    name,
    itemListElement: menu
      .filter((category) => !isMediFacial(category.name))
      .map((category) => ({
        "@type": "OfferCatalog",
        name: menuHeading(category.name),
        itemListElement: category.treatments.flatMap((treatment) =>
          treatment.options.flatMap((option): SchemaNode[] => {
            const parsed = parseTreatmentOption(option.label);
            if (!parsed) return [];
            return [
              {
                "@type": "Offer",
                name: `${treatment.name}, ${parsed.variant}`,
                itemOffered: { "@type": "Service", name: treatment.name, ...service },
                priceSpecification: priceSpecification(parsed.price),
              },
            ];
          }),
        ),
      }))
      .filter((category) => category.itemListElement.length),
  };
}

/** Mahamaya Spa is a business open to the public, so it is the page's subject. */
export function buildSpaSchema(input: PageInput & { image?: string | null; menu: TreatmentMenu }) {
  const catalogId = `${ORIGIN}${input.path}#treatments`;
  return graph(
    [
      webPage(input, { mainEntity: UBUD_SPA_ID }),
      {
        ...UBUD_SPA_NODE,
        description: input.text.description,
        image: schemaImage(input.image, ORIGIN),
        ...UBUD_SPA_FACTS,
        hasOfferCatalog: ref(catalogId),
      },
      treatmentCatalog(catalogId, "Mahamaya Spa treatments", input.menu, {
        provider: ref(UBUD_SPA_ID),
      }),
    ],
    "ubud",
  );
}

/** Seminyak's spa is not a business: its treatments are the hotel's, for guests. */
export function buildHotelSpaSchema(
  input: PageInput & { property: PropertySlug; menu: TreatmentMenu },
) {
  const about = PROPERTY_IDS[input.property];
  const catalogId = `${ORIGIN}${input.path}#treatments`;
  return graph(
    [
      webPage(input, { about, mainEntity: catalogId }),
      treatmentCatalog(catalogId, "Spa treatments", input.menu, {
        provider: ref(about),
        audience: IN_HOUSE_GUESTS,
      }),
    ],
    input.property,
  );
}

// ── The Ubud restaurant ───────────────────────────────────────────────────

export function buildRestaurantSchema(input: PageInput & { image?: string | null }) {
  return graph(
    [
      webPage(input, { mainEntity: UBUD_RESTAURANT_ID }),
      {
        "@type": "Restaurant",
        "@id": UBUD_RESTAURANT_ID,
        name: UBUD_RESTAURANT_NAME,
        url: `${ORIGIN}${input.path}`,
        description: input.text.description,
        image: schemaImage(input.image, ORIGIN),
        ...UBUD_RESTAURANT_FACTS,
      },
    ],
    "ubud",
  );
}

// ── The blog ──────────────────────────────────────────────────────────────

const blogPath = (property: PropertySlug) => `/${property}/discover`;
const blogId = (property: PropertySlug) => `${ORIGIN}${blogPath(property)}#blog`;

function blogNode(property: PropertySlug): SchemaNode {
  return {
    "@type": "Blog",
    "@id": blogId(property),
    name: `${PROPERTY_NAMES[property]} blog`,
    url: `${ORIGIN}${blogPath(property)}`,
  };
}

/**
 * Whether a post is an article. The dated pages outside `/discover/` — the
 * detox and yoga retreats, the three spa treatments — sell a service and are
 * marked up as one.
 */
export function isArticle(post: { path: string; property: PropertySlug }): boolean {
  return post.path.startsWith(`${blogPath(post.property)}/`);
}

export type ArticleInput = {
  path: string;
  property: PropertySlug;
  title: string;
  date: string;
};

export function buildBlogIndexSchema(
  input: PageInput & { property: PropertySlug; posts: ArticleInput[] },
) {
  const { property } = input;
  const author = ref(PROPERTY_IDS[property]);
  return graph(
    [
      webPage(input, { type: "CollectionPage", mainEntity: blogId(property) }),
      {
        ...blogNode(property),
        publisher: author,
        blogPost: input.posts.filter(isArticle).map((post) => ({
          "@type": "BlogPosting",
          "@id": `${ORIGIN}${post.path}#article`,
          headline: post.title,
          url: `${ORIGIN}${post.path}`,
          datePublished: post.date,
          author,
        })),
      },
    ],
    property,
  );
}

/** Author and publisher are the property whose blog the post is in, and the
 *  article itself says so (`PostBody`), so a reader sees the same author. */
export function buildBlogPostSchema(
  input: PageInput & ArticleInput & { image?: string | null },
) {
  const { path, text, property } = input;
  const id = `${ORIGIN}${path}#article`;
  const author = ref(PROPERTY_IDS[property]);
  return graph(
    [
      webPage(input, { mainEntity: id }),
      {
        "@type": "BlogPosting",
        "@id": id,
        url: `${ORIGIN}${path}`,
        headline: input.title,
        description: text.description,
        image: schemaImage(input.image, ORIGIN),
        datePublished: input.date,
        author,
        publisher: author,
        mainEntityOfPage: ref(`${ORIGIN}${path}#webpage`),
        isPartOf: ref(blogId(property)),
      },
      blogNode(property),
    ],
    property,
  );
}
