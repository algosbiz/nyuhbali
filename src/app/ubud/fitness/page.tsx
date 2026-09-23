// ======================================================
// Route Information
// Original WordPress URL:
// /ubud/fitness/           (WP page ID 279, "Ubud - Gym")
//
// Current Next.js Route:
// src/app/ubud/fitness/page.tsx
//
// Catatan slug: halaman ini adalah "Home Gym" tetapi slug WordPress-nya
// /ubud/fitness, bukan /ubud/wellness/gym — karena itu ia route statis
// tersendiri, bukan bagian dari catch-all /ubud/wellness/[...class].
//
// Jika slug berubah, perbarui:
// - nama folder: src/app/ubud/fitness/
// - internal links: src/app/ubud/wellness/page.tsx ("Free Access to Our Home
//   Gym"), src/app/complimentary-services/page.tsx ("Access to our Home Gym"),
//   src/app/ubud/retreat/host-your-own/page.tsx (kartu "Home Gym")
// - sitemap: belum ada sitemap.ts; tambahkan route baru di sana jika dibuat
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
import { getExperience, getPropertySite, getSiteLabels } from "@/sanity/lib/content";
import { resolvePageMetadata } from "@/sanity/lib/metadata";


export async function generateMetadata(): Promise<Metadata> {
  // A published `page` document's SEO wins; otherwise this stays
  // exactly the live site's title and description from src/data/seo.ts.
  return resolvePageMetadata("/ubud/fitness");
}

export default async function UbudFitnessPage() {
  const site = await getPropertySite("ubud");
  const labels = await getSiteLabels();
  const item = await getExperience("fitness");
  if (!item) notFound();

  return (
    <>
      <PropertyHeader site={site} activeHref="/ubud/wellness" />
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
