# Sanity content system

The website keeps its existing React components, Tailwind tokens, fonts, spacing and responsive behaviour. Sanity supplies structured content and section order; it never stores CSS or arbitrary HTML.

**Nothing changes on the public site until you configure a project.** Until `NEXT_PUBLIC_SANITY_PROJECT_ID` is set — or when a matching document has not been published — every route continues to render the content in `src/data/`, exactly as it does today. That is what `isSanityConfigured` in `src/sanity/env.ts` guards, and it is what makes this safe to ship before a single document exists.

## 1. Create and connect the Sanity project

1. Create a project and a `production` dataset at [sanity.io/manage](https://www.sanity.io/manage).
2. Copy `.env.example` to `.env.local` and fill in:

   ```dotenv
   NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
   NEXT_PUBLIC_SANITY_DATASET=production
   NEXT_PUBLIC_SANITY_API_VERSION=2025-02-19
   NEXT_PUBLIC_SANITY_STUDIO_URL=/studio
   SANITY_STUDIO_PREVIEW_ORIGIN=http://localhost:3001
   SANITY_API_READ_TOKEN=viewer-token
   SANITY_REVALIDATE_SECRET=a-long-random-secret
   ```

   `SANITY_API_READ_TOKEN` must be a **Viewer** token and must never carry the `NEXT_PUBLIC_` prefix. Generate the revalidate secret with `openssl rand -hex 32`.

3. In Sanity Manage → API → CORS Origins, add the production origin with credentials enabled. Add `http://localhost:3001` for local preview work.
4. Open `/studio` on the running site, or deploy the Studio separately with `npm run sanity:deploy`.

## 2. Versions — deliberately not healthylook's

This setup mirrors the healthylook project's architecture file for file, but **not its dependency versions**. healthylook runs Next 15 with `next-sanity@11` / `sanity@4`; this project is on **Next 16.2.10**, and `next-sanity@13` requires `next ^16` and `sanity ^5.29 || ^6`. Installing healthylook's versions here would not build.

Two API differences follow from that, both already handled:

- **`defineLive` no longer takes `stega` or `fetchOptions`.** `stega` is now a per-call option on `sanityFetch` and resolves itself from `draftMode()` outside strict mode, which is what healthylook's `stega: true` was for. The 60-second ISR fallback lives on the published-client path in `src/sanity/lib/client.ts` instead.
- **`revalidateTag` takes a cache profile in Next 16.** The webhook route passes `{ expire: 0 }` — a full purge, which is what a publish means. A named profile such as `"max"` would leave long-lived entries in place.

## 3. Import the existing content

`scripts/sanity/migrate.ts` imports everything in `src/data/` — 58 documents and 198 image references. Check what it will do before touching the dataset:

```bash
npm run sanity:migrate:dry
```

A dry run needs no credentials and writes nothing; it prints every document it would create and how the article-block recovery landed.

To write for real, pick whichever authentication actually works for you:

```bash
npm run sanity:migrate
```

uses your `npx sanity login` session. If that login cannot complete — a stale Sanity session in the default browser is enough to break the callback — put an **Editor** token in `SANITY_API_WRITE_TOKEN` and run:

```bash
npm run sanity:migrate:token
```

That path builds its own client from the token and never asks the CLI for a session, so it needs no login at all. It is also the one to use from CI.

| Flag | Effect |
|---|---|
| *(none)* | Creates missing documents only. Editor changes survive a rerun. |
| `--dry-run` | Prints the plan, writes nothing, needs no credentials. |
| `--upload-images` | Uploads each image to Sanity instead of recording its `/uploads/…` path. Off by default. Reads the file from `public/uploads/` — **to convert an existing dataset use `npm run sanity:images`, not this**, because this script reaches documents through `--replace`. |
| `--only=posts,legal` | Runs just those steps. Step names: `properties`, `settings`, `testimonials`, `rooms`, `experiences`, `packages`, `categories`, `pages`, `posts`, `legal`. The `pages` step is the one to rerun with `--replace` after editing a route's content file — it is a seed, and `createIfNotExists` would leave the published document as it was. |
| `--replace` | `createOrReplace` instead of `createIfNotExists` — **discards editor changes**. |

The `categories` step is the one that does not only create. It writes the seven
category documents *and* patches each post's `categories` field, because the
posts already exist and `createIfNotExists` would leave every one of them
untagged. It is a field patch rather than `--only=posts --replace` precisely so
a post keeps whatever an editor has since written into its body.

Every migrate script already ends in `--`, so one `--` from npm is enough:

```bash
npm run sanity:migrate:token -- --only=posts --replace
```

Without that trailing `--` in the script, `sanity exec` claims the flags as its own and rejects them rather than passing them to the migration.

Check the first line of output says the mode you expected before believing a `--replace` run did anything.

**Document ids must not contain a dot.** `safeId` joins with `-`, and that is
load-bearing rather than cosmetic. Sanity's default public grant is
`_id in path("*")`, which matches only single-segment ids — the same rule that
hides `drafts.foo`. With healthylook's `prefix.slug` convention, 57 of these 58
documents were invisible to every tokenless read on a dataset marked *public*;
only `siteSettings`, the one id without a dot, came back. Server rendering
never noticed because it reads with a token. What it silently breaks is Live
Content in the browser and any public API consumer.

**Two things this migration does deliberately.**

*Posts are stored as recovered blocks.* `src/components/property/postBlocks.ts` says its three recovery passes "are what a migration would run once", so the script runs `toArticleBlocks` and writes the result. The dry run confirms it lands as that file predicts — **9 FAQ blocks** ("nine of the seventeen posts"), **3 point lists** ("three posts write their points as marker punctuation") and **1 rate table** ("one table found, no false positives"). After this the listicles are real lists and the 88 question/answer pairs are real FAQ blocks in the CMS, not paragraph runs re-derived by heuristics on every render.

*Images are written as `/uploads/…` paths.* Every photograph and menu PDF is served by this site now (`public/uploads/`, see `next.config.ts` and CLAUDE.md); the migration records that path in `externalUrl` and uploads nothing, so a migrated page renders exactly what the code renders and an import that was only asked for content copies no files.

Moving one image into Sanity needs no migration and no code change — drop a file onto the image field in the Studio and the upload wins, because the resolver prefers an asset over `externalUrl`.

**To move them all, `npm run sanity:images`** (`npm run sanity:images:dry` first — it writes nothing and prints exactly what would change). Read `scripts/sanity/upload-images.mjs` before running it; the short version:

- It is **not** `migrate.ts --upload-images --replace`. That path rebuilds each document from `src/data/` and would discard every edit an author has made in the Studio since the import. This script reads whatever is published right now, adds an `asset` to the image objects inside it, and writes that same document back — so an editor's copy, a swapped heading, a reordered section all survive.
- **`externalUrl` is kept, never replaced.** The asset wins at render time; the path stays as a second line of defence. Nothing is deleted.
- **Idempotent**, keyed on `source.id`, so a rerun reuses assets and an interrupted run resumes. A field that already holds an editor's own upload is left alone. An image that cannot be read leaves that one field on its path and is named in the summary — a failure never blanks a field.
- A document whose images did not change is not written at all, so the publish webhook does not fire for documents that did not change.

One thing to expect: it writes ~72 documents, and each write fires the publish webhook, so the Cloudflare purge runs that many times. Harmless — the purges are idempotent — but the log is noisy.

## 4. How a page actually gets its content

Every route follows the same three steps, and every step has a fallback, which
is why the site never depends on the CMS being reachable.

```
route (page.tsx)
   │  await getRooms("ubud") / getPostByPath(...) / getPropertySite(...)
   ▼
src/sanity/lib/content.ts            ← the only place that asks "published yet?"
   │  sanityFetch(query, { tags })
   ▼
src/sanity/lib/client.ts
   │  1. Live Content  (live.sanityFetch)   — subscribes, updates without a deploy
   │  2. published API (fetchPublished)     — retried when Live is empty or fails
   │  3. null                               — both failed, or no project configured
   ▼
back in content.ts
      null or empty  →  return the src/data value unchanged
      documents      →  convert to the site's own types and return those
```

Three consequences worth holding onto:

- **An unpublished document is not an error.** `sanityFetch` returns `null`, and
  the resolver hands back `src/data`. That is why all 76 pages rendered
  byte-identically before a single document existed, and why they still do now.
- **The components never learned a second shape.** Conversion happens once, in
  `content.ts`, into the types the renderers already took (`RoomDetail`,
  `Post`, `PropertySite`). A renderer cannot tell where its data came from.
- **`getPropertySite` falls back field by field**, not document by document. A
  half-filled property keeps the phone number that page already showed.

### Cache invalidation

```
editor clicks Publish
   │
   ├── Sanity Live pushes to any open page               (seconds, no deploy)
   └── webhook → POST /api/revalidate/sanity
                    ├── revalidateTag("sanity:post:/ubud/…", { expire: 0 })
                    └── purgeCloudflare(…)               (only once a zone is configured)
```

A 60-second ISR fallback sits under both, so a webhook that never arrives
delays a change rather than freezing it.

Behind a live domain there is a **second** cache, and it has no such floor: the
Cloudflare edge answers most visitors without ever asking the origin, so
`revalidateTag` alone changes nothing for them. The same webhook drops the edge
copy in the same request — see **README-CLOUDFLARE.md**, which also carries the
zone's cache rules. With no zone configured that step reports `not-configured`
and this page is the whole story, exactly as before.

### Where a change lands

| You edit | The site picks it up |
|---|---|
| a document in `/studio` | on publish, via Live + webhook |
| `src/data/*.ts` | next build — it is the fallback, still live for anything unpublished |
| a schema in `src/sanity/schemaTypes` | after `npm run sanity:typegen` and a redeploy |

## 5. Editing model

| Document | Backs | Falls back to |
|---|---|---|
| **Page** | a new route at its own path, via an ordered `sections` array | 404 if unpublished |
| **Blog post** | all 17 posts, across every prefix | `src/data/posts.ts` |
| **Blog category** | the label on every blog card and article | `POST_CATEGORIES` in `src/data/posts.ts` |
| **Room or villa** | the 10 villa detail pages | `src/data/rooms.ts` |
| **Experience** | the 18 retreat / wellness / culture pages | `src/data/experiences.ts` |
| **Package set** | the romance packages, on both routes at once | `src/data/packages.ts` |
| **Testimonial** | the carousels | `src/data/testimonials.ts` |
| **Legal page** | Terms & Conditions, Privacy Policy | `src/data/legal.ts` |
| **Property** | header, footer, nav, contact, booking, awards | `src/data/properties.ts` |
| **Site settings** | site-wide defaults | `src/data/seo.ts` and constants |

Background and layout choices are controlled enums. Editors cannot enter CSS classes, scripts or unrestricted HTML.

Four modelling decisions worth knowing:

- **Image fields hold an upload, a path, or both.** `imageWithAlt` carries an optional `externalUrl` alongside the usual asset, and the resolver prefers the asset. Every field now holds both: the uploaded asset that renders, and the `/uploads/…` path it came from. That is what makes a photograph swappable in the Studio without a deploy — see section 3.
- **Blog categories are ours, not WordPress's.** The live site's taxonomy is two
  buckets — `ubud-news` (16 posts) and `seminyak-news` (2), no tags — which just
  restates `Post.property` and reads as nothing on a card. The seven categories
  here are topical, and every label reuses a word the site already navigates by
  ("Stay", "Wellness", "Retreat", "SPA", "Romance", "Explore Bali", "About Us"),
  so the blog gains a taxonomy without new brand copy. `toPost` passes whatever
  the CMS returns straight through rather than matching it against the file, so
  a category added or renamed in the Studio shows up on the card as authored.
- **Article bodies are typed blocks, not portable text.** `src/components/property/postBlocks.ts` says its `ArticleBlock` union "is the contract for the coming CRUD", and its three recovery passes exist only because the imported WordPress posts arrived flattened. Authoring `points`, `faq` and `price` blocks directly means those passes see correct blocks and let them through untouched — portable text would have meant flattening back to paragraphs and asking the heuristics to guess again.
- **`Property` fields fall back individually, not as a document.** It carries thirty unrelated values; a half-filled property must not blank the phone number in the footer of every page it owns.
- **Experiences keep `programs` tiers** rather than one flat inclusions list, for the reason `src/data/experiences.ts` gives: what you get depends on how long you stay, and flattening the tiers "lost the whole point of the section".

## 6. The page builder

A `page` document is an ordered `sections` array. `PageBuilder` switches on
`SanitySection` — the handwritten union in `src/sanity/types.ts` — and each
branch renders through a component the site already has, so a CMS page and a
hand-written route produce the same markup.

### Where a page document is served

```
src/app/[...slug]/page.tsx      catch-all, prerendered from published page paths
```

Next.js gives a static route priority over a catch-all, so this only ever
answers paths nothing else claims: all 44 existing routes keep serving their
own files, and `/` is excluded because `[...slug]` needs at least one segment.
Verified — with the catch-all in place, all 76 existing pages still render
byte-identically to the pre-Sanity build.

Chrome (header, footer, booking widget) stays per **property**, not per page:
the document's `property` field picks which one wraps it. That is the same
rule the legal pages already follow.

### Handing an existing route over

`ManagedPage` lets a route opt in one at a time. Wrap its JSX and nothing
changes until someone publishes a `page` at that path:

```tsx
<ManagedPage path="/ubud/spa" fallbackProperty="ubud">
  … the route's existing JSX …
</ManagedPage>
```

**Every hand-written route uses it — 31 of them, with a seeded `page`
document each.** Both About pages, both Stay/Villas, both Dining, both SPA, all
three Offers/Romance, both blog indexes, both Contact, plus Retreat, Luxury
Retreat, Host Your Retreat, Explore Bali, Culture, Wellness, Wedding and
Complimentary Services. Nothing hand-written is left outside the CMS.

**Seeding changed no page.** Verified by building before and after and diffing
the `<main>` of every one: identical text, identical photographs in identical
order. That is the point — the CMS took the pages over exactly as they were.

What made that possible is where the content lives. Each of these pages keeps
its constants in **`src/data/pages/<page>.ts`** (`HERO_IMAGES`, `DINING`,
`TREATMENTS`, the long intros…), the route imports them to render, and the
migration imports *the same constants* to seed. There is one copy, so a seeded
document cannot drift from the page it was seeded from. Constants had to leave
the route files for a plain reason: a Node script cannot import a module that
pulls in React or `server-only`.

Two pages needed a section type that did not exist, and both are worth knowing
about because the near-miss was tempting in each case:

- **`proseSection`** (Explore Bali's "You are in the Right Hands . . ."), which
  renders `ProseBand`. `richTextSection` looked like the answer and was not: it
  runs portable text at the `read` width (760px) where that band runs the page's
  `wide` container with the paragraphs capped at 62rem. Seeding with it would
  have narrowed a band nobody asked to change. Its `{email}` token is how the
  one linked address stays out of CMS copy — the property document supplies it.
- **`ctaSection`** for Host Your Retreat's closing "Get a Quote for your Event".
  This one *is* the existing type; the block wraps its content in
  `mx-auto max-w-2xl text-center` where the route did not, which changes nothing
  for a short centred heading and a single button, and the build diff confirms
  identical text and images.

Handing over a further route is three steps:

1. **Check every band on it has a section type.** The builder covers 22, but a
   hand-written page can still use a component with no section — the About band
   was one (`aboutNarrativeSection`), the Stay listing another
   (`roomListSection`), the contact body a third (`contactSection`). Add the
   missing type (schema → `schemaTypes/index.ts` → the `SanitySection` union →
   `PageBuilder` → a block in `ContentSections.tsx` that renders **the site's own
   component**, so the CMS page and the coded one produce the same markup).
2. **Move its constants to `src/data/pages/`** and import them back into the
   route.
3. **Wrap the route and seed its document** in the migration's `pages` step,
   then rebuild and diff `<main>` against the previous build before believing it.

### The 23 sections

| Section | Renders through |
|---|---|
| Hero | `PropertyHero` |
| About + Best Price Guaranteed | `AboutNarrative` |
| Room list (written here) | `RoomList` |
| Contact form + photograph | `ContactPanel` |
| Rich text | `SanityPortableText` |
| Heading + paragraphs | `ProseBand` |
| Text with image | grid + `SectionHeading` |
| Gallery | `ImageGallery` |
| Amenities | `AmenityGrid` |
| Card grid | `LinkCardGrid` |
| Collection | `RoomList` / `PostGrid` / `LinkCardGrid` / `TestimonialCarousel` |
| Packages | `PackageList` |
| Programme tiers | `ProgramList` |
| Spa menu | `TreatmentList` |
| Bullet list, Rate table | own markup, matching `PostBody`'s |
| FAQ | `FaqList` |
| Call to action | `SectionHeading` + `Button` |
| Enquiry form | `InquiryForm` |
| Awards, Deals, Instagram, Booking widget | their existing components |

**Collection sections list documents rather than restating them** — the
alternative was making an editor paste every room into every page that lists
it, which is the duplication the room documents exist to remove. Each branch
resolves through the same fallback layer as the routes.

### Seeing it work

```bash
npm run sanity:seed-demo
```

Publishes `/cms-renderer-test` exercising eight section types, including a
collection pulling three real Ubud rooms. Remove it with:

```bash
npm run sanity:seed-demo -- --remove
```

It is a demonstration, not content — do not leave it in a deployed dataset.

### What the CMS audit pass changed

The system above was already in place; this pass closed the gaps an editor
would actually hit. Seven of them were the same failure — content visible on
the website that could only be changed by editing a `.tsx` file.

**Every page is now a document.** The count went from 24 to **31**. The seven
that were missing: the three standalone enquiry forms
(`/spa-reservation-seminyak`, `/ubud-spa-booking-form`,
`/ubud-personalize-your-retreat`) and the four in-room / staff pages
(`/seminyak-directory`, `/ubud-directory`, `/suite-directory`,
`/welcomeaboard`). The four directories had been wrapped in `ManagedPage`
since they were built and never seeded, so the Pages list showed no trace of
the menus a guest reaches by scanning the QR code beside the bed. The forms
had never been wrapped at all: heading, submit label, confirmation and every
field label lived in the route.

**`siteSettings` was read by nothing.** `getSiteSettings()` existed and no
caller ever called it, so an editor could fill the document in and watch the
site ignore all of it — worse than having no document, because it looks like
it works. `PropertyFooter`, `HomeFooter`, `BookNowRibbon`,
`DirectBookingDeals` and the root layout read it now, and the document gained
the fields they need: the footer's column headings, its menu links, its logo,
the copyright line, the legal links, the Book Now tab label, and the
direct-booking offer.

**The promo bar's offer is content, not code.** "Direct Booking Deals 66% Off"
and `Code : "ilovenyuh"` were literals inside `DirectBookingDeals`, on a bar
that renders on all 78 pages — and the same code was already an editable field
on the About band, so the two could drift apart. `DirectBookingDeals` is now a
server component that resolves all three strings and renders the client bar
(`DirectBookingDealsBar`), which is presentation only.

**Paragraphs are rich text.** Nine fields moved from plain `text` /
`string[]` to the new `proseRichText`: the About narrative, the prose band,
the text-with-image band, four listing intros, the contact line and the CTA
body. They render through **`RichProse`**, which takes the band's *own*
paragraph classes and emits siblings with no wrapper — so one block produces
exactly the markup the band produced when this was a string, and the spacing
still comes from the wrapper the band draws. `proseRichText` offers H3/H4 (not
H2 — the band's own heading is the H2), lists, quotes, bold, italic and links.
`RichProse` accepts portable text, a string, *or* the `string[]` these fields
were, so a document published before the migration and the `src/data`
fallback both still render.

The `{email}` token survived the change. `substituteEmail` splits the span
holding it at render time and gives the middle piece a link mark, so the
address still comes from the property document and is never written into CMS
copy.

**Rich text where the design already has it.** `packageItem.description` and
`packageListSection.intro` became `inlineRichText` — one paragraph, with bold,
italic and links. Not full portable text, because both render inside a `<p>`
the layout draws and anything block-level there is invalid HTML. Bold was
already in the design: the in-room directory pages set their instructions in
it. `portableText` itself gained **H4** and internal-reference links.

**Internal links are references.** `link` and both rich-text types now take
either a reference to a published `page` / `post` / `room` / `experience` /
`legalPage`, or a typed path. `linkProjection` in `lib/queries.ts` resolves
the reference to a path in GROQ, so every renderer still sees one `href`
string and none of them learned a second shape.

**Heading levels are editable, within the one rule that matters.**
`headingLevelField` offers H2 / H3 / H4 on every band — the tag only, never
the size, so it changes the outline a screen reader and a search engine read
and nothing a sighted visitor sees. H1 is offered on exactly two section types
(`contactSection`, `inquiryFormSection`), which are the only ones that can be
a page's title, and `page.sections` warns when a document ends up with none or
with two.

**SEO gained the social pair and a canonical.** `seo` now carries `ogTitle`,
`ogDescription` and `canonicalUrl`, each falling back to the search pair and
to the page's own path.

**`npm run sanity:rich-text`** is the migration the rich-text change needed —
80 fields across 22 documents in two passes. It reads what is published and writes it back,
like `sanity:images` and unlike `--replace`, so editor changes survive; it is
idempotent, and it converts drafts too. Run `npm run sanity:rich-text:dry`
first.

**Nothing about the site moved — and diffing the raw markup proved three
things that were already wrong.** The check is to build twice, once against
the dataset and once with `NEXT_PUBLIC_SANITY_PROJECT_ID` emptied so every
route falls back to its own JSX, then diff `<main>`. Visible text and heading
tags matched on **78 of 78** pages from the first run, with one `<h1>` each.
Diffing the **raw markup** is what found the rest, and it is the check worth
repeating:

- **`amenityGridSection` drew a `<section>` inside a `<section>`.**
  `AmenityGrid` renders its own `Section`; the block wrapped it in another. So
  the Amenities band on both Stay pages carried twice the vertical padding,
  and on `/ubud/villa`, where the two tones differed, the outer band showed as
  a strip around the inner one. Neither the text nor the heading diff could
  see it.
- **Every anchored CMS section landed under the sticky header.** `Section`'s
  own doc said to pair `id` with a `scroll-mt-*` class, and only the
  hand-written tour route ever did — so `/seminyak/tour#tour-booking` worked
  and nothing authored in the Studio would have. `Section` applies it itself
  now whenever `id` is set.
- **One `inScope` field, read two ways.** `linkValue` defaults it to `true`,
  `ActionLink` and the `link` schema treat a missing one as in scope — and
  `PackageList` treated a missing one as *out* of scope. So two seeded pages
  linked where the coded page rendered inert text. Resolved in favour of
  linking, because `/ubud/fitness` is a route this project builds: both
  "Explore More" CTAs say `inScope: true` in `src/data` now, `PackageList`
  reads a missing flag the way everything else does, and
  `npm run sanity:fix-pages` put the published documents in step. Checked
  first that all **114** package CTAs in `src/data` state the flag explicitly,
  so aligning the reader changed nothing already rendered.

A fourth was mine: the four in-room pages render `AwardsRow` *outside*
`ManagedPage`, so the `awardsSection` seeded into them drew a second strip.
Also fixed by `sanity:fix-pages`.

After all of it: visible text identical on **78 of 78**, and raw `<main>`
markup identical on **76 of 78** once image URLs are normalised (the CMS build
serves the uploaded Sanity asset, the fallback the `/uploads` path it was
seeded from — same photograph). The two that remain are known and harmless:
`ctaSection`'s extra `mx-auto max-w-2xl text-center` wrapper on Host Your
Retreat, documented above, and one blog post whose Sanity body orders a
paragraph and an image differently from `src/data/posts.ts`.

## 7. Preview and publishing

The Presentation tool loads `SANITY_STUDIO_PREVIEW_ORIGIN` and enables Next.js Draft Mode through `/api/draft-mode/enable`.

Published changes are picked up by Sanity Live. A webhook gives immediate, deterministic invalidation; the 60-second ISR fallback means a missed webhook delays content rather than freezing it:

- URL: `https://nyuhbalivillas.com/api/revalidate/sanity`
- Method: `POST`
- Header: `Authorization: Bearer <SANITY_REVALIDATE_SECRET>` — a **custom HTTP
  header**, not the "Secret" field above it. That field signs the payload with
  `sanity-webhook-signature`, which this route does not read, so filling it in
  instead of the header authenticates nothing.
- Filter — **not optional, and an empty one is worse than it looks**:

  ```groq
  !(_id in path("drafts.**")) && _type in ["page","post","room","experience","packageSet","testimonial","legalPage","property","siteSettings","category"]
  ```

  With no filter the webhook fires on *every* document change in the dataset,
  and that includes drafts. A draft is written as an editor types, so the Studio
  turns into a stream of POSTs from a datacentre to `/api/` — each one purging
  the zone while the editor is still writing the sentence. Which is also a fair
  description of what bot protection exists to stop, so the empty filter is a
  candidate for deliveries being dropped rather than merely wasteful.
- Projection:

  ```groq
  {
    _type,
    path,
    property,
    "slug": slug.current
  }
  ```

`property` is in the projection because a room or experience slug is only unique within a property, so it joins the cache tag.

Trigger it for create, update and delete on `page`, `post`, `room`, `experience`, `packageSet`, `testimonial`, `legalPage`, `property` and `siteSettings`.

Confirm the webhook exists with `npm run sanity -- hook list`. An empty result means there is no instant production invalidation yet.

**Confirm it is *arriving*, which is a different question and the one that went unasked.** A webhook can be present, enabled and correctly configured and still never reach the site. The test that settles it takes a minute: change one field in a document, then watch the live page's `cf-cache-status` and `age` without purging anything. An `age` that keeps climbing means no purge happened, so no webhook arrived. Compare against calling the endpoint by hand with the same secret — if that answers 200 and purges, the route is fine and the delivery is the problem: look at the webhook's own attempt log in sanity.io/manage, and at Cloudflare's bot protection in front of `/api/` (README-CLOUDFLARE.md §7).

`/api/purge/sweep` is the net under all of this — see README-CLOUDFLARE.md §5.

## 8. `dynamicParams` and the CMS

The room, experience, post **and CMS-page** routes are catch-alls. Each builds its prerender list from `getRooms` / `getExperiences` / `getPostPaths` / `getSanityPagePaths`, which return Sanity's documents when they exist and `src/data`'s otherwise.

**All ten now carry `dynamicParams = true`, so creating a document is as instant as editing one.** It was `false`, and that made `generateStaticParams` authoritative: a document published after the last build had no route and 404d until somebody redeployed. Editing was already instant through Live Content and the webhook; only *adding* needed a developer, which on a site whose Vercel account one person holds meant the client could not add a room or a blog post at all. The paragraph this replaces proposed exactly this change and named the trade — an unknown path renders on demand instead of 404ing at the edge — and that trade was taken deliberately.

Two things did not change. **Nothing new can render**: every one of those routes already called `notFound()` for a slug with no document behind it, which is what makes the flip safe, and the flip was verified against a production server rather than assumed. **The build still prerenders exactly what it did** — `true` adds a fallback for slugs the build did not know about; it does not move anything out of the build. The raw `<main>` markup of all 79 prerendered pages is byte-identical across the change.

What still needs a deploy: anything in code — a new section type, a design change, a new route *shape*. And a **post** published under a prefix no route file covers still 404s, because the root catch-all answers `page` documents, not posts (`/ubud/discover/`, `/seminyak/discover/`, `/ubud/discoverl/` and `/ubud/spa/` are the four prefixes that have one). `src/app/sitemap.ts` knows this and refuses to advertise such a post.

## 9. Type safety

Schema modules live in `src/sanity/schemaTypes`, queries in `src/sanity/lib/queries.ts`, handwritten runtime contracts in `src/sanity/types.ts`, and the fallback layer in `src/sanity/lib/content.ts`.

After changing a schema or a GROQ projection, regenerate:

```bash
npm run sanity:typegen
```

That extracts `src/sanity/schema.json` and writes `src/sanity/types.generated.ts`, **validating every GROQ query against the schema as it goes** — it is the fastest way to catch a projection that no longer matches its document. Then run:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

`src/sanity/types.generated.ts` is machine-written; `eslint.config.mjs` exempts it from `no-empty-object-type` rather than hand-patching output that regeneration would overwrite.

## 10. Not done yet, and deliberately not done

- ~~**No route uses `ManagedPage`.**~~ **Superseded:** all 31 hand-written
  routes use it and each has a seeded document.
- **New CMS pages need a redeploy** to be reachable — see section 8 for the one-line change that removes that constraint.
- ~~**Section intros and paragraph arrays stay plain text.**~~
  **Superseded:** all nine are `proseRichText` now — see above. The concern
  that made them plain (that rich text would change the markup of bands nobody
  asked to change) was answered by `RichProse` taking the band's own classes
  rather than bringing its own.
- **FAQ answers stay plain text.** `FaqEntry` renders an answer as a string
  inside a `<details>`, and `src/data/experiences.ts` holds 88 of them that
  way. Converting would mean migrating the fallback data as well as the CMS,
  for a field that is one short paragraph by design.
- **`experience` and `room` descriptions stay plain text** for the same
  reason, with one extra: `ExperienceDetailBody` renders six different kinds
  of structured block (`sections`, `blocks`, `programs`, `highlights`, `team`)
  in the live pages' own order. That structure *is* the formatting, and it is
  already editable field by field.
- **Article bodies stay typed `ArticleBlock`s**, not portable text — see the
  note in section 5.
- **No per-section layout or spacing controls.** `tone` and `columns` exist
  because the site already alternates them. Anything further would let an
  editor break the band rhythm documented in DESIGN.md, which is measured to
  the pixel.
- **`UBUD_OFFER_QUOTES`** stays in `src/data/packages.ts`. It is a curated set for the offers pages, distinct from the general Ubud testimonials, and folding the two together would change what renders.
- ~~The migration's `--upload-images` path has never been run.~~ **Superseded:** the dataset's 301 photographs were uploaded with `npm run sanity:images` (580 image fields across 72 documents). `migrate.ts --upload-images` remains dry-run verified only, and is the wrong tool for an existing dataset anyway — see section 3.
