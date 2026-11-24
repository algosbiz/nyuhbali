import Image from "next/image";
import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { buttonClassName } from "@/components/ui/Button";
import { AboutNarrative } from "@/components/property/AboutNarrative";
import { AmenityGrid } from "@/components/property/AmenityGrid";
import { ContactPanel } from "@/components/property/ContactPanel";
import { AwardsRow } from "@/components/property/AwardsRow";
import { BookingWidget } from "@/components/property/BookingWidget";
import { DirectBookingDeals } from "@/components/property/DirectBookingDeals";
import { FaqList } from "@/components/property/FaqList";
import { ImageGallery } from "@/components/property/ImageGallery";
import { InquiryForm } from "@/components/property/InquiryForm";
import { InstagramTeaser } from "@/components/property/InstagramTeaser";
import { PropertyPanel } from "@/components/home/PropertyPanel";
import type { InstagramFeedKey } from "@/components/property/instagramFeed";
import { getInstagramWidget, getSiteLabels, toInquiryFields } from "@/sanity/lib/content";
import { LinkCardGrid } from "@/components/property/LinkCardGrid";
import { PackageList } from "@/components/property/PackageList";
import { ProgramList } from "@/components/property/ProgramList";
import { ProseBand } from "@/components/property/ProseBand";
import { PropertyHero } from "@/components/property/PropertyHero";
import { RoomList } from "@/components/property/RoomList";
import { TreatmentList } from "@/components/property/TreatmentList";
import SanityPortableText from "@/components/sanity/SanityPortableText";
import type { PropertySite } from "@/data/properties";
import type { PackageItem } from "@/components/property/PackageList";
import { resolveImageUrl, resolveImageUrls } from "@/sanity/lib/image";
import { toRuns } from "@/sanity/lib/richText";
import { RichProse } from "@/components/sanity/RichProse";
import type { PortableTextBlock } from "@portabletext/types";
import type { SanityLink, SanitySection } from "@/sanity/types";

/**
 * One renderer per page-builder section.
 *
 * Each maps onto a component the site already has, so a CMS page and a
 * hand-written route produce the same markup. Nothing here invents layout:
 * where a section needs a shell, it uses `Section` + `SectionHeading` exactly
 * as the routes do.
 */

type Narrow<T extends SanitySection["_type"]> = Extract<SanitySection, { _type: T }>;

/** A link the editor marked out of scope renders as inert text, per the site's convention. */
function ActionLink({ action }: { action: SanityLink }) {
  const className = buttonClassName(action.variant ?? "solid");
  if (action.inScope === false) {
    return <span className={`${className} pointer-events-none opacity-60`}>{action.label}</span>;
  }
  if (action.external || /^(https?:\/\/|mailto:|tel:)/.test(action.href)) {
    return (
      <a href={action.href} target="_blank" rel="noreferrer" className={className}>
        {action.label}
      </a>
    );
  }
  return (
    <Link href={action.href} className={className}>
      {action.label}
    </Link>
  );
}

export function HeroBlock({ section }: { section: Narrow<"heroSection"> }) {
  const images = resolveImageUrls(section.images);
  if (!images.length) return null;
  return (
    <PropertyHero
      images={images}
      alt={section.alt || section.title}
      eyebrow={section.eyebrow ?? ""}
      title={section.title}
    />
  );
}

/**
 * The About band, rendered through the site's own `AboutNarrative` so a
 * CMS-authored About page is byte-identical to the hand-written one.
 *
 * The booking link and the contact email come from the property, not the
 * section: they are the same values the header CTA and the footer use, and a
 * page that could set them separately is a page that can drift from them.
 */
export function AboutNarrativeBlock({
  section,
  site,
}: {
  section: Narrow<"aboutNarrativeSection">;
  site: PropertySite;
}) {
  return (
    <AboutNarrative
      anchor={section.anchor}
      eyebrow={section.eyebrow ?? ""}
      heading={section.heading}
      headingAs={section.headingLevel}
      paragraphs={section.paragraphs}
      tagline={section.tagline}
      bookingHref={site.bookingHref}
      buttonLabel={section.buttonLabel}
      offerHeading={section.offerHeading}
      offerSubtitle={section.offerSubtitle}
      offerCodeLabel={section.offerCodeLabel}
      tone={section.tone}
      promoCode={section.promoCode}
      perks={section.perks ?? []}
      contactEmail={site.contact.email}
      imageSrc={resolveImageUrl(section.image) ?? undefined}
    />
  );
}

