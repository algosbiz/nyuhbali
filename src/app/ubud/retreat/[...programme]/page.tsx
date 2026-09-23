// ======================================================
// Route Information
// Original WordPress URLs (6 program retreat):
// /ubud/retreat/couples                      (WP 118384)
// /ubud/retreat/slimming                     (WP 119176)
// /ubud/retreat/luxury/anti-aging            (WP 119522)
// /ubud/retreat/luxury/balinese-healing      (WP 118374)
// /ubud/retreat/luxury/holistic-balancing    (WP 118380)
// /ubud/retreat/luxury/new-beginning         (WP 118382)
//
// Current Next.js Route:
// src/app/ubud/retreat/[...programme]/page.tsx
//
// Route statis /ubud/retreat, /ubud/retreat/luxury dan
// /ubud/retreat/host-your-own menang atas catch-all ini.
//
// Jika slug berubah: ubah field `slug` di src/data/experiences.ts, lalu
// perbarui CTA "Explore More" di src/app/ubud/retreat/luxury/page.tsx dan
// src/app/ubud/packages/page.tsx.
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

const PREFIX = "retreat/";

type Params = { programme: string[] };

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
      programme: experience.slug.slice(PREFIX.length).split("/"),
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
  const tail = (await params).programme.join("/");
  return resolveDocumentMetadata(
    `/ubud/retreat/${tail}`,
    await getExperience(PREFIX + tail),
  );
}

export default async function RetreatProgrammePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const item = await getExperience(PREFIX + (await params).programme.join("/"));
  if (!item) notFound();
  const site = await getPropertySite("ubud");
  const labels = await getSiteLabels();
  // The closing "Other Personalized Luxury Retreat" grid shows the *other*
  // retreats, so their thumbnails have to be resolved here — the detail body
  // is handed one experience and cannot see the rest.
  const cardImages = Object.fromEntries(
    (await getExperiences()).map((entry) => [entry.slug, entry.cardImage]),
  );

  return (
    <>
      <PropertyHeader site={site} activeHref="/ubud/retreat" />
      <main>
        <BreadcrumbJsonLd path={`/ubud/${item.slug}`} name={item.title} />
        <PropertyHero
          images={[item.hero]}
          alt={item.title}
          eyebrow={item.eyebrow}
          title={item.title}
        />
        <ExperienceDetailBody
          experience={item}
          site={site}
          cardImages={cardImages}
          labels={labels}
        />
        <AwardsRow variant={site.awards.variant} badges={site.awards.badges} />
      </main>
      <PropertyFooter site={site} />
      <DirectBookingDeals bookingHref={site.bookingHref} />
    </>
  );
}
