/**
 * One-off import of everything in src/data/ into Sanity.
 *
 * Run it with:
 *
 *   npm run sanity:migrate                 # create missing documents only
 *   npm run sanity:migrate:dry             # print what would be written
 *
 * and see README-SANITY.md for the flags. Every document gets a deterministic
 * `_id` derived from its slug or path, so a rerun updates the same documents
 * instead of duplicating them, and the default mode creates only what is
 * missing — an editor's later changes survive a rerun untouched.
 *
 * ── Two things worth knowing ──────────────────────────────────────────
 *
 * **Posts are stored as recovered blocks, not as the flat paragraphs they
 * were imported from.** src/components/property/postBlocks.ts says its three
 * recovery passes "are what a migration would run once" — so this runs
 * `toArticleBlocks` and writes the result. After this, the listicles are real
 * point lists, the 88 question/answer pairs are real FAQ blocks and the spa
 * rate table is a real table, stored that way in the CMS rather than being
 * re-derived by heuristics on every render.
 *
 * **Images are written as `/uploads/…` paths, not uploads.** Every photograph
 * and menu PDF is served by this site now (public/uploads/, see
 * next.config.ts), so an image field gets that path in `externalUrl` and no
 * asset — a migrated page renders exactly what the code renders, and nothing
 * is copied into the Sanity project by a run that was only asked to import
 * content.
 *
 * `--upload-images` still uploads them, reading each file from disk rather
 * than fetching it. **But to move an existing dataset to uploaded assets, use
 * `npm run sanity:images` instead** — this script reaches documents through
 * `--replace`, which rebuilds them from src/data/ and would discard every edit
 * an author has made in the Studio since. `upload-images.mjs` changes only the
 * image objects inside whatever is published right now.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { createClient } from "@sanity/client";
import { getCliClient } from "sanity/cli";

import {
  EXPERIENCES,
  PERSONALISED_RETREATS,
  RETREAT_INQUIRY_FIELDS,
  type Experience,
} from "../../src/data/experiences";
import {
  PRIVACY_POLICY_SECTIONS,
  TERMS_CONDITIONS_SECTIONS,
  type LegalSection,
} from "../../src/data/legal";
import { UBUD_OFFER_QUOTES, UBUD_ROMANCE_PACKAGES } from "../../src/data/packages";
import { POSTS, POST_CATEGORIES, type Post } from "../../src/data/posts";
import { PROPERTY_SITES, type PropertySlug } from "../../src/data/properties";
import { ROOM_DETAILS } from "../../src/data/rooms";
import { ROUTE_SEO } from "../../src/data/seo";
import { TESTIMONIALS } from "../../src/data/testimonials";
import { toArticleBlocks } from "../../src/components/property/postBlocks";
import {
  HERO_IMAGES as ubudVillaHero,
  SUITES_INTRO as ubudSuitesIntro,
  VILLAS_INTRO as ubudVillasIntro,
  suites as ubudSuites,
  villas as ubudVillas,
} from "../../src/data/pages/ubud-villa";
import {
  HERO_IMAGES as seminyakVillaHero,
  VILLAS_INTRO as seminyakVillasIntro,
  villas as seminyakVillas,
} from "../../src/data/pages/seminyak-villa";
import {
  HERO_IMAGES as ubudDiningHero,
  DINING as ubudDining,
  GUEST_QUOTES as ubudDiningQuotes,
} from "../../src/data/pages/ubud-dining";
import {
  HERO_IMAGES as seminyakDiningHero,
  DINING as seminyakDining,
  GUEST_QUOTES as seminyakDiningQuotes,
} from "../../src/data/pages/seminyak-dining";
import {
  HERO_IMAGES as ubudSpaHero,
  SPA_INTRO as ubudSpaIntro,
  TREATMENTS as ubudTreatments,
  GUEST_QUOTES as ubudSpaQuotes,
  RESERVE_HREF as ubudSpaReserveHref,
} from "../../src/data/pages/ubud-spa";
import {
  HERO_IMAGES as seminyakSpaHero,
  SPA_INTRO as seminyakSpaIntro,
  TREATMENTS as seminyakTreatments,
  GUEST_QUOTES as seminyakSpaQuotes,
  SPA_RESERVATION_HREF as seminyakSpaReserveHref,
} from "../../src/data/pages/seminyak-spa";
import {
  HERO_IMAGES as ubudPackagesHero,
  RETREAT_PACKAGES as ubudRetreatPackages,
  WEDDING_HIGHLIGHT as ubudWeddingHighlight,
} from "../../src/data/pages/ubud-packages";
import { HERO_IMAGES as ubudRomanceHero } from "../../src/data/pages/ubud-romance";
import {
  HERO_IMAGES as seminyakRomanceHero,
  GUEST_QUOTES as seminyakRomanceQuotes,
  romanticPackages as seminyakRomanticPackages,
} from "../../src/data/pages/seminyak-romance";
import {
  HERO_IMAGES as ubudRetreatHero,
  RETREAT_PROGRAMS as ubudRetreatPrograms,
} from "../../src/data/pages/ubud-retreat";
import {
  HERO_IMAGES as ubudLuxuryHero,
  LUXURY_INTRO as ubudLuxuryIntro,
  PROGRAMS as ubudLuxuryPrograms,
} from "../../src/data/pages/ubud-retreat-luxury";
import {
  HERO_IMAGES as ubudCultureHero,
  ACTIVITIES as ubudCultureActivities,
} from "../../src/data/pages/ubud-culture";
import {
  HERO_IMAGES as ubudWellnessHero,
  FACILITIES as ubudWellnessFacilities,
  GUEST_QUOTES as ubudWellnessQuotes,
} from "../../src/data/pages/ubud-wellness";
import {
  HERO_IMAGES as servicesHero,
  SERVICES_INTRO as servicesIntro,
  SERVICES as servicesList,
} from "../../src/data/pages/complimentary-services";
import { HOME_PANELS } from "../../src/data/pages/home";
import {
  SPA_RESERVATION_COPY,
  SPA_RESERVATION_FIELDS,
  SPA_RESERVATION_PRICING,
} from "../../src/data/spa-reservations";
import {
  PERSONALIZE_RETREAT_CONFIRMATION,
  PERSONALIZE_RETREAT_FIELDS,
  PERSONALIZE_RETREAT_HEADING,
  PERSONALIZE_RETREAT_SUBMIT_LABEL,
} from "../../src/data/pages/ubud-personalize-retreat";
import {
  SEMINYAK_DIRECTORY,
  SUITE_DIRECTORY,
  UBUD_DIRECTORY,
  WELCOME_ABOARD,
  type DirectoryPageContent,
} from "../../src/data/pages/directories";

/** The four pages nothing on the site links to — see CLAUDE.md, Pass 5. */
const DIRECTORY_PAGES: Array<
  [string, string, PropertySlug, DirectoryPageContent]
> = [
  ["/seminyak-directory", "In-room directory — Seminyak", "seminyak", SEMINYAK_DIRECTORY],
  ["/ubud-directory", "In-room directory — Ubud", "ubud", UBUD_DIRECTORY],
  ["/suite-directory", "In-room directory — Ubud suites", "ubud", SUITE_DIRECTORY],
  ["/welcomeaboard", "Welcome Aboard — staff onboarding", "ubud", WELCOME_ABOARD],
];
import {
  HERO_IMAGES as seminyakTourHero,
  DAY_TRAVELLING as seminyakDayTravelling,
  TOURS as seminyakTours,
  TOUR_PROSE as seminyakTourProse,
  TOUR_FIELDS as seminyakTourFields,
  BOOKING_ANCHOR as seminyakTourAnchor,
} from "../../src/data/pages/seminyak-tour";
import {
  HERO_IMAGES as hostRetreatHero,
  INTRO as hostRetreatIntro,
  MEALS as hostRetreatMeals,
  UPLOADS as hostRetreatUploads,
} from "../../src/data/pages/ubud-host-retreat";
import {
  HERO_IMAGES as ubudWeddingHero,
  WEDDING_INTRO as ubudWeddingIntro,
  WEDDING_FIELDS as ubudWeddingFields,
} from "../../src/data/pages/ubud-wedding";
import type { TreatmentCategory } from "../../src/components/property/TreatmentList";
import type { InquiryField } from "../../src/components/property/InquiryForm";

import type { PackageItem, PackageRun } from "../../src/components/property/PackageList";

// ── Flags ──────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const replaceExisting = argv.includes("--replace");
/** Off by default: the site hotlinks, so nothing is copied unless asked. */
const uploadImages = argv.includes("--upload-images");
const dryRun = argv.includes("--dry-run");
const onlyArg = argv.find((a) => a.startsWith("--only="));
const only = onlyArg ? new Set(onlyArg.slice("--only=".length).split(",")) : null;

const wants = (step: string) => !only || only.has(step);

// ── Client ─────────────────────────────────────────────────────────────

type MigrationDocument = { _id: string; _type: string; [key: string]: unknown };

/**
 * A dry run must not need credentials — that is most of its value, since it
 * lets the whole conversion be checked before a project even exists.
 *
 * With a write token the client is built from scratch rather than from the
 * CLI's own session, so the migration needs no `sanity login` at all. That
 * matters when the browser-based login cannot complete — a stale session in
 * the default browser is enough — and it is also what makes the script usable
 * from CI, where there is no interactive login to do.
 */
const writeToken = process.env.SANITY_API_WRITE_TOKEN?.trim();

const client = dryRun
  ? null
  : writeToken
    ? createClient({
        projectId:
          process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim() ||
          process.env.SANITY_STUDIO_PROJECT_ID?.trim() ||
          "",
        dataset:
          process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() ||
          process.env.SANITY_STUDIO_DATASET?.trim() ||
          "production",
        apiVersion: "2025-02-19",
        token: writeToken,
        useCdn: false,
      })
    : getCliClient({ apiVersion: "2025-02-19" });