export function ContactBlock({
  section,
  site,
}: {
  section: Narrow<"contactSection">;
  site: PropertySite;
}) {
  const image = resolveImageUrl(section.image);
  if (!image) return null;
  return (
    <ContactPanel
      property={site.slug}
      eyebrow={section.eyebrow ?? site.label}
      heading={section.heading}
      headingAs={section.headingLevel}
      formHeading={section.formHeading}
      confirmation={section.confirmation}
      intro={section.intro}
      imageSrc={image}
      imageAlt={section.image?.alt ?? site.label}
      tone={section.tone}
      anchor={section.anchor}
    />
  );
}

export async function RoomListBlock({
  section,
  site,
}: {
  section: Narrow<"roomListSection">;
  site: PropertySite;
}) {
  const rooms = section.rooms.map((room) => ({
    name: room.name,
    images: resolveImageUrls(room.images),
    bed: room.bed ?? "",
    size: room.size ?? "",
    occupancy: room.occupancy ?? "",
    // The property's own booking URL, never a field: this is the same link the
    // header CTA and every other "Check Rates" on the site use.
    ratesHref: site.bookingHref,
    detailsHref: room.detailsHref ?? "",
    detailsInScope: room.detailsInScope ?? true,
  }));
  if (!rooms.length) return null;
  return (
    <RoomList
      checkRatesLabel={(await getSiteLabels()).checkRates}
      anchor={section.anchor}
      eyebrow={section.eyebrow}
      heading={section.heading}
      headingAs={section.headingLevel}
      intro={section.intro}
      tone={section.tone}
      rooms={rooms}
    />
  );
}

export function ProseBlock({
  section,
  site,
}: {
  section: Narrow<"proseSection">;
  site: PropertySite;
}) {
  return (
    <ProseBand
      eyebrow={section.eyebrow}
      heading={section.heading}
      headingAs={section.headingLevel}
      paragraphs={section.paragraphs}
      // The address comes from the property, never from the section — the same
      // rule `ContactPanel` and `AboutNarrative` follow.
      email={site.contact.email}
      tone={section.tone}
      anchor={section.anchor}
    />
  );
}

export function RichTextBlock({ section }: { section: Narrow<"richTextSection"> }) {
  return (
    <Section tone={section.tone} width="read" id={section.anchor}>
      {section.heading ? (
        <Reveal>
          <SectionHeading
            eyebrow={section.eyebrow}
            title={section.heading}
            as={section.headingLevel}
          />
        </Reveal>
      ) : null}
      <Reveal>
        <div className={section.heading ? "mt-8 md:mt-10" : ""}>
          <SanityPortableText value={section.body as PortableTextBlock[]} />
        </div>
      </Reveal>
    </Section>
  );
}

export function SplitContentBlock({ section }: { section: Narrow<"splitContentSection"> }) {
  const image = resolveImageUrl(section.image);
  const imageFirst = section.imageSide === "left";
  return (
    <Section tone={section.tone} id={section.anchor}>
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
        <Reveal className={imageFirst ? "lg:order-2" : undefined}>
          <SectionHeading
            eyebrow={section.eyebrow}
            title={section.heading}
            as={section.headingLevel}
          />
          <div className="mt-8 flex flex-col gap-5 md:mt-10">
            <RichProse
              value={section.paragraphs}
              paragraphClassName="text-[17px] leading-[1.85] font-light text-pretty text-text md:text-[19px]"
            />
          </div>
          {section.script ? (
            <p className="font-script mt-6 text-[26px] leading-tight text-primary-deep md:text-[30px]">
              {section.script}
            </p>
          ) : null}
          {section.action ? (
            <div className="mt-8">
              <ActionLink action={section.action} />
            </div>
          ) : null}
        </Reveal>
        {image ? (
          <Reveal className={imageFirst ? "lg:order-1" : undefined}>
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <Image
                src={image}
                alt={section.image?.alt ?? section.heading}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        ) : null}
      </div>
    </Section>
  );
}

