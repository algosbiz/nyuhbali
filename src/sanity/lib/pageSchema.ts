/**
 * Turns what a page displays into its structured data.
 *
 * Every value comes from the resolvers the page itself renders from — the
 * `page` document's visible sections, `getRooms`, `getExperiences`,
 * `getPosts`, and the same metadata call the route's `generateMetadata` makes
 * — so editing a price, a photograph or a title in the Studio changes the page
 * and its schema in one publish. The shapes are in `data/schema/builders.ts`
 * and the facts the CMS does not hold are in `data/schema/shared.ts`.
 */
import type { Metadata } from "next";
import {
  buildBlogIndexSchema,
  buildBlogPostSchema,
  buildContactSchema,
  buildHotelSpaSchema,
  buildListingSchema,
  buildPlainSchema,
  buildRestaurantSchema,
  buildServiceSchema,
  buildSpaSchema,
  buildVillaSchema,
  isArticle,
  type ListedItem,
} from "@/data/schema/builders";
import { PAGE_CONTENT, PAGE_SCHEMAS, type PageContent } from "@/data/schema/pages";
import { parsePrice } from "@/data/schema/parse";
import {
  IN_HOUSE_EXPERIENCES,
  ROOM_SCHEMA_NAMES,
  ROOM_SIZE_UNCONFIRMED,
  type SchemaNode,
} from "@/data/schema/shared";
import {
  getExperiences,
  getPosts,
  getRooms,
  getSanityPage,
  type ResolvedExperience,
  type ResolvedPost,
  type ResolvedRoom,
} from "@/sanity/lib/content";
import { resolveImageUrl } from "@/sanity/lib/image";
import {
  metadataText,
  resolveDocumentMetadata,
  resolveWebPageText,
} from "@/sanity/lib/metadata";
import type { SanitySection } from "@/sanity/types";

// ── Documents with a type of their own ────────────────────────────────────

const roomPath = (room: ResolvedRoom) => `/${room.property}/villa/${room.slug}`;

function roomName(room: ResolvedRoom): string {
  return ROOM_SCHEMA_NAMES[roomPath(room)] ?? room.title;
}

export function roomSchema(room: ResolvedRoom): SchemaNode {
  const path = roomPath(room);
  return buildVillaSchema({
    path,
    text: metadataText(resolveDocumentMetadata(path, room)),
    property: room.property,
    name: roomName(room),
    image: room.hero,
    details: room.details,
    amenities: room.amenities,
    omitSize: ROOM_SIZE_UNCONFIRMED.has(path),
  });
}

/** A retreat programme, a wellness class or a culture activity. All Ubud's. */
export function experienceSchema(experience: ResolvedExperience): SchemaNode {
  const path = `/ubud/${experience.slug}`;
  return buildServiceSchema({
    path,
    text: metadataText(resolveDocumentMetadata(path, experience)),
    property: "ubud",
    name: experience.title,
    image: experience.hero,
    price: experience.price,
    inHouseOnly: IN_HOUSE_EXPERIENCES.has(experience.slug),
  });
}

/** An article, or — outside the blog's own prefix — a service with a date. */
export function postSchema(post: ResolvedPost): SchemaNode {
  const { path, property, title, date, image } = post;
  const text = metadataText(resolveDocumentMetadata(path, post));
  if (isArticle(post)) {
    return buildBlogPostSchema({ path, text, property, title, date, image });
  }
  return buildServiceSchema({
    path,
    text,
    property,
    name: title,
    image,
    bySpa: path.startsWith("/ubud/spa/"),
  });
}

/** The two legal pages are about the brand, not about either property. */
export function legalSchema(path: string, metadata: Metadata): SchemaNode {
  return buildPlainSchema({ path, text: metadataText(metadata) });
}

// ── Hand-written pages ────────────────────────────────────────────────────

/** The parts of a `page` document its schema is built from. */
function contentFrom(sections: SanitySection[]): PageContent {
  const content: PageContent = {};
  for (const section of sections) {
    switch (section._type) {
      case "heroSection":
        content.title ??= section.title;
        content.image ??= resolveImageUrl(section.images?.[0]);
        break;
      case "roomListSection":
        (content.rooms ??= []).push(...(section.rooms ?? []));
        break;
      case "packageListSection":
        (content.bands ??= []).push({
          heading: section.heading,
          // The same choice `PackageListBlock` makes.
          packages:
            (section.source === "reference" ? section.packageSet?.packages : section.packages) ??
            [],
        });
        break;
      case "treatmentListSection":
        (content.menu ??= []).push(...(section.categories ?? []));
        break;
    }
  }
  return content;
}

