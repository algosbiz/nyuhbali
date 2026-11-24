// ======================================================
// Page content: / (Home — the Seminyak/Ubud picker)
//
// Lives here rather than in the route for the reason CLAUDE.md gives for the
// other pages: the Sanity migration imports these same constants to seed the
// page's document, so the CMS copy cannot drift from the page it was seeded
// from. A plain Node script cannot import a module that pulls in React, so as
// long as this sat next to the component it could not be read.
// ======================================================

/** One panel of the picker — the shape `PropertyPanel` takes, minus
 *  `priority`, which the page derives from position. */
export type HomePanel = {
  name: string;
  description: string;
  imageSrc: string;
  href: string;
};

/**
 * The two properties, in the order they appear left to right.
 *
 * Copy is verbatim from the live homepage, double space in Seminyak's first
 * line included — CLAUDE.md's rule is that wording is not the redesign's to
 * change, and this is content, not a typo to tidy.
 */
export const HOME_PANELS: HomePanel[] = [
  {
    name: "Seminyak",
    description:
      "Experience romantic ambiance in our  Seminyak honeymoon villa that ready to pamper you and your loved one. Enjoy the personalized service from our team and signature Nyuh amenities for your memorable honeymoon.",
    imageSrc:
      "/uploads/2023/03/home-seminyak.webp",
    href: "/seminyak",
  },
  {
    name: "Ubud",
    description:
      "A sanctuary for relaxation and wellness, our Ubud resort is an ideal journey to recharge your body and mind. We invite you to experience our luxury retreat in Ubud to find tranquility, balance, and inner peace.",
    imageSrc:
      "/uploads/2025/01/home-ubud-compress.webp",
    href: "/ubud",
  },
];
