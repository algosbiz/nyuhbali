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
  return resolvePageMetadata("/privacy-policy");
}

// See terms-conditions/page.tsx for why this hard-codes the Ubud site rather
// than taking a `site` prop — same reasoning applies here.

export default async function PrivacyPolicyPage() {
  const site = await getPropertySite("ubud");
  // Published legal copy wins; otherwise src/data/legal.ts.
  const { sections } = await getLegalPage("/privacy-policy");
  return (
    <>
      <PropertyHeader site={site} activeHref="/privacy-policy" />
      <main>
        <BreadcrumbJsonLd path="/privacy-policy" />
        {/* Same treatment as Terms & Conditions — see the note there. */}
        <Section tone="sand" space="loose" width="narrow">
          <SectionHeading title="Privacy Policy" as="h1" size="display" />

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