const counts: Record<string, number> = {};
/** Block kinds written into post bodies — how the recovery actually landed. */
const blockCounts: Record<string, number> = {};

async function write(document: MigrationDocument) {
  counts[document._type] = (counts[document._type] ?? 0) + 1;
  if (dryRun || !client) return;
  if (replaceExisting) await client.createOrReplace(document);
  else await client.createIfNotExists(document);
}

// ── Ids and keys ───────────────────────────────────────────────────────

/**
 * Deterministic document ids, joined with `-` and never `.`.
 *
 * The dot matters more than it looks. Sanity's default public access grant is
 * `_id in path("*")`, and `path("*")` matches only single-segment ids — the
 * same rule that keeps `drafts.foo` out of published reads. An id like
 * `post.ubud-discover-hatha-yoga` therefore reads as a namespaced path and is
 * excluded from every anonymous query: with dotted ids, 57 of these 58
 * documents were invisible to a tokenless read on a dataset marked public,
 * and only `siteSettings` — the one id with no dot — came back.
 *
 * Server rendering never noticed, because it reads with a token. What it
 * breaks is everything tokenless: Live Content in the browser, and any public
 * API consumer.
 */
function safeId(prefix: string, value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${prefix}-${slug}`;
}

/**
 * Posts whose URL changed after they were first imported.
 *
 * A document's `_id` is fixed when it is created, while `safeId` derives one
 * from the path. So a post that moves would be looked for under an id that
 * does not exist: `posts` would create a second copy of the article, and
 * `categories` would fail patching nothing. Pinning the original id is what
 * keeps a rerun writing to the document that is already there. The id is
 * internal and appears in no URL.
 */
const MOVED_POST_IDS: Record<string, string> = {
  "/ubud/discover/luxury-hotel-awards": "post-ubud-discoverl-luxury-hotel-awards",
};

function postId(path: string): string {
  return MOVED_POST_IDS[path] ?? safeId("post", path.slice(1));
}

/**
 * Array item keys must be stable across reruns, or --replace would hand every
 * item a new identity and Sanity's history would show the whole array as
 * rewritten each time.
 */
function key(prefix: string, index: number): string {
  return `${prefix}-${String(index + 1).padStart(3, "0")}`;
}

// ── Images ─────────────────────────────────────────────────────────────

type SanityImageValue = {
  _type: "imageWithAlt";
  alt: string;
  /** Set when the file was uploaded; absent for a hotlink. */
  asset?: { _type: "reference"; _ref: string };
  /** The live site's URL, which is what the default run writes. */
  externalUrl?: string;
};

const imageCache = new Map<string, SanityImageValue | undefined>();
let hotlinked = 0;
let uploaded = 0;
let reused = 0;
let failed = 0;

/**
 * Builds an image value for one live-site URL.
 *
 * By default that is the URL itself — no download, no upload, and the page
 * keeps rendering the same file from the same CDN it does today.
 *
 * With --upload-images the file is fetched once and uploaded, keyed on
 * `source.id`. That key is what makes a rerun cheap and idempotent: Sanity is
 * asked whether an asset with this origin already exists before anything is
 * downloaded, so an interrupted upload run resumes instead of starting over.
 * An upload that fails keeps the hotlink rather than leaving the field empty.
 */
async function migratedImage(
  url: string | undefined,
  alt: string,
): Promise<SanityImageValue | undefined> {
  if (!url) return undefined;
  // Assets are served by this site now, so a data file names them `/uploads/…`
  // rather than nyuhbalivillas.com. Absolute URLs are still accepted for
  // anything genuinely remote. Anything else is a mistake worth naming.
  const isLocal = url.startsWith("/uploads/");
  if (!isLocal && !/^https?:\/\//.test(url)) {
    console.warn(`  ! neither a /uploads path nor an absolute URL, skipped: ${url}`);
    return undefined;
  }

  const cacheKey = `${url} ${alt}`;
  if (imageCache.has(cacheKey)) return imageCache.get(cacheKey);

  const hotlink: SanityImageValue = { _type: "imageWithAlt", alt, externalUrl: url };

  if (!uploadImages) {
    hotlinked += 1;
    imageCache.set(cacheKey, hotlink);
    return hotlink;
  }

  if (dryRun || !client) {
    uploaded += 1;
    const stub: SanityImageValue = {
      _type: "imageWithAlt",
      alt,
      asset: { _type: "reference", _ref: `image-DRYRUN-${imageCache.size}` },
    };
    imageCache.set(cacheKey, stub);
    return stub;
  }

  // Keyed on the path, so `upload-images.mjs` and this script share one asset
  // per photograph instead of uploading it twice under different keys.
  const sourceId = isLocal ? `nbv-local:${url}` : `nbv-live:${url}`;
  let assetId = await client.fetch<string | null>(
    `*[_type == "sanity.imageAsset" && source.id == $sourceId][0]._id`,
    { sourceId },
  );

  if (assetId) {
    reused += 1;
  } else {
    try {
      let buffer: Buffer;
      if (isLocal) {
        // public/uploads mirrors WordPress's own /YYYY/MM/ layout, so the URL
        // path is the file path.
        buffer = await readFile(join(process.cwd(), "public", decodeURIComponent(url)));
      } else {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        buffer = Buffer.from(await response.arrayBuffer());
      }
      const filename = decodeURIComponent(url.split("/").pop() || "image");
      const asset = await client.assets.upload("image", buffer, {
        filename,
        source: { id: sourceId, name: "Live site migration", url },
      });
      assetId = asset._id;
      uploaded += 1;
    } catch (error) {
      // Keeping the hotlink means a flaky download costs nothing: the page
      // still renders, and a later rerun can upload it.
      failed += 1;
      console.warn(`  ! upload failed, kept hotlink: ${url} (${(error as Error).message})`);
      imageCache.set(cacheKey, hotlink);
      return hotlink;
    }
  }

  const value: SanityImageValue = {
    _type: "imageWithAlt",
    alt,
    asset: { _type: "reference", _ref: assetId },
  };
  imageCache.set(cacheKey, value);
  return value;
}

async function migratedImages(
  urls: string[] | undefined,
  alt: string,
): Promise<SanityImageValue[]> {
  const out: SanityImageValue[] = [];
  for (const [index, url] of (urls ?? []).entries()) {
    const image = await migratedImage(url, alt);
    if (image) out.push({ ...image, _key: key("img", index) } as SanityImageValue);
  }
  return out;
}

// ── Shared field builders ──────────────────────────────────────────────

function seoFor(path: string) {
  const entry = ROUTE_SEO[path];
  if (!entry) return undefined;
  return {
    _type: "seo",
    title: entry.title,
    ...(entry.description ? { description: entry.description } : {}),
  };
}

function linkValue(
  cta: { label: string; href: string; external?: boolean; inScope?: boolean; variant?: string },
  index: number,
) {
  return {
    _type: "link",
    _key: key("cta", index),
    label: cta.label,
    href: cta.href,
    external: cta.external ?? false,
    inScope: cta.inScope ?? true,
    ...(cta.variant ? { variant: cta.variant } : {}),
  };
}

function bulletGroups(
  groups: Array<{ heading?: string; items: string[] }> | undefined,
  prefix: string,
) {
  return (groups ?? []).map((group, index) => ({
    _type: "bulletGroup",
    _key: key(prefix, index),
    ...(group.heading ? { heading: group.heading } : {}),
    items: group.items,
  }));
}

function faqItems(faqs: Array<{ question: string; answer: string }> | undefined) {
  return (faqs ?? []).map((faq, index) => ({
    _type: "faqItem",
    _key: key("faq", index),
    question: faq.question,
    answer: faq.answer,
  }));
}


/**
 * A string or a run list written as the inline rich text the schema now takes.
 *
 * `packageItem.description` and `packageListSection.intro` became
 * `inlineRichText` in the CMS audit pass, so an editor can bold a phrase the
 * way the in-room directory pages already do. The directories are also the
 * one place `src/data` holds runs rather than a string, and this is what
 * carries that bold into the CMS rather than flattening it on the way in.
 *
 * One block, because the value renders inside a `<p>` the layout draws.
 */

/**
 * A string or an array of paragraphs, written as the `proseRichText` those
 * fields now take: one block per paragraph, so the breaks an author wrote are
 * the breaks the CMS stores.
 *
 * Sibling of `inlineRichText`, which is the single-paragraph form used where
 * the value renders inside a `<p>` the layout already draws.
 */
function proseRichText(value: string | string[] | undefined) {
  if (!value) return undefined;
  const paragraphs = (typeof value === "string" ? [value] : value)
    .flatMap((entry) => entry.split(/\n{2,}/))
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (!paragraphs.length) return undefined;
  return paragraphs.map((text) => ({
    _type: "block" as const,
    _key: key("block", keyCounter++),
    style: "normal" as const,
    markDefs: [],
    children: [{ _type: "span" as const, _key: key("span", keyCounter++), text, marks: [] }],
  }));
}

let keyCounter = 0;

function inlineRichText(value: string | PackageRun[] | undefined) {
  if (!value) return undefined;
  const runs = typeof value === "string" ? [{ text: value }] : value;
  const children = runs
    .filter((run) => run.text)
    .map((run, index) => ({
      _type: "span" as const,
      _key: key("span", index),
      text: run.text,
      marks: run.bold ? ["strong"] : [],
    }));
  if (!children.length) return undefined;
  return [
    {
      _type: "block" as const,
      _key: key("block", 0),
      style: "normal" as const,
      markDefs: [],
      children,
    },
  ];
}

async function packageItems(items: PackageItem[], prefix: string) {
  const out = [];
  for (const [index, item] of items.entries()) {
    out.push({
      _type: "packageItem",
      _key: key(prefix, index),
      name: item.name,
      images: await migratedImages(item.images, item.name),
      ...(item.description ? { description: inlineRichText(item.description) } : {}),
      ...(item.benefitsHeading ? { benefitsHeading: item.benefitsHeading } : {}),
      ...(item.benefits?.length ? { benefits: item.benefits } : {}),
      ...(item.meta?.length
        ? {
            meta: item.meta.map((fact, i) => ({
              _type: "packageMeta",
              _key: key("meta", i),
              label: fact.label,
              value: fact.value,
            })),
          }
        : {}),
      ...(item.notes?.length ? { notes: item.notes } : {}),
      // Plain `linkValue` again. It briefly carried `inScope: cta.inScope ??
      // false` to reproduce `PackageList`'s own reading of a missing flag —
      // that disagreement is gone: PackageList reads it as every other
      // component does, and all 114 CTAs in src/data are explicit.
      ...(item.ctas?.length ? { ctas: item.ctas.map(linkValue) } : {}),
    });
  }
  return out;
}

