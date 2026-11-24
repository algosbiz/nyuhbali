/**
 * `<lastmod>` for every published route.
 *
 * **Taken from the live site, not invented and not generated at build time.**
 * Yoast publishes one `<lastmod>` per URL across `/page-sitemap.xml` and
 * `/post-sitemap.xml`; those 68 values are copied here verbatim. The six routes
 * the live sitemap leaves out (see `src/app/sitemap.ts`) carry their own page's
 * `article:modified_time` instead, which is the value Yoast would have written
 * had they been listed — the same field, from the same source.
 *
 * **Why not `Date.now()`, and why not Sanity's `_updatedAt`.** A build stamp
 * would tell Google all 74 pages changed every time the site is deployed, which
 * is how a sitemap's dates stop being trusted. `_updatedAt` has the same fault
 * from the other end: the migration wrote every document at once, so it says
 * every page was last touched on migration day. A real date that is a little
 * old is worth more than a fresh date that is wrong.
 *
 * A page edited in the Studio therefore keeps the date below until this map is
 * refreshed. That is the accepted trade: a stale `<lastmod>` costs a slower
 * re-crawl of one page, while a wrong one costs the whole file's credibility.
 * Publishing still purges Next's cache and Cloudflare's immediately, so the new
 * copy is served at once either way — `<lastmod>` only influences how soon a
 * crawler comes back.
 *
 * To refresh after a round of WordPress edits, re-fetch the two live sitemaps
 * and regenerate; it is one map in one file precisely so that stays a one-step
 * diff, the same arrangement `src/data/seo.ts` uses for titles.
 *
 * A path missing from this map is not an error — `src/app/sitemap.ts` lists it
 * with no `<lastmod>` at all, which is what a page published in the Studio
 * after this file was written will do.
 */
