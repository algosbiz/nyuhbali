import type { Metadata } from "next";
import { PropertyHeader } from "@/components/property/PropertyHeader";
import { PropertyFooter } from "@/components/property/PropertyFooter";
import { LegalIntro, LegalSection } from "@/components/legal/LegalSection";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { JsonLd } from "@/components/seo/JsonLd";
import { getLegalPage, getPropertySite } from "@/sanity/lib/content";
import { resolveDocumentMetadata } from "@/sanity/lib/metadata";
import { legalSchema } from "@/sanity/lib/pageSchema";

const PATH = "/terms-conditions";

export async function generateMetadata(): Promise<Metadata> {
  // The legal page document's own SEO tab wins, field by field; otherwise
  // this stays exactly the live site's title and description from
  // src/data/seo.ts. It used to ask for a `page` document at this path —
  // which no one ever creates for a legal page — so the SEO an editor typed
  // into the Legal page document was never read.
  const { document } = await getLegalPage(PATH);
  return resolveDocumentMetadata(PATH, document);
}

// Global, not per-property — the live site renders this (and Privacy Policy)
// with the Ubud site's header/footer regardless of which property a visitor
// arrived from, so it's hard-coded to PROPERTY_SITES.ubud rather than taking a
// `site` prop the way About/Contact do. No nav item matches this page, so
// PropertyHeader's active-item marker naturally shows nothing selected, which
// is correct here.

/**
 * Legal copy is the densest reading on the site, so it runs at the `narrow`
 * Container width rather than the full grid. The heading is left-aligned like
 * every other page on the site — centring a title above a left-aligned wall of
 * text was one of the small mismatches that made the old pages feel assembled
 * rather than designed.
 */
export default async function TermsConditionsPage() {
  const site = await getPropertySite("ubud");
  // Published legal copy wins; otherwise src/data/legal.ts. The title and
  // intro come from the same document, so editing them in the Studio is not
  // a field that silently does nothing.
  const { sections, document } = await getLegalPage(PATH);
  const title = document?.title?.trim() || "Terms & Conditions";
  return (
    <>
      <PropertyHeader site={site} activeHref={PATH} />
      <main>
        <BreadcrumbJsonLd path={PATH} name={title} />
        <JsonLd data={legalSchema(PATH, resolveDocumentMetadata(PATH, document))} />
        <Section tone="sand" space="loose" width="narrow">
          <SectionHeading title={title} as="h1" size="display" />
          <LegalIntro text={document?.intro} />

          <div className="mt-11 flex flex-col gap-10 md:mt-14">
            {sections.map((section) => (
              <LegalSection key={section.heading} section={section} />
            ))}
          </div>
        </Section>
      </main>
      <PropertyFooter site={site} />
    </>
  );
}