// ── Properties ─────────────────────────────────────────────────────────

async function migrateProperties() {
  for (const slug of ["seminyak", "ubud"] as PropertySlug[]) {
    const site = PROPERTY_SITES[slug];
    await write({
      _id: safeId("property", slug),
      _type: "property",
      slug,
      label: site.label,
      logo: await migratedImage(site.logoSrc, `${site.label} logo`),
      navItems: site.navItems.map((item, index) => ({
        _type: "navItem",
        _key: key("nav", index),
        label: item.label,
        href: item.href,
        inScope: item.inScope,
        ...(item.children?.length
          ? {
              children: item.children.map((child, i) => ({
                _type: "navChild",
                _key: key("sub", i),
                label: child.label,
                href: child.href,
                inScope: child.inScope,
                external: child.external ?? false,
              })),
            }
          : {}),
      })),
      addressLines: site.contact.addressLines,
      phones: site.contact.phones,
      email: site.contact.email,
      maps: site.social.maps,
      facebook: site.social.facebook,
      instagram: site.social.instagram,
      bookingHref: site.bookingHref,
      bookingWidgetId: site.bookingWidgetId,
      offersHref: site.offersHref,
      blogPosts: site.blogPosts.map((post, index) => ({
        _type: "blogTeaser",
        _key: key("teaser", index),
        title: post.title,
        href: post.href,
      })),
      awardBadges: await migratedImages(site.awards.badges, `${site.label} award`),
      awardVariant: site.awards.variant,
    });
    console.log(`  property: ${slug}`);
  }
}

// ── Site settings ──────────────────────────────────────────────────────

/** `RETREAT_INQUIRY_FIELDS` as Site settings stores it — the same shape an
 * "Enquiry form" section's `fields` take. `seed-retreat-inquiry.mjs` writes
 * the same value into an existing dataset, where this step would be a no-op
 * (`createIfNotExists`). */
function retreatInquiryFieldsValue() {
  return RETREAT_INQUIRY_FIELDS.map((field, index) => ({
    _type: "inquiryField",
    _key: key("retreat-inquiry", index),
    kind: field.kind,
    name: field.name,
    label: field.label,
    ...("options" in field && field.options?.length ? { options: field.options } : {}),
    ...(field.required ? { required: true } : {}),
  }));
}

async function migrateSiteSettings() {
  const home = ROUTE_SEO["/"];
  await write({
    _id: "siteSettings",
    _type: "siteSettings",
    title: "Nyuh Bali Villas",
    ...(home?.description ? { description: home.description } : {}),
    // The two wordmarks. Different artwork, not two crops of one: the
    // homepage's tagline is cream for the dark photography it sits over, the
    // footer's is the mark that reads on `ink`. Seeded so the Studio shows
    // what is rendering rather than an empty field.
    homeLogo: await migratedImage(
      "/uploads/2023/04/logonyuhbali.webp",
      "Nyuh Bali Villas",
    ),
    footerLogo: await migratedImage("/uploads/2022/12/Logo-Nyuh-Bali.png", ""),
    legalLinks: [
      {
        _type: "link",
        _key: key("legal", 0),
        label: "Terms & Conditions",
        href: "/terms-conditions",
        external: false,
        inScope: true,
      },
      {
        _type: "link",
        _key: key("legal", 1),
        // The footer's own wording, not the page's title. The two differ on
        // this site and the copy rule is that neither gets reworded: the
        // legal bar says "Privacy & Policy", the page it opens is titled
        // "Privacy Policy". Seeded as the latter, this quietly changed the
        // footer on all 78 pages the moment the footer started reading it.
        label: "Privacy & Policy",
        href: "/privacy-policy",
        external: false,
        inScope: true,
      },
    ],
    defaultSeo: seoFor("/"),
    // The form that closes the six retreat programmes. Seeded so the Studio
    // shows the six questions the pages render, rather than an empty list an
    // editor would have to rebuild from memory to change one label.
    retreatInquiryFields: retreatInquiryFieldsValue(),
    retreatInquirySubmitLabel: "Send",
  });
  console.log("  siteSettings");
}

// ── Testimonials ───────────────────────────────────────────────────────

async function migrateTestimonials() {
  let total = 0;
  for (const property of ["seminyak", "ubud"] as PropertySlug[]) {
    for (const [index, item] of TESTIMONIALS[property].entries()) {
      await write({
        _id: safeId("testimonial", `${property}-${index + 1}-${item.author}`),
        _type: "testimonial",
        quote: item.quote,
        author: item.author,
        property,
        order: index + 1,
      });
      total += 1;
    }
  }
  console.log(`  testimonials: ${total}`);
}

// ── Rooms ──────────────────────────────────────────────────────────────

async function migrateRooms() {
  for (const [index, room] of ROOM_DETAILS.entries()) {
    await write({
      _id: safeId("room", `${room.property}-${room.slug}`),
      _type: "room",
      title: room.title,
      slug: { _type: "slug", current: room.slug },
      property: room.property,
      description: room.description,
      details: room.details.map((detail, i) => ({
        _type: "detailRow",
        _key: key("detail", i),
        label: detail.label,
        value: detail.value,
      })),
      amenities: room.amenities,
      facilities: room.facilities,
      hero: await migratedImage(room.hero, room.title),
      gallery: await migratedImages(room.gallery, room.title),
      order: index + 1,
      seo: seoFor(`/${room.property}/villa/${room.slug}`),
    });
    console.log(`  room: ${room.property}/${room.slug}`);
  }
}

// ── Experiences ────────────────────────────────────────────────────────

async function migrateExperiences() {
  for (const experience of EXPERIENCES as Experience[]) {
    const sections = [];
    for (const [index, section] of (experience.sections ?? []).entries()) {
      sections.push({
        _type: "experienceSection",
        _key: key("section", index),
        heading: section.heading,
        body: section.body,
        ...(section.image
          ? { image: await migratedImage(section.image, section.heading) }
          : {}),
      });
    }

    const highlights = [];
    for (const [index, item] of (experience.highlights?.items ?? []).entries()) {
      highlights.push({
        _type: "experienceHighlight",
        _key: key("highlight", index),
        icon: await migratedImage(item.icon, item.title),
        title: item.title,
        body: item.body,
      });
    }

    const team = [];
    for (const [index, member] of (experience.team?.members ?? []).entries()) {
      team.push({
        _type: "teamMember",
        _key: key("member", index),
        name: member.name,
        photo: await migratedImage(member.photo, member.name),
        bio: member.bio,
      });
    }

    await write({
      _id: safeId("experience", experience.slug),
      _type: "experience",
      title: experience.title,
      slug: experience.slug,
      group: experience.group,
      eyebrow: experience.eyebrow,
      paragraphs: experience.paragraphs,
      ...(experience.recommendedFor?.length
        ? { recommendedFor: experience.recommendedFor }
        : {}),
      ...(experience.note ? { note: experience.note } : {}),
      ...(sections.length ? { sections } : {}),
      ...(experience.blocks?.length
        ? {
            blocks: experience.blocks.map((block, index) => ({
              _type: "bulletBlock",
              _key: key("block", index),
              heading: block.heading,
              ...(block.intro ? { intro: block.intro } : {}),
              groups: bulletGroups(block.groups, `group-${index}`),
            })),
          }
        : {}),
      ...(experience.programs
        ? {
            programsHeading: experience.programs.heading,
            programs: experience.programs.tiers.map((tier, index) => ({
              _type: "experienceProgram",
              _key: key("tier", index),
              name: tier.name,
              groups: bulletGroups(tier.groups, `tier-${index}`),
            })),
          }
        : {}),
      ...(experience.inclusions?.length ? { inclusions: experience.inclusions } : {}),
      ...(experience.price ? { price: experience.price } : {}),
      ...(experience.highlights
        ? { highlightsHeading: experience.highlights.heading, highlights }
        : {}),
      ...(experience.closingCta ? { closingCta: experience.closingCta } : {}),
      ...(experience.team ? { teamHeading: experience.team.heading, team } : {}),
      ...(experience.faqHeading ? { faqHeading: experience.faqHeading } : {}),
      ...(experience.faq?.length ? { faq: faqItems(experience.faq) } : {}),
      hero: await migratedImage(experience.hero, experience.title),
      // The thumbnail this retreat shows when it is listed at the foot of
      // another one's page. Only the four personalised retreats are ever
      // listed that way, so only they carry one.
      ...(personalisedCardImage(experience.slug)
        ? {
            cardImage: await migratedImage(
              personalisedCardImage(experience.slug) as string,
              experience.title,
            ),
          }
        : {}),
      gallery: await migratedImages(experience.gallery, experience.title),
      seo: seoFor(`/ubud/${experience.slug}`),
    });
    console.log(`  experience: ${experience.slug}`);
  }
}

