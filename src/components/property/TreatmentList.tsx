import Image from "next/image";
import { Section, type BandTone } from "@/components/ui/Section";
import { SectionHeading, type HeadingLevel } from "@/components/ui/SectionHeading";
import { RichProse, type ProseValue } from "@/components/sanity/RichProse";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { ChevronIcon } from "@/components/ui/icons";

export type Treatment = {
  name: string;
  /** Most treatments are offered at one duration; several have two or three,
   * each with its own price and its own booking link. */
  options: { label: string; href: string }[];
  description: string;
  /** What a multi-step package contains ("Balinese Massage", "Coconut Body
   * Scrub", …). Only the Ubud spa's package tiers carry these. */
  includes?: string[];
};

export type TreatmentCategory = {
  /** "MASSAGE", "SELF INDULGENCE", "COUPLE" — the live page's own tab labels. */
  name: string;
  image?: string;
  treatments: Treatment[];
};

type TreatmentListProps = {
  /** Button and section wording from Site settings. Optional, so the
   * component keeps the string it shipped with when nothing is set. */
  bookNowLabel?: string;
  eyebrow?: string;
  heading: string;
  /** Which tag this band's heading is written as. The size never changes —
   * see HeadingLevel. Editors set it per section in the CMS. */
  headingAs?: HeadingLevel;
  intro?: ProseValue;
  /** Short facts under the intro — opening hours, the early-booking discount. */
  notes?: string[];
  categories: TreatmentCategory[];
  /** The page's closing "Reserve Now" action. */
  cta?: { label: string; href: string };
  tone?: BandTone;
  /** Optional id so a link can jump to this band. `Section` adds the
   * scroll-mt that clears the sticky header whenever this is set. */
  anchor?: string;
};

/**
 * The spa treatment menu — a price list, which is a different shape from the
 * package/room listings and so gets its own component rather than being forced
 * through `PackageList`.
 *
 * **Categories are an accordion, collapsed by default.** The live page splits
 * its ~40 treatments behind menu tabs — Massage, Body Treatment, Hair Therapy,
 * and so on — so a visitor sees seven short labels, not every price and
 * description at once. Rendering every category fully expanded (the previous
 * approach) put the whole menu — every duration, price, and paragraph — on the
 * page at once, which made the section read as far longer than the rest of the
 * site's pages. A native `<details>/<summary>` per category (the same
 * mechanism `FaqAccordion` uses, for the same reasons: no JS required to open,
 * keyboard- and screen-reader-accessible for free, and the content still ships
 * in the server HTML so it stays indexable whether or not a visitor ever clicks)
 * gets back to "seven labels, click one to see its treatments" without losing
 * any content.
 *
 * Individual treatments inside an unopened category are not wrapped in
 * `Reveal`: closed `<details>` content has no layout box until it's opened, and
 * `Reveal`'s fold check reads a zero-size box as "already past the fold" —
 * untested territory that `FaqAccordion` sidesteps by only ever animating the
 * row, not what's inside it. This does the same: the category row animates in
 * on scroll, and what's inside it appears instantly once a visitor opens it.
 *
 * **Prices are rows, not buttons.** Each treatment offers one or two
 * duration/price options and the live page puts a "Book Now" beside every one
 * of them. Rendering ten CTA buttons down a page would break the site's rule
 * that there is one button treatment and it means "the main action here", so
 * the per-option links are set as gold text on hairline-divided rows — the same
 * treatment as the perk list on the offer plate — and the section's single
 * solid Button is the closing "Reserve Now".
 */
