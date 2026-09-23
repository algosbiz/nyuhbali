# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Nyuh Bali Villas clone** — a pixel-accurate Next.js recreation of [nyuhbalivillas.com](https://nyuhbalivillas.com), a real Bali villa rental business with two properties (Seminyak and Ubud). This is client/authorized work, not an unaffiliated scrape — confirmed with the user before building, which is why real content (guest testimonial names, contact details) is used verbatim and the live site's own photographs are used rather than placeholders. Those photographs were hotlinked at first and are now **downloaded into `public/uploads/`**, because this build is replacing WordPress rather than sitting alongside it.

Scope is **24 hand-written routes**, built in three passes, with two data-driven passes after them:

*Original 7:* Home, About Us (×2 properties), Contact (×2 properties), Terms & Conditions, Privacy Policy.

*Pass 2 (10):* `/ubud/villa`, `/ubud/packages`, `/ubud/villa/honeymoon/packages`, `/ubud/retreat`, `/ubud/wedding`, `/seminyak/villa`, `/seminyak/villa/honeymoon/packages`, `/seminyak/dining`, `/seminyak/spa`, `/seminyak/tour`.

*Pass 3 (7) — completes the navigation, submenus included:* `/ubud/spa`, `/ubud/dining`, `/ubud/balinese-culture`, `/complimentary-services`, `/ubud/retreat/luxury`, `/ubud/retreat/host-your-own`, `/ubud/wellness`.

*Pass 4 (50) — the tier below the nav.* **74 routes prerender after this pass.** These are data-driven rather than hand-written, because each family shares one WordPress template and differs only in content:

| Family | Routes | Data | Rendered by |
|---|---|---|---|
| Room/villa detail | 10 | `data/rooms.ts` | `ubud/villa/[...room]`, `seminyak/villa/[...room]` |
| Retreat programmes | 6 | `data/experiences.ts` | `ubud/retreat/[...programme]` |
| Wellness classes | 7 (+`/ubud/fitness`) | `data/experiences.ts` | `ubud/wellness/[...class]` |
| Culture activities | 4 | `data/experiences.ts` | `ubud/balinese-culture/[...activity]` |
| Blog | 2 indexes + 17 posts | `data/posts.ts` | `**/discover/[slug]` + 3 standalone routes |
| Standalone forms | 3 | inline | `InquiryForm` |

*Pass 5 (4) — the tier below search.* `/seminyak-directory`, `/ubud-directory`, `/suite-directory` and `/welcomeaboard`. **77 routes prerender in total** (78 until `/life-coach-retreat-benefits` became a redirect). These are the only routes nothing on the site links to and the only ones the sitemap leaves out (`UNLISTED` in `src/app/sitemap.ts`, matching the live site, which lists none of them either). Three are the in-room directories a guest reaches by scanning the QR code on the card beside the bed — a hub of menus, all of them PDFs served from `/wp-content/uploads` like every photograph here; the fourth is staff onboarding. They were built for one reason: those QR codes are already printed on cards in every room, and this build replacing the live site must not turn them into 404s. Content in `src/data/pages/directories.ts`, rendered by `PackageList` (image + paragraph + a row of file buttons is exactly its shape, so no new component), with the band's heading as the `<h1>` since these pages have no hero. **These are the one place body copy carries the source's own emphasis**, which is what `PackageRun` on `PackageItem.description`/`PackageList`'s `intro` is for: the bold here is instruction, not decoration — the staff quiz's pass mark, "initials will not be accepted", the names of the complimentary classes — and it is set in the `strong` treatment `SanityPortableText` already uses, so nothing new was invented to show it. Fidelity is checked by diffing the live page's visible text against the rendered route, in both directions: **every word and all 16 emphasised phrases carry over**, the only differences being the footer our own `PropertyFooter` draws. **Two of the Healthy Look links 404 — on the live site too**, at the partner's own domain; they are copied unchanged rather than guessed at, and are worth fixing in WordPress.

**Catch-all routes, all ten now `dynamicParams = true`.** Room and experience slugs vary in depth (`suite` vs `honeymoon/pool`, `couples` vs `luxury/anti-aging`), so each family uses a catch-all fed by `generateStaticParams`. Static routes win over catch-alls in Next.js, which is what lets `/ubud/villa/honeymoon/packages`, `/ubud/retreat/luxury` and `/ubud/wellness` keep their own pages while their siblings resolve through the catch-all.

**They were `false` until the site went live, and the reason they are `true` now is an access problem, not a technical one.** `generateStaticParams` runs at build time, so a room, post, experience or `page` the client publishes in the Studio afterwards had no route and 404d until somebody redeployed — and only the developer has Vercel. Content editing was already instant; *adding* anything needed a second person. `true` means a slug that was not in the build list is rendered on its first request instead, so a new document is live with the publish. **Nothing about what can render changed**: all ten routes already called `notFound()` when no document matched, which is what makes the flip safe, and it was checked rather than assumed — against a production server, five known slugs answer 200 and ten invented ones answer 404, not 500. The design is provably untouched: two builds either side of the change, and the **raw `<main>` markup of all 79 prerendered pages is byte-identical**, along with visible text, heading order, image list and section count.

Two consequences worth knowing. The root `[...slug]` catch-all is included, which is what lets an editor publish a page at a path nothing here claims — it was built for exactly that and the flag was all that stopped it — but it also means **every stray URL on the site is now computed rather than served from a prebuilt 404** (`/wp-admin`, `/.env`, a typo). Cloudflare caches that 404 like any other response and a publish purges the zone, so a path that 404s today and is created tomorrow goes live with the publish. And the build's prerendered count stays exactly what it was — `true` adds a fallback, it does not move anything out of the build.

**Blog posts are the one content type WordPress serves properly** — posts are not Oxygen, so `content.rendered` is real HTML. It is converted at generation time into a small block list (heading / paragraph / list / image) and rendered by `PostBody`, never with `dangerouslySetInnerHTML`. Posts live at several unrelated prefixes on the live site (`/ubud/discover/`, `/ubud/spa/`, `/ubud/retreat/detox`, `/ubud/wellness/yoga/retreat`, a bare `/life-coach-retreat-benefits`, and a misspelt `/ubud/discoverl/`), so each prefix has its own thin route wrapping the shared `PostPage`.

**The blog's categories are this project's, not WordPress's.** The live taxonomy is two buckets — `ubud-news` (16 posts) and `seminyak-news` (2), and no tags at all — which restates `Post.property` and would read as nothing on a card. `POST_CATEGORIES` in `data/posts.ts` defines seven topical ones instead, and **every label reuses a string the site already navigates by** ("Stay", "Wellness", "Retreat", "SPA", "Romance", "Explore Bali", "About Us") — the same rule the redesign followed for hero eyebrows and footer headings, so the blog gains a taxonomy without a word of new brand copy. It renders as the first item of the existing meta row (`CATEGORY · date · N min read`) in both `PostGrid` and `PostBody`, not as a badge over the photograph, so the blog keeps exactly one label treatment; a post with no category simply starts on its date. In Sanity these are `category` documents referenced by each post, written by the migration's `categories` step, and `toPost` passes whatever the CMS returns straight through — so a category renamed in the Studio renames on the card.

**One live-site collision is reproduced, not fixed:** a post and a page both publish at `/ubud/retreat/host-your-own/`. WordPress serves the page, so the post is unreachable there — it is omitted here for the same reason (17 posts render, not 18).

These reuse the existing design system — no new visual language — and each page file opens with a **Route Information** comment mapping its WordPress slug to its Next.js path and listing what to update if the slug changes.

**Both menus are now fully navigable.** Seminyak's 7 items are flat; Ubud's 8 top-level items carry three dropdowns, matching the live site exactly: Offers ▾ (Romance, Retreat, Wedding), SPA ▾ (Balinese Spa, Medical Aesthetic), Retreat ▾ (Luxury Retreat, Host Your Retreat, Wellness Facilities). Only Medical Aesthetic leaves the site — it's a separate business on its own domain, which is what `PropertyNavChild.external` marks.