// ── Package sets ───────────────────────────────────────────────────────

async function migratePackageSets() {
  await write({
    _id: safeId("packageSet", "ubud-romance"),
    _type: "packageSet",
    title: "Ubud Romance",
    slug: { _type: "slug", current: "ubud-romance" },
    property: "ubud",
    // The shared inclusions are already spread into each package in
    // src/data/packages.ts, so they are not repeated in alwaysIncluded —
    // doing both would list every line twice.
    packages: await packageItems(UBUD_ROMANCE_PACKAGES, "pkg"),
  });
  console.log("  packageSet: ubud-romance");
}

// ── Posts ──────────────────────────────────────────────────────────────

/**
 * Converts one article block into its Sanity shape. This is where the
 * recovery pays off: `points`, `faq` and `price` arrive already structured
 * from `toArticleBlocks`, so they are stored as real blocks rather than as
 * the paragraph runs WordPress exported.
 */
async function articleBlockValue(
  block: ReturnType<typeof toArticleBlocks>[number],
  index: number,
  alt: string,
) {
  const _key = key("block", index);
  switch (block.kind) {
    case "heading":
      return { _type: "articleHeading", _key, text: block.text };
    case "paragraph":
      return { _type: "articleParagraph", _key, text: block.text };
    case "list":
      return { _type: "articleList", _key, items: block.items };
    case "image": {
      const image = await migratedImage(block.src, alt);
      return image ? { _type: "articleImage", _key, image } : null;
    }
    case "points": {
      const items = [];
      for (const [i, item] of block.items.entries()) {
        const body = [];
        for (const [j, child] of item.body.entries()) {
          if (child.kind === "paragraph") {
            body.push({
              _type: "articleParagraph",
              _key: key("body", j),
              text: child.text,
            });
          } else if (child.kind === "image") {
            const image = await migratedImage(child.src, alt);
            if (image) body.push({ _type: "articleImage", _key: key("body", j), image });
          }
        }
        items.push({
          _type: "articlePointItem",
          _key: key("point", i),
          label: item.label,
          ...(body.length ? { body } : {}),
        });
      }
      return { _type: "articlePoints", _key, ordered: block.ordered, items };
    }
    case "price":
      return {
        _type: "articlePrice",
        _key,
        table: {
          _type: "priceTable",
          columns: block.columns,
          rows: block.rows.map((row, i) => ({
            _type: "priceRow",
            _key: key("row", i),
            cells: row,
          })),
        },
      };
    case "faq":
      return {
        _type: "articleFaq",
        _key,
        heading: block.heading,
        items: faqItems(block.items),
      };
    default:
      return null;
  }
}

// ── Pages ──────────────────────────────────────────────────────────────

/**
 * Every hand-written page as a `page` document, section for section.
 *
 * This is what makes a page editable the way a room or a post already is: the
 * route wraps its own JSX in `ManagedPage`, so publishing the document here
 * takes the page over, and every section renders through the component the
 * route was already using. The document has to be *complete* — a published
 * page replaces the whole `<main>`, so a section left out is a band that
 * disappears rather than one that falls back.
 *
 * **The values are imported from the routes, never retyped.** Each route
 * exports the constants it renders (`HERO_IMAGES`, `DINING`, `TREATMENTS`, the
 * long intros…) and this step reads those same constants, so a seeded page
 * cannot drift from the page it was seeded from — which is the whole
 * requirement: put the pages in the CMS without changing a word of them.
 */
type SectionValue = Record<string, unknown> & { _type: string; _key: string };

let sectionSeq = 0;
const nextKey = () => key("section", sectionSeq++);

async function heroSection(
  images: string[],
  eyebrow: string,
  title: string,
  alt: string,
): Promise<SectionValue> {
  return {
    _type: "heroSection",
    _key: nextKey(),
    images: await migratedImages(images, alt),
    eyebrow,
    title,
    alt,
  };
}

const bookingWidgetSection = (): SectionValue => ({
  _type: "bookingWidgetSection",
  _key: nextKey(),
});

async function packageListSection(options: {
  eyebrow?: string;
  heading?: string;
  intro?: string | PackageRun[];
  packages: PackageItem[];
  tone?: "sand" | "sand-deep";
}): Promise<SectionValue> {
  return {
    _type: "packageListSection",
    _key: nextKey(),
    source: "inline",
    ...(options.eyebrow ? { eyebrow: options.eyebrow } : {}),
    ...(options.heading ? { heading: options.heading } : {}),
    ...(options.intro ? { intro: inlineRichText(options.intro) } : {}),
    ...(options.tone ? { tone: options.tone } : {}),
    packages: await packageItems(options.packages, "pkg"),
  };
}

async function roomListSection(options: {
  eyebrow?: string;
  heading: string;
  intro?: string;
  rooms: Array<{
    name: string;
    images: string[];
    bed: string;
    size: string;
    occupancy: string;
    detailsHref: string;
    detailsInScope?: boolean;
  }>;
  tone?: "sand" | "sand-deep";
}): Promise<SectionValue> {
  const rooms = [];
  for (const [index, room] of options.rooms.entries()) {
    rooms.push({
      _key: key("room", index),
      name: room.name,
      images: await migratedImages(room.images, room.name),
      bed: room.bed,
      size: room.size,
      occupancy: room.occupancy,
      detailsHref: room.detailsHref,
      detailsInScope: room.detailsInScope ?? true,
    });
  }
  return {
    _type: "roomListSection",
    _key: nextKey(),
    ...(options.eyebrow ? { eyebrow: options.eyebrow } : {}),
    heading: options.heading,
    ...(options.intro ? { intro: proseRichText(options.intro) } : {}),
    ...(options.tone ? { tone: options.tone } : {}),
    rooms,
  };
}

const amenitySection = (
  amenities: Array<{ icon: string; title: string; subtitle?: string }>,
  heading?: string,
  tone?: "sand" | "sand-deep",
): SectionValue => ({
  _type: "amenityGridSection",
  _key: nextKey(),
  ...(heading ? { heading } : {}),
  ...(tone ? { tone } : {}),
  amenities: amenities.map((item, index) => ({
    _type: "amenity",
    _key: key("amenity", index),
    icon: item.icon,
    title: item.title,
    ...(item.subtitle ? { subtitle: item.subtitle } : {}),
  })),
});

async function treatmentListSection(options: {
  eyebrow?: string;
  heading: string;
  intro?: string;
  notes?: string[];
  categories: TreatmentCategory[];
  cta?: { label: string; href: string };
  tone?: "sand" | "sand-deep";
}): Promise<SectionValue> {
  const categories = [];
  for (const [index, category] of options.categories.entries()) {
    categories.push({
      _type: "treatmentCategory",
      _key: key("cat", index),
      name: category.name,
      ...(category.image
        ? { image: await migratedImage(category.image, category.name) }
        : {}),
      treatments: category.treatments.map((treatment, t) => ({
        _type: "treatmentItem",
        _key: key("treat", t),
        name: treatment.name,
        description: treatment.description,
        options: treatment.options.map((option, o) => ({
          _type: "treatmentOption",
          _key: key("opt", o),
          label: option.label,
          href: option.href,
        })),
        ...(treatment.includes?.length ? { includes: treatment.includes } : {}),
      })),
    });
  }
  return {
    _type: "treatmentListSection",
    _key: nextKey(),
    ...(options.eyebrow ? { eyebrow: options.eyebrow } : {}),
    heading: options.heading,
    ...(options.intro ? { intro: proseRichText(options.intro) } : {}),
    ...(options.notes?.length ? { notes: options.notes } : {}),
    ...(options.cta ? { cta: linkValue(options.cta, 0) } : {}),
    ...(options.tone ? { tone: options.tone } : {}),
    categories,
  };
}

/** Quotes written on the page — the spa, dining and offers pages each carry
 * their own selection rather than the property's general reviews. */
const quotesSection = (
  quotes: Array<{ quote: string; author: string }>,
  property?: string,
): SectionValue => ({
  _type: "collectionSection",
  _key: nextKey(),
  collection: "testimonial",
  ...(property ? { property } : {}),
  quotes: quotes.map((item, index) => ({
    _type: "quoteItem",
    _key: key("quote", index),
    quote: item.quote,
    author: item.author,
  })),
});

const postsSection = (property: string, heading: string): SectionValue => ({
  _type: "collectionSection",
  _key: nextKey(),
  collection: "post",
  property,
  heading,
  tone: "sand",
});

async function linkCardGridSection(options: {
  heading: string;
  columns: 2 | 3 | 4;
  tone?: "sand" | "sand-deep";
  items: Array<{ label: string; href: string; imgSrc: string; inScope?: boolean }>;
}): Promise<SectionValue> {
  const items = [];
  for (const [index, item] of options.items.entries()) {
    items.push({
      _key: key("card", index),
      label: item.label,
      href: item.href,
      inScope: item.inScope ?? true,
      image: await migratedImage(item.imgSrc, item.label),
    });
  }
  return {
    _type: "linkCardGridSection",
    _key: nextKey(),
    heading: options.heading,
    columns: options.columns,
    ...(options.tone ? { tone: options.tone } : {}),
    items,
  };
}

