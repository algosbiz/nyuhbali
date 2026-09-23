// ======================================================
// Route Information
// Original WordPress URLs (4 aktivitas budaya):
// /ubud/balinese-culture/balinese-class                    (WP 297)
// /ubud/balinese-culture/cooking-class                     (WP 381)
// /ubud/balinese-culture/melukat-purification-ceremony     (WP 289)
// /ubud/balinese-culture/rice-field-walk                   (WP 281)
//
// Current Next.js Route:
// src/app/ubud/balinese-culture/[...activity]/page.tsx
// Route statis /ubud/balinese-culture (indeks) menang atas catch-all ini.
//
// Jika slug berubah: ubah `slug` di src/data/experiences.ts, lalu perbarui CTA
// "Details" di src/app/ubud/balinese-culture/page.tsx, tautan "Discover more"
// di src/app/ubud/dining/page.tsx, dan src/app/complimentary-services/page.tsx.
// ======================================================

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PropertyHeader } from "@/components/property/PropertyHeader";
import { PropertyFooter } from "@/components/property/PropertyFooter";
import { DirectBookingDeals } from "@/components/property/DirectBookingDeals";
import { PropertyHero } from "@/components/property/PropertyHero";
import { ExperienceDetailBody } from "@/components/property/ExperienceDetail";
import { AwardsRow } from "@/components/property/AwardsRow";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { getExperience, getExperiences, getPropertySite, getSiteLabels } from "@/sanity/lib/content";
import { resolveDocumentMetadata } from "@/sanity/lib/metadata";

const PREFIX = "balinese-culture/";

type Params = { activity: string[] };

/**
 * Slugs come from Sanity when experiences are published there and from
 * src/data/experiences.ts otherwise. This is what is prerendered at build
 * time; `dynamicParams = true` below means an experience published after that
 * build still resolves.
 */
export async function generateStaticParams(): Promise<Params[]> {
  const experiences = await getExperiences();
  return experiences
    .filter((experience) => experience.slug.startsWith(PREFIX))
    .map((experience) => ({
      activity: experience.slug.slice(PREFIX.length).split("/"),
    }));
}

/**
 * A slug that was not in the list above is rendered on its first request
 * rather than 404ing, so an experience published in the Studio is live without a
 * deploy. `notFound()` below still answers anything that matches no document,
 * so this widens what can render, not what exists.
 */
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  // The published experience's own SEO fields win; anything it leaves empty
  // falls back to the live site's title and description in src/data/seo.ts.
  const tail = (await params).activity.join("/");
  return resolveDocumentMetadata(
    `/ubud/balinese-culture/${tail}`,
    await getExperience(PREFIX + tail),
  );
}

export default async function CultureActivityPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const item = await getExperience(PREFIX + (await params).activity.join("/"));
  if (!item) notFound();
  const site = await getPropertySite("ubud");
  const labels = await getSiteLabels();

  return (
    <>
      <PropertyHeader site={site} activeHref="/ubud/balinese-culture" />
      <main>
        <BreadcrumbJsonLd path={`/ubud/${item.slug}`} name={item.title} />
        <PropertyHero
          images={[item.hero]}
          alt={item.title}
          eyebrow={item.eyebrow}
          title={item.title}
        />
        <ExperienceDetailBody experience={item} site={site} labels={labels} />
        <AwardsRow variant={site.awards.variant} badges={site.awards.badges} />
      </main>
      <PropertyFooter site={site} />
      <DirectBookingDeals bookingHref={site.bookingHref} />
    </>
  );
}
