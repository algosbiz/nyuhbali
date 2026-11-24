import type { FieldDefinition } from "sanity";
import { defineField } from "sanity";

/**
 * "Hide this section", on its own.
 *
 * For the bands that draw no `Section` of their own and so have nothing to
 * hang an id on — the hero and the property picker are full-bleed
 * photography, the awards strip and the booking widget draw their own
 * surface, and the deals bar is fixed to the viewport. Offering an anchor
 * there put an ID field in the Studio that reached no element: a link to it
 * would simply not jump, with nothing to say why.
 */
export const hiddenOnlySettingsFields: FieldDefinition[] = [
  defineField({
    name: "isHidden",
    title: "Hide this section",
    type: "boolean",
    initialValue: false,
    description: "Keeps the content in the document without rendering it on the website.",
  }),
];

export const sectionSettingsFields: FieldDefinition[] = [
  defineField({
    name: "anchor",
    title: "Section anchor",
    type: "string",
    description: "Optional ID for links such as /ubud/spa#treatments. Letters, numbers, and hyphens only.",
    validation: (Rule) =>
      Rule.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { invert: false }).warning(
        "Use lowercase words separated by hyphens.",
      ),
  }),
  defineField({
    name: "isHidden",
    title: "Hide this section",
    type: "boolean",
    initialValue: false,
    description: "Keeps the content in the document without rendering it on the website.",
  }),
];

/**
 * The band's background colour.
 *
 * **Three, and deliberately not four.** `Section` also renders `ink`, the dark
 * brown, and that one is not offered here: the design puts dark in the chrome
 * and the frame, never in a page band, and the whole-site audit checks it —
 * `main > section` with a background of `rgb(38, 30, 19)` must be 0. An editor
 * given the option would break that with one click and nothing would say so.
 * The dark shapes that do exist (the "Best Price Guaranteed" plate, the awards
 * base, the footer) are drawn by their own components, not by this field.
 *
 * The labels name the colour rather than the token. "Sand" and "Deep sand" are
 * what `globals.css` calls them and what the code passes through, but they are
 * not what someone choosing a background is looking at.
 */
export const toneField = defineField({
  name: "tone",
  title: "Background colour",
  type: "string",
  options: {
    layout: "radio",
    list: [
      { title: "Warm white — the usual band", value: "sand" },
      { title: "Warm beige — for the band between two warm-white ones", value: "sand-deep" },
      { title: "Plain white — brightest, used sparingly", value: "white" },
    ],
  },
  initialValue: "sand",
  description:
    "Bands normally alternate warm white and warm beige down the page so each one reads as its own section. Two of the same colour in a row look like one long band.",
});

export const eyebrowField = defineField({
  name: "eyebrow",
  title: "Eyebrow",
  type: "string",
  description: "Small letter-spaced label above the heading.",
});

/**
 * How a section's heading is marked up — **not** how large it looks.
 *
 * The size is the design's, and stays the design's: `SectionHeading` sets
 * every band heading in the same `text-section` scale whichever tag it uses,
 * so choosing H3 changes the document outline a screen reader and a search
 * engine read, and changes nothing a sighted visitor sees. That is the point
 * — a subsection that looks like a band but sits *under* the band above it
 * should say so.
 *
 * **H1 is not offered.** A page's `<h1>` is its hero or its opening section,
 * every page but the homepage has exactly one, and the whole-site audit
 * checks that. Letting a band claim one is the single easiest way for an
 * editor to break page structure without seeing anything change, so the
 * ladder starts at H2.
 * `page.sections` validates the other half of the same rule — that a page
 * carries exactly one section capable of producing an `<h1>`.
 */
export const headingLevelField = defineField({
  name: "headingLevel",
  title: "Heading level",
  type: "string",
  options: {
    layout: "radio",
    list: [
      { title: "H2 — a section of the page", value: "h2" },
      { title: "H3 — part of the section above", value: "h3" },
      { title: "H4 — part of the H3 above", value: "h4" },
    ],
  },
  initialValue: "h2",
  description:
    "Affects the page outline for search engines and screen readers, not the size on screen. Leave on H2 unless this band belongs under the one before it.",
});

/**
 * The same control for the two sections that can legitimately carry a page's
 * `<h1>`: the contact body (whose heading *is* the contact page's title) and
 * the enquiry form (which is the only heading on each of the three standalone
 * form pages).
 *
 * H1 is offered here and nowhere else, and `page.sections` validates that a
 * document ends up with exactly one section producing one — so the invariant
 * is enforced at the level it actually holds at, the page, rather than by
 * hoping no two sections claim it.
 */
export function pageHeadingLevelField(initial: "h1" | "h2") {
  return defineField({
    name: "headingLevel",
    title: "Heading level",
    type: "string",
    options: {
      layout: "radio",
      list: [
        { title: "H1 — this is the page's title", value: "h1" },
        { title: "H2 — a section of the page", value: "h2" },
        { title: "H3 — part of the section above", value: "h3" },
      ],
    },
    initialValue: initial,
    description:
      "Affects the page outline for search engines and screen readers, not the size on screen. Use H1 only when this is the page's own title — a page with a hero already has one.",
  });
}