const inquiryFormSection = (
  heading: string,
  fields: InquiryField[],
  submitLabel: string,
  anchor?: string,
): SectionValue => ({
  _type: "inquiryFormSection",
  _key: nextKey(),
  heading,
  submitLabel,
  ...(anchor ? { anchor } : {}),
  fields: fields.map((field, index) => ({
    _key: key("field", index),
    kind: field.kind,
    name: field.name,
    label: field.label,
    ...("options" in field && field.options?.length ? { options: field.options } : {}),
    ...(field.required ? { required: true } : {}),
  })),
});

/**
 * `feed`/`profileUrl` are omitted on the two About pages, where the band is the
 * page's own property and the default is right. /ubud/spa is the exception: it
 * is an Ubud page, so both would resolve to the resort's account and the band
 * published @nyuhbaliubud's posts under the spa's heading.
 */
const instagramSection = (
  heading: string,
  account?: { feed: string; profileUrl: string },
): SectionValue => ({
  _type: "instagramSection",
  _key: nextKey(),
  heading,
  ...(account ?? {}),
});

async function awardsSection(slug: PropertySlug): Promise<SectionValue> {
  const site = PROPERTY_SITES[slug];
  return {
    _type: "awardsSection",
    _key: nextKey(),
    ...(site.awards.variant ? { variant: site.awards.variant } : {}),
    badges: await migratedImages(site.awards.badges, `${site.label} award`),
  };
}

async function contactSection(options: {
  eyebrow: string;
  heading: string;
  intro?: string;
  image: string;
  alt: string;
}): Promise<SectionValue> {
  return {
    _type: "contactSection",
    _key: nextKey(),
    eyebrow: options.eyebrow,
    heading: options.heading,
    ...(options.intro ? { intro: proseRichText(options.intro) } : {}),
    image: await migratedImage(options.image, options.alt),
  };
}

/** The grid thumbnail each personalised retreat carries, from src/data. */
function personalisedCardImage(slug: string): string | undefined {
  return PERSONALISED_RETREATS.find((item) => item.slug === slug)?.image;
}