export function TreatmentList({
  eyebrow,
  heading,
  headingAs = "h2",
  intro,
  notes,
  categories,
  cta,
  tone = "sand",
  bookNowLabel = "Book Now",
  anchor,
}: TreatmentListProps) {
  return (
    <Section tone={tone} id={anchor}>
      <SectionHeading eyebrow={eyebrow} title={heading} as={headingAs} />

      {intro ? (
        <Reveal delay={80}>
          <RichProse
            value={intro}
            paragraphClassName="max-w-[62rem] text-[17px] leading-[1.7] font-light text-text"
            firstClassName="mt-8"
            restClassName="mt-4"
          />
        </Reveal>
      ) : null}

      {notes?.length ? (
        <Reveal delay={120}>
          <ul className="mt-5 flex flex-col gap-1.5">
            {notes.map((note) => (
              <li
                key={note}
                className="text-eyebrow font-body text-primary-deep uppercase"
              >
                {note}
              </li>
            ))}
          </ul>
        </Reveal>
      ) : null}

      <div className="mt-10 flex flex-col border-t border-ink/10 md:mt-12">
        {categories.map((category, categoryIndex) => (
          <Reveal key={category.name} delay={categoryIndex * 60}>
            <details className="group/cat border-b border-ink/10">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 [&::-webkit-details-marker]:hidden">
                <div className="flex items-center gap-4 md:gap-5">
                  {category.image ? (
                    <span className="relative h-16 w-16 shrink-0 overflow-hidden md:h-24 md:w-24">
                      <Image
                        src={category.image}
                        alt=""
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </span>
                  ) : null}
                  <div>
                    <h3 className="font-heading text-[19px] leading-tight font-light text-ink md:text-[26px]">
                      {category.name}
                    </h3>
                    <span className="text-eyebrow font-body mt-1.5 block text-primary-deep uppercase">
                      {category.treatments.length} treatments
                    </span>
                  </div>
                </div>

                <ChevronIcon
                  aria-hidden
                  className="h-3 w-3 shrink-0 rotate-90 text-primary transition-transform duration-300 group-open/cat:-rotate-90"
                />
              </summary>

              <div className="grid gap-x-12 gap-y-9 pb-9 lg:grid-cols-2">
                {category.treatments.map((treatment) => (
                  <article key={treatment.name}>
                    <h4 className="font-heading text-[20px] leading-tight font-light text-ink">
                      {treatment.name}
                    </h4>

                    <ul className="mt-3 flex flex-col divide-y divide-ink/10 border-y border-ink/10">
                      {treatment.options.map((option) => (
                        <li
                          key={option.label}
                          className="flex flex-wrap items-center justify-between gap-3 py-2.5"
                        >
                          <span className="text-[15px] font-light text-text">
                            {option.label}
                          </span>
                          <a
                            href={option.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-eyebrow font-body text-primary-deep uppercase underline decoration-primary/40 underline-offset-[5px] transition-colors duration-300 hover:decoration-primary"
                          >
                            {bookNowLabel}
                          </a>
                        </li>
                      ))}
                    </ul>

                    {/* One item per row on a phone, packed inline from `sm`.
                        Wrapping these freely at 335px produced a ragged
                        1/1/2/2/1 zigzag — the long steps ("Full Body Lymphatic
                        Drainage Massage") take a row to themselves and leave
                        the short ones pairing up behind them, so no two gold
                        dashes line up. A column reads as the list of steps it
                        is, and it is the same treatment `PackageList` already
                        gives its benefits list: one column on a phone, several
                        across from `sm`. Above `sm` the run still packs 3–4 to
                        a row and fills the column, so the inline flow is kept
                        there. The dash is top-aligned rather than centred
                        because several steps are long enough to wrap ("Healthy
                        Green Juice (spinach, pineapple, apple, cucumber)"), and
                        a centred dash on a two-line item floats between the
                        lines. */}
                    {treatment.includes?.length ? (
                      <ul className="mt-3 flex flex-col gap-y-1 sm:flex-row sm:flex-wrap sm:gap-x-4">
                        {treatment.includes.map((step) => (
                          <li
                            key={step}
                            className="flex gap-2 text-[13px] leading-relaxed font-light text-text"
                          >
                            <span
                              aria-hidden
                              className="mt-2.5 block h-px w-2 shrink-0 bg-primary"
                            />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    <p className="mt-3 text-[15px] leading-relaxed font-light text-text">
                      {treatment.description}
                    </p>
                  </article>
                ))}
              </div>
            </details>
          </Reveal>
        ))}
      </div>

      {cta ? (
        <Reveal delay={120}>
          <div className="mt-10">
            <Button href={cta.href} external>
              {cta.label}
            </Button>
          </div>
        </Reveal>
      ) : null}
    </Section>
  );
}