/** `ManagedPage`'s rule: no visible section means the route's own content. */
async function pageContent(path: string, sections?: SanitySection[]): Promise<PageContent> {
  const published = sections ?? (await getSanityPage(path))?.sections ?? [];
  const visible = published.filter((section) => !section.isHidden);
  return visible.length ? contentFrom(visible) : (PAGE_CONTENT[path] ?? {});
}

/** The page a button leads to on this site, or nothing for a file, an anchor
 *  or the booking engine. */
function pagePath(href: string | undefined): string | undefined {
  if (!href?.startsWith("/") || href.startsWith("/uploads/")) return undefined;
  return href.replace(/[?#].*$/, "").replace(/(.)\/+$/, "$1");
}

/**
 * What a linked page calls itself. A listing card is often worded for the
 * card ("Anti Aging Retreat"); the schema names the thing by its own page
 * ("Luxury Anti Aging Retreat in Ubud Bali"), so one thing has one name
 * wherever it is listed.
 */
async function pageNames(): Promise<Map<string, string>> {
  const [rooms, experiences] = await Promise.all([getRooms(), getExperiences()]);
  return new Map([
    ...rooms.map((room): [string, string] => [roomPath(room), roomName(room)]),
    ...experiences.map((item): [string, string] => [`/ubud/${item.slug}`, item.title]),
  ]);
}

async function listedItems(content: PageContent, omit: string[]): Promise<ListedItem[]> {
  const names = await pageNames();
  const named = async (path: string, fallback: string): Promise<ListedItem> => ({
    kind: "page",
    name: names.get(path) ?? (await pageContent(path)).title ?? fallback,
    path,
  });

  const items: ListedItem[] = [];

  for (const room of content.rooms ?? []) {
    const path = pagePath(room.detailsHref);
    if (path && !omit.includes(path)) items.push(await named(path, room.name));
  }

  for (const band of content.bands ?? []) {
    for (const item of band.packages) {
      const path = item.ctas?.map((cta) => pagePath(cta.href)).find(Boolean);
      if (path) {
        if (!omit.includes(path)) items.push(await named(path, item.name));
        continue;
      }
      // Without a page of its own an item is listed only if it is something a
      // guest buys. An entry named after the band it opens is the band's own
      // introduction ("Dining Experience"), and one with neither a price nor
      // anything to press is an amenity (the Rindik performance).
      const price = item.meta?.map((row) => parsePrice(row.value)).find(Boolean);
      const introducesBand = item.name.trim() === band.heading?.trim();
      if (introducesBand || (!price && !item.ctas?.length)) continue;
      items.push({ kind: "service", name: item.name.trim(), price });
    }
  }

  return items;
}

/**
 * The schema for a hand-written route, or null for a page that has none.
 *
 * `sections` are the ones the page is about to render, so the two read one
 * list; a route with no page builder of its own (`/ubud/fitness`) leaves them
 * out.
 */
export async function pageSchema(
  path: string,
  sections?: SanitySection[],
): Promise<SchemaNode | null> {
  const schema = PAGE_SCHEMAS[path];
  if (!schema) return null;

  const text = await resolveWebPageText(path);
  if (schema.kind === "plain") return buildPlainSchema({ path, text, property: schema.property });
  if (schema.kind === "contact") return buildContactSchema({ path, text, property: schema.property });
  if (schema.kind === "blog") {
    const posts = await getPosts(schema.property);
    return buildBlogIndexSchema({ path, text, property: schema.property, posts });
  }

  const content = await pageContent(path, sections);
  switch (schema.kind) {
    case "service":
      return buildServiceSchema({
        path,
        text,
        property: schema.property,
        name: content.title ?? text.name ?? "",
        image: content.image,
      });
    case "spa":
      return buildSpaSchema({ path, text, image: content.image, menu: content.menu ?? [] });
    case "hotelSpa":
      return buildHotelSpaSchema({
        path,
        text,
        property: schema.property,
        menu: content.menu ?? [],
      });
    case "restaurant":
      return buildRestaurantSchema({ path, text, image: content.image });
    case "listing":
      return buildListingSchema({
        path,
        text,
        property: schema.property,
        items: await listedItems(content, schema.omit ?? []),
        inHouseOnly: schema.inHouseOnly,
        servicesPath: schema.servicesPath,
      });
  }
}