async function migratePages() {
  const U = "https://nyuhbalivillas.com/wp-content/uploads";
  const seminyakBooking = PROPERTY_SITES.seminyak.bookingHref;
  const ubudBooking = PROPERTY_SITES.ubud.bookingHref;

  const pages: Array<{
    path: string;
    title: string;
    property: PropertySlug;
    sections: SectionValue[];
  }> = [];

  const add = (
    path: string,
    title: string,
    property: PropertySlug,
    sections: SectionValue[],
  ) => {
    sectionSeq = 0;
    pages.push({ path, title, property, sections });
  };

  // ── About ────────────────────────────────────────────────────────
  sectionSeq = 0;
  add("/ubud", "About Us — Ubud", "ubud", [
    await heroSection(
      [`${U}/2025/01/home-ubud-compress.webp`],
      "Nyuh Bali Villas",
      "Ubud",
      "Nyuh Bali Villas Ubud",
    ),
    bookingWidgetSection(),
    {
      _type: "aboutNarrativeSection",
      _key: nextKey(),
      eyebrow: "About Us",
      heading: "Luxury Villas & Suite in Ubud",
      paragraphs: proseRichText([
        "Inspired by the philosophy of the coconut tree, or Nyuh in the Balinese language, which is known as the versatile tree to shore up people’s lives, Ubud Nyuh Bali Resort aims to create the holistic luxury retreat experience that you look for. Presenting you with two luxury yoga shalas, five-star accommodations, two swimming pools, a spa, and a home gym, you will feel the power of positive transformation of Ubud energy. Imagine waking up while hearing the groups of birds singing, inhaling the morning breeze during guided morning walks, stretching your body with a daily yoga class, and enjoying delicious healthy foods. Calm your mind by joining daily complimentary wellness activities like breathwork & sound healing to allow yourself to relax as your well-being deserves. With an experienced team that cares for you from the heart and with the personalized touch of our luxury villas in Ubud, you will feel recharged and reborn for a new beginning.",
      ]),
      buttonLabel: "Plan Now",
      promoCode: "ilovenyuh",
      perks: [
        "One-way airport transfer (for booking min 3 nights at our villa)",
        "20% discount at Mahamaya SPA",
        "Upgrade to floating breakfast",
      ],
      image: await migratedImage(
        `${U}/2026/08/Nyuh-Bali-Ubud-26-1.jpg`,
        "Luxury Villas & Suite in Ubud",
      ),
    },
    await linkCardGridSection({
      heading: "STAY",
      columns: 3,
      tone: "sand",
      items: [
        { label: "Suites", href: "/ubud/villa", imgSrc: `${U}/2023/03/Honeymoon-Suite-5.webp` },
        { label: "Romantic Villas", href: "/ubud/villa", imgSrc: `${U}/2023/03/ubud-One-Bedroom-Deluxe-Pool-Villa-6.webp` },
        { label: "Family Villas", href: "/ubud/villa", imgSrc: `${U}/2023/03/Four-Bedroom-Pool-Villa-4.webp` },
      ],
    }),
    await linkCardGridSection({
      heading: "DISCOVER",
      columns: 3,
      tone: "sand-deep",
      items: [
        { label: "Dining", href: "/ubud/dining", imgSrc: `${U}/2023/03/ezgif.com-gif-maker-3.webp` },
        { label: "SPA", href: "/ubud/spa", imgSrc: `${U}/2023/03/ubudspa.webp` },
        { label: "Experience", href: "/ubud/balinese-culture", imgSrc: `${U}/2026/08/Nyuh-Bali-Ubud-31-1.jpg` },
      ],
    }),
    await linkCardGridSection({
      heading: "OUR PACKAGES",
      columns: 3,
      tone: "sand",
      items: [
        { label: "Honeymoon", href: "/ubud/villa/honeymoon/packages", imgSrc: `${U}/2023/03/ezgif.com-gif-maker-7.webp` },
        { label: "Couple's Retreat", href: "/ubud/retreat/couples", imgSrc: `${U}/2023/03/ubud-yoga-4.webp` },
        { label: "Authentic Balinese Healing", href: "/ubud/retreat/luxury/balinese-healing", imgSrc: `${U}/2023/05/TD004090-min.webp` },
      ],
    }),
    {
      _type: "collectionSection",
      _key: nextKey(),
      collection: "testimonial",
      property: "ubud",
    },
    instagramSection("What's happening @nyuhbaliubud"),
    await awardsSection("ubud"),
  ]);

  sectionSeq = 0;
  add("/seminyak", "About Us — Seminyak", "seminyak", [
    await heroSection(
      [
        `${U}/2023/03/Seminyak-slider-3.webp`,
        `${U}/2023/03/seminyak-slider.webp`,
        `${U}/2023/03/home-seminyak.webp`,
      ],
      "Nyuh Bali Villas",
      "Seminyak",
      "Nyuh Bali Villas Seminyak",
    ),
    bookingWidgetSection(),
    {
      _type: "aboutNarrativeSection",
      _key: nextKey(),
      eyebrow: "About Us",
      heading: "Nyuh Bali's Honeymoon Villa in Seminyak",
      paragraphs: proseRichText([
        "Nestled in the heart of Seminyak, Nyuh Bali Villa is designed as a romantic oasis to unwind while having easy access to enjoy the Seminyak vibes. World-class restaurants, minimarket, and money changers are just a few steps from your door. Each villa represents the authentic Balinese style featuring a private pool, tropical greenery, and our signature Nyuh Bali touches for the romantic experience in Bali.",
        "Imagine the comfort of your private villa in Bali while enjoying the convenience of a fully serviced hotel such as onsite restaurant, spa, and shuttle around Seminyak. Butler service is ready around the clock as our commitment to deliver the highest level of personalized service. In every romantic journey, from the proposal, a honeymoon to the anniversary, we would love to make it memorable for you to treasure. All people at Nyuh Bali believe that your holiday should be less stressful. Let us take care your holiday in Seminyak Bali",
      ]),
      tagline: "We serve with smile and sincerity",
      buttonLabel: "Book Your Stay",
      promoCode: "ilovenyuh",
      perks: [
        "One-way airport transfer*",
        "IDR 200.000 credit for candlelight dinner & BBQ",
        "Upgrade to floating breakfast",
      ],
      image: await migratedImage(
        `${U}/2023/03/seminyak-best-price.webp`,
        "Nyuh Bali's Honeymoon Villa in Seminyak",
      ),
    },
    await linkCardGridSection({
      heading: "Our Villas",
      columns: 2,
      tone: "sand",
      items: [
        { label: "One-bedroom Pool Villa", href: "/seminyak/villa/honeymoon/pool", imgSrc: `${U}/2023/03/Seminyak-One-bedroom-pool-villa.webp` },
        { label: "Honeymoon Suite Pool Villa", href: "/seminyak/villa/honeymoon", imgSrc: `${U}/2023/03/Seminyak-slider-2.webp` },
      ],
    }),
    await linkCardGridSection({
      heading: "Discover",
      columns: 3,
      tone: "sand-deep",
      items: [
        { label: "Dining", href: "/seminyak/dining", imgSrc: `${U}/2023/01/BBQ-seminyak-min-min-slider-1-_1__1.webp` },
        { label: "SPA", href: "/seminyak/spa", imgSrc: `${U}/2023/03/discover-spa.webp` },
        { label: "Explore Bali", href: "/seminyak/tour", imgSrc: `${U}/2023/03/discover-explore-bali.webp` },
      ],
    }),
    await linkCardGridSection({
      heading: "Plan your Romantic Gateaway",
      columns: 4,
      tone: "sand",
      items: [
        { label: "Stress-Free Proposal", href: "/seminyak/villa/honeymoon/packages", imgSrc: `${U}/2023/01/stress-free-proposal-package.webp` },
        { label: "Sweet Celebration", href: "/seminyak/villa/honeymoon/packages", imgSrc: `${U}/2023/03/sweet-celebration.webp` },
        { label: "Dreamy Honeymoon", href: "/seminyak/villa/honeymoon/packages", imgSrc: `${U}/2022/12/Dreamy-Honeymoon-Package.jpeg` },
        { label: "Culture Hideaway", href: "/seminyak/villa/honeymoon/packages", imgSrc: `${U}/2023/01/balinese-culture-hideaway.webp` },
      ],
    }),
    {
      _type: "collectionSection",
      _key: nextKey(),
      collection: "testimonial",
      property: "seminyak",
    },
    instagramSection("What's happening @nyuhbalivillas"),
    await awardsSection("seminyak"),
  ]);

  // ── Stay ─────────────────────────────────────────────────────────
  sectionSeq = 0;
  add("/ubud/villa", "Stay — Ubud", "ubud", [
    await heroSection(
      ubudVillaHero,
      "Ubud",
      "Luxury Suite & Villa in Ubud",
      "Luxury suites and villas at Ubud Nyuh Bali Resort",
    ),
    bookingWidgetSection(),
    await roomListSection({
      eyebrow: "Stay",
      heading: "Suites",
      intro: ubudSuitesIntro,
      rooms: ubudSuites(ubudBooking),
      tone: "sand",
    }),
    await roomListSection({
      heading: "Villas",
      intro: ubudVillasIntro,
      rooms: ubudVillas(ubudBooking),
      tone: "sand-deep",
    }),
    amenitySection(
      [
        { icon: "wifi", title: "Complimentary", subtitle: "WIFI" },
        { icon: "spa", title: "SPA" },
        { icon: "dining", title: "16-Hour", subtitle: "In Room Dining" },
        { icon: "romance", title: "Romance" },
        { icon: "service", title: "Personalised", subtitle: "Service" },
        { icon: "yoga", title: "Yoga" },
        { icon: "gym", title: "Gym" },
        { icon: "class", title: "Balinese Class" },
      ],
      undefined,
      "sand",
    ),
    await awardsSection("ubud"),
  ]);

  sectionSeq = 0;
  add("/seminyak/villa", "Villas — Seminyak", "seminyak", [
    await heroSection(
      seminyakVillaHero,
      "Seminyak",
      "Seminyak Luxury Villas",
      "Private pool villas at Nyuh Bali Villas Seminyak",
    ),
    bookingWidgetSection(),
    await roomListSection({
      eyebrow: "Villas",
      heading: "Seminyak Luxury Villas",
      intro: seminyakVillasIntro,
      rooms: seminyakVillas(seminyakBooking),
      tone: "sand",
    }),
    amenitySection(
      [
        { icon: "wifi", title: "Complimentary", subtitle: "WIFI" },
        { icon: "spa", title: "SPA" },
        { icon: "dining", title: "16-Hour", subtitle: "In Room Dining" },
        { icon: "romance", title: "Romantic Villa" },
        { icon: "service", title: "Personalised", subtitle: "Service" },
      ],
      undefined,
      "sand-deep",
    ),
    await awardsSection("seminyak"),
  ]);

  // ── Dining ───────────────────────────────────────────────────────
  sectionSeq = 0;
  add("/ubud/dining", "Dining — Ubud", "ubud", [
    await heroSection(ubudDiningHero, "Ubud", "Dining", "Lumbini Restaurant at Ubud Nyuh Bali Resort"),
    await packageListSection({
      eyebrow: "Dining",
      heading: "Lumbini Restaurant in Ubud",
      packages: ubudDining,
      tone: "sand",
    }),
    quotesSection(ubudDiningQuotes, "ubud"),
    await awardsSection("ubud"),
  ]);

  sectionSeq = 0;
  add("/seminyak/dining", "Dining — Seminyak", "seminyak", [
    await heroSection(seminyakDiningHero, "Seminyak", "Dining Experience", "Dining at Nyuh Bali Villas Seminyak"),
    await packageListSection({
      eyebrow: "Dining",
      heading: "Dining Experience",
      packages: seminyakDining,
      tone: "sand",
    }),
    quotesSection(seminyakDiningQuotes, "seminyak"),
    await awardsSection("seminyak"),
  ]);

  // ── Spa ──────────────────────────────────────────────────────────
  sectionSeq = 0;
  add("/ubud/spa", "SPA — Ubud", "ubud", [
    await heroSection(ubudSpaHero, "Ubud", "Luxury Spa & Flower Bath", "Mahamaya Spa at Ubud Nyuh Bali Resort"),
    await treatmentListSection({
      eyebrow: "SPA",
      heading: "Luxury Spa & Flower Bath in Ubud",
      intro: ubudSpaIntro,
      notes: [
        "For spa inquiries, please email us through spa@ubudnyuhbali.com",
        "Opening Hours: 09.00 - 21.00",
      ],
      categories: ubudTreatments,
      cta: { label: "Reserve Now", href: ubudSpaReserveHref },
      tone: "sand",
    }),
    quotesSection(ubudSpaQuotes, "ubud"),
    instagramSection("What's happening @mahamayaspa.ubud", {
      feed: "spa",
      profileUrl: "https://www.instagram.com/mahamayaspa.ubud/",
    }),
    await awardsSection("ubud"),
  ]);

  sectionSeq = 0;
  add("/seminyak/spa", "SPA — Seminyak", "seminyak", [
    await heroSection(seminyakSpaHero, "Seminyak", "Romantic Spa Experience", "Spa at Nyuh Bali Villas Seminyak"),
    await treatmentListSection({
      eyebrow: "SPA",
      heading: "Romantic Spa Experience in Seminyak",
      intro: seminyakSpaIntro,
      notes: [
        "Opening Hours: 09.00 - 17.00",
        "Enjoy 20% Discount for early booking before arrival",
      ],
      categories: seminyakTreatments,
      cta: { label: "Reserve Now", href: seminyakSpaReserveHref },
      tone: "sand",
    }),
    quotesSection(seminyakSpaQuotes, "seminyak"),
    await awardsSection("seminyak"),
  ]);

  // ── Offers ───────────────────────────────────────────────────────
  sectionSeq = 0;
  add("/ubud/packages", "Offers — Ubud", "ubud", [
    await heroSection(ubudPackagesHero, "Ubud", "Offers", "Romance and retreat packages at Ubud Nyuh Bali Resort"),
    bookingWidgetSection(),
    await packageListSection({
      eyebrow: "Offers",
      heading: "Romance",
      intro: "Luxury Suite & Villa in Ubud",
      packages: UBUD_ROMANCE_PACKAGES.map((item, index) => ({
        ...item,
        images:
          index === 1
            ? [`${U}/2024/11/011A0124-Edit-min-min-min-1.jpg`, ...item.images]
            : index === 2
              ? [`${U}/2024/11/IMG_8918-Edit-min-1.jpg`, ...item.images]
              : item.images,
      })),
      tone: "sand",
    }),
    await packageListSection({ heading: "Retreat", packages: ubudRetreatPackages, tone: "sand-deep" }),
    await packageListSection({ heading: "Wedding", packages: ubudWeddingHighlight, tone: "sand" }),
    quotesSection(UBUD_OFFER_QUOTES, "ubud"),
    await awardsSection("ubud"),
  ]);

  sectionSeq = 0;
  add("/ubud/villa/honeymoon/packages", "Romance — Ubud", "ubud", [
    await heroSection(ubudRomanceHero, "Offers", "Ubud Romance", "Romantic honeymoon packages at Ubud Nyuh Bali Resort"),
    bookingWidgetSection(),
    await packageListSection({ heading: "Ubud Romance", packages: UBUD_ROMANCE_PACKAGES, tone: "sand" }),
    quotesSection(UBUD_OFFER_QUOTES, "ubud"),
    await awardsSection("ubud"),
  ]);

  sectionSeq = 0;
  add("/seminyak/villa/honeymoon/packages", "Offers — Seminyak", "seminyak", [
    await heroSection(seminyakRomanceHero, "Offers", "Romantic Package in Seminyak", "Romantic packages at Nyuh Bali Villas Seminyak"),
    bookingWidgetSection(),
    await packageListSection({
      eyebrow: "Offers",
      heading: "Romantic Package in Seminyak",
      packages: seminyakRomanticPackages(seminyakBooking),
      tone: "sand",
    }),
    quotesSection(seminyakRomanceQuotes, "seminyak"),
    await awardsSection("seminyak"),
  ]);

  // ── Retreat, culture, wellness, services ─────────────────────────
  sectionSeq = 0;
  add("/ubud/retreat", "Retreat — Ubud", "ubud", [
    await heroSection(ubudRetreatHero, "Ubud", "Retreat", "Luxury wellness retreat at Ubud Nyuh Bali Resort"),
    bookingWidgetSection(),
    await packageListSection({
      eyebrow: "Retreat",
      heading: "Personalised Luxury Retreat",
      packages: ubudRetreatPrograms,
      tone: "sand",
    }),
    await awardsSection("ubud"),
  ]);

  sectionSeq = 0;
  add("/ubud/retreat/luxury", "Luxury Retreat — Ubud", "ubud", [
    await heroSection(ubudLuxuryHero, "Retreat", "Personalised Luxury Retreat in Ubud", "Personalised luxury retreat at Ubud Nyuh Bali Resort"),
    await packageListSection({
      eyebrow: "Luxury Retreat",
      heading: "Personalised Luxury Retreat in Ubud",
      intro: ubudLuxuryIntro,
      packages: ubudLuxuryPrograms,
      tone: "sand",
    }),
    amenitySection(
      [
        { icon: "spa", title: "Private" },
        { icon: "service", title: "Personalized" },
        { icon: "class", title: "Start anytime", subtitle: "as you wish" },
      ],
      "Why our retreat is different",
      "sand-deep",
    ),
    await awardsSection("ubud"),
  ]);

  sectionSeq = 0;
  add("/ubud/balinese-culture", "Culture — Ubud", "ubud", [
    await heroSection(ubudCultureHero, "Ubud", "Authentic Balinese Activity", "Authentic Balinese activities at Ubud Nyuh Bali Resort"),
    await packageListSection({
      eyebrow: "Culture",
      heading: "Authentic Balinese Activity",
      packages: ubudCultureActivities,
      tone: "sand",
    }),
    await awardsSection("ubud"),
  ]);

  sectionSeq = 0;
  add("/ubud/wellness", "Wellness Facilities — Ubud", "ubud", [
    await heroSection(ubudWellnessHero, "Ubud", "Wellness", "Wellness facilities at Ubud Nyuh Bali Resort"),
    await packageListSection({
      eyebrow: "Wellness",
      heading: "Luxury Retreat in Ubud",
      packages: ubudWellnessFacilities,
      tone: "sand",
    }),
    quotesSection(ubudWellnessQuotes, "ubud"),
    await awardsSection("ubud"),
  ]);

  sectionSeq = 0;
  add("/complimentary-services", "Complimentary Services", "ubud", [
    await heroSection(servicesHero, "Ubud", "Complimentary Services", "Complimentary services at Ubud Nyuh Bali Resort"),
    await packageListSection({
      eyebrow: "Services",
      heading: "Complimentary Services",
      intro: servicesIntro,
      packages: servicesList,
      tone: "sand",
    }),
    await awardsSection("ubud"),
  ]);

  sectionSeq = 0;
  add("/ubud/wedding", "Wedding — Ubud", "ubud", [
    await heroSection(ubudWeddingHero, "Ubud", "Wedding", "Intimate wedding at Ubud Nyuh Bali Resort"),
    await packageListSection({
      eyebrow: "Wedding",
      heading: "Intimate Wedding in Ubud",
      packages: ubudWeddingIntro,
      tone: "sand",
    }),
    { ...inquiryFormSection("Personalize your Wedding", ubudWeddingFields, "Send"), tone: "sand-deep" },
    await awardsSection("ubud"),
  ]);

  // ── Blog indexes ─────────────────────────────────────────────────
  sectionSeq = 0;
  add("/ubud/discover", "Blog — Ubud", "ubud", [
    await heroSection([`${U}/2023/05/IS_06578-min.webp`], "Ubud", "Our Blog", "Stories from Ubud Nyuh Bali Resort"),
    postsSection("ubud", "Our Blog"),
    await awardsSection("ubud"),
  ]);

  sectionSeq = 0;
  add("/seminyak/discover", "Blog — Seminyak", "seminyak", [
    await heroSection([`${U}/2023/03/seminyak-slider.webp`], "Seminyak", "Our Blog", "Stories from Nyuh Bali Villas Seminyak"),
    postsSection("seminyak", "Our Blog"),
    await awardsSection("seminyak"),
  ]);

  // ── Contact ──────────────────────────────────────────────────────
  sectionSeq = 0;
  add("/ubud/contact", "Contact — Ubud", "ubud", [
    await contactSection({
      eyebrow: PROPERTY_SITES.ubud.label,
      heading: "Contact Us",
      intro:
        "Please complete this form to reach us. Our team will get back to you within 24 hours.",
      image: `${U}/2023/03/contact-us-ubud.webp`,
      alt: "Nyuh Bali Villas Ubud",
    }),
  ]);

  sectionSeq = 0;
  add("/seminyak/contact", "Contact — Seminyak", "seminyak", [
    await contactSection({
      eyebrow: PROPERTY_SITES.seminyak.label,
      heading: "Contact Us",
      image: `${U}/2023/03/Contact-us-seminyak.webp`,
      alt: "Nyuh Bali Villas Seminyak",
    }),
  ]);


  // ── The last two hand-written pages ────────────────────────────
  //
  // Both were left unseeded when the other 21 went in, because each carries a
  // band no section reproduced: the tour page's prose (now `proseSection`,
  // rendering the same `ProseBand` the route renders) and this page's closing
  // call to action (the existing `ctaSection` — a centred heading and one
  // button, which is exactly what the band is).
  sectionSeq = 0;
  add("/seminyak/tour", "Explore Bali — Seminyak", "seminyak", [
    await heroSection(
      seminyakTourHero,
      "Seminyak",
      "Travel as You Wish",
      "Private Bali tours from Nyuh Bali Villas Seminyak",
    ),
    {
      _type: "proseSection",
      _key: nextKey(),
      eyebrow: "Explore Bali",
      heading: "You are in the Right Hands . . .",
      paragraphs: proseRichText(seminyakTourProse),
      tone: "sand",
    },
    await packageListSection({
      heading: "Day Travelling",
      packages: seminyakDayTravelling,
      tone: "sand-deep",
    }),
    await packageListSection({ heading: "Tour Packages", packages: seminyakTours, tone: "sand" }),
    {
      ...inquiryFormSection(
        "Book your Tour",
        seminyakTourFields,
        "Send",
        seminyakTourAnchor.replace("#", ""),
      ),
      tone: "sand-deep",
    },
    await awardsSection("seminyak"),
  ]);

  sectionSeq = 0;
  add("/ubud/retreat/host-your-own", "Host Your Retreat — Ubud", "ubud", [
    await heroSection(
      hostRetreatHero,
      "Retreat",
      "Host your Retreat in Ubud",
      "Host your own retreat at Ubud Nyuh Bali Resort",
    ),
    await packageListSection({
      eyebrow: "Host Your Retreat",
      heading: "Why Host your Retreat with us?",
      packages: hostRetreatIntro,
      tone: "sand",
    }),
    amenitySection(
      [
        { icon: "spa", title: "Facilities", subtitle: "Two spacious yoga shala, two swimming pools, spa, home gym & meditation garden" },
        { icon: "yoga", title: "Equipment", subtitle: "Yoga mats, towels, straps, blocks, meditation cushion, projector, screen, speaker, whiteboard, and microphone" },
        { icon: "class", title: "Exclusivity", subtitle: "Dedicated space for dining, Exclusive use of Indoor Yoga Shala (11.00 - 22.00), Roof Top Yoga Shala (06.00 - 16.00)" },
        { icon: "romance", title: "SPA Perks", subtitle: "Highly trained therapists deliver high-quality treatments. Get discounted treatments for all students." },
        { icon: "service", title: "Support for Retreat Leader", subtitle: "Discounted accommodation & meals for the retreat leader. Free listing of your event on our website & social media" },
        { icon: "gym", title: "Free Daily Activities", subtitle: "Daily morning walks, yoga class, Balinese activities, and wellness activities like sound healing & breathwork" },
      ],
      "What we provide",
      "sand-deep",
    ),
    await linkCardGridSection({
      heading: "Luxurious Accomodation to choose from",
      columns: 3,
      tone: "sand",
      items: [
        { label: "Suite", href: "/ubud/villa/suite", imgSrc: `${hostRetreatUploads}/2023/03/Suite-6.webp` },
        { label: "Luxury Suite", href: "/ubud/villa/honeymoon/pool", imgSrc: `${hostRetreatUploads}/2023/03/Honeymoon-Suite-3.webp` },
        { label: "One Bedroom Deluxe Pool Villa", href: "/ubud/villa/1-bedroom-pool-deluxe", imgSrc: `${hostRetreatUploads}/2023/03/ubud-One-Bedroom-Deluxe-Pool-Villa.webp` },
      ],
    }),
    await linkCardGridSection({
      heading: "Wellness Facilities",
      columns: 3,
      tone: "sand-deep",
      items: [
        { label: "Mahamaya Spa", href: "/ubud/spa", imgSrc: `${hostRetreatUploads}/2023/03/ubudspa.webp` },
        { label: "Home Gym", href: "/ubud/fitness", imgSrc: `${hostRetreatUploads}/2023/03/ubud-gym-1.webp` },
        { label: "Indoor Yoga Shala", href: "/ubud/villa/1-bedroom-pool-deluxe", imgSrc: `${hostRetreatUploads}/2023/03/ubud-yoga-2.webp` },
        { label: "Rooftop Yoga Shala", href: "/ubud/villa/1-bedroom-pool-royal", imgSrc: `${hostRetreatUploads}/2023/05/AW_06570-min.webp` },
        { label: "Meditation Garden", href: "/ubud/villa/honeymoon/pool", imgSrc: `${hostRetreatUploads}/2023/03/ubud-yoga-1.webp` },
        { label: "Wellness Library", href: "/ubud/villa/2-bedroom-pool", imgSrc: `${hostRetreatUploads}/2023/04/0D7555AC-09E4-4332-9619-08A9AA329530.webp` },
      ],
    }),
    await packageListSection({ heading: "Healthy Meals", packages: hostRetreatMeals, tone: "sand" }),
    {
      _type: "ctaSection",
      _key: nextKey(),
      heading: "Get a Quote for your Event",
      actions: [
        linkValue(
          { label: "Personalize your Retreat", href: "/ubud-personalize-your-retreat", inScope: true },
          0,
        ),
      ],
      tone: "sand-deep",
    },
    await awardsSection("ubud"),
  ]);


  // ── Home ─────────────────────────────────────────────────────────
  //
  // The one hand-written route that was never handed to the Studio: it has no
  // property, so none of the per-property sections fit and it was skipped when
  // the other 23 went in. An editor looking for "the page where you pick which
  // resort" found nothing in the Pages list, which is what this fixes. The
  // `property` is "ubud" only because a page document carries one and
  // ManagedPage resolves a site from it; the picker section never reads it.
  sectionSeq = 0;
  add("/", "Home — property picker", "ubud", [
    {
      _type: "propertyPickerSection",
      _key: nextKey(),
      panels: await Promise.all(
        HOME_PANELS.map(async (panel, index) => ({
          _key: `panel-${index + 1}`,
          name: panel.name,
          description: panel.description,
          image: await migratedImage(panel.imageSrc, `Nyuh Bali Villas ${panel.name}`),
          href: panel.href,
        })),
      ),
    },
  ]);


  // ── The three standalone enquiry forms ─────────────────────────
  //
  // Left out of the first two seeding batches because they are the only
  // hand-written routes whose whole `<main>` is one form — heading, submit
  // label, confirmation and every field label typed into the route file. A
  // client changing "Send" to "Submit", or adding a dietary option, needed a
  // developer. `inquiryFormSection` already rendered exactly this shape; what
  // was missing was the field that lets its heading be the page's `<h1>`,
  // which these three pages need because the form is their only heading.
  //
  // `awardsSection` carries no badges here: it falls back to the property's
  // own, which is what every other page on the site shows.
  sectionSeq = 0;
  add("/spa-reservation-seminyak", "Spa Reservation — Seminyak", "seminyak", [
    {
      ...inquiryFormSection(
        SPA_RESERVATION_COPY["spa-reservation-seminyak"].heading,
        SPA_RESERVATION_FIELDS["spa-reservation-seminyak"],
        SPA_RESERVATION_COPY["spa-reservation-seminyak"].submitLabel,
      ),
      headingLevel: "h1",
      confirmation: SPA_RESERVATION_COPY["spa-reservation-seminyak"].confirmation,
      // The running total, with the live form's own tax and discount rates.
      pricing: { enabled: true, ...SPA_RESERVATION_PRICING["spa-reservation-seminyak"] },
      tone: "sand",
    },
    { _type: "awardsSection", _key: nextKey() },
  ]);

  sectionSeq = 0;
  add("/ubud-spa-booking-form", "Spa Booking — Ubud", "ubud", [
    {
      ...inquiryFormSection(
        SPA_RESERVATION_COPY["ubud-spa-booking-form"].heading,
        SPA_RESERVATION_FIELDS["ubud-spa-booking-form"],
        SPA_RESERVATION_COPY["ubud-spa-booking-form"].submitLabel,
      ),
      headingLevel: "h1",
      confirmation: SPA_RESERVATION_COPY["ubud-spa-booking-form"].confirmation,
      // The running total, with the live form's own tax and discount rates.
      pricing: { enabled: true, ...SPA_RESERVATION_PRICING["ubud-spa-booking-form"] },
      tone: "sand",
    },
    { _type: "awardsSection", _key: nextKey() },
  ]);

  sectionSeq = 0;
  add("/ubud-personalize-your-retreat", "Personalize Your Retreat — Ubud", "ubud", [
    {
      ...inquiryFormSection(
        PERSONALIZE_RETREAT_HEADING,
        PERSONALIZE_RETREAT_FIELDS,
        PERSONALIZE_RETREAT_SUBMIT_LABEL,
      ),
      headingLevel: "h1",
      confirmation: PERSONALIZE_RETREAT_CONFIRMATION,
      tone: "sand",
    },
    { _type: "awardsSection", _key: nextKey() },
  ]);

  // ── The four in-room / staff pages ─────────────────────────────
  //
  // Wrapped in `ManagedPage` from the day they were built and never seeded,
  // so an editor opening the Pages list found no trace of the menus a guest
  // reaches by scanning the QR code on the card beside the bed. Each renders
  // through `PackageList` exactly as the route does, with the band's heading
  // as the `<h1>` — these pages have no hero — which is what `headingLevel`
  // is for. Their bold survives the import: see `inlineRichText`.
  for (const [path, title, property, content] of DIRECTORY_PAGES) {
    sectionSeq = 0;
    add(path, title, property, [
      {
        ...(await packageListSection({
          heading: content.heading,
          intro: content.intro,
          packages: content.items,
          tone: "sand",
        })),
        headingLevel: "h1",
      },
      // `AwardsRow` sits *inside* `ManagedPage` on these four routes now, like
      // every other band, so the seeded section is what draws it — and it is
      // hideable from the Studio, which it was not while the route rendered
      // it outside.
      { _type: "awardsSection", _key: nextKey() },
    ]);
  }

  for (const page of pages) {
    await write({
      _id: safeId("page", page.path === "/" ? "home" : page.path.slice(1)),
      _type: "page",
      title: page.title,
      path: page.path,
      property: page.property,
      sections: page.sections,
      seo: seoFor(page.path),
    });
    console.log(`  page: ${page.path} (${page.sections.length} sections)`);
  }
}

