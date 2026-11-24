import Image from "next/image";
import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { FaqAccordion, type FaqEntry } from "@/components/property/FaqAccordion";
import {
  parseInline,
  toArticleBlocks,
  type ArticleBlock,
  type PointItem,
} from "@/components/property/postBlocks";
import type { Post, PostBlock } from "@/data/posts";
import { PROPERTY_NAMES } from "@/data/schema/shared";

/**
 * A rate table inside an article.
 *
 * A real `<table>`, because it is one — the money column has to be readable
 * against its row, which is exactly what a table gives for free and what the
 * flattened paragraph run it was imported as destroyed. The money column is
 * right-aligned and set in `ink`, so the eye can run down it; everything else
 * stays body copy. The wrapper scrolls rather than the page if a narrow phone
 * can't fit three columns.
 */
function PriceTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div className="mt-8 overflow-x-auto">
      <table className="w-full min-w-[20rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-ink/15">
            {columns.map((column, index) => (
              <th
                key={column}
                scope="col"
                className={`text-eyebrow font-body pb-3 font-normal text-primary-deep uppercase ${
                  index === columns.length - 1 ? "text-right" : ""
                }`}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join("|")} className="border-b border-ink/10">
              {row.map((cell, index) => {
                const isLast = index === columns.length - 1;
                return (
                  <td
                    key={index}
                    className={`py-3 text-[15px] leading-snug font-light md:text-[16px] ${
                      isLast
                        ? "pl-4 text-right font-normal whitespace-nowrap text-ink"
                        : index === 0
                          ? "pr-4 text-ink"
                          : "pr-4 text-text"
                    }`}
                  >
                    {cell}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A recovered FAQ section, set as its own titled block inside the article. */
function ArticleFaq({ heading, items }: { heading: string; items: FaqEntry[] }) {
  return (
    <section className="mt-12 md:mt-14">
      <h2 className="font-heading text-[24px] leading-[1.2] font-light text-balance text-ink md:text-[29px]">
        {heading}
      </h2>
      <div className="mt-6">
        {/* No stagger: the article is already revealing section by section, and
            a second entrance on top of that reads as a page still loading. */}
        <FaqAccordion faqs={items} animate={false} />
      </div>
    </section>
  );
}

/** Body text with the source's `[link:…]` shorthand resolved to real links. */
function InlineText({ text }: { text: string }) {
  const segments = parseInline(text);

  return (
    <>
      {segments.map((segment, index) =>
        segment.kind === "text" ? (
          segment.text
        ) : segment.external ? (
          <a
            key={index}
            href={segment.href}
            target="_blank"
            rel="noreferrer"
            className="text-primary-deep underline decoration-primary/40 underline-offset-[5px] transition-colors duration-300 hover:decoration-primary"
          >
            {segment.text}
          </a>
        ) : (
          <Link
            key={index}
            href={segment.href}
            className="text-primary-deep underline decoration-primary/40 underline-offset-[5px] transition-colors duration-300 hover:decoration-primary"
          >
            {segment.text}
          </Link>
        ),
      )}
    </>
  );
}

/**
 * `articleBlocks` is what a Sanity-authored post carries: the editor picks
 * `points`, `faq` and `price` blocks directly, so there is nothing to
 * recover. A post still coming from src/data has only `blocks`, and the
 * recovery passes run over it as before.
 */
type PostBodyProps = {
  /** The wording of the link back to the index, from Site settings. */
  blogLabel?: string; post: Post & { articleBlocks?: ArticleBlock[] } };

/** "2024-06-18" -> "18 June 2024". Fixed locale so the server and the client
 * can't disagree about the format and trigger a hydration mismatch. */
export function formatPostDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

const wordsIn = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

/**
 * Every word the article actually publishes, whatever shape it is stored in.
 *
 * It has to walk the recovered blocks, not just the flat ones: a post whose
 * listicle is a `points` block or whose tail is a `faq` block keeps all that
 * copy inside those structures. Counting only the flat kinds made the same
 * article read as "4 min" from the CMS and "6 min" from src/data — the words
 * had not gone anywhere, the counter had simply stopped looking at them.
 */
function countWords(blocks: ArticleBlock[]): number {
  return blocks.reduce((total, block) => {
    switch (block.kind) {
      case "image":
        return total;
      case "list":
        return total + wordsIn(block.items.join(" "));
      case "points":
        return (
          total +
          block.items.reduce(
            (sum, item) => sum + wordsIn(item.label) + countWords(item.body),
            0,
          )
        );
      case "faq":
        return (
          total +
          wordsIn(block.heading) +
          block.items.reduce(
            (sum, item) => sum + wordsIn(item.question) + wordsIn(item.answer),
            0,
          )
        );
      case "price":
        return (
          total +
          wordsIn(block.columns.join(" ")) +
          block.rows.reduce((sum, row) => sum + wordsIn(row.join(" ")), 0)
        );
      default:
        return total + wordsIn(block.text);
    }
  }, 0);
}

/** Derived from the post's own words — metadata, not written copy. 200 wpm is
 * the usual figure for adult reading of general prose. */
export function readingMinutes(blocks: PostBlock[] | ArticleBlock[]) {
  const words = countWords(toArticleBlocks(blocks as PostBlock[]));
  return Math.max(1, Math.round(words / 200));
}

/** A body paragraph. Shared so a paragraph reads identically whether it sits in
 * the article's spine or inside a point. */
function BodyParagraph({ text, className = "" }: { text: string; className?: string }) {
  return (
    // `break-words` is a guard, not styling: one unbreakable token in the CMS
    // copy is enough to push the whole document into horizontal scroll on a
    // phone, and the article body is the one place arbitrary text lands.
    <p
      className={`text-[17px] leading-[1.85] font-light break-words text-pretty text-text md:text-[19px] ${className}`}
    >
      <InlineText text={text} />
    </p>
  );
}

/**
 * A restored point list. The marker sits in its own gutter so every label
 * starts on one vertical line and the eye can run down the list without
 * reading it — which is the entire reason these are lists and not paragraphs.
 */
function PointList({ ordered, items }: { ordered: boolean; items: PointItem[] }) {
  const Tag = ordered ? "ol" : "ul";

  return (
    <Tag className="mt-9 flex flex-col gap-9 border-t border-ink/10 pt-9">
      {items.map((item) => (
        <li
          key={item.label}
          className="grid grid-cols-[2.25rem_1fr] gap-x-4 sm:grid-cols-[3rem_1fr] sm:gap-x-6"
        >
          {ordered ? (
            // The source's own numeral, not a generated one — one of these
            // lists is titled "10 Romantic…" but only writes eight points, and
            // renumbering would quietly assert a count the copy doesn't have.
            <span
              aria-hidden
              className="font-heading text-[26px] leading-[1.15] font-light text-primary-deep sm:text-[32px]"
            >
              {item.marker}
            </span>
          ) : (
            <span aria-hidden className="mt-[0.7em] block h-px w-full bg-primary" />
          )}

          <div>
            <h3 className="font-heading text-[20px] leading-[1.3] font-light break-words text-balance text-ink sm:text-[23px]">
              <InlineText text={item.label} />
            </h3>

            {item.body.map((block, index) =>
              block.kind === "image" ? (
                // Contained rather than breaking the measure: inside a list
                // item a full-width image would tear the marker gutter apart.
                <Image
                  key={index}
                  src={block.src}
                  alt=""
                  width={900}
                  height={600}
                  sizes="(min-width: 800px) 690px, 100vw"
                  className="mt-5 h-auto w-full"
                />
              ) : block.kind === "paragraph" ? (
                <BodyParagraph key={index} text={block.text} className="mt-4" />
              ) : null,
            )}
          </div>
        </li>
      ))}
    </Tag>
  );
}

/**
 * A blog post's body.
 *
 * **What this pass changed, and why the previous one was wrong.** The article
 * was set as a print magazine feature: drop cap on the opening paragraph, a
 * gold hairline rule stacked above every heading, uppercase tracked metadata.
 * That is one specific aesthetic lane — display-serif editorial — and it had
 * two problems here. It is the single most saturated "designed article" look
 * there is, so it reads as generic rather than considered; and the rule-above-
 * every-heading device does not survive contact with this content, where one
 * post carries twenty-one headings and the page turns into a ladder of
 * identical gold ticks. Hierarchy now comes from scale and space, which is
 * what actually scales to a 1,900-word post.
 *
 * The bigger change is structural. Three posts are literal listicles whose
 * points were written as marker punctuation inside ordinary paragraphs, so
 * they rendered as the flattest text on the site — see `postBlocks.ts`. They
 * are now real lists with the marker in its own gutter, which is what makes a
 * long piece scannable instead of a wall.
 *
 * Unchanged, because they were right: the `narrow` 680px measure (~75
 * characters, the one thing that should never move on a page of prose), the
 * standfirst, photographs breaking the measure at `lg`, and rendering a block
 * list rather than injecting CMS HTML.
 */
export function PostBody({ post, blogLabel = "Our Blog" }: PostBodyProps) {
  const minutes = readingMinutes(post.articleBlocks ?? post.blocks);
  // WordPress serves the featured image again as the article's first inline
  // image on most posts. `PostPage` already runs it full-bleed as the hero, so
  // rendering the block too put the same photograph on screen twice, a few
  // hundred pixels apart. Drop it wherever it appears in the body — later
  // photographs, which are genuinely different, are untouched.
  const blocks = (post.articleBlocks ?? toArticleBlocks(post.blocks)).filter(
    (block) => !(block.kind === "image" && block.src === post.image),
  );
  // The opening paragraph is set larger, as a lead-in. Anything after it is
  // ordinary body copy.
  const firstParagraph = blocks.findIndex((b) => b.kind === "paragraph");

  return (
    <Section tone="sand" width="read">
      <Reveal>
        <p className="text-eyebrow font-body flex flex-wrap items-center gap-x-3 gap-y-1 text-primary-deep uppercase">
          {/* Same row, same order as the blog cards' `PostMeta` — a reader
              arriving from the index should meet the article's category where
              they just left it. Absent when the post carries none. */}
          {post.categories?.[0] ? (
            <>
              <span>{post.categories[0].title}</span>
              <span className="sr-only">, </span>
              <span aria-hidden className="block h-px w-4 bg-primary" />
            </>
          ) : null}
          {/* The article's author: the property whose blog it is in, the same
              name its structured data gives. */}
          <span>{PROPERTY_NAMES[post.property]}</span>
          <span className="sr-only">, </span>
          <span aria-hidden className="block h-px w-4 bg-primary" />
          <time dateTime={post.date}>{formatPostDate(post.date)}</time>
          {/* The gold rule is the *visual* separator, but it's aria-hidden and
              carries no text — without this the two run together for a screen
              reader as "…2024 9 min read", or worse "20249". */}
          <span className="sr-only">, </span>
          <span aria-hidden className="block h-px w-4 bg-primary" />
          <span>{minutes} min read</span>
        </p>

        {post.excerpt ? (
          <p className="font-heading mt-6 text-[22px] leading-[1.5] font-light text-balance text-ink md:text-[26px]">
            {post.excerpt}
          </p>
        ) : null}

        <span aria-hidden className="mt-8 block h-px w-14 bg-primary" />
      </Reveal>

      <div className="mt-9">
        {blocks.map((block, index) => {
          if (block.kind === "points") {
            return (
              <PointList key={index} ordered={block.ordered} items={block.items} />
            );
          }

          if (block.kind === "faq") {
            return (
              <ArticleFaq key={index} heading={block.heading} items={block.items} />
            );
          }

          if (block.kind === "price") {
            return (
              <PriceTable key={index} columns={block.columns} rows={block.rows} />
            );
          }

          if (block.kind === "heading") {
            // Space above, none of its own below — a heading belongs to what
            // follows it, and the gap that separates it from the *previous*
            // section is what makes that legible.
            return (
              <h2
                key={index}
                className="font-heading mt-12 text-[24px] leading-[1.2] font-light text-balance text-ink first:mt-0 md:mt-14 md:text-[29px]"
              >
                {block.text}
              </h2>
            );
          }

          if (block.kind === "list") {
            return (
              <ul key={index} className="mt-7 flex flex-col gap-3">
                {block.items.map((item) => (
                  <li
                    key={item}
                    className="grid grid-cols-[1.5rem_1fr] text-[17px] leading-[1.85] font-light text-text md:text-[19px]"
                  >
                    <span
                      aria-hidden
                      className="mt-[0.85em] block h-px w-3.5 bg-primary"
                    />
                    <span className="break-words text-pretty">
                      <InlineText text={item} />
                    </span>
                  </li>
                ))}
              </ul>
            );
          }

          if (block.kind === "image") {
            return (
              // Flush with the text, deliberately. These used to break the
              // measure — 900px against a 680px column at `lg` — which is a
              // real editorial device, but it needs a wide gutter and a
              // consistent rhythm to read as one. With a photograph every few
              // paragraphs and nothing else escaping the column, the only
              // thing it communicated was that two edges failed to line up.
              <div key={index} className="mt-10 md:mt-12">
                <Image
                  src={block.src}
                  alt=""
                  width={900}
                  height={600}
                  sizes="(min-width: 800px) 760px, 100vw"
                  className="h-auto w-full"
                />
              </div>
            );
          }

          const isLead = index === firstParagraph;
          return isLead ? (
            <p
              key={index}
              className="font-body mt-6 text-[19px] leading-[1.7] font-light break-words text-pretty text-ink first:mt-0 md:text-[21px]"
            >
              <InlineText text={block.text} />
            </p>
          ) : (
            <BodyParagraph key={index} text={block.text} className="mt-6" />
          );
        })}
      </div>

      {/* Closing rule + a way back into the blog. "Our Blog" is a string the
          site already uses (the footer column heading); no new copy. */}
      <Reveal>
        <div className="mt-14 border-t border-ink/10 pt-7">
          <Link
            href={`/${post.property}/discover`}
            className="text-eyebrow font-body group/back inline-flex items-center gap-3 text-primary-deep uppercase"
          >
            <span
              aria-hidden
              className="block h-px w-6 bg-primary transition-all duration-500 ease-out group-hover/back:w-10"
            />
            {blogLabel}
          </Link>
        </div>
      </Reveal>
    </Section>
  );
}