export function GalleryBlock({ section }: { section: Narrow<"gallerySection"> }) {
  const images = resolveImageUrls(section.images);
  if (!images.length) return null;
  return (
    <Section tone={section.tone} id={section.anchor}>
      {section.heading ? (
        <Reveal>
          <SectionHeading
            eyebrow={section.eyebrow}
            title={section.heading}
            as={section.headingLevel}
          />
        </Reveal>
      ) : null}
      <Reveal>
        <div className={section.heading ? "mt-8 md:mt-10" : ""}>
          <ImageGallery
            images={images}
            alt={section.alt || section.heading || "Gallery"}
            heightClassName="h-72 md:h-[28rem]"
            sizes="(min-width: 1280px) 1240px, 100vw"
          />
        </div>
      </Reveal>
    </Section>
  );
}

/**
 * No `Section` wrapper here: `AmenityGrid` draws its own.
 *
 * It used to have one, which put a `<section>` inside a `<section>` and gave
 * the Amenities band on both Stay pages twice the vertical padding it should
 * have — with the outer band's tone showing as a strip around the inner one
 * on /ubud/villa, where the two tones differed. Found by diffing the raw
 * markup of the CMS build against the hand-written fallback; the text and the
 * heading tags matched, so only the markup diff could show it.
 */
export function AmenityBlock({ section }: { section: Narrow<"amenityGridSection"> }) {
  return (
    <AmenityGrid
      heading={section.heading}
      headingAs={section.headingLevel}
      amenities={section.amenities}
      tone={section.tone}
      anchor={section.anchor}
    />
  );
}

export function LinkCardGridBlock({ section }: { section: Narrow<"linkCardGridSection"> }) {
  const items = section.items.flatMap((item) => {
    const imgSrc = resolveImageUrl(item.image, 900);
    if (!imgSrc) return [];
    return [{ label: item.label, href: item.href, imgSrc, inScope: item.inScope }];
  });
  if (!items.length) return null;
  return (
    <LinkCardGrid
      anchor={section.anchor}
      eyebrow={section.eyebrow}
      heading={section.heading}
      headingAs={section.headingLevel}
      items={items}
      columns={section.columns}
      tone={section.tone}
    />
  );
}

/** Inline packages, or a referenced set so one edit lands on every page using it. */
export function PackageListBlock({ section }: { section: Narrow<"packageListSection"> }) {
  const source =
    section.source === "reference" ? section.packageSet?.packages : section.packages;
  const always = section.source === "reference" ? (section.packageSet?.alwaysIncluded ?? []) : [];

  const packages: PackageItem[] = (source ?? []).map((item) => ({
    name: item.name,
    images: resolveImageUrls(item.images, 900),
    description: toRuns(item.description),
    benefitsHeading: item.benefitsHeading,
    benefits: [...(item.benefits ?? []), ...always],
    meta: item.meta,
    notes: item.notes,
    ctas: item.ctas?.map((cta) => ({
      label: cta.label,
      href: cta.href,
      external: cta.external,
      inScope: cta.inScope,
      variant: cta.variant,
    })),
  }));
  if (!packages.length) return null;

  return (
    <PackageList
      anchor={section.anchor}
      eyebrow={section.eyebrow}
      heading={section.heading ?? ""}
      headingAs={section.headingLevel}
      intro={toRuns(section.intro)}
      packages={packages}
      tone={section.tone}
    />
  );
}

export function ProgramListBlock({ section }: { section: Narrow<"programListSection"> }) {
  return (
    <ProgramList
      anchor={section.anchor}
      heading={section.heading}
      headingAs={section.headingLevel}
      tiers={section.tiers}
      tone={section.tone}
    />
  );
}

export async function TreatmentListBlock({
  section,
}: {
  section: Narrow<"treatmentListSection">;
}) {
  const categories = section.categories.map((category) => ({
    name: category.name,
    image: resolveImageUrl(category.image, 900) ?? undefined,
    treatments: category.treatments,
  }));
  return (
    <TreatmentList
      bookNowLabel={(await getSiteLabels()).bookNow}
      anchor={section.anchor}
      eyebrow={section.eyebrow}
      heading={section.heading}
      headingAs={section.headingLevel}
      intro={section.intro}
      notes={section.notes}
      categories={categories}
      cta={section.cta ? { label: section.cta.label, href: section.cta.href } : undefined}
      tone={section.tone}
    />
  );
}

