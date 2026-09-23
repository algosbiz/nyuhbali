// ======================================================
// Route Information
// Original WordPress URLs (8 halaman, satu template Oxygen):
// /ubud/villa/suite                    (WP 184)
// /ubud/villa/honeymoon/pool           (WP 192)
// /ubud/villa/1-bedroom-pool-deluxe    (WP 200)
// /ubud/villa/1-bedroom-pool-royal     (WP 207)
// /ubud/villa/honeymoon                (WP 213)
// /ubud/villa/2-bedroom-pool           (WP 220)
// /ubud/villa/3-bedroom-pool           (WP 226)
// /ubud/villa/4-bedroom-pool           (WP 232)
//
// Current Next.js Route:
// src/app/ubud/villa/[...room]/page.tsx  (catch-all, di-prerender via
// generateStaticParams dari ROOM_DETAILS di src/data/rooms.ts)
//
// Kenapa catch-all: slug kamar punya kedalaman berbeda — "suite" satu segmen,
// "honeymoon/pool" dua segmen. Route statis /ubud/villa dan
// /ubud/villa/honeymoon/packages tetap menang atas catch-all ini (Next.js
// memprioritaskan route statis), jadi keduanya tidak tertimpa.
//
// Jika slug berubah, perbarui:
// - field `slug` pada src/data/rooms.ts (BUKAN nama folder — folder ini generic)
// - internal links: src/app/ubud/villa/page.tsx (detailsHref tiap Room)
// - breadcrumb: belum ada breadcrumb di project ini
// - sitemap: belum ada sitemap.ts; tambahkan route baru di sana jika dibuat
// ======================================================

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PropertyHeader } from "@/components/property/PropertyHeader";
import { PropertyFooter } from "@/components/property/PropertyFooter";
import { DirectBookingDeals } from "@/components/property/DirectBookingDeals";
import { PropertyHero } from "@/components/property/PropertyHero";
import { RoomDetailBody } from "@/components/property/RoomDetail";
import { AwardsRow } from "@/components/property/AwardsRow";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { getPropertySite, getRoom, getRooms, getSiteLabels } from "@/sanity/lib/content";
import { resolveDocumentMetadata } from "@/sanity/lib/metadata";

type Params = { room: string[] };

/**
 * Slugs come from Sanity when rooms are published there and from
 * src/data/rooms.ts otherwise. This is what is prerendered at build time;
 * `dynamicParams = true` below means a room published after that build still
 * resolves.
 */
export async function generateStaticParams(): Promise<Params[]> {
  const rooms = await getRooms("ubud");
  return rooms.map((room) => ({ room: room.slug.split("/") }));
}

/**
 * A slug that was not in the list above is rendered on its first request
 * rather than 404ing, so a room published in the Studio is live without a
 * deploy. `notFound()` below still answers anything that matches no document,
 * so this widens what can render, not what exists.
 */
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  // The published room's own SEO fields win; anything it leaves empty falls
  // back to the live site's title and description in src/data/seo.ts.
  const slug = (await params).room.join("/");
  return resolveDocumentMetadata(`/ubud/villa/${slug}`, await getRoom("ubud", slug));
}

export default async function UbudRoomDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const room = await getRoom("ubud", (await params).room.join("/"));
  if (!room) notFound();
  const site = await getPropertySite("ubud");
  const labels = await getSiteLabels();

  return (
    <>
      <PropertyHeader site={site} activeHref="/ubud/villa" />
      <main>
        <BreadcrumbJsonLd path={`/ubud/villa/${room.slug}`} name={room.title} />
        <PropertyHero
          images={[room.hero]}
          alt={room.title}
          eyebrow="Stay"
          title={room.title}
        />
        <RoomDetailBody room={room} site={site}
          checkRatesLabel={labels.checkRates}
          galleryHeading={labels.gallery}
          detailsHeading={labels.details}
          amenitiesHeading={labels.amenities}
        />
        <AwardsRow variant={site.awards.variant} badges={site.awards.badges} />
      </main>
      <PropertyFooter site={site} />
      <DirectBookingDeals bookingHref={site.bookingHref} />
    </>
  );
}