// ── Blog categories ────────────────────────────────────────────────────

/**
 * The seven topical categories, plus the reference on each post.
 *
 * A separate step from `posts` for one reason: posts already exist in the
 * dataset, and the default `createIfNotExists` would leave every one of them
 * without a category. Rerunning `--only=posts --replace` would set them, but
 * `--replace` discards whatever an editor has since written into the article
 * body. This patches the single `categories` field instead, so a post keeps
 * every other edit it has.
 */
async function migrateCategories() {
  for (const category of Object.values(POST_CATEGORIES)) {
    await write({
      _id: safeId("category", category.slug),
      _type: "category",
      title: category.title,
      slug: { _type: "slug", current: category.slug },
      description: category.description,
    });
    console.log(`  category: ${category.title}`);
  }

  let tagged = 0;
  for (const post of POSTS as Post[]) {
    const references = (post.categories ?? []).map((category, index) => ({
      _type: "reference" as const,
      _ref: safeId("category", category.slug),
      _key: key("category", index),
    }));
    if (!references.length) continue;
    tagged += 1;
    if (dryRun || !client) continue;
    await client
      .patch(postId(post.path))
      .set({ categories: references })
      .commit();
  }
  console.log(`  tagged ${tagged} posts`);
}

async function migratePosts() {
  for (const [index, post] of (POSTS as Post[]).entries()) {
    // The same recovery the renderer runs, done once here instead.
    const recovered = toArticleBlocks(post.blocks);
    const blocks = [];
    for (const [index, block] of recovered.entries()) {
      const value = await articleBlockValue(block, index, post.title);
      if (value) {
        blocks.push(value);
        blockCounts[value._type] = (blockCounts[value._type] ?? 0) + 1;
      }
    }

    await write({
      _id: postId(post.path),
      _type: "post",
      title: post.title,
      path: post.path,
      property: post.property,
      date: post.date,
      // The source array is already date-descending; this preserves its own
      // tiebreak for the five pairs that share a publication date.
      order: index + 1,
      excerpt: post.excerpt,
      image: await migratedImage(post.image, post.title),
      blocks,
      seo: seoFor(post.path),
    });
    console.log(`  post: ${post.path} (${blocks.length} blocks)`);
  }
}