**Every internal link resolves, with one known hop.** The latest audit reports **2691 internal hrefs across the 77 prerendered routes, 0 dead** — and **1 that goes through a redirect**, `/ubud/discover` → `/life-coach-retreat-benefits` → `/ubud/wellness/life-coach`, which is the open content decision described under the redirects above. Plus 1 orphan — `/ubud-spa-booking-form`, which nothing links to on the live site either (Ubud's spa books through Fresha). The `inScope` convention below is still the mechanism for anything that later points outside the build.

The only WordPress pages deliberately left out are non-content ones: the in-room directory pages (`/ubud-directory`, `/seminyak-directory`, `/suite-directory`), `/welcomeaboard`, and superseded duplicates (`/ubud-culture`, `/lumbini-restaurant`, `/seminyak-honeymoon`, `/ubud-spa-and-medical-aesthetic`, `/ubud-backup/*`).

**Source content is Oxygen Builder, not Elementor** — the WP REST API returns an empty `content.rendered` for these pages. Copy has to be scraped from the rendered HTML, and the section/room photographs are CSS **background images** in the LiteSpeed-combined stylesheet (`#slide-<id>-<pageid>{background-image:url(...)}`), not `<img>` tags. Both were extracted that way for the 10 pages above.

Every visual value (colors, font sizes, spacing, breakpoints) was originally measured from the live site's computed styles rather than eyeballed. **That is no longer the whole story** — most pages have since been deliberately redesigned away from the original. Read "Design state" below before matching anything to the live site; the design system documented there is the current source of truth, not nyuhbalivillas.com.

## Commands

- `npm run dev` — start the dev server on **port 3001**, not 3000. The sibling `nextjs-art-gallery-clone` repo (same parent folder) often has its own server occupying 3000; the script is pinned to 3001 to avoid that collision outright rather than relying on Next's auto-port-increment.
- `npm run build` — production build (Turbopack). **81 routes prerender** — the 77 content routes, Next's own `/_not-found` and `/_global-error`, and `/robots.txt` and `/sitemap.xml` (both are ordinary static routes, generated from `src/app/robots.ts` and `src/app/sitemap.ts`) — and the build's `86/86` counter is those plus the five dynamic API routes (draft mode on and off, Sanity revalidation, the post-deploy purge Vercel's webhook calls, and `/api/contact` — the one endpoint every form posts to). The "7 routes" this line used to claim was from the first pass; "79 pages" was the same count before the Turnstile route existed, "76 / 80" was the count before robots and the sitemap, "78 / 82" was the count before the four in-room pages, the same "78 / 82" stood until `/life-coach-retreat-benefits` stopped being a route and became a redirect, and `81 / 85` was the count before `/api/purge/vercel` replaced the GitHub Actions purge.
- `npm run start` — serve the production build
- `npm run lint` — ESLint (flat config, `eslint-config-next`)

- `npm run sanity:typegen` — extracts the schema and regenerates
  `src/sanity/types.generated.ts`, **validating every GROQ query against the
  schema as it goes**. Run it after any schema or projection change. One trap:
  a **function call** inside a query's template literal is the one thing it
  cannot evaluate — it reports "Unsupported expression type", skips that whole
  query, and still exits successfully, so the check you are running it for is
  silently gone. Build a projection as a `const` and interpolate the
  identifier; that is why `descriptionProjection`, `introProjection` and
  `bodyProjection` in `queries.ts` are three near-identical constants rather
  than one helper.
- `npm run sanity:rich-text` (`:dry` first) — the one-off migration for the
  two fields that became rich text. See README-SANITY.md.

There is no test suite in this project.

**A `github:` dependency will fail the Vercel build even when it builds locally.** Commit `ca19177` added `"@seoboost/instagram-feed": "github:algosbiz/ig-library#v0.2.0"` to `package.json`; the lockfile resolved it as **`git+ssh://git@github.com/algosbiz/ig-library.git`**, and that repo answers 404 unauthenticated. A developer machine with an SSH key clones it fine, so `npm ci` and `npm run build` both pass locally — Vercel's builder has no key, so `npm ci` dies at the install step and the deployment fails before Next runs at all, which is why the failure carries no page-level error. Nothing in `src/` ever imported the package, so it was removed. If it is ever genuinely needed, it has to be reachable from CI: publish it to npm, make the repo public, or give Vercel a deploy key. **Check `grep -cE "git\+ssh|git\+https|github:" package-lock.json` returns 0 before pushing** — a private git dependency is invisible in local testing by construction.

**Windows/Turbopack note:** if routes start 404ing after killing and restarting the dev server (a symptom of a corrupted `.next` cache), don't delete `.next` while a server is still running against it — that corrupts its persistent cache further. Stop the process first (`taskkill`), then delete `.next`, then restart.

The same corruption also shows up as **every route returning 500** with `SyntaxError: Unexpected non-whitespace character after JSON` thrown from inside Next (including `Failed to generate static paths`). It is not your JSON: validate the project's own `.json` files first to rule that out, then note that deleting `.next` alone did **not** clear it — `tsconfig.tsbuildinfo` had to go too. Full recovery: free the port (`Get-NetTCPConnection -LocalPort 3001` → `Stop-Process`), `rm -rf .next tsconfig.tsbuildinfo`, restart.

## Architecture

**Stack:** Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict), Tailwind CSS v4. Fonts are Open Sans (body) and Source Sans 3 (headings, at a light 300 weight for large text) via `next/font/google`, matching the live site's self-hosted webfonts.

**Design tokens** live in `src/app/globals.css` via a Tailwind v4 `@theme` block (CSS-first config, not `tailwind.config.js`).

*Brand colours, fixed:* `primary` (gold `#c7a259`), `text` (`#404040`), `ink` (`#261e13`), `error` (`#ff0000`).

*Derived, not invented:* `sand` (`#faf8f2` = gold at 8% over white) is the site's default surface and is set on `<body>`, so no page can open on stark white; `sand-deep` (`#f6f0e4` = gold at 16%) is the alternating band. `primary-deep` (`#81693a` = brand gold at 65%) is the accessible gold for **text on light surfaces** — brand gold measures 2.39:1 on white and fails WCAG AA. **Measure gold text against `sand-deep`, not white**: that's the darkest light surface here, and it's what the earlier `#8a6f31` value got wrong (4.78:1 on white, but 4.21:1 on the warm bands the site actually uses). At 65% it clears AA on all three — 4.61 / 4.93 / 5.23 on sand-deep / sand / white. The rule: full-strength `primary` for gold-on-dark, rules/hairlines, icons and button fills; `primary-deep` for gold text on sand or white.

*Type scale:* `text-eyebrow`, `text-section`, `text-display`, `text-quote`, the last three using `clamp()`. Font tokens (`font-body`, `font-heading`) use a separate `@theme inline` block because they reference `next/font`'s runtime CSS variables rather than literal values.

*Animation tokens:* `animate-marquee` (Ubud awards), `animate-kenburns` (hero push-in), `animate-rise-in` (mobile menu stagger), `animate-fade-in` (**currently unused** — it was the cross-fade in the hand-built Instagram viewer, which the app's own embed replaced; the token is left defined rather than deleted because it is a generic fade, but nothing consumes it today).

**Every asset is served by this site — nothing is hotlinked any more.** All **352 files** (315 photographs and **37 menu / directory PDFs**) live in `public/uploads/`, under WordPress's own `/YYYY/MM/name.ext` layout. That layout is the whole trick: each of the 24 files that declared `const UPLOADS = "https://nyuhbalivillas.com/wp-content/uploads"` now declares `"/uploads"`, and every `${UPLOADS}/2023/03/x.webp` in the codebase resolved locally with no other edit. **`nyuhbalivillas.com` is no longer in `next.config.ts`'s `images.remotePatterns`**, deliberately: with the host allow-listed a stray absolute URL would keep working until WordPress is switched off and then fail silently on whichever page nobody opened that week; with it gone it fails the first time it renders.

**This was forced by the migration, not chosen for tidiness.** The plan is for this build to *replace* WordPress, and every photograph on all 78 routes plus every in-room menu was being fetched from the machine about to be turned off. Verified on the production build: **348 distinct `/uploads` references across 80 prerendered files, 0 missing from disk, 0 pages still naming `nyuhbalivillas.com/wp-content`**, every file's magic bytes matching its extension, and `next/image` optimizing them (a 160 KB WebP served at 70 KB). 68 MB total, which is small enough to commit.

**The photographs then moved into Sanity, and that was a capability decision rather than a saving.** `npm run sanity:images` (`:dry` first) uploaded **301 photographs into 580 image fields across 72 documents**, so every image field now carries a real asset alongside the `/uploads/…` path it came from. The resolver prefers the asset, which means **swapping a photograph is dragging a file onto a field in the Studio — no code change, no deploy**. It saves nothing: `public/uploads/` stays exactly as it is, because it is still what renders when Sanity is unconfigured or a document is unpublished, and it is still what the migration seeds from.

**It is deliberately not `migrate.ts --upload-images --replace`**, even though that flag exists and does the uploading. That path reaches documents through `createOrReplace` built from `src/data/`, so it would also overwrite every edit an author had made in the Studio since the import. `scripts/sanity/upload-images.mjs` never builds a document: it reads what is published right now, adds an `asset` to the image objects inside it, and writes that same document back. Idempotent (keyed on `source.id`, so a rerun reuses and an interrupted run resumes), it never replaces `externalUrl`, it leaves alone any field that already holds an editor's own upload, and a document whose images did not change is not written at all. An image it cannot read leaves that one field on its path and is named in the summary — a failure cannot blank a field. Expect the publish webhook to fire once per written document, so the Cloudflare purge runs ~72 times; harmless, just noisy.

**The one photograph that was re-encoded, and why only one.** Measured across all 315: they average 148 KB and only 30 exceed 1600px, so capping the lot would have saved **3.9 MB of 69 MB** — and the measurement turned up the reason not to, because several of those 30 are not photographs at all but documents a guest opens (`Minibar-list-seminyak.jpg`, the award certificates). Downscaling those costs legibility. Source size is also not delivery size: `next/image` already resizes per breakpoint, so a 2.5 MB source reaches a phone as a few KB. The single exception was a 2929×2929 PNG at 2.5 MB, a blog post's featured image that nothing renders above 1600px — **2.5 MB → 820 KB**. It stays a PNG at its original filename and its original 256-colour palette: converting to WebP would have saved another 0.5 MB and broken every reference to it, including the ones inside the CMS. Converting it to RGB first made it *bigger* (3.2 MB), which is the trap — the file was palette-mode, and palette-mode is why it compressed well in the first place.

**The CMS holds the old URLs and is fixed on read, not migrated.** The Sanity migration seeded every `page`, `post`, `room` and `experience` document with the absolute URLs that were current when it ran, and a published document is what actually renders — so the code fix alone would have left the fallback correct and every CMS-rendered page without photographs. `localizeUploads` in `src/sanity/lib/uploads.ts` rewrites them inside `sanityFetch`, on both its Live and published paths, so **one rewrite covers every field** — an image's `externalUrl`, a post body's image block, a CTA's `href`, a portable-text link mark, a menu button in a section an editor adds next month. Patching the handful of resolvers known today would work until the next shape appears, and that failure is silent. It matches three hosts (`nyuhbalivillas.com`, `www.`, and `preview.`, which the live markup still emits for a few assets), returns the payload unchanged when there is nothing to rewrite, and is a no-op once the documents are re-seeded — so it is safe before, during and after any such migration. It is pure and runs under `node --experimental-strip-types`; the global-regex `lastIndex` trap it guards against is why repeated calls are part of that check.

**Route structure** (every path matches the WordPress slug exactly, so the
migration is a straight swap):
```
/                                       Home (property picker)
/seminyak                               About Us – Seminyak
/seminyak/villa                         Villas
/seminyak/villa/honeymoon/packages      Offers (romantic packages)
/seminyak/dining                        Dining
/seminyak/spa                           SPA
/seminyak/tour                          Explore Bali (tours + booking form)
/seminyak/contact                       Contact – Seminyak
/ubud                                   About Us – Ubud
/ubud/villa                             Stay (suites + villas)
/ubud/packages                          Offers (romance / retreat / wedding)
/ubud/villa/honeymoon/packages          Romance            [Offers ▾]
/ubud/retreat                           Retreat            [Offers ▾]
/ubud/wedding                           Wedding (+ enquiry form)  [Offers ▾]
/ubud/retreat/luxury                    Luxury Retreat     [Retreat ▾]
/ubud/retreat/host-your-own             Host Your Retreat  [Retreat ▾]
/ubud/wellness                          Wellness Facilities [Retreat ▾]
/ubud/spa                               SPA (Mahamaya)     [also SPA ▾ "Balinese Spa"]
/ubud/dining                            Dining (Lumbini Restaurant)
/ubud/balinese-culture                  Culture / Experience
/ubud/contact                           Contact – Ubud
/complimentary-services                 Services (top-level slug, Ubud chrome)
/terms-conditions                       Terms & Conditions (global)
/privacy-policy                         Privacy Policy (global)
```
`/complimentary-services` sits at the root rather than under `/ubud`, exactly as
WordPress has it, even though its content and chrome are Ubud's — the same
top-level-slug situation as the two legal pages.
Terms & Conditions and Privacy Policy hard-code `PROPERTY_SITES.ubud` for their header/footer chrome rather than taking a `site` prop — that's not an arbitrary choice, it's what the live site actually does (both legal pages render with Ubud's nav/footer regardless of referring property).

**Data model** (`src/data/`): `properties.ts` exports `PROPERTY_SITES` (nav items, contact info, logo, booking URL, blog post titles, per property) and the smaller `PROPERTIES` list (just label+href, used by Home's picker). `testimonials.ts` and `legal.ts` hold the two properties' guest reviews and the two legal pages' section content respectively — kept separate from `properties.ts` because they're long and only needed by specific pages, not by every page's nav/footer.

**The six retreat programmes are structured content, not two arrays of strings.** The original scrape flattened them: every heading was dropped, every paragraph became an anonymous entry in `paragraphs`, and the live "Available Programs" accordion — three to five length-of-stay tiers, which is the actual decision a visitor is on the page to make — was concatenated into one 30-item `inclusions` list. The client flagged the result as content having been deleted. `Experience` now carries `recommendedFor`, `note`, `sections` (titled prose, optionally with a photograph), `highlights` ("Why Choose Ubud Nyuh Bali Resort?", using the live site's own transparent gold icon PNGs), `blocks` (stand-alone lists), `programs` (the tiers), `faqHeading`, `closingCta` and `team` (photo + name + bio), and `ExperienceDetailBody` renders them in the live pages' own order. `RETREAT_STANDARD` holds the "Retreat Exclusive" and "Complimentary" blocks once — they are byte-identical across every tier of every page — and each tier spreads them in. Verify a re-scrape with: every line of the live page's text appears somewhere inside our `<main>` (all six were at zero missing when this was written).

**`PERSONALISED_RETREATS` / `otherPersonalisedRetreats(slug)`** back the "Other Personalized Luxury Retreat" grid that closes the four personalised pages. The live site uses a different thumbnail for the same retreat depending on which page you're on; one image per retreat is used here instead, so the grid can't put a photograph on a page twice.

**`seo.ts` holds every route's `<title>` and `<meta name="description">`, copied verbatim from the live site** and keyed by published path. `seo(path)` returns a Next `Metadata`; every `page.tsx` uses it, including the dynamic ones (`generateMetadata` rebuilds the path from its params and looks it up). Before this, titles were written for this project rather than taken from the business — **61 of the 74 disagreed with what was actually published and indexed** — and no page except the root layout carried a description at all. Fifteen live routes publish no description; those entries carry a title only and inherit the layout's, which is better than the nothing the live site serves there. To refresh after a WordPress edit, re-fetch each live URL's head and regenerate the map; it is one file precisely so that stays a one-step diff. One live fault is copied rather than fixed: `/ubud/discover/5-star-resort` publishes the *yoga teacher training* title, identical to `/ubud/discover/yoga-teacher-training` — that is a real duplicate-title problem to fix in WordPress, not here.

**`seo(path)` now returns the canonical link and the Open Graph block as well**, so a route that states its title states which URL it is in the same breath. `og:locale` `en_US`, `og:site_name` "Nyuh Bali" and `og:type` (`website` on the landing page, `article` everywhere else) mirror what Yoast publishes on the live site value for value, and `og:title`/`og:description` are the same two strings again — the live site sends no separate social headline, so neither does this. **No `og:image`, deliberately**: the live site publishes none on any page, and choosing one would mean picking a photograph to stand for the whole business, which is a brand decision and not a default to invent (an editor can set one per page in the Studio, and `resolvePageMetadata` uses it). `twitter:card` is `summary_large_image`, stated once in the root layout because it is one value for the whole site — Next merges metadata a field at a time, so every route that never mentions `twitter` inherits it, which is why `seo()` sets only `openGraph`.

**Every page except the landing page carries one `BreadcrumbList` JSON-LD block, and it is the only structured data on the site.** There is no visible breadcrumb and none was added. Trails are built in `src/data/breadcrumbs.ts` by walking the URL upwards and keeping only **hub** pages (`HUB_NAMES`, named with the site's own nav labels), so a room is always Home › Ubud › Stay › room, never under another room whose slug it happens to nest in; `PARENT` overrides the URL where it points at the wrong parent (root-level property pages, the two offers pages whose URLs run through the villas listing, `/ubud/fitness`, the misspelt `/ubud/discoverl`). `components/seo/BreadcrumbJsonLd` renders it, from exactly one place per page: `ManagedPage` (all hand-written routes), `PostPage` (all posts), and the room, experience, legal and `[...slug]` routes themselves. **A new hub page needs an entry in `HUB_NAMES`**, or it will be skipped as an ancestor and its own breadcrumb will fall back to nothing.

**Canonicals and `og:url` are written as paths, not absolute URLs**, and resolved against the root layout's `metadataBase`. That is what `SITE_ORIGIN` in `seo.ts` is for: it reads `SITE_URL` (the same variable the Cloudflare purge already uses) and **falls back to the production domain, not to the deployment's own host**. A preview deployment with nothing set therefore points its canonicals at the live site rather than nominating itself, which is the safe direction to be wrong in. Without `metadataBase` Next resolves them against `localhost:3000`, warns once, and ships it.

One consequence worth knowing: `metadataBase` + a relative canonical of `/` gives Next a URL whose path is a bare slash, and **it normalizes the trailing slash away** — even when the canonical is written absolutely, which was tried. So the landing page's canonical reads `https://nyuhbalivillas.com` while the sitemap lists `https://nyuhbalivillas.com/`. Same URL, and not worth chasing.

**`/sitemap.xml` is exactly the routes this build serves** (`src/app/sitemap.ts`), which is the one rule that cannot drift — a page cannot be published without being listed. It is the 74 `ROUTE_SEO` keys unioned with Sanity's `page` paths and any `post` path under a prefix that has a route file, so a page or post created in the Studio appears with no code change; both queries return `[]` until Sanity is configured. **74, against the live site's 71**: six of ours are missing from the live sitemap (the two legal pages, `/complimentary-services`, and the three standalone booking forms) and three of theirs are pages this project deliberately does not build (`/seminyak-honeymoon`, `/ubud-spa-and-medical-aesthetic`, a `/ubud-backup/…` draft). `/complimentary-services` sits in Ubud's own navigation, so its absence there reads as an oversight rather than a decision, and none of the six is copied. **No `<priority>` and no `<changefreq>`** — the live sitemap emits neither and Google ignores both.

**`<lastmod>` is copied from the live site, not generated** (`src/data/sitemap.ts`). A build stamp would claim all 74 pages changed on every deploy, which is how a sitemap's dates stop being believed; Sanity's `_updatedAt` fails the same way from the other end, because the migration wrote every document at once. So a page edited in the Studio keeps its old date until the map is refreshed — a slower re-crawl of one page, against the alternative of the whole file losing credibility. Publishing still purges both caches immediately, so the new copy is served either way. The 68 in the live sitemap are Yoast's own values; the other six come from each page's `article:modified_time`, which is the same field.

**`next.config.ts` carries 150 permanent redirects in five sets, and the first two exist for the same reason: a URL WordPress publishes today that nothing here would answer.** A 308 keeps the ranking a page has accumulated; a 404 throws it away.

Three are Yoast's sitemap URLs (`/sitemap_index.xml` and its two children) → `/sitemap.xml`. The next five are the superseded duplicates this project deliberately does not rebuild, each sent to the route its content actually lives at now: `/seminyak-honeymoon` → `/seminyak/villa/honeymoon`, `/ubud-spa-and-medical-aesthetic` → `/ubud/spa`, `/ubud-culture` → `/ubud/balinese-culture`, `/lumbini-restaurant` → `/ubud/dining`, `/ubud-backup/culture/chakra-healing-retreat` → `/ubud/wellness/chakra-healing`. The first two need no judgement at all — the live page's `<title>` is byte-identical to the destination's entry in `seo.ts`, so WordPress is serving one page at two URLs and the redirect just picks the survivor.

**The third set is a single redirect, the opposite case, and the only one that mirrors a change the live site made *after* this build was written.** `/life-coach-retreat-benefits` → `/ubud/wellness/life-coach`, because WordPress now 301s it. Two things about how it was found matter more than the redirect itself:

- **No date could have revealed it.** The 301 is served at the server, not in PHP — the response carries no `x-powered-by` and none of WordPress's `link:` headers — so the post's `modified` never moved and neither did Yoast's `<lastmod>`. Yoast still lists the post in `/post-sitemap.xml`. **Requesting every published URL is the only check that finds this class of change**; add it to the refresh below.
- **This build had already met the same collision from the other side and answered it worse.** `src/app/life-coach-retreat-benefits/page.tsx` re-rendered the wellness class at the legacy URL, so two routes served byte-identical content and each self-canonicalised. That alias is deleted; the redirect replaces it, and the URL now has one canonical instead of two. The post's article text stays in `src/data/posts.ts` and in Sanity, with a note there — **it has no route, and `/ubud/discover` still links the card through the redirect.** Retiring the card is a content decision and takes both the file and the Studio, because `getPosts` reads Sanity when it is configured.

**How those first nine were found, and the only way to refresh them: `/wp-json/wp/v2/pages` + `/posts` (83 unique published paths) diffed against `ROUTE_SEO`, then every one of those URLs requested to catch redirects the API cannot see.** A page missing from the build is invisible from inside the build — no link audit can see it, because nothing here links to it. That diff is also the check that nothing was invented in the other direction: **all 77 of our routes are published live, and exactly 6 live URLs have no route here — which is precisely the first two sets above.** Re-run it after any WordPress restructuring.

**The fourth set is 86 redirects and a different population entirely: URLs WordPress itself retired years ago and still answers a 301 for.** The REST API cannot see one — a retired permalink is not a published page, it is a row in WordPress's own redirect table — so they were found the only way they can be, by crawling every URL the live site responds to (`nyuhbalivillas-redirect-list.csv`, the sheet this list was built from). That table is data this build does not inherit: the pre-2023 permalink scheme (`/ubud-villa/nyuh-suite`, `/ubud-wellness/ubud-breathwork`, the blog posts' bare slugs), plus the hyphen-less and double-published variants that accumulated around it (`/poolvillainseminyak`, `/ubudwellness/…`, `/how-to-host-retreat`). Without them every one 404s the day the DNS moves.

**Each destination is the crawl's *Final* URL, not its Redirect Target**, so a chain the live site walks in two hops (`/balinese-culture-activity` → `/ubud/culture` → `/ubud/balinese-culture`) is walked here in one. Six entries needed a decision rather than a copy, because the live site's own final URL for them is a 404, and each is commented individually at its entry: `/retreat-in-ubud` and `/ubud-experience` (parents whose children still redirect), `/ubud-blog/page/2` (WordPress pagination this build has no equivalent for), `/spa-in-ubud/spa-menu` (the menu is a PDF, so it goes to the page carrying the link), and the `/ubudwellness/…` and `/personalised-luxury-retreat-in-ubud/ubud-authentic-balinese-healing` variants (mapped the way their hyphenated siblings are). `/ubudvilla/honeymoon-suite-pool-villa` is the seventh judgement and the oddest: the live site resolves it to the room's *photograph* in `/wp-content/uploads`, which is a WordPress attachment page rather than anyone's decision, so it goes to the room.

**Verified by following all 88 crawled URLs against the production build, with their trailing slashes as indexed: 88 of 88 end at a 200**, 83 in two hops (slash normalisation, then the redirect) and 5 in one. The http:// and www. rows of the same crawl are deliberately not here — those are host-level, handled by TLS termination and a Cloudflare redirect rule, because `src/proxy.ts` exempts anything carrying `cf-ray` from its canonical-host 308.

**The four in-room / staff URLs are built rather than redirected** — see *Pass 5* below. A redirect would have sent a guest who scanned the QR code by their bed to a page that is not the menu they were reaching for; there was no equivalent to point at, so the equivalent was made.

**The fifth set is 55 redirects and exists because the fourth set was built from half a population.** That crawl followed the URLs the live site still answered a **301** for — but a permalink WordPress had already forgotten answered a **404** there too, so it never entered the list, and the day this build replaced WordPress those URLs went on 404ing with whatever ranking and inbound links they had kept. The client found them the way anyone would: a link report full of `308 → 404` rows.

**Two sources find what a redirect crawl cannot, and both are needed.** Every URL the Internet Archive holds for the domain (`/cdx/search/cdx?url=nyuhbalivillas.com&matchType=domain`, 378 apex paths) requested against the live site; and Ahrefs' broken-backlink report for the domain, which is what attests the two `/ubud/culture/…` paths the archive never captured — and which is the reason to bother, because the strongest links the domain still has point at exactly these (esoftskills.com at DR 49 to `/ubud/culture/chakra-healing-retreat`, knycxjourneying.com at DR 40 to `/ubud/culture/melukat-purification-ceremony`). The population is whole families rather than strays: `/ubud/culture/*` and `/ubud-culture/*` (the culture activities under both prefixes that predate `/ubud/balinese-culture/`, whose *parents* were redirected while their children were not), the Ubud rooms under `/ubudvilla/`, `/luxurious-accomodation-in-ubud/` and bare `/ubud/`, `/ubud-romance/*`, `/spa-in-ubud/*`, and the rest of the hyphen-less set (`/lumbinirestaurant`, `/seminyakdining`, `/villainseminyak`, `/seminyakdirectory`).

Three entries required a decision. `/ubud-wellness/ubud-pilates` is a class the resort **retired rather than renamed** — there is no pilates page here and there was none on WordPress either, so it goes to `/ubud/wellness`, the index listing the classes that did survive. `/ubud-romance/balinese-costume-photoshooting` is a package this build does not carry and goes to the page carrying the rest. And `/ubud/culture/rice-field-walk` is inferred rather than attested, completing a family whose other three members are.

**Verified against a production build: all 150 sources end at a 200, each tested with and without its trailing slash (300 requests, 0 failures), and every distinct destination answers 200 on the live site.** **168 archived paths still 404 and are left that way on purpose** — WordPress plumbing (`/wp-*`, `/*/feed`, `/category/*`, `/author/*`, attachment pages), hack probes, the pre-2023 `.php`/`.html` site, and about 40 real pages this business no longer has (`/career`, `/our-partners`, `/our-policy`, `/our-rate`, `/facilities`, `/special-offers`, the galleries, the seasonal offer posts). Each of those last ones needs a content decision rather than a mapping, and guessing one is how a redirect starts lying.

Note the same file does *not* set `trailingSlash` — the live site's URLs all end in one and ours do not, so an indexed `…/ubud/villa/` takes one 308 to `…/ubud/villa`, and a redirected `…/seminyak-honeymoon/` takes two (normalisation, then the redirect). Both land on a 200 and Google follows either. Turning `trailingSlash` on would instead put a redirect in front of all 2691 internal links.

**`/robots.txt`** (`src/app/robots.ts`) is the live file carried over rule by rule, minus the lines that can no longer match anything — every `/wp-*` path, `/xmlrpc.php`, `/feed/`, `/trackback/`, `/cgi-bin/`, `?replytocom`, `?attachment_id=`, and the `Allow: /wp-content/uploads/` that existed only to carve the uploads folder back out of two of them. A rule that cannot match is not faithfulness, it is a thing the next person has to disprove. The three `utm` rules and `/*?s=` are kept; `/studio` and `/api/` are added. **A preview deployment refuses everything instead** (`Disallow: /`, on `VERCEL_ENV === "preview"`, read at build time so each deployment bakes in its own answer) — a preview serves all 74 pages on its own hostname, which is the whole site duplicated at an address nobody meant to publish. Production and local development are identical to each other, so `localhost:3001/robots.txt` is what ships.

**`src/proxy.ts` is the site's only middleware, and it exists for the hole robots.txt cannot reach: the production `*.vercel.app` alias.** (It was `src/middleware.ts`; Next 16 deprecated that convention in favour of `proxy.ts` exporting `proxy`, and warns on every build until you rename it. Same mechanism, same matcher, nothing else changed.) A Vercel production deployment answers on its own alias as well as on the custom domain, and that alias serves all 74 pages. Vercel's automatic `X-Robots-Tag: noindex` is sent on *previews* only — a production alias reports `VERCEL_ENV` as `"production"` and is served the permissive robots.txt — and Cloudflare cannot help at all, because its cache rules belong to the zone for `nyuhbalivillas.com` and `*.vercel.app` never passes through the proxy. So a 308 to `SITE_ORIGIN` on any non-canonical host is the fix, and the canonical tags are the hint it makes unambiguous. **Three exemptions, each load-bearing.** Anything that is not a production deployment (localhost and previews are supposed to answer on their own hosts). `/api/` — README-CLOUDFLARE.md §7 recommends pointing the Sanity webhook at the alias *on purpose* when Cloudflare's bot protection starts eating it, and a webhook that quietly stops firing is a far worse failure than a duplicate URL. And **any request carrying `cf-ray`**: that header is on every request Cloudflare proxies and nothing else, so it separates real traffic from a crawler hitting the alias directly — without it, a Host Header Override on the proxy would make "host is not canonical" true for *every* live request and put the site in a redirect loop. `SITE_ORIGIN` moved to `src/data/origin.ts` for this, so middleware does not pull `ROUTE_SEO`'s 74 entries into the edge bundle; `seo.ts` re-exports it and every existing import is unchanged.

**Two things about that file cost a full debugging session each, and both are invisible from a passing build.**

- **The matcher's escape must be a double backslash.** It is a *string*, so `"\."` is not a valid JavaScript escape and collapses to `"."` — any character. Write `"\\."`, which is what reaches the regex as a literal dot. The exclusion `.*\.[^/]+$`, meant to skip paths with a file extension, then reads "anything, any character, then one or more non-slash characters at the end", which every path of two characters or more satisfies. **The proxy therefore matched nothing at all, on every page**, and shipped that way: no type error, no warning, and a build with a broken matcher is byte-identical in its output to one with a working matcher. The only check is behavioural — return a redirect for a sentinel path at the top of `proxy`, build, request it, and expect a 307 rather than a 404.
- **Do not probe it with a response header.** Headers set on `NextResponse.next()` do not survive a prerendered cache hit (`x-nextjs-cache: HIT`), so their absence proves nothing about whether the proxy ran. That is what made the first diagnosis point at the wrong thing twice.

**The alias is served `noindex` by default, and the 308 is the thing behind a flag — `ENFORCE_CANONICAL_HOST=1`. That is deliberately the opposite way round from how it was first written.** The reason for that default was that the build was finished while `nyuhbalivillas.com` still resolved to WordPress, so the production alias was the only address at which the finished site could be looked at, and a redirect-by-default sent every reviewer to the very site the build replaces. **That reason is gone: the domain serves this build now** — it answers from Vercel behind Cloudflare, with no `x-powered-by` and none of WordPress's `link:` headers — so the alias now duplicates a live site and the flag is worth setting. Two things make it less urgent than it sounds: the alias sits behind Vercel's deployment protection, so an anonymous request is 302'd to `vercel.com/sso-api` rather than served the site at all, and `noindex` is on it either way. **Check both before deciding it is handled** — protection can be turned off without anyone connecting it to this. **Both modes keep the alias out of the index**: `noindex` is a directive rather than the hint a canonical is, so a crawler must obey it. What the default gives up is the consolidation of ranking signals, and nothing links to a `*.vercel.app` address, so today that costs nothing; set the flag at cutover, when the alias starts duplicating a live site. **Forgetting either value is not an incident** — whichever is left behind, the alias stays unindexable — and the flag cannot reach a visitor on the real domain at all, because real traffic arrives at the canonical host where `isOffCanonicalHost` is already false. Verified both ways against a production build, simulating a deployment with `VERCEL_ENV=production`: unset, the alias answers 200 with the header while the canonical host answers 200 without it; set, the same request is a 308 to the canonical origin with the query string intact, while a `cf-ray` request stays 200 and `/api/` reaches its route rather than the redirect. And **never pair either mode with `Disallow: /`** — a blocked page is never fetched, so its `noindex` is never read, and an already-indexed URL then has no way to be removed.

**The Studio is kept out of search engines three ways, and each covers a different failure.** `Disallow: /studio` in robots.txt is a prefix match covering every tool route beneath it, and it is the whole of what matters in practice because **nothing on the site links to the Studio** — a crawler has no way to reach it. If a URL is ever pasted somewhere public, a crawler may fetch it anyway: the route's own `robots: { index: false, follow: false }` metadata handles that, and an `X-Robots-Tag: noindex, nofollow` header (`next.config.ts`) handles it for the Studio's asset responses too, not only its HTML. The two are not redundant — a disallowed page is never fetched, so its `noindex` is never read, which is exactly why the header exists. Cloudflare already bypasses its cache for `/studio*`, so no edge copy can be serving these without the header.

**Page content lives in `src/data/pages/`, not in the route file.** Fifteen routes used to declare their content inline — `HERO_IMAGES`, `DINING`, `TREATMENTS`, the long `intro` strings, the room arrays. Those constants now sit in `src/data/pages/<page>.ts`; the route imports them to render and the Sanity migration imports **the same constants** to seed that page's `page` document, so the CMS copy cannot drift from the page it was seeded from. The move was forced by a hard constraint, not taste: a plain Node script (which is what `sanity exec` runs) cannot import a module that pulls in React or `server-only`, so as long as the content sat next to the component it could not be read. Put new page content here, and keep the route file to layout.

**Every hand-written page is now edited in the Studio — all 31, Home included.**

**Seven of those were added by the CMS audit pass, and all seven were the same
failure: content on the live website that only a developer could change.** The
three standalone enquiry forms (`/spa-reservation-seminyak`,
`/ubud-spa-booking-form`, `/ubud-personalize-your-retreat`) had never been
wrapped in `ManagedPage` at all — heading, submit label, confirmation and every
field label were typed into the route. The four in-room / staff pages
(`/seminyak-directory`, `/ubud-directory`, `/suite-directory`,
`/welcomeaboard`) had been wrapped since they were built and **never seeded**,
so the Pages list showed no trace of the menus a guest reaches by scanning the
QR code beside the bed. The same pass found **`siteSettings` was read by
nothing** — `getSiteSettings()` existed and no caller ever called it, so an
editor could fill the document in and watch the site ignore all of it, which
is worse than having no document because it looks like it works. The footer's
column headings, its menu links, its logo, the copyright line, the legal
links, the Book Now tab label and the **direct-booking promo — offer, promo
code and button label, on a bar that renders on all 78 pages** — were all
literals in `.tsx`. They are fields now, each defaulting to exactly the string
it replaced. `DirectBookingDeals` became a server component that resolves them
and renders `DirectBookingDealsBar`, which is presentation only; splitting it
was necessary because the bar needs `useState` to be dismissible and a client
component cannot read Sanity. **The whole pass moved nothing on the site**:
verified by building twice, once against the dataset and once with
`NEXT_PUBLIC_SANITY_PROJECT_ID` emptied so every route falls back to its own
JSX, then diffing both the visible text of `<main>` and the sequence of
heading tags inside it — **78 of 78 pages identical on both measures**, one
`<h1>` each. See README-SANITY.md for the rest of what that pass changed.

**Diffing the *raw markup* of the two builds is the check that earns its
keep, and it found three faults the text diff could not.** `amenityGridSection`
wrapped `AmenityGrid` — which draws its own `Section` — in a second one, so the
Amenities band on both Stay pages carried twice the vertical padding, with the
outer tone showing as a strip around the inner one on `/ubud/villa`. Every
anchored CMS section landed under the sticky header, because `Section`'s doc
said to pair `id` with a `scroll-mt-*` class and only the hand-written tour
route ever did; `Section` applies it itself now. And two seeded pages linked
where the coded page rendered inert text, because `linkValue` defaults
`inScope` to `true` while **`PackageList` read a missing `inScope` as *out* of
scope and `ActionLink` reads it as *in* scope** — one field, two readings.
Resolved in favour of linking (`/ubud/fitness` is a route this project builds):
both CTAs state `inScope: true` in `src/data`, and `PackageList` now reads a
missing flag the way everything else does, which was safe to align only after
checking that **all 114 package CTAs in `src/data` state it explicitly**.
`npm run sanity:fix-pages` corrected the published documents. Text and heading tags matched on all 78 pages throughout;
only the markup diff showed any of this.

**One seeded string had quietly disagreed with the site, and only reading the
document exposed it.** `siteSettings.legalLinks` was seeded with "Privacy
Policy" — the *page's* title — while the footer's own literal read "Privacy &
Policy". Nothing rendered the field, so nothing noticed; the moment the footer
started reading it, the label changed on all 78 pages. Both the seed in
`migrate.ts` and the published document were corrected. The lesson is the
general one: a CMS field nothing reads is not inert, it is an unexploded
difference. Each route wraps its `<main>` in `ManagedPage` and has a seeded `page` document; publishing one replaces that page's whole `<main>` with its sections, each rendered through the component the route already used. Verified by diffing a build before and after seeding: identical text and identical photographs on every page, in three batches (21, then two, then Home).

**Home was the last one, and it was left out for a reason worth knowing: it is the only route with no property.** Its chrome is `HomeHeader`/`HomeFooter`, not a resort's, so none of the per-property sections apply and `ManagedPage`'s `fallbackProperty` is a formality there (the document carries `"ubud"`; the picker section never reads it). The client found this the way anyone would — they opened the Pages list looking for "the page where you pick which resort" and it was not there. It now has one section type of its own, **`propertyPickerSection`**, holding both panels in a single `panels[]` array rather than one section each: the page is one choice rather than a stack of bands, and **the first panel renders the `<h1>` and the rest `<h2>`**, derived from array order so two `<h1>`s cannot be authored. The block renders the panels as bare siblings with no wrapper — the route's `<main className="grid md:grid-cols-2">` stays the grid, and a wrapper would collapse both photographs into one column. Content lives in `src/data/pages/home.ts` like every other page's, and the seeded `<main>` was verified **byte-identical** to the hardcoded one it replaced.

The last two needed a section type that did not exist, and both near-misses are worth knowing: Explore Bali's prose band got **`proseSection`** rendering `ProseBand`, because `richTextSection` runs at the blog's 760px `read` width where that band runs the page's `wide` container capped at 62rem — seeding with it would have narrowed a band nobody asked to change. Host Your Retreat's closing band uses the existing **`ctaSection`**; its block adds an `mx-auto max-w-2xl` wrapper the route did not have, which changes nothing for a short centred heading and one button. `ProseBand`'s `{email}` token is how the one linked address stays out of CMS copy — the property document supplies it, so it cannot disagree with the footer. See README-SANITY.md for the three steps to hand over a future route.

**Component organization** (`src/components/`):
- `home/` — components used only on `/` (HomeHeader, HomeFooter, PropertyPanel). Home's chrome floats over full-bleed photography and carries 2 nav links, so it isn't shared with the property pages' 7–8-item header.
- `property/` — everything shared across the Seminyak/Ubud property pages (PropertyHeader, PropertyFooter, PropertyHero, BookingSearchBar, AboutNarrative — which also carries the "Best Price Guaranteed" offer — LinkCardGrid, TestimonialCarousel, InstagramTeaser, AwardsRow, DirectBookingDeals, ContactForm). The second pass added, all named for what they *do* rather than which page they came from:
  - `ImageGallery` — client; a fixed-height multi-photo frame with gold bullet indicators, reusing PropertyHero's navigation convention and LinkCardGrid's crop rule. Used by rooms, packages, tours, spa. **It auto-advances (5s)**, like the hero — before that it sat on frame 1 until someone clicked a 6px dot, so the other five photographs of a villa were in practice never seen.
  - `RoomList` — the accommodation listing (Ubud Stay ×2 categories, Seminyak Villas). Photo + name + bed/size/occupancy + Check Rates / Details.
  - `AmenityGrid` — the "Featured Amenities" icon row.
  - `PackageList` — **the workhorse**: offers, retreat programmes, dining venues, wedding intro *and* the Explore Bali tours all render through it. An item is photographs + a pitch + optionally a benefits list (`benefits`), structured facts (`meta`, used for tour price/itinerary), extra paragraphs (`notes`) and one or more CTAs. Rows alternate sides at `lg`. Resist adding a parallel "TourList"/"RetreatList" — that was considered and rejected, they are the same shape.
  - `TreatmentList` — the spa price menu. Genuinely a different shape (duration/price rows), so it is not forced through PackageList.
  - `ProgramList` — the retreat pages' "Available Programs" accordion: one `<details>` row per length-of-stay tier ("3 Nights" … "14 Nights"), each opening to that tier's treatments plus the two blocks every tier repeats. Same `<details>` mechanism and summary treatment as `FaqAccordion`/`TreatmentList`.
  - `InquiryForm` — client; a data-driven form (`InquiryField[]`) for the Wedding and tour booking forms. Sibling of `ContactForm`, which keeps its own fixed five fields; both share the underlined-field treatment and both are gated by `Turnstile`.
  - `Turnstile` — client; the Cloudflare bot check, exported as the `useTurnstileGate` hook rather than a component. A captcha is two halves that have to stay together — the widget a visitor solves and the "may this submit proceed?" question the submit handler asks — so the hook returns `{ field, take, reset }`.
  - `FormDelivery` — client; `useFormDelivery`, everything the two form components do between "the visitor pressed Send" and "show the confirmation": hold the token, post to `/api/contact`, report failure. The two forms differ in exactly one respect — which fields they collect — so the seam is `send(fields)` and nothing else about delivery lives in either file. See the forms note below.
- `legal/` — LegalSection, the paragraph-or-bulleted-list renderer shared by Terms & Privacy.
- `layout/` — the two pieces genuinely shared between Home *and* the property pages: MobileNavOverlay (the full-screen mobile nav) and BookNowRibbon (Home's fixed vertical "BOOK NOW" tab).
- `ui/` — the design-system primitives. **Reach for these before writing layout by hand:**
  - `Container` — content width (`wide` 1240px / `narrow` 680px).
  - `Section` — the standard page band: full-bleed `tone` background + contained content + `space` rhythm. Replaces the `px-5 py-14 md:py-20` + `<Container>` boilerplate that was repeated in eight components.
  - `SectionHeading` — eyebrow + heading + gold rule, with `surface="light|dark"` picking the safe gold.
  - `Button` / `buttonClassName()` — the one CTA treatment. The exported class helper is what lets the contact form's real `<button type="submit">` match without being wrapped in an anchor.
  - `Reveal` — scroll entrances.
  - `ReadMore` — clamps a long block behind a "Read more" toggle, **but only after measuring a real overflow**, so short items keep no control. Used by `PackageList` for the benefits list and the tour notes: the photograph is a fixed 352px while those text columns ran 725–905px, leaving a third of the row as empty band. Follows `Reveal`'s rule — the server ships it unclamped with no button, and the clamp is only ever applied once the client has confirmed it can undo it. The "Read more" label and its gold-underline treatment are reused from `PostGrid`, not invented.
  - `icons.tsx` — hand-drawn inline SVGs instead of an icon library dependency. Deliberately avoids recreating any brand's actual logomark (e.g. Google Maps links use the generic pin icon, not Google's "G").

**All five readers of `inScope` agree now, and that took three passes to
notice.** `PackageList`, `PropertyHeader` and `LinkCardGrid` tested the flag
for truthiness — a *missing* one meant **out** of scope — while
`MobileNavOverlay`, `ActionLink`, the `link` schema's `initialValue` and the
migration's `linkValue` all treated a missing one as **in** scope. One field,
two readings, and the desktop nav disagreeing with the mobile nav over the
same data. The visible damage was two seeded pages linking where the coded
page rendered inert text; the latent damage was that any item added without
the flag would render as a dead label that looks like a design choice. All
five test `!== false` now. That was only safe to change after checking that
**all 84 labelled internal links in `src/data` state the flag explicitly**, so
it altered nothing rendered — verified by diffing the raw `<main>` markup of
all 78 pages before and after. Audit it with: no `border border-ink/20` (the
inert-button class) anywhere in the build, no `<li class="group/item
relative"><span`, and every `group/card` tile wrapped in an `<a>`; at the time
of writing that is 0, 0, and 39 of 39.

**Editors choose a band's background, and `ink` is deliberately not on the
list.** `toneField` offers three of the four tones `Section` renders — warm
white, warm beige, plain white — labelled by colour rather than by token name,
because "Sand" and "Deep sand" are what the code calls them and not what
someone picking a background is looking at. **`ink` stays reachable from code
and out of the CMS**: the design puts dark in the chrome and the frame, never
in a page band, and the whole-site audit checks that `main > section` on
`rgb(38, 30, 19)` is 0 — an editor given the option would break that in one
click with nothing to say so. `BandTone` in `Section.tsx` is that editable
subset and is what every band component takes; `SectionTone` is it plus `ink`.
The field is on **18 of the 24** page-builder sections. The six without it earn
the absence: hero and the property picker are full-bleed photographs with no
band colour behind them, and awards, deals, Instagram and the booking widget
draw their own surface.

**No copy is left in a component that a client would reasonably want to
change.** The sweep that found this classifies every visible literal by
whether it survives the CMS — a literal in a route's own JSX is the
documented fallback and only renders when Sanity is unconfigured, while one in
a shared component renders whichever way the page is served. The
document-backed count is **0** and what remains in shared components is six
strings, all deliberate:

| Left in code | Why |
|---|---|
| "Award badge", "Close menu" | accessible names, not copy |
| "Flexible Dates" | a control on the booking bar |
| "Reservation Review", "Total price", the empty-state line | the live form's own panel structure, on two pages |

Two corrections were needed along the way, and the second is the reason to
re-run a sweep rather than trust the last one. `contactSection` gained
`formHeading` and `confirmation`, because `ContactForm` hardcoded both while
its sibling `InquiryForm` had taken them as props all along. And **an earlier
commit here claimed the header and mobile menu read `bookNowLabel` when they
did not** — they are Client Components and could not reach Sanity. The label
rides on `PropertySite` now, filled in by `getPropertySite`, which is what
lets two Client Components read a site-wide setting without threading a prop
through all 31 routes that render the header.

**The 47 document-backed pages set their headings and buttons from Site
settings now, not from the components.** Rooms, experiences, posts and the
legal pages have no page-builder — their content comes from their own document
and their *section labels* came from nowhere at all: "Gallery", "Details",
"Amenities & Facilities", "Recommended for", "Inclusions", "Check Rates",
"Book Now", "Follow on Instagram" were written into `RoomDetail`,
`ExperienceDetailBody`, `RoomList`, `TreatmentList` and `InstagramTeaser`. A
client wanting any of them in Indonesian needed a developer.

**They belong to `siteSettings`, not to each document.** "Gallery" on ten room
documents would be ten copies of one decision, and the first one edited would
disagree with the other nine. `getSiteLabels()` resolves them once; every
default is the string its component shipped with, so an unset field renders
what the site rendered before — verified as **78 of 78 pages byte-identical**,
then verified the other way by setting `amenitiesHeading` to "Fasilitas &
Amenitas", rebuilding, and watching it appear on every room page before
reverting it.

`bookNowLabel` stopped being half-wired in the same pass: it existed but only
the homepage ribbon read it, so an editor changing it saw one of four places
change. The header, the mobile menu and the spa menu read it too now, and the
ribbon uppercases it because that tab stacks one letter per line.

**And `collectionSection.heading` was silently dropped for testimonials.**
`DynamicCollectionSection` passed it on its room, post and experience branches
and not on the testimonial one, where `TestimonialCarousel` hardcoded "What
our guests are saying" and took no heading at all. The earlier dead-field
audit missed it because it asked whether the *block* mentions `section.heading`
— it does, three times — rather than whether every branch does.

**The spa forms' "Reservation Review" is built, and the objection that kept
it out turned out to be answerable.** The route file said the live panel was
"a pricing calculator wired to the booking backend… inventing the arithmetic
would risk quoting a guest a number the business never agreed to." Right at
the time, and moot now: the formula was read straight off each live form's own
`updateReview()`, and every price was checked against the `data-price` the
live markup carries — **all 7 Seminyak prices and all 39 Ubud ones match what
this project already stores, to the rupiah**. Nothing is invented.

    tax      = 21% of subtotal
    total    = subtotal + tax
    discount = 20% (Seminyak) / 15% (Ubud) of *that total*, not of the subtotal
    payable  = total - discount

Three things are worth knowing. **The two forms genuinely differ** — different
discount rates, and only Ubud prints "*Discount is valid for booking minimum
one week in advance" — which is why `SPA_RESERVATION_PRICING` is a table and
the CMS carries the rates per section rather than in code. **One live branch
is deliberately not reproduced**: Ubud's script splits treatments on a
`data-ts` attribute that *no element on the page carries*, so every treatment
takes the taxed path; copying the branch would imply a distinction the live
form does not make. And **the panel must not guess a treatment's name** — a
first version split the option label at the first capitalised word and turned
"Honeymoon Enjoyment Package" into "Honeymoon", so it now shows everything
before the duration, clamped to two lines. The live form can separate them
because its markup has a `.package-name`; this data is one string.

Prices are parsed from the option label rather than stored twice
(`priceFromOption`), the form stays uncontrolled — one `onChange` on the
`<form>` recomputes from its own `FormData` — and `inquiryFormSection.pricing`
carries it in the CMS, so the published pages and `src/data` both render it.

**A menu PDF is replaceable from the Studio, and that closed the first thing
the client actually asked for.** "My team would like to change the F&B menu"
turned out to be the one job the CMS could not do: the menu buttons are `link`
objects whose destination was a path into `public/uploads/`, which is in the
repository — so changing a menu meant a developer and a deploy. `link` (and
the rich-text annotation) now takes **"A file to open"** alongside a page
reference and a typed URL, resolved by `linkProjection` the same way an image
is: upload wins, the typed path stays as the fallback, and a button whose file
has not been uploaded renders exactly as before. **There were zero `file`
fields in the whole schema before this.**

**It shipped invisible, which is worth more than the feature.** The upload
box was `hidden` unless the `linkType` radio said "file", and *every link
the migration seeded carries no `linkType` at all* — measured against the
dataset, **46 PDF buttons across seven pages, `linkType: null` on all 46**.
So the radio read as unset, the field never rendered, and on the one page
the feature was built for an editor saw a Destination they could not change
and nothing to drop a file onto. The client's report was simply that there
was no way to upload a PDF. The field now also shows when nothing has been
chosen and the typed destination is itself a file (`.pdf/.jpg/.png`), so the
drop target is there without anyone having to find the radio first.

The second half was worse and is why the radio alone was never the fix:
`linkProjection` read `linkType == "file" && defined(file.asset)`, so a PDF
dropped onto a seeded button would upload, publish, and change nothing —
the button went on opening the old file with nothing to say why. **An
uploaded file wins wherever one exists now**, which is the rule an image
already follows (asset beats `externalUrl`), and the typed path stays the
fallback. Verified against the live dataset: the new projection returns
hrefs identical to the old one, because nothing has been uploaded yet and
every link still falls through to its path.

The menus live on **five** pages, not one — `/seminyak/dining`, `/ubud/dining`
and the three in-room directories — and **the same menu was two different
PDFs**. The Dining pages linked what the live dining page linked in 2023 while
the in-room pages, built later from the cards guests actually scan, linked
newer files. A guest at the QR code and a guest on the website could read
different prices. Six pairs, unified onto the in-room file and established
from each PDF's own `ModDate` rather than its `/YYYY/MM/` folder (which only
records when WordPress received the upload): Seminyak à la carte 2023-01-27 →
2025, breakfast 2022-08-04 → 2023-12-08, CLD+BBQ → 2023-12-22; Ubud breakfast
2023-08-19 → 2024, all-day 2025-06-13 → 2025-10-08, candle-light 2023-05-01 →
2023-11-19. `npm run sanity:menus` did the published documents,
`src/data/pages/*-dining.ts` carries the same six, and the two builds agree.
**Most apparent mismatches are not** — Spa, Wellness, All Day and Room
Directory differ per property and per room type on purpose, so the script
moves only the six exact paths it names.

**Then every published value was checked against every rule, and three more
turned up.** The method: read the enum unions out of `src/sanity/schema.json`,
parse `Rule.required()` and `.max(n)` out of the schema source, and walk all
405 published documents looking for values the Studio would mark red. Two
things make the result trustworthy — the enum side is read from the extracted
schema rather than guessed, and every `required` hit was checked against
`schema.json`'s own field ownership before being believed. **All 23 that
survived were mis-attribution** (`legalList.items` read as `legalPage.items`,
`linkCard.image` as `linkCardGridSection.image`, and so on: the parser scans a
window per `defineField` and can slurp the next field's validation). Discount
that column; the enum and length findings were real.

- **`packageListSection` could not hold the heading level its own seed
  writes.** The four in-room pages have no hero, so that band *is* the page
  title and the migration sets `headingLevel: "h1"` — which
  `headingLevelField` (H2/H3/H4) rejects. Four documents showed a red error on
  content that renders correctly. It takes `pageHeadingLevelField` now, and
  `countPageTitles` counts it, which also stopped those four warning "no main
  heading" when they plainly have one.
- **`post.excerpt` was `required().max(320)` and thirteen of the seventeen
  posts failed it** — eleven over 320 (373 at the longest) and two with no
  excerpt at all, empty in `src/data` too, so the source's own doing. Neither
  breaks anything: `PostGrid` guards on `post.excerpt` and clamps it to two
  lines. Both are warnings now.

**A validation rule the project's own data failed.**
`inquiryFormSection.fields[].name` required kebab-case — and the Wedding page
ships six camelCase names (`weddingDate`, `stayDate`, `weddingGift`,
`legalWedding`, `hairMakeup`, `receptionDinner`), so every editor who opened
that page met six red errors on content that has always worked. The rule was
house style written as a blocker. It accepts any identifier that survives form
encoding now (`^[A-Za-z][A-Za-z0-9_-]*$`), which is the part that actually
matters: the name is the key the answer is posted and emailed under. **Check a
new validation rule against `src/data` before adding it** — every one of these
forms was seeded from there, so a rule the file breaks is a rule the CMS
breaks. The only other regex rule here, the section anchor, is deliberately a
`.warning()` rather than an error for the same reason.

**Section order is the editor's on 31 pages and the component's on 47, and
that split is deliberate.** A `page` document's `sections` array is
drag-to-reorder like any Sanity array — nothing in this schema disables
sorting anywhere — so every band on the 31 hand-written routes can be moved.
The other 47 are backed by their own document type (10 rooms, 18 experiences,
17 posts, 2 legal pages) and their band order lives in `RoomDetail`,
`ExperienceDetailBody`, `PostBody` and `LegalSection`. `ExperienceDetailBody`
in particular renders the live pages' own order, which is the reason those six
retreat programmes were restructured in the first place — turning it into a
page builder would hand an editor the ability to reorder a sequence that was
reconstructed from the source on purpose.

**`npm run pages:check` is the standing proof that nothing has gone missing.**
It reads a build and compares it against `seo.ts`, the sitemap, every Sanity
document that owns a URL, and `src/data` — currently 77 served, 0 missing on
every count, and 1 *redirected*: a Sanity `post` whose URL now 308s is
reported as a note rather than a problem, because a check that always fails
stops being read. The redirect list it compares against is parsed out of
`next.config.ts`'s `redirects()` body, so retiring the next URL needs no edit
here. The `src/data` comparison is the one worth having: `getRooms`,
`getExperiences` and `getPostPaths` return Sanity's list *instead of* the
file's rather than merging, so **unpublishing one room of ten takes its URL
down** with nothing else changing. Correct for a deletion, a silent outage for
an accident — so the script reports it and a human decides which it was. Since
the catch-alls went `dynamicParams = true` this is no longer deferred to the
next deploy in either direction: an unpublished room 404s at once, and a newly
published one resolves at once.

**Hide/show reaches every band now, and two things stood between it and
that.** All 24 section types carried `isHidden` and `PageBuilder` filtered on
it, so as a *field* it was complete — but:

- **The awards strip on the four in-room / staff pages was not a section at
  all.** Those routes rendered `AwardsRow` outside `ManagedPage`, which is why
  their seeded documents had to omit `awardsSection` (two strips otherwise).
  It was the one band on those pages a client could not hide. It sits inside
  `ManagedPage` now, like every other band, and the seeded section is what
  draws it.
- **Hiding *every* section published a blank page.** `ManagedPage` tested
  `sections.length` before the hidden ones were filtered out, so an all-hidden
  document rendered an empty `<main>` — no heading, no content. It counts the
  visible ones now and falls back to the route's own JSX, which is the rule
  every other resolver here follows for "nothing to render".

**Verified by actually hiding one and rebuilding**, not by reading the code:
the strip disappeared, the page kept its `<h1>`, the other three were
untouched, and unhiding restored it. Expect **a one-build lag** doing this —
the first `npm run build` after a write still served the pre-write copy both
times, in each direction, with `.next` deleted. The data was correct on
`api` *and* `apicdn` when checked directly, so it is the fetch layer's cache,
not the CDN and not the code. Build twice before believing a CMS change did
not take.

**Then the same question was asked of every field, and the answer was six
more.** The check is mechanical and worth rerunning: for each section, take
its fields from `src/sanity/schema.json`, check each one is in the
`SanitySection` variant in `types.ts` (a field missing there *cannot* be read
— TypeScript would reject it), then check the block `PageBuilder` maps that
`_type` to actually mentions it. Do the same for the ten document types
against `queries.ts` and the app. Both now report zero.

- **`anchor` was offered on all 24 sections and honoured by 10.** Every
  section carried "Section anchor" in the Studio; fourteen blocks dropped it,
  so a client setting one on a Packages band, an FAQ or a card grid got an id
  that never reached the DOM and a `#link` that silently did not jump. Nine
  band components took no `anchor` prop at all and now do. **Five sections lost
  the field instead**, because they draw no `Section` to hang an id on: the
  hero and the property picker are full-bleed photography, awards and the
  booking widget draw their own surface, and the deals bar is fixed to the
  viewport. `hiddenOnlySettingsFields` is the settings pair without an anchor.
- **`collectionSection.action`** was a "Closing action" link rendered by
  nothing — none of the three components that section renders through draws a
  button after the list, and adding one would have put a button on bands the
  design closes without one.
- **`legalPage.updatedAt`** and **`property.instagramFeedUrl`** were both
  projected, typed, and read by nothing. The second is a leftover of the
  deleted Behold proxy — `instagramApiUrl` / `spaInstagramApiUrl` are what
  choose an account now. No document set either, so nothing was lost.
- **`category.description` is the one that stayed.** Seven categories carry a
  real one and nothing renders it — but it reads as a note to whoever tags the
  posts, which is a fair thing for a schema to hold. It is titled and
  described as internal now, so no one expects it on the site.

**Two more fields were read by nothing, and the fix was to delete them rather
than honour them.** `awardsSection.heading` and `bookingWidgetSection.heading`
existed in the schema; neither `AwardsRow` nor `BookingWidget` accepts a
heading and neither block ever passed one. Making them work would have *added*
a heading to two bands the design draws without one — so the fields went
instead. No published document had a value in either, so nothing was lost.
Same lesson as `siteSettings`: a CMS field nothing reads is not inert, it is an
unexploded difference.

**The `inScope` convention:** `PropertyNavItem`, `LinkCardItem`, and `MobileNavLink` all carry an `inScope?: boolean`. When true (or omitted), the item renders as a real `<Link>`; when explicitly `false`, it renders as plain `<span>` text with identical styling — used everywhere a live-site link points at a page this project doesn't build (Villas, Dining, SPA, Offers, Blog, etc.). Follow this same pattern for any new nav/grid item rather than inventing a different scoping mechanism.

**Carousels** (PropertyHero, ImageGallery, TestimonialCarousel) follow one consistent pattern: local `useState` index, plain prev/next handlers with wraparound, hairline-rule indicators — no carousel library. All hide their controls entirely when given a single item (the live Ubud hero genuinely has one slide). PropertyHero auto-advances every 6s and ImageGallery every 5s — a gallery is shorter-lived than the hero and there are often several to a page — both pausing on hover and disabled outright under `prefers-reduced-motion`. ImageGallery uses a `setTimeout` keyed on the active index rather than a standing `setInterval`, so tapping a bullet restarts the wait instead of having the chosen slide yanked away a moment later.

**All three carousels keep every slide in the server HTML** and cross-fade between them; none renders only the active one. `TestimonialCarousel` used to — it rendered `testimonials[activeIndex]` alone, so three of Ubud's four guest quotes existed only in the React payload and never reached a crawler or a visitor whose JS didn't run. It now stacks its quotes in a one-cell grid (`col-start-1 row-start-1`, `items-center`) rather than the absolute positioning the image carousels use, because text has no fixed height: the band takes the height of the longest quote and stops resizing as you page through. Same rule as `FaqAccordion`'s answers — if it is page copy, it ships in the markup.

**Every photograph on the site is now editable from the Studio, bar two, and
the check that proves it is a build scan rather than a source grep.** Count
what each prerendered page actually requests: an image served from
`cdn.sanity.io` has an asset behind it and can be swapped by dragging a file
onto a field; one served from `/uploads/…` is falling back to a path. That
scan started at **21 distinct files** and ends at **2**. Three different causes,
and only the first was visible by grepping for a literal path:

- **The landing page's wordmark** was written into `HomeHeader` as a path. It
  is the one route with no property document to take a logo from, so it had no
  field at all — `siteSettings.homeLogo` is it, and because `HomeHeader` is a
  Client Component (it owns the hamburger) the route resolves the image and
  passes it in.
- **The four in-room pages** were seeded *after* `npm run sanity:images` last
  ran, so their fields held paths with no asset. Rerunning it was the whole
  fix — it is idempotent and resumes.
- **The "Other Personalized Luxury Retreat" grid** took its six thumbnails from
  `PERSONALISED_RETREATS` in `src/data/experiences.ts`, which no CMS field
  reached. Each retreat carries its own `cardImage` now, resolved by the route
  (the detail body is handed one experience and cannot see the others).

**The two that remain are deliberate and must stay in code.** They are the
per-page overrides inside `otherPersonalisedRetreats` — `ubudspa.webp` and
`yoga-4.jpg` — and they exist for the rule below: without them, two of those
pages would show the same photograph twice. They are a layout constraint, not
content.

**No photograph is used twice on the same page.** This is a client requirement, and it is enforced structurally rather than by remembering: `RoomDetail` and `ExperienceDetail` filter the page's `hero` out of the gallery they render, `PostBody` drops any body image block equal to the post's featured image, and the three `InstagramTeaser` grids carry photos the rest of their page doesn't use. The rest is per-page curation — page heroes are chosen from outside the lists below them, and where two entries share a subject (the two Seminyak sunset tours both visit Tanah Lot) each shows the stops unique to it. Re-check by counting `<img>` sources inside `<main>` per route after any image change; the awards marquee and the header/footer logo legitimately repeat and are excluded.

**The rule now holds on all 74 routes, and the page header is where it kept breaking.** The live site routinely opens a page on a photograph it uses again further down — the Wellness header is the Yoga Class photo, the Explore Bali header is the charter car, `/ubud/villa`'s three header slides are three rooms' lead photographs — and the client flagged exactly that ("please don't repeat the same pictures"). Sixteen pages carried a repeat; each was fixed by moving the **header**, not the content row, because the content photograph is the one that has to be there (the client had specifically asked for the yoga picture back). Replacements come from the live WordPress media library (`/wp-json/wp/v2/media`, 640 images, most of them unused by the site), and **two traps make filename-based picking unsafe**: the same shot is often published twice under different names (`2023/03/Tour-Seminyak.webp` = `2023/02/full-day-travelling.webp`, `2023/03/honeymoon-ubud.webp` = `2023/02/Honeymoon-Getaway-Package.jpg`, `2023/03/Honeymoon-Pool-Villa-1.webp` = `2023/02/Honeymoon-Pool-Villa-6.jpg`), and a promising name can be the wrong picture entirely (`Seminyak-slider-4.webp` is a housekeeper cleaning a basin). **Look at every candidate before using it.** Verify with the audit above: 0 repeats across 74 routes, awards badges excluded.

**Deliberately simplified, not faked, functionality:**
- **The booking bar is the booking engine's own widget** (`BookingWidget`), embedded exactly as the live site embeds it — a `#quickbook-widget` div plus a `<script id="propInfo" propertyid="…">` loader from `booking.nyuhbalivillas.com`, with each property's widget token in `PROPERTY_SITES[*].bookingWidgetId` (a *different* token from the `propertyId` inside `bookingHref`). That buys the one thing no markup of ours can reproduce: the live availability calendar, with a nightly rate on every date and the sold-out days marked. **Its DOM is not React's** — the loader calls `replaceWith` on both the container and its own script tag, so the wrapper renders empty and its children are created in an effect; never render children into it from JSX. `globals.css` ends with a **brand skin** for it (`.booking-widget …`): the vendor's theme block is entirely `!important`, so every override needs `!important` *and* higher specificity to win. `min-h` on the wrapper reserves the widget's measured height per breakpoint so the band below doesn't jump while it loads.
- `BookingSearchBar` is now the **fallback** under `BookingWidget`, shown if the vendor script hasn't rendered within 7s so the page's primary CTA is never an empty strip. It is a working bar in its own right: native date inputs, a guest stepper, promo field, and a Search that carries the dates onto the engine. **Its parameters must go in the URL's fragment, not its query string** — the engine (STAAH SwiftBook) is a hash-routed SPA at `…/inst/#home?propertyId=…&JDRN=Y` and reads its parameters from that fragment. A plain `<form method="GET">` — which is what the live site's own booking form uses — puts them before the `#`, where the app never looks; measured against the live engine, dates sent that way left it on its own today/tomorrow defaults. `bookingUrl()` appends them to the fragment instead. **Only `checkIn`/`checkOut` are honoured**: `promoCode` and every guest-count spelling tried (`adult`/`adults`/`noOfAdults`, `room`/`rooms`, `child`, `promo`/`promocode`/`couponCode`) were ignored, so re-test before adding any.
- **The forms, by contrast, are not simplified — they are wired end to end.** Every form on the site posts to **one endpoint, `/api/contact`**, which checks a Cloudflare Turnstile token and emails the property through SendGrid **in the same request**. That is **13 routes, one form each**: the two Contact pages, Wedding, Explore Bali's tour booking, the three standalone form pages, and the six retreat programmes' Inquiry. A CMS-authored `contactSection` or `inquiryFormSection` inherits all of it for free, because those blocks render the site's own two form components. The booking bar is deliberately outside this: it submits nothing, it hands dates to the external engine, and a challenge in front of the primary CTA would be friction bought for no protection.

  **The one-request order is the security property, and it is also a hard constraint.** There is deliberately no verify-only route — an earlier pass had `/api/turnstile/verify` and it had to go the moment mail was added. **Cloudflare spends a token the first time it is checked**, so verifying in one request and sending in another fails the second one every time with `timeout-or-duplicate`. Check and send stay in one handler, and the widget resets itself whenever that handler says no.

  **Nothing about the recipient comes from the browser.** The client sends a property slug; the server maps it to an address it already knows (`CONTACT_TO_*`, else the published address in `data/properties.ts`). A form that could name its own recipient is an open relay with a nice typeface. For the same reason the visitor's own address only ever reaches `Reply-To`, and only after `isEmailAddress` has refused anything carrying a comma, an angle bracket or a line break — sending *as* the visitor fails SPF/DKIM and lands the mail in spam.

  **Sender and recipient are configured separately, and per property, because the business runs two domains.** `SENDGRID_FROM_SEMINYAK` / `SENDGRID_FROM_UBUD` name the sender, falling back to `SENDGRID_FROM_EMAIL` for either; `CONTACT_TO_SEMINYAK` / `CONTACT_TO_UBUD` name the inbox, falling back to that property's published address; `CONTACT_CC` copies a comma-separated list on both, for watching real submissions arrive without diverting them, and drops any entry equal to that property's own recipient because SendGrid rejects a send where one address appears twice across to/cc/bcc. Only the **sender** side needs anything of SendGrid: a From address must be a verified Sender Identity there or the send is refused with a 403, and its domain is what SPF/DKIM are checked against — which is why Ubud should leave from `ubudnyuhbali.com` rather than borrowing Seminyak's domain, once both are authenticated. Recipients need no verification at all. A property with no sender resolvable logs which of the two variables to set and is the only configuration that reaches SendGrid's 403. **The notification carries the property's wordmark, centred on the dark band, and it travels *inside* the message.** `src/server/emailLogos.ts` holds it as base64 PNG, sent as an inline attachment and referenced as `cid:`. Three constraints pushed it there and each is easy to re-discover the hard way: the site's own `logoSrc` is the right artwork — its tagline is set in cream, for exactly this dark header — but it is **WebP, which Outlook on Windows cannot render**, and Outlook is what a resort's reservations inbox tends to be; the media library's only PNGs are a *different* lockup whose tagline is dark olive and vanishes against `ink` (compositing them over #261e13 and looking is what settled it, and `Logo-Nyuh-Bali.png` hides an Ubud-specific mark behind a generic name); and a converted file would need public hosting that does not exist yet. Embedding answers all three, and skips the "display images" prompt as well. The PNG is **pre-composited onto #261e13**, so it needs no alpha and costs 8.6 KB — about 11.5 KB base64 per send — but that also means **a change to the band's colour requires re-exporting it**. Width and height are set as attributes *and* in the style, and the cell carries `align="center"`, because Outlook reads the attributes, invents a size without them, and ignores `margin:0 auto`; the `alt` is styled in gold so a blocked image leaves a line of type rather than a broken box. The message carries a real `<head>` — viewport, charset, `x-apple-disable-message-reformatting`, and **`color-scheme: light`**, the last of which guards the logo specifically: with the band's colour baked into the PNG, a client that force-inverts for dark mode would lighten the band and leave the mark sitting in a dark rectangle. Measured at 320 / 375 / 414 with a long unbroken address in the body: no overflow, and `word-break:break-word` on the value cell is what keeps it that way. **Every delivery logs one line naming both ends** — `sent "Contact Us" (seminyak) from Nyuh Bali Seminyak <no-reply@nyuhbalivillas.com> → …` — business addresses only, never the visitor's; the sender is in it because the sender is the half SendGrid refuses over, so a 403 can be read rather than guessed at.

  **The confirmation now means something.** These forms used to swap themselves for a thank-you the moment they were submitted, whatever happened next, because nothing happened next. `send` resolves false on every failure and the form stays on screen with its answers intact — a visitor is never told an enquiry was received when it was not.

  **Server-only code lives in `src/server/`:** `turnstile.ts` (siteverify, holds the secret), `sendgrid.ts` (one `fetch` at their v3 API — **no `@sendgrid/mail` dependency**, which is the same judgement that hand-draws the icons, and one fewer thing to break a Vercel install), `cloudflare.ts` (the cache purge, same one-`fetch`-no-SDK judgement), `inquiryEmail.ts` and `purgeTargets.ts`. The last two are pure on purpose — no env, no network, no `server-only` — because what each must not get wrong is invisible in a browser: in `inquiryEmail.ts` every value in those bodies was typed by a stranger, and in `purgeTargets.ts` a page missing from the list stays wrong at the edge for as long as the TTL runs. Both can be run on their own with `node --experimental-strip-types`, which is how the escaping, the header-injection guards and the purge map were checked.

  **Unconfigured means invisible, and that is the deployment-safety property.** With `NEXT_PUBLIC_TURNSTILE_SITE_KEY` empty, no widget renders and **the vendor script is never even requested**; with `SENDGRID_API_KEY` empty the route still runs and still confirms, but logs loudly that nothing was delivered and answers `delivered: false`. Both are the state a preview deploy runs in; neither is a state to launch in. Setting only the Turnstile *site* key is the one genuinely broken state — a widget appears whose token the route will always refuse (503 rather than passing, because otherwise deleting one environment variable would switch the check off). The Turnstile site key is inlined at build time, so **adding keys to a live deployment needs a rebuild, not a restart**; the SendGrid key is read per request, so rotating it does not. Verified after a build: no secret and no server-only variable name appears in any client chunk or prerendered page.
- **Behind a live domain there are two caches to clear on publish, not one.** `revalidateTag` empties Next's; the Cloudflare edge holds its own copy of every page and has to be told separately, which `/api/revalidate/sanity` now does in the same request via `src/server/cloudflare.ts`. Order matters and is not interchangeable, and there are **three** steps rather than two: revalidate, **warm**, purge. `revalidateTag` does not rebuild a page, it marks one stale — the rebuild happens on the next request for it — so revalidate-then-purge left a window in which the edge held nothing and the origin had not rebuilt. **Cloudflare's first request after a purge is exactly what it then caches**, so that window ended with the pre-publish page pinned at the edge for the full day. `warmOrigin` makes that first request itself, in two rounds with a gap, before the purge runs. It was found the way these always are: an editor uploaded a menu PDF to `/suite-directory`, published, and the edge went on serving the old button — `HIT` at age 104s with no `cdn.sanity.io` link — while the same page fetched from the origin already had one. **A site-wide publish is deliberately not warmed** (`property`, `siteSettings`, `testimonial` change all 77 pages, and warming 77 pages inside the request an editor is waiting on is not a trade worth making); it still purges.

  **The cache rules are in the repo, not only in the dashboard** (`scripts/cloudflare/cache-rules.mjs`, applied with `npm run cloudflare:rules`, which refuses to overwrite a rule it did not write). Four of them: bypass for `/api/*`, `/studio*`, `/_next/image*` and the two draft-mode cookies; respect-origin for `/_next/static/*`; respect-origin for `/uploads/*`, whose 30 days are stated once as a `Cache-Control` header in `next.config.ts` rather than as a number in the dashboard; and everything else — the 74 pages — cached at the edge for **1 day**. Thirty was the first choice and was wrong: publishing drops the edge copy within the second, so that number is only ever how long a page *nobody edited* stays warm, which makes it worth choosing for the case where the purge **fails** (token revoked, WAF in front of the webhook, an outage) rather than the case where it works. A month means the wrong page survives a month with nothing in the Studio saying so; a day means the site heals itself overnight, and a page anyone actually visits stays hot either way. **Every rule is scoped to `nyuhbalivillas.com` and `www.nyuhbalivillas.com`** — a zone covers the apex *and every subdomain*, so a path-only rule would also catch `booking.nyuhbalivillas.com` and freeze the STAAH availability calendar; `ubudnyuhbali.com` is email-only and deliberately absent. **The design rests on one thing: long edge TTL, and no browser TTL of our own.** Next already sends `max-age=0, must-revalidate` for a prerendered page, so the browser re-asks Cloudflare every navigation and a purge reaches every visitor at once. Override Browser TTL with a long value and no purge, publish or redeploy can reach someone who already loaded the old page. `/_next/image` is bypassed rather than cached because the optimizer varies on `Accept` and **Cloudflare ignores `Vary` outside Enterprise** — caching it risks serving AVIF to a browser that cannot read it.

  Unconfigured means invisible here too: with `CLOUDFLARE_ZONE_ID`/`CLOUDFLARE_PURGE_TOKEN` empty the purge answers `not-configured` and the webhook behaves exactly as it did before. **Two tokens, not one** — the runtime one carries only Zone → Cache Purge → Purge and is the only Cloudflare credential that belongs in a deployment; `CLOUDFLARE_RULES_TOKEN` is the wider Cache Rules → Edit token that `npm run cloudflare:rules` needs, and stays on a developer's machine. The purge is bounded at **8s** (`AbortSignal.timeout`) because it sits between an editor's Publish and Sanity being told the webhook worked, and it is `await`ed rather than fired and forgotten — an unawaited `fetch` on a serverless runtime is cancelled the moment the response is sent, so it would work locally and silently never happen in production. A deploy publishes nothing in Sanity and still changes every page, so it needs its own trigger: **`/api/purge/vercel`, called by a Vercel webhook on `deployment.succeeded`**. **That was `.github/workflows/cloudflare-purge.yml` for a while, and the workflow never once succeeded** — 25 runs on `algosbiz/nyuhbali` and 23 on `Muthiakartika/nyuh-bali-villa`, every one red, because it needed `CLOUDFLARE_ZONE_ID` and `CLOUDFLARE_PURGE_TOKEN` a *second* time as repository secrets while the values sat in Vercel's Environment Variables, which is where the rest of this site's configuration lives and the first place anyone looks. Nobody watches an Actions tab, so every deploy left Cloudflare serving the previous page, and the first symptom was a batch of redirects that had shipped hours earlier still answering 404 at the edge. **The lesson is not "fail loudly" — it already did.** It is that a design asking for the same credential in two places will be configured in one of them, and the half nobody is watching is the half that breaks. The route runs inside the deployment, so it reads the same two variables `purgeCloudflare` already uses and nothing is duplicated.

  Three things about that route are load-bearing. Vercel signs each webhook with **HMAC-SHA1 over the raw body** (`x-vercel-signature`) and the route refuses anything it cannot verify — an endpoint that purges on an unverified POST is one an anonymous caller can use to keep the origin under load; `VERCEL_WEBHOOK_SECRET` is shown once, when the webhook is created. It **waits before purging**, polling the canonical host until it reports the new deployment id (`<html data-dpl-id>`, with a cache-busting query so the question reaches the origin rather than the edge) for up to 10s, then purges either way — because Cloudflare caches whatever the origin answers on the *first* request after a purge, so purging while the alias still points at the previous deployment re-caches the build being replaced for the full TTL. And a preview target, a failed build and every event other than `deployment.succeeded`/`promoted` are acknowledged and ignored, so an over-broad subscription costs nothing.

  **Probe it with an unsigned POST**, which is the one diagnostic that separates the two failures: `401 Bad signature` means the secret is live and the route is refusing what it should, `503 Not configured` means `VERCEL_WEBHOOK_SECRET` never reached the running deployment — env vars are baked in at build time, so adding one needs a redeploy. Proven end to end rather than assumed: five pages primed to `HIT` on one deployment with their age past 20 minutes, an empty commit pushed, and every one of them reading the new deployment id at `age 0` on the first request afterwards, with no manual purge in between. `npm run cache:purge` remains the manual stand-in. Purge-everything is the default deliberately — a URL purge misses `?utm_source=…` copies, and 74 static pages cost nothing to refill.

  **Two commands do the operating, and `cache:check` is the one to reach for first.** `npm run cache:check` validates the zone id's shape, asks Cloudflare whether the token is live (`/user/tokens/verify`, which needs no zone permission) and prints what the edge is currently serving — **purging nothing**, so it is safe against production. There is no dry run for a purge, which is why the two things worth knowing beforehand are their own command; it catches the two failures that actually happen, a token created with the wrong permission and **an Account ID pasted where a Zone ID belongs** (both are 32 hex characters and they sit next to each other on the Overview page). `npm run cache:purge` empties the zone and prints the edge state before and after as proof. Same command names as the sibling `healthylook` project, which this pattern is ported from. README-CLOUDFLARE.md carries the DNS/TLS steps, the WAF skip the Sanity webhook needs once bot protection is on, and Cloudflare's own error codes decoded.

- `InstagramTeaser` shows the heading, a real "Follow on Instagram" link and — when a workspace is configured — the feed app's **own embed**: `<script src="https://ig-library.vercel.app/embed.js">` plus `<seoboost-feed widget="w_…">`, rendered by `InstagramEmbed`. The client asked for the app's script rather than a grid of ours, and that is now the whole rendering story: layout, columns per breakpoint, radius, gap, the 1:1 crop, captions, like/comment counts, the reel/carousel badges and the viewer are all the app's, changed in the workspace and never here.

  **This replaced `InstagramFeedGrid`, ~600 lines that reimplemented the app's grid and viewer** against the JSON the proxy returned. It was a faithful copy, but a copy has to be re-derived every time the app changes, and it drifted three times (the arrows, the reels and the caption clamp were each wrong once and each needed a screen recording to correct). Deleted, and in git history if it is ever wanted back.

  Three things about the embed are load-bearing:
  - **The photographs are not prerendered, and must not be.** The feed hands back Instagram's own CDN links, signed with an `oe=` expiry a few days out; every route here is statically generated, so baking them in would serve HTML whose photographs start 404ing within days. The embed fetches in the browser, which is what makes that safe. Verify with: the prerendered HTML must contain **zero** `fbcdn.net` / `cdninstagram.com` URLs — it does, on all 74 routes.
  - **The markup lives in a shadow root.** The app's stylesheet is scoped to it and cannot reach the page; equally, this site's tokens cannot reach in. Do not add CSS for the band — the host needs no `display` rule either, which was checked by forcing `display: inline` and measuring no difference.
  - **Nothing in this repo reads, proxies, caches or reshapes the feed — by instruction.** The client asked that a change made in the app reach the site with nothing of ours in the way, so `/api/instagram/[property]` (the proxy), `fetchInstagramPosts` (the server-side Behold fetch `/seminyak` still ran) and the Behold post types were all deleted with the grid. The proxy had existed because the feed's JSON endpoint sends no `Access-Control-Allow-Origin`; the embed's own requests are allowed cross-origin, verified from this site's origin before switching. Measured on a loaded page, the only two requests are the library's own: `/embed.js` and `/api/v1/w/<id>/feed`. **Do not reintroduce a proxy or a server-side fetch of this feed.** To inspect a workspace, curl `https://ig-library.vercel.app/api/v1/w/<id>/feed` directly.

  The workspace lives on the **property document in Sanity** (`instagramApiUrl`), falling back to `INSTAGRAM_FEED_SEMINYAK` / `INSTAGRAM_FEED_UBUD`. One setting serves both forms: the JSON endpoint is `…/api/v1/w/<widget id>/feed`, so `instagramWidgetId()` reads the id back out of it (and accepts a bare `w_…` too). That order is deliberate: the feed app keeps moving host (an ngrok tunnel, now a Vercel app), and each move is a new URL — in an env var that means a redeploy each time, while published in the Studio it is live within a minute. Nothing set means no grid, and the band falls back to whatever stills the page passes (Seminyak's six; Ubud and the spa have none), exactly as before any feed existed.

  **The widget id is prerendered, so a stale build cache can bake in a dead workspace.** A build that had not cleared `.next` emitted `widget="w_woo1hpn4a5s8hsk1xrttrniy"` — a workspace that answers `{"error":"not_found"}` — on **both** resort pages, while Sanity, the Sanity CDN and `.env.local` all held the correct, distinct ids and the dev server rendered them correctly. It came from a stale Next Data Cache entry dating from when the documents still carried the old test workspace; `grep` cannot find it because cache entries are encoded, so the only symptom is the wrong id in `.next/server/app/*.html`. `rm -rf .next` and rebuild. **Check after every build: the three pages must carry three different ids** — `grep -o 'seoboost-feed widget="[^"]*"' .next/server/app/{seminyak,ubud,ubud/spa}.html`.

  **There are three feeds, not two** — `InstagramFeedKey` is `"seminyak" | "ubud" | "spa"`. Mahamaya Spa on `/ubud/spa` posts as **@mahamayaspa.ubud**, a third account alongside the two resorts'. The spa has no property document of its own (it is an Ubud page wearing Ubud's chrome), so its workspace is a **second field on Ubud's document**, `spaInstagramApiUrl` — hidden in the Studio on Seminyak — falling back to `INSTAGRAM_FEED_SPA`.

  **A feed URL identifies a workspace, not an account, so always check what one actually returns** (`profile.username` in the payload) before wiring it. Two ways this has already gone wrong: `INSTAGRAM_FEED_SEMINYAK` and `INSTAGRAM_FEED_UBUD` were set to the *same* workspace, which publishes @nyuhbalivillas's posts under Ubud's "@nyuhbaliubud" heading; and both Sanity documents carried a leftover workspace belonging to an unrelated test account, which — because **Sanity wins over the env var** — is what the two resort pages actually rendered while the env vars looked correct. Read the Sanity value first when a grid shows the wrong posts: `*[_type=="property"]{slug,instagramApiUrl,spaInstagramApiUrl}`. All three Sanity fields were briefly unset on 2026-09-09 and **were set again the same day, so Sanity is the live source now** — read it first, not the env. That happened because the feed app moved off its ngrok tunnel to `https://ig-library.vercel.app`, whose JSON endpoint is `https://ig-library.vercel.app/api/v1/w/<widget-id>/feed` (the `<script src=".../embed.js">` + `<seoboost-feed widget="…">` snippet the app hands out is its *embed* form; this site needs the JSON one). The old tunnel now 404s, and the symptom was specific: **production kept serving a frozen pre-move snapshot** rather than an empty band — Next's Data Cache holds the last good response and background revalidations against a dead host fail silently, so the route never sees the 404 and `posts: []` never happens. A feed that is stale by days but *consistent across repeated calls* is that, not the 60s cache. Publishing the three URLs in the Studio fixed production within one request and with no redeploy, which is the whole reason the Sanity-over-env order exists.

**Appearance and behaviour are the workspace's settings, not this repo's.** `layout` (grid or carousel), `columns` / `columnsMd` / `columnsSm`, `limitSm`, `gap`, `radius`, `aspectRatio`, `showCaption` and `showStats` are all read by the app's own embed. Any value named here is a snapshot and will drift — as of 2026-09-10 all three are `columnsSm: 1, limitSm: 3` with Ubud on `carousel` and the other two on `grid`, measured at 375px as 3 stacked tiles / 1029px band for the grids and a 3-wide swipe row / 343px band for the carousel. **Change it in the app, then press "Save appearance" *and* "Refresh now."** The appearance block travels *inside* the app's cached feed JSON, so a saved setting does not leave the app until that copy is dropped. **All of the remaining delay is the library's, and it is three layers deep** — measured on its own endpoint: `fetchedAt` in the payload was 45 minutes old, `Age: 1846` with `X-Vercel-Cache: STALE` on its edge, and `Cache-Control: public, max-age=300` telling every visitor's browser to hold it 5 more minutes. "Refresh now" clears the first; the other two age out. This site adds nothing to that — after the switch to the embed there is no cache of ours anywhere in the path — so when a setting looks slow to land, it is the app's cache, and there is nothing to fix here.

**This is the one place the site's square-corner rule is deliberately broken** — the client asked for the app's look applied as-is, and the radius is the app's setting (24px for Seminyak, 12px for Ubud and the spa), so change it in the workspace rather than here.

**The band's account is chosen per section, and `/ubud/spa` is why.** `instagramSection` carries `feed` (a feed key) and `profileUrl`; empty means the page's own property, which is right on the two About pages. It is wrong on exactly one page: the spa is an Ubud page wearing Ubud's chrome, so `site.slug` is `"ubud"` and the CMS-rendered band published **@nyuhbaliubud's posts, and a Follow button pointing at @nyuhbaliubud, under the heading "What's happening @mahamayaspa.ubud"**. The hand-written route had always passed the spa's endpoint explicitly; the section had no way to say so, and the bug arrived silently the day the page moved into Sanity. Any future page whose band is not its property's account needs both fields set.

**Known live-site content quirks, preserved rather than "fixed":** the Privacy Policy's Ubud contact email is `info@ubudnyuhbali.co` (no "m"), genuinely different from the `info@ubudnyuhbali.com` used everywhere else on the live site — that inconsistency is in the source content itself. Conversely, `/ubud/contact/` is *broken* on the live site (always serves Seminyak's cached content, confirmed via network inspection) — that bug was **not** reproduced; the real `contact-us-ubud.webp` photo was recovered via the WordPress REST API and used with Ubud's own correct header/footer/form instead.

---

## Design state — read this before "fixing" anything back toward the live site

This began as a pixel-accurate clone. **Every page has since been deliberately redesigned.** Differences from nyuhbalivillas.com are intentional, not defects — do not "fix" anything back toward the live site.

The current design answers a client brief of **"75% keep the identity, 25% modernise"**, run as *evolution, not revolution*. Identity is preserved at the **information-architecture** layer: section order is byte-for-byte the same on every page, so a returning visitor finds everything where they left it. Modernisation happens entirely in the **visual/compositional** layer.

**Still binding, do not change:** same fonts (Open Sans body, Source Sans headings), same brand colours, same logo, same images, same booking flow, and **same copy** — no headline, paragraph, button label or nav item has been reworded. Where the redesign needed a label it didn't have (hero eyebrows, footer column headings), it reuses a string that already exists on the site ("Nyuh Bali Villas", "About Us", "Seminyak", "Our Blog", "Contact Us"). Composition, spacing, scale, colour *placement* and motion are fair game; wording, brand and photography are not.

### The design system as it stands

> A standalone **`DESIGN.md`** at the repo root now documents this system as a
> design reference (palette, type, spacing, per-component conventions). This
> section is the deeper "why / gotchas" companion to it; keep the two in sync.

- **Width:** `ui/Container` — `wide` 1240px (was 1080px, a 2012-era measure that squeezed 4-up grids to ~280px), `narrow` 680px for legal copy (~75 characters/line). Backgrounds stay full-bleed on the outer section; only content is capped. Media (hero, homepage panels, marquee) is deliberately allowed to escape the cap — contained text against uncontained image is most of what makes the layout read as editorial.
- **Bands:** compose with `ui/Section` (`tone` × `space`), never hand-rolled padding. Mobile totals per step are 52px (`tight`), 60px (`normal`), 68px (`loose`); **on `md` and up every step is 96px**, split 45/51. These were **tuned down repeatedly** from `py-20 md:py-28`, each time because the client read the gaps as too wide. Heading→content inside a band is `mt-8 md:mt-10`.
- **Mobile is ~60% of the desktop rhythm, not a scaled copy.** Stacked bands make a boundary read wider than the same number does beside a full-width grid, so the phone column is tuned on its own. Content-to-content across a boundary is **~64px on a phone against ~104px on desktop**; the internal heading→content gap stays 32px, which keeps the boundary clearly the larger of the two.
- **A band's top and bottom padding are deliberately unequal — 6px more on the bottom at `md`, 12px on mobile** (`normal` is `pt-6 pb-9 md:pt-[45px] md:pb-[51px]`, not `py-*`). **On desktop all three space steps share one pair** (`DESKTOP_SPACE` in `Section.tsx`): a boundary's upper half is band A's `pb` and its lower half is band B's `pt`, so the halves can only match when both are constants — mixing `loose` against `normal` was leaving the testimonial boundary 8px lopsided. The steps still differ on mobile. The 6px is the *measured* ink offset of a 42px section heading (canvas `actualBoundingBoxAscent` against the text node's baseline — **not** the element's box rect, which is what produced the earlier, wrong, 8px figure). Verified across 26 boundaries on 11 pages: 18 land at exactly 0, the rest within 2px except one at 5px. The residual is typographic and not fixable with padding — a heading with ascenders ("Healthy Meals") starts its ink ~2px higher than an all-caps one ("STAY"), and a band closing on text sits a few px above its box. Bands open on a heading and close on a hard edge (photographs, a plate, a button). Two effects stack: a heading's glyphs start ~7px below their line box, and a strip bounded by a *dark photograph* reads tighter than the same strip bounded by text on the same background. The client called the phone's bottom strip too narrow while it measured wider than the top one — so on mobile the correction is optical (12px), not arithmetic. Don't "fix" it back to symmetry. `AboutNarrative` is the one exception to the whole rule (its `pt` is clearance under the overlapping booking card, not rhythm).
- **Dark is chrome and frame, not a band.** The old design ran **seven** full-width `ink` slabs per page, three of them consecutive at the foot. A page body now carries **zero** — the awards row + footer form one dark base, the header goes dark on scroll, and the two remaining dark shapes are *inside* light sections (the "Best Price Guaranteed" plate in `AboutNarrative`, the frame around the booking card). The closing run steps `sand` → `sand-deep` (testimonial) → white (Instagram) → `ink` base, so the page fades to light before it lands. Verify with: count `main > section` whose computed background is `rgb(38, 30, 19)` — it should be 0.
- **Headings are `ink`, gold is the accent.** This is the single most important typographic rule here. Gold headings on white measured 2.39:1 and were the loudest "luxury website, 2005" signal on the page. Gold now lives in eyebrows (`primary-deep` on light, `primary` on dark), rules, icons, button fills and hover states.
- **Buttons:** gold fill with **`ink` text** (6.93:1, passes AA — white on gold was 2.39:1 and failed), `rounded-none`, hover *inverts* the fill **and draws a gold outline**. The outline is not decoration: the header bar and the footer base are both `ink`, so inverting the fill there swapped the button to the colour it was already sitting on and it dissolved into the background, leaving gold lettering floating in the dark. `solid` therefore carries a `border-transparent` at rest — invisible against the fill, no size change on hover — that turns `primary` on hover. Never reintroduce `hover:opacity-90`; opacity was the old universal hover and makes an element look disabled exactly when it should look ready.
- **Cards** (`LinkCardGrid`, `PropertyPanel`, hero): square corners, **bottom-weighted gradient scrim** (never a flat wash over the whole photo), label anchored bottom-left, a gold rule that extends on hover, and a slow `scale-[1.05]` zoom. No inset hairline frames.
- **`LinkCardGrid` cards are a FIXED height, not an aspect-ratio.** Every card in every grid is `h-44` (176px) mobile / `h-60` (240px) desktop, and the photo is cropped in with `object-cover`. This replaced an `aspect` prop (`portrait`/`tall`/`square`) whose height varied with card width — a 2-up card towered over a 4-up one, and portrait source photos stretched the card. Fixed height = all cards align, the frame is always landscape-or-square, tall photos crop instead of growing the card. Column count (2/3/4) sets width + label size only. **Do not reintroduce an aspect-ratio crop here** — the client asked for consistent, short, width-maximised cards specifically.
- **Header is solid on every page, never transparent** (`PropertyHeader`): one `sticky` `ink` bar, 68px / 72px at `lg`, with the gold hairline gradient under it and a soft shadow. It used to float over the hero and go solid on scroll (an `overlay` prop + scroll listener + brown scrim gradient); **the client asked for no transparent header, so that whole mechanism is deleted** — no scroll state, no height change, no scrim, and `PropertyHero` no longer draws a top scrim either (it existed only to make the floating header legible). Don't reintroduce it: a gold wordmark over a slideshow of photographs is legible only for as long as that slide stays dark in that corner. Logo 128×46. The header carries the **Book Now CTA**.
- **`PropertyHero`** is navigated by **gold bullet indicators** (one centred row), not prev/next arrows.
- **`BookingSearchBar` overlaps the hero's bottom edge** as a `sand-deep` card inside a **thick `ink` frame** — the live widget's brown kept as structure, not as a filled dark panel (which made it read as a third dark slab under the hero). Light-surface colour rules apply inside it: `primary-deep` labels/marks, `ink` values, `ink/15` field hairlines; only the Search block keeps full-strength gold. It carries the site's **one** shadow; everything else stays flat.
- **`AboutNarrative` also carries the offer.** Explicit grid: heading top-left, a dark "Best Price Guaranteed" plate bottom-left (dark so the gold promo code keeps contrast on the light band), narrative spanning the right. DOM order heading → narrative → offer so the mobile stack reads sensibly. `PromoBanner` was deleted; its content lives here now.
- **Footer is one compact row of 4 columns** (`PropertyFooter`): brand column (logo + Book Now + social) beside Menu / Contact / Blog, then a thin legal bar. The CTA sits *in* the grid, not on a separate banner tier above it. Desktop footer ≈ 324px (down from ~910 originally). Keeps mobile `pb-24` to clear `DirectBookingDeals`.
- **Landing page** is two full-height photographs meeting at a gapless seam, with `HomeHeader`/`HomeFooter` absolutely positioned *over* them. The page wrapper is `relative min-h-screen` — that's what they anchor to.

### Non-obvious constraints (every one of these was a real bug)
1. **Turbopack + Tailwind v4 silently drops brand-new class names** on an incremental rebuild — JSX hot-reloads but the new utilities are missing from the compiled CSS, so an edit looks half-applied. **After adding any new Tailwind class: stop the server → delete `.next` → restart.** Touching `globals.css` does not help.
2. **Custom breakpoints must be `rem`.** `--breakpoint-heroxl: 70.3125rem` (= 1125px). In px, Tailwind can't order it against the rem-based defaults, emits its media block out of sequence, and `lg:` silently wins.
3. **Hover effects must not depend on a `<Link>` ancestor.** Every grid item is `inScope: false` and renders as a plain div, so `group-hover:` keyed to a wrapping link never fires — this left the entire grid visually inert. Use a named group on the tile itself (`group/card` + `group-hover/card:`).
4. **The property nav appears at `lg`, not `md`.** 7 (Seminyak) or 8 (Ubud) letter-spaced items plus the logo *and* the Book Now button do not fit a 768px tablet, and previously caused ~75px of horizontal page scroll.
5. **`BookingSearchBar`'s five-across row is `lg:`, not `md:`.** At exactly 768px the md variant gave each field ~120px — "1 Room, 2 Adult, 0 Child" wrapped to three lines and the promo input was unusable. Below 1024px the card is a vertical stack.
6. **Every two-column split on this site happens at `lg`, never `md`** — the tablet gets the stacked layout. 768px minus padding is a 704px container, which two columns cut into ~290px and ~350px: `AboutNarrative`'s narrative became 41 characters a line (and its stretched offer plate gained ~190px of empty dark space), and the contact pages' photo became a 288×540 sliver at 0.53:1. Same rule for `LinkCardGrid`'s 4-up, which holds two columns until `lg` rather than putting four ~160px tiles against the fixed 240px card height. If you add a split, add it at `lg`.
7. **`AboutNarrative` no longer bottom-aligns its CTA to the offer plate — and must not go back to it.** The narrative column used `lg:justify-between` so the button's bottom edge landed on the plate's, with the plate `h-full` + `justify-center` to reach that edge. That is only safe while the two columns are close in height, because *all* the spare height pools into a single gap. When the plate gained a photograph (commit 28bf0b7, a client request), the left column grew ~300px and the Ubud page opened a **432px hole** between the last line of the narrative and "Plan Now" — measured at 1440, and the first thing the client asked about. The closing block now follows the narrative at a plain `mt-6` (24px measured on both About pages) and the plate is allowed to run lower than the button. The plate keeps `h-full` + `justify-center`, which are still what stop it stretching raggedly.
8. **`Reveal` must never be able to hide content permanently.** Server HTML ships visible (`curl <url> | grep -c reveal-hidden` must return `0` for every route); the client only hides what is already below the fold; a 1500ms fail-safe releases content if no `IntersectionObserver` callback arrives — a working observer always delivers one initial callback per target, so silence means it is broken. `prefers-reduced-motion` disables the whole thing in CSS.
9. **Date defaults in `BookingSearchBar` use `useSyncExternalStore`, not `useState` + `useEffect`.** These routes are statically generated, so "today" baked into the HTML is the *build* date and must be recomputed in the browser. A `setState` inside an effect is the obvious way to do that and is flagged by `react-hooks/set-state-in-effect`; `useSyncExternalStore` with distinct client/server snapshots is the correct API. Both snapshots must be module-level constants — `getSnapshot` runs every render and a fresh object each time loops forever.
10. **Mobile bottom padding is load-bearing — never trim it as "spacing".** Two fixed elements overlay the bottom of the page on phones, and the padding that clears them is functional, not decorative:
   - `PropertyFooter` `pb-24 md:pb-6` clears `DirectBookingDeals`, which docks as a full-width bar on phones (~63–92px depending on text wrap). `pb-24` (96px) clears the worst case. **The bar's height is width-dependent** — its text wraps at 360px — so verify at 360 as well as 390, not 390 alone.
   - `PropertyPanel` `pb-28 md:pb-32` clears `HomeFooter`, which floats over the homepage panels. `HomeFooter` runs a deliberately shallow `py-3 md:py-5` because its nav links carry their own `py-2` for tap size — without that the two paddings double-count and eat the clearance.

   Re-measure both pairs after any change to either side.
11. **`scrollHeight` lies about a CSS multi-column element — never measure `columns-*` content with it.** The benefits list in `PackageList` is `sm:columns-2`, and the column balancer settles on a column height and then lets the last item *overflow the container's own box* instead of growing it. `ul.scrollHeight` and `ul.getBoundingClientRect().height` agreed with each other (405px) while the final `<li>` ended 16px below both — so `ReadMore` shipped with one or two bullets still clipped in its *expanded* state. Measure to the furthest child edge (`max(child.bottom) - container.top`) instead. Clipping the container doesn't interfere: `overflow: hidden` changes what is painted, not the rects children report. `ReadMore` now also drops its `max-height` entirely once expanded, so no measurement error can clip content again.

12. **One unbreakable token in CMS copy is enough to break the whole page's horizontal scroll.** Two posts carry the source's `[link:https://nyuhbalivillas.com/…/]label` shorthand, which the importer never resolved — so a 68-character word with no break opportunity sat in the body text. At 390px that pushed the *document* to 603px wide against a 375px viewport: 228px of horizontal scroll on `/seminyak/discover/10-romantic-honeymoon-activities`, 10px on `/ubud/discover/five-relaxing-activities-to-do`. `parseInline` in `postBlocks.ts` now renders them as real internal links, and every article text node carries `break-words` as a standing guard. Two traps when hunting this: per-element rect scans miss it (no *element* is over-wide — the overflow is inside a normal-width `<p>`, visible only as `scrollWidth` 583 vs `clientWidth` 335), and the awards marquee shows up as a false positive in any such scan. Bisect by hiding `main`'s children and watching `document.documentElement.scrollWidth`.

13. **A `display` utility passed to `Button` via `className` silently loses.** `buttonClassName` hardcodes `inline-flex`, so `className="hidden sm:inline-flex"` puts two equal-specificity `display` rules on one element — and Tailwind's *stylesheet* order decides the winner, not the order in the class attribute. `inline-flex` wins. `PropertyHeader`'s Book Now CTA therefore rendered on every phone despite being marked hidden, and logo + CTA + hamburger overflowed a 360px viewport by 17px on **every property page**. Put responsive display on a wrapper element instead (`<span className="hidden sm:block">`), which has no competing utility. The same trap applies to any component that hardcodes a `display` in its base classes. Note the symptom is invisible at 390px, where it happens to just fit — check 360.

14. **Never centre an overflowing scroll container's own content.** `MobileNavOverlay`'s nav was `flex flex-col justify-center overflow-y-auto`. Once the Ubud menu expanded to 16 rows (8 top-level plus 8 submenu children, ~880px) it overflowed a phone in *both* directions, and the overflow above the container's top edge is unreachable — `scrollTop` cannot go negative. The first two items, "About Us" and "Stay", were simply gone, which is what the client reported ("i can't see the about us section and stay section unless i scroll up… the most important part is the stay section"). The fix is to move the centring off the scroll container and onto the list inside it: `<nav className="flex-1 overflow-y-auto">` wrapping `<ul className="flex min-h-full flex-col justify-center">`. A short menu (Seminyak's 7 flat items) still centres because the list has spare height; a long one grows past `min-h-full` and starts at the top. Verified at 375×812 and 360×640: "About Us" 14px below the nav's top edge at `scrollTop` 0, every one of the 16 rows reachable, Book Now still clear of the bottom.

### Verification limits — important
The browser pane in this environment reports `document.visibilityState: "hidden"`. Consequences, all confirmed: **screenshots time out**, `IntersectionObserver` never fires, **`ResizeObserver` never fires either — including the initial callback the spec promises on `observe()`** (this cost a rewrite of `ReadMore`, which measured only in the observer callback and therefore clamped nothing; take the first measurement synchronously on mount instead, and note that `requestAnimationFrame` is throttled in a non-painting tab for the same reason), **native scroll events never fire** (`window.scrollTo` moves `scrollY` but no listener runs — dispatch `new Event('scroll')` manually to test scroll behaviour), and **CSS transitions never advance**, so `getComputedStyle` on a transitioning property returns the *start* value forever. To read a real end state, set `el.style.transition = 'none'` first.

**No visual check of any page has ever been performed.** All verification is computed-style measurement. An eyeball pass on a real browser/phone is still outstanding — particularly photo cropping in the portrait/square crops, gold legibility over the photography, and whether the award badges (kept on `ink` precisely because several may be light-on-transparent) would survive being moved to a light surface.

### Whole-site audit (all pages, four widths)

Run after any structural change; every number below was measured, not assumed.

**Static, over the production build's prerendered HTML** (`.next/server/app/**.html`):
77 content routes, **2691 internal links, 0 dead and 1 through a redirect**, 1431 `<img>` in `<main>`,
**exactly one `<h1>` per page**, 0 `reveal-hidden` (the invariant that server HTML
ships visible), 0 `fbcdn.net` URLs (Instagram's signed links must never be
prerendered), no empty `<section>`, and no `undefined` / `null` / `[object Object]`
leaking into copy. `/_not-found` and `/_global-error` have no `<main>` by design.

**Images:** all **301 distinct photographs** the site references answer 200 —
fetched directly rather than judged from the DOM, because the browser pane never
paints and lazy images therefore never load.

**HTTP:** all 74 routes serve 200 with a `<main>` and one `<h1>`.

**Responsive**, measured per route inside a fixed-width iframe (media queries
apply to the frame, so one pass covers every width without navigating):
**360 · 768 · 1024 · 1440** — no horizontal document scroll anywhere, no
zero-height band, one `<h1>` each. Two false positives to expect in any
per-element rect scan: the awards marquee (clipped by `overflow-hidden`) and the
Instagram carousel's tiles (they extend inside an `overflow-x-auto` track).
The reliable test is behavioural — `window.scrollTo(300, 0)` then read `scrollX`.

**The Turnstile widget sets a hard floor at ~344px.** Cloudflare's `normal` widget is a fixed 300px wide and cannot go narrower (`flexible` still floors at 300; only `compact`, 150x140, is smaller and changes the look everywhere). Measured across all 13 form routes at 360 / 768 / 1024 / 1440: no horizontal document scroll anywhere, the widget sitting in a 305px slot at 360 with room to spare. Below about 344px it stops fitting — a 320px viewport overflows by ~20px — which is under this project's documented 360 floor, so it is recorded rather than worked around: the available fixes each cost more than they save (a CSS scale blurs the widget, and `overflow-x:auto` forces `overflow-y` to `auto` too, which would clip an interactive challenge when one appears).

**Interaction:** mobile nav opens on both properties (Ubud 16 rows, scrollable,
"About Us" 14px below the nav's top edge; Seminyak 7 rows, centred), body scroll
locks, the Book Now CTA stays in view; the header at 360 carries only logo +
hamburger with nothing overflowing; `DirectBookingDeals` measures 80px against
the footer's 96px `pb-24`; desktop shows 8 nav items with 3 dropdowns; the
Seminyak hero has 3 bullets and Ubud's single-slide hero correctly has none; the
booking widget container and its loader script are present; the tour and contact
forms both submit to their confirmation; a fresh tab logs **zero console errors**.

### Verified state (redesign pass)
Typecheck, lint and production build all pass. Measured in-browser at the time of that pass — **where a line below disagrees with the whole-site audit above, the audit is the current one**:
- No horizontal document scroll at 360 / 390 / 768 / 1024 / 1280 / 1440 on any page. **This claim was wrong for a long time at 360 specifically** — every property page scrolled 17px, and the cause was the header's Book Now CTA rendering on phones when it was supposed to be hidden (see constraint 13). Re-verified after that fix across 12 routes at 360: `scrollX` 0, `scrollWidth` == `clientWidth` == 360, zero overflowing elements inside the header. Two traps when checking this: the Ubud marquee's track legitimately extends past the viewport but is clipped by `overflow-hidden` on its `Container`, so per-element rects report false positives; and **the browser pane fractionally zooms** at some widths (at "360" it renders a 362px viewport at `visualViewport.scale` 0.994), which makes `scrollWidth > clientWidth` report a phantom 2px. The reliable test is behavioural: `window.scrollTo(200, 0)` and check `window.scrollX` — 0 means nothing actually scrolls.
- Every route returns 200 with `reveal-hidden` count **0** in the server HTML.
- ~~Header transitions transparent/104px → `rgb(38,30,19)`/72px on scroll~~ — **superseded**: the header is solid on every page and has no scroll state at all (see "Header is solid on every page" above). `main > section` dark count is **0** on both property pages (band order: hero → sand → sand → sand-deep → sand → sand-deep testimonial → white Instagram → ink awards base); h1 68px `ink` at 1440; exactly one `<h1>` per page. ~~hero 591px at 390×844~~ — **superseded**: `PropertyHero` sizes from the photograph's own ratio (`aspect-[3/2]`, so 260px at 390 wide) rather than from viewport height, which is what stopped a landscape photo being cropped to a portrait sliver on a phone.
- Every `primary-deep` eyebrow measures ≥ 4.61:1 against its own band (worst case is on `sand-deep`). Re-check this after any surface change — the token is calibrated to `sand-deep`, so moving text onto a *darker* surface than that would need re-measuring, not just re-colouring.
- Mobile nav: opens, locks body scroll, restores on close, closes on Escape, carries a Book Now CTA, staggers at 55ms.
- Zero console errors; every image resolves 200 through `next/image` — served from `public/uploads/` since the assets were brought in-house, not from WordPress.
