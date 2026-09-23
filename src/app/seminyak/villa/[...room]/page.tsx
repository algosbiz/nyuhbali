// ======================================================
// Route Information
// Original WordPress URLs (2 halaman, template Oxygen yang sama seperti Ubud):
// /seminyak/villa/honeymoon        (WP 19)  - Honeymoon Suite Pool Villa
// /seminyak/villa/honeymoon/pool   (WP 16)  - One Bedroom Pool Villa
//
// Current Next.js Route:
// src/app/seminyak/villa/[...room]/page.tsx  (catch-all, di-prerender via
// generateStaticParams dari ROOM_DETAILS di src/data/rooms.ts)
//
// Catatan: route statis /seminyak/villa dan
// /seminyak/villa/honeymoon/packages menang atas catch-all ini, jadi keduanya
// tidak tertimpa meskipun segmennya beririsan.
//
// Jika slug berubah, perbarui:
// - field `slug` pada src/data/rooms.ts (BUKAN nama folder — folder ini generic)
// - internal links: src/app/seminyak/villa/page.tsx (detailsHref tiap Room),
//   src/app/seminyak/page.tsx (LinkCardGrid "Our Villas")
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
  const rooms = await getRooms("seminyak");
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
  return resolveDocumentMetadata(
    `/seminyak/villa/${slug}`,
    await getRoom("seminyak", slug),
  );
}

export default async function SeminyakRoomDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const room = await getRoom("seminyak", (await params).room.join("/"));
  if (!room) notFound();
  const site = await getPropertySite("seminyak");
  const labels = await getSiteLabels();

  return (
    <>
      <PropertyHeader site={site} activeHref="/seminyak/villa" />
      <main>
        <BreadcrumbJsonLd path={`/seminyak/villa/${room.slug}`} name={room.title} />
        <PropertyHero
          images={[room.hero]}
          alt={room.title}
          eyebrow="Villas"
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