// ── Legal pages ────────────────────────────────────────────────────────

async function migrateLegalPages() {
  const pages: Array<{ title: string; path: string; sections: LegalSection[] }> = [
    {
      title: "Terms & Conditions",
      path: "/terms-conditions",
      sections: TERMS_CONDITIONS_SECTIONS,
    },
    {
      title: "Privacy Policy",
      path: "/privacy-policy",
      sections: PRIVACY_POLICY_SECTIONS,
    },
  ];

  for (const page of pages) {
    await write({
      _id: safeId("legalPage", page.path.slice(1)),
      _type: "legalPage",
      title: page.title,
      path: page.path,
      sections: page.sections.map((section, index) =>
        section.type === "list"
          ? {
              _type: "legalList",
              _key: key("section", index),
              heading: section.heading,
              items: section.items,
            }
          : {
              _type: "legalParagraph",
              _key: key("section", index),
              heading: section.heading,
              text: section.text,
            },
      ),
      seo: seoFor(page.path),
    });
    console.log(`  legalPage: ${page.path}`);
  }
}

// ── Entry point ────────────────────────────────────────────────────────

const STEPS: Array<[string, () => Promise<void>]> = [
  ["properties", migrateProperties],
  ["settings", migrateSiteSettings],
  ["testimonials", migrateTestimonials],
  ["rooms", migrateRooms],
  ["experiences", migrateExperiences],
  ["packages", migratePackageSets],
  ["categories", migrateCategories],
  ["pages", migratePages],
  ["posts", migratePosts],
  ["legal", migrateLegalPages],
];

async function main() {
  console.log(
    dryRun
      ? "Migration mode: DRY RUN — nothing is written"
      : replaceExisting
        ? "Migration mode: replace existing documents"
        : "Migration mode: create missing documents only",
  );
  console.log(
    uploadImages
      ? "Images: uploaded to Sanity (--upload-images)"
      : "Images: hotlinked from nyuhbalivillas.com — nothing is copied",
  );
  if (only) console.log(`Steps: ${[...only].join(", ")}`);
  console.log("");

  for (const [name, run] of STEPS) {
    if (!wants(name)) continue;
    console.log(`${name}:`);
    await run();
    console.log("");
  }

  console.log("── Summary ──");
  for (const [type, count] of Object.entries(counts).sort()) {
    console.log(`  ${type.padEnd(14)} ${count}`);
  }
  console.log(
    uploadImages
      ? `  images         ${uploaded} uploaded, ${reused} reused, ${failed} kept as hotlink`
      : `  images         ${hotlinked} hotlinked, 0 uploaded`,
  );
  if (Object.keys(blockCounts).length) {
    console.log("\n── Article blocks recovered ──");
    for (const [type, count] of Object.entries(blockCounts).sort()) {
      console.log(`  ${type.padEnd(20)} ${count}`);
    }
  }
  console.log(dryRun ? "\nDry run complete — nothing was written." : "\nMigration completed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
