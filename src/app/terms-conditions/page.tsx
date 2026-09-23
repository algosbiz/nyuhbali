import type { Metadata } from "next";
import { PropertyHeader } from "@/components/property/PropertyHeader";
import { PropertyFooter } from "@/components/property/PropertyFooter";
import { LegalSection } from "@/components/legal/LegalSection";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { getLegalPage, getPropertySite } from "@/sanity/lib/content";
import { resolvePageMetadata } from "@/sanity/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  // A published `page` document's SEO wins; otherwise this stays
  // exactly the live site's title and description from src/data/seo.ts.
  return resolvePageMetadata("/terms-conditions");
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
  // Published legal copy wins; otherwise src/data/legal.ts.
  const { sections } = await getLegalPage("/terms-conditions");
  return (
    <>
      <PropertyHeader site={site} activeHref="/terms-conditions" />
      <main>
        <BreadcrumbJsonLd path="/terms-conditions" />
        <Section tone="sand" space="loose" width="narrow">
          <SectionHeading title="Terms & Conditions" as="h1" size="display" />

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
