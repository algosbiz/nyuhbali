// `remotePatterns` is next/image's allow-list: it refuses to optimize an image
// from a host it doesn't recognise, which stops the optimizer being used as a
// free proxy for arbitrary third-party images.
//
// **nyuhbalivillas.com is deliberately NOT on it any more.** Every photograph
// and menu PDF used to be hotlinked from its /wp-content/uploads/; all 287 are
// now downloaded into public/uploads/ under WordPress's own /YYYY/MM/ layout,
// because WordPress is being switched off and this build replaces it. Leaving
// the host allow-listed would let a stray absolute URL keep working right up
// until that happens and then fail silently, on whichever page nobody opened
// that week. With it gone, such a URL fails loudly the first time it renders,
// which is the failure this project can act on. Anything in the CMS still
// holding an old URL is rewritten on read — see src/sanity/lib/uploads.ts.
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // The Instagram grid on /seminyak. Behold re-encodes each post to WebP
      // and serves it from its own CDN rather than passing Instagram's URLs
      // through — which is what makes these safe to prerender at all:
      // Instagram's own CDN links are signed and expire within days, so a
      // statically generated page holding them would rot. Both hostnames
      // appear in Behold's payloads. `pathname` stays open because that CDN
      // keys by content hash, so there is no stable prefix to scope it to.
      {
        protocol: "https",
        hostname: "cdn.behold.pictures",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "behold.pictures",
        pathname: "/**",
      },
      // Sanity's image pipeline, for anything an editor uploads rather than
      // hotlinks. Scoped to the image asset path rather than the whole host,
      // for the same reason the uploads folder above is scoped: keeping the
      // allow-list as narrow as what is actually referenced.
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**",
      },
    ],
  },

  // The Studio must not be indexed, and robots.txt alone cannot promise that.
  // `Disallow: /studio` stops a well-behaved crawler fetching the page; it does
  // not stop the URL itself being listed if someone links to it, because a
  // crawler that is refused the page never reads the `noindex` inside it. This
  // header is the half that survives that case, and being a header it also
  // covers the Studio's own asset responses rather than only its HTML. Both
  // halves are kept: the disallow saves the crawl, this saves the index.
  //
  // Cloudflare bypasses its cache for `/studio*` (scripts/cloudflare/
  // cache-rules.mjs), so there is no edge copy that could be serving these
  // pages without the header.
  async headers() {
    return [
      {
        source: "/studio/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/studio",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },

      // The 352 files in `public/uploads/` — 315 photographs and 37 menu
      // PDFs, carried over under WordPress's own /YYYY/MM/ layout.
      //
      // Vercel serves everything in `public/` with `Cache-Control: public,
      // max-age=0, must-revalidate` unless told otherwise. Files under
      // `_next/static` get a fingerprinted name and a year of `immutable`
      // for free; a `public/` file keeps the name it was authored with, so
      // Next cannot assume it is safe to hold and revalidates every one on
      // every visit. The photographs mostly go through next/image and are
      // answered from Vercel's optimizer, but the PDFs are linked directly
      // and are the largest single things a guest downloads — a menu paying
      // a conditional request per open, forever.
      //
      // **30 days, and deliberately not `immutable`.** These filenames are
      // stable, so a photograph swapped in under an existing name would
      // otherwise be invisible to anyone who had already cached it. A month
      // bounds that, and giving the replacement a new filename busts the
      // cache immediately if it ever needs to be faster than that.
      //
      // This is also the value Cloudflare passes through: rule 3 in
      // scripts/cloudflare/cache-rules.mjs caches `/uploads/*` with *both*
      // TTLs set to respect origin, so this header — not a number in the
      // dashboard — is the single place the figure is stated, for the edge
      // and the browser alike.
      {
        source: "/uploads/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000" }],
      },
    ];
  },

  // Three sets. Two are about the day this build replaces the live site: URLs
  // WordPress publishes today that nothing here would answer. A 308 keeps the
  // ranking signals a page has accumulated; a 404 throws them away. The third
  // is the opposite case — a URL this build *did* answer, retired because the
  // live site retired it.
  //
  // **Every destination is a route this build already serves, and every source
  // is a URL the live site actually publishes.** Both lists were derived, not
  // guessed: the sources come from WordPress's own page and post index
  // (`/wp-json/wp/v2/pages` and `/posts`, 83 published paths) diffed against
  // `ROUTE_SEO`, and the destinations are the successors this project already
  // recorded. Re-run that diff after any WordPress restructuring — it is the
  // only way these can be found, because a page missing from the build is
  // invisible from inside the build.
  async redirects() {
    return [
      // Yoast served the sitemap as an index of two files at three URLs. Google
      // has been fetching those for years and a Search Console property still
      // names one of them, so they redirect to Next's single `/sitemap.xml`
      // instead of becoming three 404s. Permanent, because they are not coming
      // back.
      {
        source: "/sitemap_index.xml",
        destination: "/sitemap.xml",
        permanent: true,
      },
      {
        source: "/page-sitemap.xml",
        destination: "/sitemap.xml",
        permanent: true,
      },
      {
        source: "/post-sitemap.xml",
        destination: "/sitemap.xml",
        permanent: true,
      },

      // The five superseded duplicates. Each is a page WordPress still serves
      // at an old URL while the content itself moved to one of the 74 routes
      // here, which is why this project does not rebuild them — see the list of
      // deliberate omissions in CLAUDE.md.
      //
      // The first two need no judgement at all: the live page's `<title>` is
      // byte-identical to the destination's entry in `src/data/seo.ts`, so
      // WordPress is publishing one page at two URLs and this simply picks the
      // one that survived.
      {
        // "Honeymoon Suite Pool Villa - Seminyak", both of them.
        source: "/seminyak-honeymoon",
        destination: "/seminyak/villa/honeymoon",
        permanent: true,
      },
      {
        // "Luxury Spa in Ubud", both of them. The "medical aesthetic" half of
        // the old title is a separate business on its own domain now, which is
        // what `PropertyNavChild.external` marks in the Ubud menu.
        source: "/ubud-spa-and-medical-aesthetic",
        destination: "/ubud/spa",
        permanent: true,
      },
      {
        // "Ubud - Culture - Nyuh Bali" → "Ubud - Experience - Nyuh Bali": the
        // same slot in the same title template, renamed. It is the page the
        // Ubud menu's Culture item points at.
        source: "/ubud-culture",
        destination: "/ubud/balinese-culture",
        permanent: true,
      },
      {
        // Lumbini is the restaurant `/ubud/dining` is about — the page is
        // headed "Lumbini Restaurant" and nothing else here covers it.
        source: "/lumbini-restaurant",
        destination: "/ubud/dining",
        permanent: true,
      },
      {
        // A draft copy in a `/ubud-backup/` folder that Yoast listed in the
        // public sitemap — a live-site accident rather than a page. Its
        // treatment list differs from the published chakra healing page, but
        // that page is the only one this site has on the subject, and a
        // backup URL should not have been indexed in the first place.
        source: "/ubud-backup/culture/chakra-healing-retreat",
        destination: "/ubud/wellness/chakra-healing",
        permanent: true,
      },

      // The one redirect that mirrors a change the live site made after this
      // build was written, rather than one that pre-dates it.
      //
      // `/life-coach-retreat-benefits` is a published post, and WordPress no
      // longer serves it: the URL 301s to `/ubud/wellness/life-coach` at the
      // server, not in PHP — the response carries no `x-powered-by` and none
      // of WordPress's `link:` headers — which is why it left no trace in the
      // REST API's `modified` dates or in Yoast's `<lastmod>`, and why Yoast
      // still lists the post in `/post-sitemap.xml`. A date diff cannot find
      // this class of change; only requesting the URL can.
      //
      // This build had already found the same collision from the other end and
      // answered it differently: `src/app/life-coach-retreat-benefits/page.tsx`
      // re-rendered the wellness class at the legacy URL, so two routes served
      // byte-identical content and each self-canonicalised. That is the
      // duplicate the live site has now resolved, so that alias route is
      // deleted and this takes its place — one URL, one canonical.
      //
      // The post's own article text is untouched in `src/data/posts.ts`; only
      // its route is gone. See the note there before restoring it.
      {
        source: "/life-coach-retreat-benefits",
        destination: "/ubud/wellness/life-coach",
        permanent: true,
      },


      // ── The legacy WordPress permalinks ──────────────────────────────
      //
      // The 86 below come from a crawl of every URL the live site still
      // answers a 301 for (nyuhbalivillas-redirect-list.csv), and they are a
      // different population from the eight above: those are pages the live
      // site *serves* that this build does not rebuild, while these are URLs
      // WordPress itself already retired — the pre-2023 permalink scheme,
      // plus the hyphen-less and double-published variants that accumulated
      // around it. WordPress answers them from its own redirect table, which
      // is data this build does not inherit, so without this block every one
      // of them 404s the day the DNS moves, and drops whatever ranking and
      // inbound links it still carries.
      //
      // **Each destination is the crawl's Final URL, not its Redirect
      // Target.** The live site chains several of these
      // (`/balinese-culture-activity` -> `/ubud/culture` ->
      // `/ubud/balinese-culture`); resolving to the end of the chain here
      // means one hop instead of two. The handful where the crawl's own
      // final URL is a 404 are marked individually below — those are the
      // only entries that required a decision.
      //
      // Refresh the same way the list above is refreshed: re-crawl every
      // published URL. A retired permalink is invisible from inside this
      // build, because nothing here links to one.

      // Section landing pages, under their old top-level slugs.
      { source: "/contact-us", destination: "/seminyak/contact", permanent: true },
      { source: "/contact-our-ubud-villa", destination: "/ubud/contact", permanent: true },
      { source: "/seminyak-luxury-villa", destination: "/seminyak/villa", permanent: true },
      { source: "/seminyak-dining", destination: "/seminyak/dining", permanent: true },
      { source: "/seminyak-spa", destination: "/seminyak/spa", permanent: true },
      { source: "/tour", destination: "/seminyak/tour", permanent: true },
      { source: "/luxury-villa-ubud", destination: "/ubud", permanent: true },
      { source: "/ubud-villa", destination: "/ubud/villa", permanent: true },
      { source: "/ubud-packages", destination: "/ubud/packages", permanent: true },
      { source: "/dining-ubud", destination: "/ubud/dining", permanent: true },
      { source: "/spa-in-ubud", destination: "/ubud/spa", permanent: true },
      { source: "/ubud-wellness", destination: "/ubud/wellness", permanent: true },
      { source: "/wedding-in-ubud", destination: "/ubud/wedding", permanent: true },
      { source: "/ubud-retreat", destination: "/ubud/retreat", permanent: true },
      { source: "/luxury-retreat-ubud", destination: "/ubud/retreat/luxury", permanent: true },
      { source: "/host-your-own-retreat", destination: "/ubud/retreat/host-your-own", permanent: true },
      { source: "/how-to-host-retreat", destination: "/ubud/retreat/host-your-own", permanent: true },
      // The parent of four permalinks that still redirect individually below;
      // it 404s on the live site, so its own successor is a reading rather
      // than a copy — `/ubud/retreat` is the page those four now live under.
      { source: "/retreat-in-ubud", destination: "/ubud/retreat", permanent: true },
      // "Ubud - Experience" is the old title of the page `/ubud-culture`
      // already redirects to, which is what settles these three. The live
      // site sends `/ubud-experience` to `/?page_id=38`, and that 404s.
      { source: "/ubud-experience", destination: "/ubud/balinese-culture", permanent: true },
      { source: "/balinese-culture-activity", destination: "/ubud/balinese-culture", permanent: true },
      { source: "/ubud/culture", destination: "/ubud/balinese-culture", permanent: true },
      // The two blog indexes. `/ubud-blog/page/2` is WordPress's pagination;
      // this build's `/ubud/discover` is a single page, so page 2 is the
      // index itself rather than the `/ubud/discoverpage/2/` the live
      // redirect points at, which 404s there too.
      { source: "/ubud-blog", destination: "/ubud/discover", permanent: true },
      { source: "/ubud-blog/page/2", destination: "/ubud/discover", permanent: true },
      { source: "/seminyak-blog", destination: "/seminyak/discover", permanent: true },

      // Romance — the packages and the two honeymoon villas, including the
      // hyphen-less variants WordPress published alongside them.
      { source: "/romanticpackage", destination: "/seminyak/villa/honeymoon/packages", permanent: true },
      { source: "/honeymoon-romantic-packages-bali", destination: "/seminyak/villa/honeymoon/packages", permanent: true },
      { source: "/ubud-romance", destination: "/ubud/villa/honeymoon/packages", permanent: true },
      { source: "/honeymoon-villa-seminyak", destination: "/seminyak/villa/honeymoon", permanent: true },
      { source: "/honeymoonvillainseminyak", destination: "/seminyak/villa/honeymoon", permanent: true },
      { source: "/pool-villa-seminyak", destination: "/seminyak/villa/honeymoon/pool", permanent: true },
      { source: "/poolvillainseminyak", destination: "/seminyak/villa/honeymoon/pool", permanent: true },

      // The Ubud rooms, under the old `/ubud-villa/` prefix. The pairing of
      // the two honeymoon URLs is the live site's own and is copied as it
      // stands: `honeymoon-suite-pool-villa` is the suite, `honeymoon-suite`
      // is the pool villa.
      { source: "/ubud-villa/nyuh-suite", destination: "/ubud/villa/suite", permanent: true },
      { source: "/ubud-villa/honeymoon-suite-pool-villa", destination: "/ubud/villa/honeymoon", permanent: true },
      { source: "/ubud-villa/honeymoon-suite", destination: "/ubud/villa/honeymoon/pool", permanent: true },
      { source: "/ubud-villa/one-bedroom-deluxe-pool-villa", destination: "/ubud/villa/1-bedroom-pool-deluxe", permanent: true },
      { source: "/ubud-villa/one-bedroom-royal-pool-villa", destination: "/ubud/villa/1-bedroom-pool-royal", permanent: true },
      { source: "/ubud-villa/two-bedroom-pool-villa", destination: "/ubud/villa/2-bedroom-pool", permanent: true },
      { source: "/ubud-villa/three-bedroom-pool-villa", destination: "/ubud/villa/3-bedroom-pool", permanent: true },
      { source: "/ubud-villa/four-bedroom-pool-villa-family-suite-villa", destination: "/ubud/villa/4-bedroom-pool", permanent: true },
      // The prefix without its hyphen. On the live site this one resolves to
      // the room's *photograph* in /wp-content/uploads — a WordPress
      // attachment page, not a decision anybody made — so it is sent to the
      // room its hyphenated twin above goes to.
      { source: "/ubudvilla/honeymoon-suite-pool-villa", destination: "/ubud/villa/honeymoon", permanent: true },

      // Retreat programmes, under both of the prefixes they were published
      // at. `/personalised-luxury-retreat-in-ubud/` is the older of the two,
      // and its balinese-healing URL 404s on the live site rather than
      // redirecting; it is mapped the way its `new-beginning` sibling is.
      { source: "/luxury-retreat-ubud/couples-retreat", destination: "/ubud/retreat/couples", permanent: true },
      { source: "/luxury-retreat-ubud/holistic-balancing-retreat", destination: "/ubud/retreat/luxury/holistic-balancing", permanent: true },
      { source: "/luxury-retreat-ubud/new-beginning", destination: "/ubud/retreat/luxury/new-beginning", permanent: true },
      { source: "/personalised-luxury-retreat-in-ubud/new-beginning", destination: "/ubud/retreat/luxury/new-beginning", permanent: true },
      { source: "/luxury-retreat-ubud/ubud-authentic-balinese-healing", destination: "/ubud/retreat/luxury/balinese-healing", permanent: true },
      { source: "/personalised-luxury-retreat-in-ubud/ubud-authentic-balinese-healing", destination: "/ubud/retreat/luxury/balinese-healing", permanent: true },
      { source: "/ubud-anti-aging-retreat", destination: "/ubud/retreat/luxury/anti-aging", permanent: true },
      { source: "/detox-retreat-bali", destination: "/ubud/retreat/detox", permanent: true },
      { source: "/ubud-slimming-retreat", destination: "/ubud/retreat/slimming", permanent: true },

      // The wellness classes. `/ubudwellness/` — the prefix with its hyphen
      // dropped — 404s on the live site rather than redirecting; both of its
      // URLs are mapped the way their `/ubud-wellness/` twins are.
      { source: "/ubud-wellness/ubud-bodytoneflow", destination: "/ubud/wellness/body-tone-flow", permanent: true },
      { source: "/ubud-wellness/ubud-breathwork", destination: "/ubud/wellness/breathwork", permanent: true },
      { source: "/ubudwellness/ubud-breathwork", destination: "/ubud/wellness/breathwork", permanent: true },
      { source: "/ubud-wellness/ubud-chakra-healing", destination: "/ubud/wellness/chakra-healing", permanent: true },
      { source: "/ubud-wellness/ubud-life-coach", destination: "/ubud/wellness/life-coach", permanent: true },
      { source: "/ubud-wellness/ubud-reiki-healing", destination: "/ubud/wellness/reiki-healing", permanent: true },
      { source: "/ubudwellness/ubud-reiki-healing", destination: "/ubud/wellness/reiki-healing", permanent: true },
      { source: "/ubud-wellness/ubud-sound-healing", destination: "/ubud/wellness/sound-healing", permanent: true },
      { source: "/ubud-wellness/yoga", destination: "/ubud/wellness/yoga", permanent: true },
      { source: "/retreat-in-ubud/yoga", destination: "/ubud/wellness/yoga", permanent: true },
      { source: "/yoga-retreat-ubud", destination: "/ubud/wellness/yoga/retreat", permanent: true },
      { source: "/balinese-culture-activity/chakra-healing-retreat", destination: "/ubud/wellness/chakra-healing", permanent: true },
      // The same page under a third prefix. The live site sends this one to
      // the `/ubud-backup/` draft already redirected above, so this skips
      // that hop.
      { source: "/retreat-in-ubud/chakra-healing-retreat", destination: "/ubud/wellness/chakra-healing", permanent: true },
      { source: "/balinese-culture-activity/ubud-fitness", destination: "/ubud/fitness", permanent: true },
      { source: "/retreat-in-ubud/ubud-fitness", destination: "/ubud/fitness", permanent: true },

      // Culture activities. The live site's target for the cooking class is
      // `/ubud/culture/cooking-class`, which is the renamed prefix redirected
      // above and 404s on its own; both spellings land on the built route.
      { source: "/retreat-in-ubud/complimentary-rice-paddies-walk-2", destination: "/ubud/balinese-culture/rice-field-walk", permanent: true },
      { source: "/ubud-market-tour-and-private-balinese-cooking-lesson", destination: "/ubud/balinese-culture/cooking-class", permanent: true },
      { source: "/ubud/culture/cooking-class", destination: "/ubud/balinese-culture/cooking-class", permanent: true },

      // Spa treatments, and the spa's own menu page. `/ubud/spa/spa-menu` is
      // not a page this build has — the menu is a PDF linked from the spa
      // page — and it 404s on the live site too, so it goes to the page that
      // carries the link.
      { source: "/couple-massage-ubud", destination: "/ubud/spa/couple-massage", permanent: true },
      { source: "/couple-massage-in-ubud-romantic-packages", destination: "/ubud/spa/couple-massage", permanent: true },
      { source: "/hot-stone-massage-ubud", destination: "/ubud/spa/hot-stone-massage", permanent: true },
      { source: "/spa-with-flower-bath-experience-in-ubud", destination: "/ubud/spa/flower-bath", permanent: true },
      { source: "/spa-in-ubud/spa-menu", destination: "/ubud/spa", permanent: true },
      { source: "/spa-reservation-seminyak-2", destination: "/spa-reservation-seminyak", permanent: true },

      // Blog posts, at the bare slugs they were published under before the
      // `/discover/` prefixes existed. `/ubud/discoverl/` is the live site's
      // own misspelling and the route this build serves that post at.
      { source: "/10-romantic-honeymoon-activities-in-seminyak", destination: "/seminyak/discover/10-romantic-honeymoon-activities", permanent: true },
      { source: "/sunset-seminyak", destination: "/seminyak/discover/sunset", permanent: true },
      { source: "/five-relaxing-activities-to-do-in-ubud", destination: "/ubud/discover/five-relaxing-activities-to-do", permanent: true },
      { source: "/most-instagrammable-places-in-ubud", destination: "/ubud/discover/most-instagrammable-places", permanent: true },
      { source: "/luxury-honeymoon-in-ubud", destination: "/ubud/discover/luxury-honeymoon", permanent: true },
      { source: "/ubud-honeymoon", destination: "/ubud/discover/luxury-honeymoon", permanent: true },
      { source: "/wellness-retreat-bali", destination: "/ubud/discover/wellness-retreat", permanent: true },
      { source: "/what-is-a-bali-5-star-resort", destination: "/ubud/discover/5-star-resort", permanent: true },
      { source: "/what-is-hatha-yoga", destination: "/ubud/discover/hatha-yoga", permanent: true },
      { source: "/yoga-teacher-training-in-bali", destination: "/ubud/discover/yoga-teacher-training", permanent: true },
      { source: "/luxury-hotel-award", destination: "/ubud/discoverl/luxury-hotel-awards", permanent: true },

      // Two reopening announcements the live site retired to the landing
      // page. Copied as they stand rather than pointed at a resort: the post
      // applied to both.
      { source: "/ubud-welcoming-the-new-normal-era", destination: "/", permanent: true },
      { source: "/welcoming-the-new-normal-era", destination: "/", permanent: true },


      // ── The permalinks the first crawl missed ────────────────────────
      //
      // The block above was built from a crawl of the URLs the live site
      // still answered a 301 for. That is only half the population: a
      // permalink WordPress had already forgotten answered a 404 there too,
      // so it never entered the list — and the day this build replaced
      // WordPress those URLs went on 404ing, now with the ranking and the
      // inbound links they had kept all along.
      //
      // These were found the only way that finds them: every URL the Internet
      // Archive holds for nyuhbalivillas.com (413 distinct paths) requested
      // against the live site, cross-checked against the broken backlinks
      // Ahrefs reports for the domain. Every entry below is a path one of
      // those two attests, except the three marked as completing a family.
      // Re-run both after any future restructuring.

      // The culture activities, under the two prefixes that predate
      // `/ubud/balinese-culture/`. `/ubud/culture/` is the renamed prefix
      // already redirected above; its children were never mapped with it, and
      // two of them carry the strongest broken links the domain has
      // (esoftskills.com at DR 49, knycxjourneying.com at DR 40).
      { source: "/ubud/culture/chakra-healing-retreat", destination: "/ubud/wellness/chakra-healing", permanent: true },
      { source: "/ubud/culture/balinese-class", destination: "/ubud/balinese-culture/balinese-class", permanent: true },
      { source: "/ubud/culture/melukat-purification-ceremony", destination: "/ubud/balinese-culture/melukat-purification-ceremony", permanent: true },
      // Completes that family; its other three siblings are all attested.
      { source: "/ubud/culture/rice-field-walk", destination: "/ubud/balinese-culture/rice-field-walk", permanent: true },
      { source: "/ubud-culture/daily-authentic-balinese-class", destination: "/ubud/balinese-culture/balinese-class", permanent: true },
      { source: "/ubud-culture/melukat-balinese-purification-ceremony", destination: "/ubud/balinese-culture/melukat-purification-ceremony", permanent: true },
      { source: "/ubud-culture/complimentary-rice-paddies-walk", destination: "/ubud/balinese-culture/rice-field-walk", permanent: true },
      { source: "/ubud-culture/market-tour-private-balinese-cooking-lesson", destination: "/ubud/balinese-culture/cooking-class", permanent: true },
      { source: "/market-tour-private-balinese-cooking-lesson", destination: "/ubud/balinese-culture/cooking-class", permanent: true },
      { source: "/balinese-culture-activity/rice-field-walk-ubud", destination: "/ubud/balinese-culture/rice-field-walk", permanent: true },
      { source: "/retreat-in-ubud/rice-field-walk-ubud", destination: "/ubud/balinese-culture/rice-field-walk", permanent: true },

      // Wellness. `/balinese-culture-activity/yoga` is worth more than its
      // shape suggests — nine referring domains still point at it.
      { source: "/balinese-culture-activity/yoga", destination: "/ubud/wellness/yoga", permanent: true },
      { source: "/retreat-in-ubud/chakra-balancing", destination: "/ubud/wellness/chakra-healing", permanent: true },
      { source: "/retreat-in-ubud/free-access-home-gym", destination: "/ubud/fitness", permanent: true },
      { source: "/ubudwellness", destination: "/ubud/wellness", permanent: true },
      // The one class the resort retired rather than renamed: there is no
      // pilates page here, and there was none on WordPress either by the time
      // it was crawled. Two sites still link to it, so it goes to the index
      // listing the classes that did survive rather than to a 404.
      { source: "/ubud-wellness/ubud-pilates", destination: "/ubud/wellness", permanent: true },

      // The Ubud rooms again, under the two further prefixes they were
      // published at before `/ubud-villa/` — plus the hyphen-less
      // `/ubudvilla/` variant, of which only the honeymoon suite was mapped
      // above. Same pairing of the two honeymoon URLs as the `/ubud-villa/`
      // block: the live site's own, copied as it stands.
      { source: "/ubudvilla", destination: "/ubud/villa", permanent: true },
      { source: "/ubudvilla/nyuh-suite", destination: "/ubud/villa/suite", permanent: true },
      { source: "/ubudvilla/honeymoon-suite", destination: "/ubud/villa/honeymoon/pool", permanent: true },
      { source: "/ubudvilla/one-bedroom-deluxe-pool-villa", destination: "/ubud/villa/1-bedroom-pool-deluxe", permanent: true },
      { source: "/ubudvilla/one-bedroom-royal-pool-villa", destination: "/ubud/villa/1-bedroom-pool-royal", permanent: true },
      { source: "/ubudvilla/two-bedroom-pool-villa", destination: "/ubud/villa/2-bedroom-pool", permanent: true },
      { source: "/ubudvilla/three-bedroom-pool-villa", destination: "/ubud/villa/3-bedroom-pool", permanent: true },
      { source: "/ubudvilla/four-bedroom-pool-villa-family-suite-villa", destination: "/ubud/villa/4-bedroom-pool", permanent: true },
      { source: "/luxurious-accomodation-in-ubud", destination: "/ubud/villa", permanent: true },
      { source: "/luxury-villa-ubud/luxurious-accomodation-in-ubud", destination: "/ubud/villa", permanent: true },
      { source: "/luxurious-accomodation-in-ubud/honeymoon-suite-pool-villa", destination: "/ubud/villa/honeymoon", permanent: true },
      { source: "/luxurious-accomodation-in-ubud/one-bedroom-deluxe-pool-villa", destination: "/ubud/villa/1-bedroom-pool-deluxe", permanent: true },
      { source: "/luxurious-accomodation-in-ubud/one-bedroom-royal-pool-villa", destination: "/ubud/villa/1-bedroom-pool-royal", permanent: true },
      { source: "/luxurious-accomodation-in-ubud/two-bedroom-pool-villa", destination: "/ubud/villa/2-bedroom-pool", permanent: true },
      { source: "/luxurious-accomodation-in-ubud/three-bedroom-pool-villa", destination: "/ubud/villa/3-bedroom-pool", permanent: true },
      { source: "/luxurious-accomodation-in-ubud/four-bedroom-pool-villa-family-suite-villa", destination: "/ubud/villa/4-bedroom-pool", permanent: true },
      // And the same room slugs hung straight off `/ubud/`, which is a live
      // route here — these are paths beneath it, not the page itself.
      { source: "/ubud/honeymoon-suite-pool-villa", destination: "/ubud/villa/honeymoon", permanent: true },
      { source: "/ubud/one-bedroom-deluxe-pool-villa", destination: "/ubud/villa/1-bedroom-pool-deluxe", permanent: true },
      { source: "/ubud/one-bedroom-royal-pool-villa", destination: "/ubud/villa/1-bedroom-pool-royal", permanent: true },
      { source: "/ubud/two-bedroom-pool-villa", destination: "/ubud/villa/2-bedroom-pool", permanent: true },
      { source: "/ubud/three-bedroom-pool-villa", destination: "/ubud/villa/3-bedroom-pool", permanent: true },
      { source: "/ubud/four-bedroom-pool-villa-family-suite-villa", destination: "/ubud/villa/4-bedroom-pool", permanent: true },

      // Romance, under the prefix `/ubud-romance` already redirects from.
      // The costume photoshoot is a package this build does not carry, so it
      // goes to the page carrying the rest of them rather than nowhere.
      { source: "/ubud-romance/honeymoon", destination: "/ubud/villa/honeymoon/packages", permanent: true },
      { source: "/ubud-romance/easy-stress-free-proposal-package", destination: "/ubud/villa/honeymoon/packages", permanent: true },
      { source: "/ubud-romance/balinese-costume-photoshooting", destination: "/ubud/villa/honeymoon/packages", permanent: true },

      // The Ubud spa's own children. Its three booking URLs are one form
      // here; `mahamaya-spa` is the spa page itself under its old name.
      { source: "/spa-in-ubud/mahamaya-spa", destination: "/ubud/spa", permanent: true },
      { source: "/spa-in-ubud/spa-inquiry", destination: "/ubud-spa-booking-form", permanent: true },
      { source: "/spa-in-ubud/spa-reservation-ubud", destination: "/ubud-spa-booking-form", permanent: true },
      { source: "/spa-in-ubud/spa-reservation-ubud-2", destination: "/ubud-spa-booking-form", permanent: true },

      // The rest of the hyphen-less set WordPress double-published, which
      // `/poolvillainseminyak` and `/honeymoonvillainseminyak` above belong
      // to. The three directory ones matter more than the others: those are
      // the pages a guest reaches from the QR code beside the bed.
      { source: "/lumbinirestaurant", destination: "/ubud/dining", permanent: true },
      { source: "/seminyakdining", destination: "/seminyak/dining", permanent: true },
      { source: "/seminyakspa", destination: "/seminyak/spa", permanent: true },
      { source: "/villainseminyak", destination: "/seminyak/villa", permanent: true },
      { source: "/romanticubudvilla", destination: "/ubud/villa/honeymoon", permanent: true },
      { source: "/familyubudvilla", destination: "/ubud/villa/4-bedroom-pool", permanent: true },
      { source: "/seminyakdirectory", destination: "/seminyak-directory", permanent: true },
      { source: "/ubuddirectory", destination: "/ubud-directory", permanent: true },
      { source: "/suitedirectory", destination: "/suite-directory", permanent: true },

      // WordPress's blog pagination under the new prefix, the counterpart of
      // the `/ubud-blog/page/2` entry above.
      { source: "/ubud/discover/page/2", destination: "/ubud/discover", permanent: true },


      // ── The WordPress media library ──────────────────────────────────
      //
      // Every photograph and menu PDF this site serves lives in
      // `public/uploads/` under WordPress's own `/YYYY/MM/name.ext` layout —
      // which is what makes the last rule below a one-liner: an old
      // `/wp-content/uploads/2023/03/x.webp` is the same path with a
      // different prefix. Measured against every upload URL the Internet
      // Archive holds for the domain (543 of them), **85 resolve exactly**;
      // the rest are files this build does not carry and 404 either way, so
      // the rule can only help.
      //
      // The named rules above it are the files it *cannot* help, requested by
      // the client for image search. Two things about them are worth keeping.
      //
      // **A redirect per exact URL would have missed most of the links.**
      // WordPress publishes a handful of size variants per image, and the
      // client's list was the `-212x300` thumbnails while Ahrefs reports the
      // referring domains on `-724x1024` and on the bare filename. So each
      // rule matches the *base name* with an optional `-WxH` suffix rather
      // than one spelling. **These are the redirects whose matching cannot be
      // read off the source** — see the note on `src/proxy.ts` about a
      // matcher that silently matched nothing — so every pattern here was
      // checked against a running production build, positively and
      // negatively, not by eye.
      //
      // **The destination is an image, never a page.** An image URL sent to
      // an HTML page is a soft 404 to Google Images and throws the signal
      // away; the client's own rule was that the picture need only match the
      // name, which is what makes these defensible.

      // The Seminyak room whose title is literally "Honeymoon Suite Pool
      // Villa", and this is that page's hero — the closest thing to the same
      // photograph under the same name. Four referring domains.
      {
        source: "/wp-content/uploads/2022/12/:file(honeymoon-suite-pool-villa(?:-\\d+x\\d+)?\\.jpe?g)",
        destination: "/uploads/2023/03/Honeymoon-Suite-Pool-Villa-1.webp",
        permanent: true,
      },

      // The candle-light dinner family, which is five base names across four
      // folders rather than the three URLs the client listed — the strongest
      // of them, `In-villa-candle-light-dinner.jpg` at six referring domains,
      // was not on the list at all. They were menu cards and setup shots for
      // one offer, and `Couple-having-a-romantic-dinner-at-Nyuh-Bali.jpg` is
      // the photograph of that offer this build actually carries: a table for
      // two at night, candle lit, under the Balinese umbrellas. One
      // destination for all of them is correct here — they are one subject,
      // and picking different pictures to keep the URLs distinct would put a
      // photograph behind a name that does not describe it.
      {
        // Balinese / Indonesian / International, plus every size variant.
        source: "/wp-content/uploads/2019/08/:file(Candle-light-dinner-[A-Za-z]+(?:-\\d+x\\d+)?\\.png)",
        destination: "/uploads/2024/04/Couple-having-a-romantic-dinner-at-Nyuh-Bali.jpg",
        permanent: true,
      },
      {
        source: "/wp-content/uploads/2019/08/:file(100-candles-light-dinner(?:-\\d+x\\d+)?\\.png)",
        destination: "/uploads/2024/04/Couple-having-a-romantic-dinner-at-Nyuh-Bali.jpg",
        permanent: true,
      },
      {
        // `candle-light-diner` is the live site's own misspelling, and both
        // spellings are published.
        source: "/wp-content/uploads/2019/02/:file([Cc]andle-light-din(?:n)?er[A-Za-z-]*?(?:-\\d+x\\d+)?\\.jpe?g)",
        destination: "/uploads/2024/04/Couple-having-a-romantic-dinner-at-Nyuh-Bali.jpg",
        permanent: true,
      },
      {
        source: "/wp-content/uploads/2018/07/:file(In-villa-candle-light-dinner(?:-\\d+x\\d+)?\\.jpe?g)",
        destination: "/uploads/2024/04/Couple-having-a-romantic-dinner-at-Nyuh-Bali.jpg",
        permanent: true,
      },
      {
        source: "/wp-content/uploads/2016/02/:file(2\\.-Romantic-Candle-Light-Dinner-Nyuh-Bali-Villas(?:-\\d+)?(?:-\\d+x\\d+)?\\.jpe?g)",
        destination: "/uploads/2024/04/Couple-having-a-romantic-dinner-at-Nyuh-Bali.jpg",
        permanent: true,
      },

      // Nothing here for `/wp-content/uploads/2016/02/easter.jpg`, the fifth
      // URL on the client's list, and the omission is deliberate. It was a
      // 2016 seasonal promotion: this build has no Easter photograph, no
      // seasonal offer page, and nothing whose name matches — the nearest
      // candidate, `sweet-celebration.webp`, is a romantic bed setup with
      // heart balloons, which is a different occasion wearing the word
      // "celebration". The Internet Archive never captured the file, so it
      // cannot even be looked at, and Ahrefs reports no referring domain for
      // it, so a 404 costs nothing. Inventing a match is how a redirect
      // starts lying; if the business wants one, it is a content decision.


      // The seven image URLs carrying the most links, none of which this
      // build carries under its old name. Ranked by referring domains, which
      // is why they are worth a judgement each rather than a 404: 27, 20, 14,
      // 7, 7, 6 and 5. **Only two of the seven survive in the Internet
      // Archive**, so five were matched on the name alone — which is the rule
      // the client set, and the reason the two that *could* be looked at were
      // looked at is below.

      // 27 referring domains, the most of any URL on this domain. Never
      // archived, and by its filename it was a stock photograph of stacked
      // zen stones with the agency's own id on the end, so there is nothing
      // of the resort to match. `restoring-body-balance` is the closest this
      // build has on both counts — the word the old name leads with, and a
      // guest holding a balance pose on the Ubud rooftop shala.
      {
        source:
          "/wp-content/uploads/2018/02/:file(Balance-Meditation-Zen-Stack-Stones-Rocks-Pile-2907290(?:-\\d+x\\d+)?\\.jpe?g)",
        destination: "/uploads/2023/09/restoring-body-balance-1.webp",
        permanent: true,
      },

      // The Seminyak spa's printed menu, photographed — 15 referring domains
      // on the https spelling and 5 more on http, plus `…menu2` at 4, so the
      // rule takes the whole numbered family. There is no menu *image* here
      // (the menus are PDFs now), so it goes to the lead photograph of the
      // page that carries them.
      {
        source: "/wp-content/uploads/2016/02/:file(nyuhbalispamenu\\d+(?:-\\d+x\\d+)?\\.jpe?g)",
        destination: "/uploads/2023/03/Seminyak-Spa-2.webp",
        permanent: true,
      },

      // One of the two that *is* archived, and worth having looked at: the
      // resort's entrance bridge, two guardian statues under black-and-white
      // payung. `/ubud` is the About Us page this names, so its own hero is
      // the counterpart — a different view of the same subject, which is the
      // most the client's rule asks for.
      {
        source: "/wp-content/uploads/2018/02/:file(ubud-nyuh-bali-about-us(?:-\\d+x\\d+)?\\.jpe?g)",
        destination: "/uploads/2025/01/home-ubud-compress.webp",
        permanent: true,
      },

      // Same villa, same index: the linked URL is `…one-bedroom-pool-villas-3`
      // and `One-Bedroom-Pool-Villa-3.webp` is that villa's third photograph,
      // checked rather than assumed — pool at dusk, loungers, open bedroom.
      // Pinned to `-3` rather than the numbered family, because that is the
      // only index anything links to and inventing the others would put a
      // photograph behind a number that never existed.
      {
        source:
          "/wp-content/uploads/2016/02/:file(Villa-in-seminyak-nyuh-bali-villas-one-bedroom-pool-villas-3(?:-\\d+x\\d+)?\\.jpe?g)",
        destination: "/uploads/2023/03/One-Bedroom-Pool-Villa-3.webp",
        permanent: true,
      },

      // The Ubud Honeymoon Suite, whose gallery still opens on this
      // photograph — canopy bed, swan towels, balcony over the garden. The
      // numbered family goes to one image because they are one room.
      {
        source:
          "/wp-content/uploads/2018/02/:file(ubud-nyuh-bali-accomodation-honeymoon-suite-\\d+(?:-\\d+x\\d+)?\\.jpe?g)",
        destination: "/uploads/2023/03/Honeymoon-Suite-3.webp",
        permanent: true,
      },

      // **The one that would have gone to the wrong property.** `contact.jpg`
      // reads as the Seminyak contact photograph and it is not: the archived
      // file is Ubud's entrance sign, carrying Ubud's street address and
      // `info@ubudnyuhbali.com`. This is exactly the trap the media-library
      // note warns about, and the only reason it was caught is that the file
      // was fetched and looked at. It goes to Ubud's contact photograph.
      {
        source: "/wp-content/uploads/2018/07/:file(contact(?:-\\d+x\\d+)?\\.jpe?g)",
        destination: "/uploads/2023/03/contact-us-ubud.webp",
        permanent: true,
      },

      // The Explore Bali charter car at the Seminyak entrance. Five of this
      // numbered family carry links (`-3` through `-9`, one of them with 185
      // inbound links), they are one tour page's photographs, and this is the
      // photograph that page still opens on.
      {
        source: "/wp-content/uploads/2019/03/:file(nyuh-bali-tour-\\d+(?:-\\d+x\\d+)?\\.jpe?g)",
        destination: "/uploads/2023/03/Tour-Seminyak.webp",
        permanent: true,
      },

      // Everything else the media library ever served, at the same path under
      // the prefix this build uses. LAST, because the rules above are more
      // specific and Next takes the first match.
      {
        source: "/wp-content/uploads/:path*",
        destination: "/uploads/:path*",
        permanent: true,
      },

      // Nothing here for the http:// and www. rows of the same crawl. Those
      // are host-level, not path-level: TLS termination handles the scheme,
      // and www -> apex is a Cloudflare redirect rule, because src/proxy.ts
      // deliberately exempts anything carrying `cf-ray` from its
      // canonical-host 308 (see the note in that file).

      // Nothing here for /welcomeaboard, /ubud-directory, /seminyak-directory
      // or /suite-directory — those four are *built*, at their own URLs, so
      // the QR codes printed on the cards in every room keep resolving rather
      // than landing anywhere approximate. They are the four routes the
      // sitemap deliberately leaves out; see UNLISTED in src/app/sitemap.ts.
    ];
  },
};

export default nextConfig;
