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

const PATH = "/privacy-policy";

export async function generateMetadata(): Promise<Metadata> {
  // The legal page document's own SEO wins — see terms-conditions/page.tsx.
  const { document } = await getLegalPage(PATH);
  return resolveDocumentMetadata(PATH, document);
}

// See terms-conditions/page.tsx for why this hard-codes the Ubud site rather
// than taking a `site` prop — same reasoning applies here.

export default async function PrivacyPolicyPage() {
  const site = await getPropertySite("ubud");
  // Published legal copy wins; otherwise src/data/legal.ts.
  const { sections, document } = await getLegalPage(PATH);
  const title = document?.title?.trim() || "Privacy Policy";
  return (
    <>
      <PropertyHeader site={site} activeHref={PATH} />
      <main>
        <BreadcrumbJsonLd path={PATH} name={title} />
        <JsonLd data={legalSchema(PATH, resolveDocumentMetadata(PATH, document))} />
        {/* Same treatment as Terms & Conditions — see the note there. */}
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