export function BulletListBlock({ section }: { section: Narrow<"bulletListSection"> }) {
  return (
    <Section tone={section.tone} id={section.anchor}>
      {section.heading ? (
        <Reveal>
          <SectionHeading
            eyebrow={section.eyebrow}
            title={section.heading}
            as={section.headingLevel}
          />
        </Reveal>
      ) : null}
      {section.intro ? (
        <Reveal>
          <RichProse
            value={section.intro}
            paragraphClassName="text-[17px] leading-[1.85] font-light text-pretty text-text md:text-[19px]"
            firstClassName="mt-8 md:mt-10"
            restClassName="mt-4"
          />
        </Reveal>
      ) : null}
      <div className="mt-8 grid gap-10 md:mt-10 md:grid-cols-2">
        {section.groups.map((group, index) => (
          <Reveal key={index}>
            {group.heading ? (
              <h3 className="font-heading text-[20px] leading-[1.3] font-light text-ink md:text-[23px]">
                {group.heading}
              </h3>
            ) : null}
            <ul className={`flex flex-col gap-3 ${group.heading ? "mt-5" : ""}`}>
              {group.items.map((item, i) => (
                <li
                  key={i}
                  className="grid grid-cols-[1.5rem_1fr] text-[17px] leading-[1.85] font-light text-text md:text-[19px]"
                >
                  <span aria-hidden className="mt-[0.85em] block h-px w-3.5 bg-primary" />
                  <span className="break-words text-pretty">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/**
 * A rate table, set as a real `<table>` for the same reason `PostBody` does:
 * the money column has to stay readable against its own row.
 */
export function PriceTableBlock({ section }: { section: Narrow<"priceTableSection"> }) {
  const { columns, rows } = section.table;
  return (
    <Section tone={section.tone} id={section.anchor}>
      {section.heading ? (
        <Reveal>
          <SectionHeading title={section.heading} as={section.headingLevel} />
        </Reveal>
      ) : null}
      <Reveal>
        <div className={`overflow-x-auto ${section.heading ? "mt-8 md:mt-10" : ""}`}>
          <table className="w-full min-w-[20rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-ink/15">
                {columns.map((column, index) => (
                  <th
                    key={column}
                    scope="col"
                    className={`text-eyebrow font-body pb-3 font-normal text-primary-deep uppercase ${
                      index === columns.length - 1 ? "text-right" : ""
                    }`}
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-ink/10">
                  {row.cells.map((cell, index) => {
                    const isLast = index === columns.length - 1;
                    return (
                      <td
                        key={index}
                        className={`py-3 text-[15px] leading-snug font-light md:text-[16px] ${
                          isLast
                            ? "pl-4 text-right font-normal whitespace-nowrap text-ink"
                            : index === 0
                              ? "pr-4 text-ink"
                              : "pr-4 text-text"
                        }`}
                      >
                        {cell}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
    </Section>
  );
}

export function FaqBlock({ section }: { section: Narrow<"faqSection"> }) {
  return (
    <FaqList
      anchor={section.anchor}
      heading={section.heading}
      headingAs={section.headingLevel}
      faqs={section.faqs}
      tone={section.tone}
    />
  );
}

export function CtaBlock({ section }: { section: Narrow<"ctaSection"> }) {
  const image = resolveImageUrl(section.image);
  return (
    <Section tone={section.tone} id={section.anchor} className={image ? "relative" : undefined}>
      {image ? (
        <>
          <Image
            src={image}
            alt={section.image?.alt ?? ""}
            fill
            sizes="100vw"
            className="-z-10 object-cover"
          />
          <div aria-hidden className="absolute inset-0 -z-10 bg-ink/55" />
        </>
      ) : null}
      <Reveal className="mx-auto max-w-2xl text-center">
        <SectionHeading
          eyebrow={section.eyebrow}
          title={section.heading}
          as={section.headingLevel}
          align="center"
          surface={image ? "dark" : "light"}
        />
        {section.body ? (
          <RichProse
            value={section.body}
            paragraphClassName={`text-[17px] leading-[1.85] font-light text-pretty md:text-[19px] ${
              image ? "text-white/85" : "text-text"
            }`}
            firstClassName="mt-6"
            restClassName="mt-4"
          />
        ) : null}
        {section.actions?.length ? (
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {section.actions.map((action, index) => (
              <ActionLink key={index} action={action} />
            ))}
          </div>
        ) : null}
      </Reveal>
    </Section>
  );
}

export function InquiryFormBlock({
  section,
  site,
}: {
  section: Narrow<"inquiryFormSection">;
  site: PropertySite;
}) {
  const fields = toInquiryFields(section.fields);
  return (
    <Section tone={section.tone} width="narrow" id={section.anchor}>
      <InquiryForm
        property={site.slug}
        heading={section.heading}
        headingAs={section.headingLevel}
        // Only when the section says so: every other form on the site has no
        // prices to total, and a summary of nothing is worse than none.
        pricing={
          section.pricing?.enabled
            ? {
                field: section.pricing.field || "package",
                taxPercent: section.pricing.taxPercent ?? 21,
                discountPercent: section.pricing.discountPercent ?? 0,
                note: section.pricing.note || undefined,
              }
            : undefined
        }
        fields={fields}
        submitLabel={section.submitLabel}
        confirmation={section.confirmation}
      />
    </Section>
  );
}

/**
 * The awards strip. Its badges and its layout both fall back to the
 * property's own, the same rule `dealsSection` and `instagramSection`
 * follow — every page on the site shows that property's awards, so making
 * an editor paste eleven badges into each page would be duplication with no
 * decision behind it.
 */
export function AwardsBlock({
  section,
  site,
}: {
  section: Narrow<"awardsSection">;
  site: PropertySite;
}) {
  const authored = resolveImageUrls(section.badges, 400);
  const badges = authored.length ? authored : site.awards.badges;
  if (!badges.length) return null;
  return <AwardsRow badges={badges} variant={section.variant || site.awards.variant} />;
}

/** The three sections below fall back to the page's own property when left empty. */
export function DealsBlock({
  section,
  site,
}: {
  section: Narrow<"dealsSection">;
  site: PropertySite;
}) {
  return (
    <DirectBookingDeals
      bookingHref={section.bookingHref || site.bookingHref}
      headline={section.headline}
      code={section.code}
      buttonLabel={section.buttonLabel}
    />
  );
}

export function PropertyPickerBlock({
  section,
}: {
  section: Narrow<"propertyPickerSection">;
}) {
  // The homepage's two panels. They are direct children of the route's
  // `<main className="grid md:grid-cols-2">`, so this renders them as
  // siblings and adds no wrapper of its own — a wrapper here would become the
  // single grid cell and put both photographs in one column.
  //
  // Every panel's heading is an `<h2>`. The homepage has no `<h1>` on purpose
  // — see PropertyPanel.
  return (
    <>
      {(section.panels ?? []).map((panel, index) => {
        const imageSrc = resolveImageUrl(panel.image);
        if (!imageSrc || !panel.name || !panel.href) return null;
        return (
          <PropertyPanel
            key={panel._key ?? panel.href}
            priority={index === 0}
            name={panel.name}
            description={panel.description ?? ""}
            imageSrc={imageSrc}
            href={panel.href}
          />
        );
      })}
    </>
  );
}

export async function InstagramBlock({
  section,
  site,
}: {
  section: Narrow<"instagramSection">;
  site: PropertySite;
}) {
  // The live grid, not just the heading and the Follow button: the proxy path
  // is derived from the property, exactly as the hand-written routes derive
  // it, so a CMS-authored page keeps the feed instead of quietly losing it.
  //
  // `section.feed` overrides that default, and one page needs it: /ubud/spa is
  // an Ubud page wearing Ubud's chrome, so `site.slug` is "ubud" and the band
  // published the resort's posts under "What's happening @mahamayaspa.ubud".
  // The hand-written route had always passed "/api/instagram/spa" explicitly;
  // the section had no way to say so until this field existed.
  const feed = (section.feed || site.slug) as InstagramFeedKey;
  const widget = await getInstagramWidget(feed);
  return (
    <InstagramTeaser
      followLabel={(await getSiteLabels()).followInstagram}
      anchor={section.anchor}
      heading={section.heading || "Follow Us"}
      instagramHref={section.profileUrl || site.social.instagram}
      widget={widget}
    />
  );
}

export function BookingWidgetBlock({
  section,
  site,
}: {
  section: Narrow<"bookingWidgetSection">;
  site: PropertySite;
}) {
  // The widget is keyed to a property token, so an override replaces just that.
  const scoped = section.widgetId
    ? { ...site, bookingWidgetId: section.widgetId }
    : site;
  return <BookingWidget site={scoped} />;
}