export const ROUTE_LASTMOD: Record<string, string> = {
  "/": "2025-03-19T03:00:01+00:00",
  "/complimentary-services": "2026-01-23T10:21:05+00:00",
  "/privacy-policy": "2026-02-16T03:58:55+00:00",
  "/seminyak": "2025-08-13T13:52:06+00:00",
  "/seminyak-directory": "2025-08-14T14:02:28+00:00",
  "/seminyak/contact": "2025-11-13T07:48:10+00:00",
  "/seminyak/dining": "2025-11-13T05:00:50+00:00",
  "/seminyak/discover": "2025-11-13T05:04:12+00:00",
  "/seminyak/discover/10-romantic-honeymoon-activities": "2024-07-10T16:31:07+00:00",
  "/seminyak/discover/sunset": "2025-12-15T07:15:54+00:00",
  "/seminyak/spa": "2025-11-13T05:00:05+00:00",
  "/seminyak/tour": "2025-11-13T05:01:38+00:00",
  "/seminyak/villa": "2025-11-13T04:40:17+00:00",
  "/seminyak/villa/honeymoon": "2025-11-13T04:46:20+00:00",
  "/seminyak/villa/honeymoon/packages": "2025-11-27T04:20:31+00:00",
  "/seminyak/villa/honeymoon/pool": "2025-11-13T04:50:00+00:00",
  "/spa-reservation-seminyak": "2025-11-13T07:51:03+00:00",
  "/suite-directory": "2025-04-26T01:14:57+00:00",
  "/terms-conditions": "2026-02-16T03:39:02+00:00",
  "/ubud": "2026-07-17T12:02:39+00:00",
  "/ubud-directory": "2025-04-26T01:14:53+00:00",
  "/ubud-personalize-your-retreat": "2025-11-13T07:50:31+00:00",
  "/ubud-spa-booking-form": "2024-07-10T12:27:24+00:00",
  "/ubud/balinese-culture": "2025-12-12T01:10:46+00:00",
  "/ubud/balinese-culture/balinese-class": "2025-12-12T02:36:02+00:00",
  "/ubud/balinese-culture/cooking-class": "2025-12-12T02:37:23+00:00",
  "/ubud/balinese-culture/melukat-purification-ceremony": "2025-12-12T02:35:04+00:00",
  "/ubud/balinese-culture/rice-field-walk": "2025-12-12T02:35:47+00:00",
  "/ubud/contact": "2026-07-24T03:08:30+00:00",
  "/ubud/dining": "2026-07-24T03:08:21+00:00",
  "/ubud/discover": "2026-07-24T03:08:36+00:00",
  "/ubud/discover/5-star-resort": "2025-12-16T01:56:28+00:00",
  "/ubud/discover/five-relaxing-activities-to-do": "2025-11-13T08:09:00+00:00",
  "/ubud/discover/hatha-yoga": "2025-12-15T06:58:17+00:00",
  "/ubud/discover/luxury-honeymoon": "2025-12-16T02:55:43+00:00",
  "/ubud/discover/luxury-hotel-awards": "2025-11-13T08:15:19+00:00",
  "/ubud/discover/most-instagrammable-places": "2025-11-13T08:10:36+00:00",
  "/ubud/discover/restoring-body-balance": "2025-12-15T07:00:11+00:00",
  "/ubud/discover/wellness-retreat": "2025-12-15T07:02:16+00:00",
  "/ubud/discover/yoga-teacher-training": "2025-12-16T04:00:54+00:00",
  "/ubud/fitness": "2026-07-24T03:08:12+00:00",
  "/ubud/packages": "2026-07-24T03:08:06+00:00",
  "/ubud/retreat": "2026-07-24T03:07:59+00:00",
  "/ubud/retreat/couples": "2026-07-24T03:05:56+00:00",
  "/ubud/retreat/detox": "2025-11-13T08:07:02+00:00",
  "/ubud/retreat/host-your-own": "2026-07-24T03:06:09+00:00",
  "/ubud/retreat/luxury": "2026-07-24T03:10:37+00:00",
  "/ubud/retreat/luxury/anti-aging": "2026-07-24T03:09:07+00:00",
  "/ubud/retreat/luxury/balinese-healing": "2026-07-24T03:08:59+00:00",
  "/ubud/retreat/luxury/holistic-balancing": "2025-11-27T04:52:54+00:00",
  "/ubud/retreat/luxury/new-beginning": "2026-07-24T03:08:51+00:00",
  "/ubud/retreat/slimming": "2026-07-24T03:10:43+00:00",
  "/ubud/spa": "2026-07-24T03:07:53+00:00",
  "/ubud/spa/couple-massage": "2025-11-13T08:03:16+00:00",
  "/ubud/spa/flower-bath": "2025-12-16T01:46:10+00:00",
  "/ubud/spa/hot-stone-massage": "2025-12-16T01:44:19+00:00",
  "/ubud/villa": "2026-07-24T03:07:47+00:00",
  "/ubud/villa/1-bedroom-pool-deluxe": "2026-07-24T03:11:03+00:00",
  "/ubud/villa/1-bedroom-pool-royal": "2026-07-24T03:11:09+00:00",
  "/ubud/villa/2-bedroom-pool": "2026-07-24T03:11:21+00:00",
  "/ubud/villa/3-bedroom-pool": "2026-07-24T03:11:15+00:00",
  "/ubud/villa/4-bedroom-pool": "2026-07-24T03:10:49+00:00",
  "/ubud/villa/honeymoon": "2026-07-24T03:10:55+00:00",
  "/ubud/villa/honeymoon/packages": "2026-07-24T03:11:33+00:00",
  "/ubud/villa/honeymoon/pool": "2026-07-24T03:11:27+00:00",
  "/ubud/villa/suite": "2025-11-27T05:08:07+00:00",
  "/ubud/wedding": "2026-07-24T03:07:39+00:00",
  "/ubud/wellness": "2026-07-24T03:07:32+00:00",
  "/ubud/wellness/body-tone-flow": "2026-07-24T03:07:11+00:00",
  "/ubud/wellness/breathwork": "2026-07-24T03:07:05+00:00",
  "/ubud/wellness/chakra-healing": "2026-07-24T03:25:05+00:00",
  "/ubud/wellness/life-coach": "2025-12-16T03:07:22+00:00",
  "/ubud/wellness/reiki-healing": "2026-07-24T03:06:57+00:00",
  "/ubud/wellness/sound-healing": "2026-07-24T03:06:52+00:00",
  "/ubud/wellness/yoga": "2026-07-24T03:06:45+00:00",
  "/ubud/wellness/yoga/retreat": "2025-12-15T06:54:54+00:00",
  "/welcomeaboard": "2024-11-12T10:30:40+00:00",
};
