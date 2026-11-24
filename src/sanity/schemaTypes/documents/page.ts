import { defineArrayMember, defineField, defineType } from "sanity";

async function isUniquePath(
  path: string | undefined,
  context: {
    document?: { _id?: string };
    getClient: (options: { apiVersion: string }) => {
      fetch: <T>(query: string, params: Record<string, string>) => Promise<T>;
    };
  },
) {
  if (!path) return true;
  const id = context.document?._id?.replace(/^drafts\./, "") || "";
  const duplicate = await context.getClient({ apiVersion: "2025-02-19" }).fetch<string | null>(
    `*[_type == "page" && path == $path && !(_id in [$id, $draftId])][0]._id`,
    { path, id, draftId: `drafts.${id}` },
  );
  return duplicate ? "Another page already uses this website path." : true;
}


/**
 * Exactly one `<h1>` per page, checked where the rule actually holds.
 *
 * A hero always produces one; the contact body, the enquiry form and the
 * packages band do when their heading level says so. Every other section is
 * capped at H2 by `headingLevelField`, so this is the whole of the rule.
 *
 * The homepage is the one exception: it carries the property picker and no
 * `<h1>` at all, by decision. See `PropertyPanel`.
 *
 * It is a **warning, not an error**, for one reason: it must not be able to
 * block an editor from saving a page that is mid-edit — a hero deleted before
 * its replacement is added would otherwise lock the document. The message
 * names which sections are competing, which is the part that is hard to work
 * out by reading the page.
 */
function countPageTitles(sections: unknown): true | string {
  if (!Array.isArray(sections)) return true;
  const titles = sections.filter((section) => {
    const s = section as { _type?: string; headingLevel?: string; isHidden?: boolean };
    if (s?.isHidden) return false;
    if (s?._type === "heroSection") return true;
    if (s?._type === "contactSection") return (s.headingLevel ?? "h1") === "h1";
    if (s?._type === "inquiryFormSection") return s.headingLevel === "h1";
    // The in-room pages have no hero: their packages band carries the <h1>.
    // Left out, this warned "no main heading" on the four pages that do have
    // one — a warning that teaches an editor to ignore warnings.
    if (s?._type === "packageListSection") return s.headingLevel === "h1";
    return false;
  });
  if (titles.length === 1) return true;
  // The homepage. Asking an editor for a main heading here would undo the
  // decision that it has none.
  const isPicker = sections.some((section) => {
    const s = section as { _type?: string; isHidden?: boolean };
    return s?._type === "propertyPickerSection" && !s.isHidden;
  });
  if (titles.length === 0 && isPicker) return true;
  const names = titles.map((section) => (section as { _type?: string })._type).join(", ");
  if (titles.length === 0) {
    return "This page has no main heading. Add a hero, or set the contact or enquiry section's heading level to H1.";
  }
  return `This page has ${titles.length} main headings (${names}). Search engines expect exactly one — lower all but one to H2.`;
}

const sectionMembers = [
  "heroSection",
  "propertyPickerSection",
  "aboutNarrativeSection",
  "richTextSection",
  "proseSection",
  "splitContentSection",
  "gallerySection",
  "amenityGridSection",
  "linkCardGridSection",
  "collectionSection",
  "roomListSection",
  "packageListSection",
  "programListSection",
  "treatmentListSection",
  "bulletListSection",
  "priceTableSection",
  "faqSection",
  "ctaSection",
  "inquiryFormSection",
  "contactSection",
  "awardsSection",
  "dealsSection",
  "instagramSection",
  "bookingWidgetSection",
].map((type) => defineArrayMember({ type }));

export const page = defineType({
  name: "page",
  title: "Page",
  type: "document",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Internal page name",
      type: "string",
      group: "content",
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: "path",
      title: "Website path",
      type: "string",
      group: "content",
      description: "Use / for the homepage or a complete path such as /ubud/spa.",
      validation: (Rule) =>
        Rule.required().custom(async (value, context) => {
          if (!value) return true;
          if (!value.startsWith("/")) return "The path must begin with /.";
          if (value.length > 1 && value.endsWith("/")) return "Remove the trailing /.";
          if (value.includes("?") || value.includes("#"))
            return "Do not include query strings or anchors.";
          return isUniquePath(value, context);
        }),
    }),
    defineField({
      name: "property",
      title: "Property chrome",
      type: "string",
      group: "content",
      description:
        "Which property's header, footer and booking links wrap this page. Terms and Privacy both use Ubud's, as the live site does.",
      options: {
        layout: "radio",
        list: [
          { title: "Seminyak", value: "seminyak" },
          { title: "Ubud", value: "ubud" },
        ],
      },
    }),
    defineField({
      name: "sections",
      title: "Page sections",
      type: "array",
      group: "content",
      of: sectionMembers,
      // Two rules, not one chain: `.warning()` applies to everything before
      // it, so chaining the heading check onto `.required()` would have
      // downgraded "a page needs at least one section" to a warning too.
      validation: (Rule) => [
        Rule.required().min(1),
        Rule.warning().custom(countPageTitles),
      ],
      options: { insertMenu: { views: [{ name: "grid" }, { name: "list" }] } },
    }),
    defineField({ name: "seo", title: "Search and social", type: "seo", group: "seo" }),
  ],
  preview: {
    select: { title: "title", subtitle: "path" },
  },
  orderings: [
    {
      title: "Website path",
      name: "pathAsc",
      by: [{ field: "path", direction: "asc" }],
    },
  ],
});
