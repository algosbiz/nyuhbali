import { defineArrayMember, defineField, defineType } from "sanity";
import { hiddenOnlySettingsFields } from "./shared";

/**
 * One half of the homepage's Seminyak/Ubud picker: a full-height photograph
 * with the property's name and its paragraph over the bottom of it.
 */
export const propertyPanel = defineType({
  name: "propertyPanel",
  title: "Property panel",
  type: "object",
  fields: [
    defineField({
      name: "name",
      title: "Property name",
      type: "string",
      description: "Set at display scale over the photograph — one or two words.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 4,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "image",
      title: "Photograph",
      type: "imageWithAlt",
      description: "Fills the whole panel, so a landscape shot with room at the bottom works best.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "href",
      title: "Links to",
      type: "string",
      description: 'A path on this site, starting with a slash — "/seminyak" or "/ubud".',
      validation: (Rule) =>
        Rule.required().custom((value) =>
          typeof value === "string" && value.startsWith("/")
            ? true
            : "Start the path with a slash.",
        ),
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "href", media: "image" },
  },
});

/**
 * The homepage, and the only section it has.
 *
 * Home was the one hand-written route never handed to the Studio — the other
 * 23 all have a `page` document, and an editor looking for "the page where you
 * pick which resort" found nothing in the Pages list. It was left out because
 * it is the one route with no property: its chrome is `HomeHeader`/
 * `HomeFooter`, not a resort's, so none of the per-property sections apply.
 *
 * Both panels live in **one** section rather than one section each, because
 * the page is a single choice rather than a stack of bands. Adding a third
 * property is then just a third entry. Every panel's name is an `<h2>`: the
 * properties are equal, so none of them is the page's title and the homepage
 * has no `<h1>` on purpose (see `PropertyPanel`).
 */
export const propertyPickerSection = defineType({
  name: "propertyPickerSection",
  title: "Property picker (homepage)",
  type: "object",
  fields: [
    defineField({
      name: "panels",
      title: "Panels",
      type: "array",
      of: [defineArrayMember({ type: "propertyPanel" })],
      description:
        "Shown side by side on a desktop and stacked on a phone, in this order.",
      validation: (Rule) => Rule.required().min(1).max(4),
    }),
    // No background field: both panels are full-bleed photographs, so there
    // is no band colour behind them to choose.
    ...hiddenOnlySettingsFields,
  ],
  preview: {
    // Three path segments, not four: `panels.0.image.asset` is one level too
    // deep for a preview select and the Studio rejects the whole config with
    // "Invalid preview config". `items.0.image` in linkCardGridSection is the
    // working shape — select the image field itself and let Sanity resolve it.
    select: { panels: "panels", media: "panels.0.image" },
    prepare: ({ panels, media }) => {
      const names = (panels as { name?: string }[] | undefined)
        ?.map((panel) => panel?.name)
        .filter(Boolean);
      return {
        title: "Property picker",
        subtitle: names?.length ? names.join(" · ") : "No panels yet",
        media,
      };
    },
  },
});
