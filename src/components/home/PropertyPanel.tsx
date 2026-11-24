import Image from "next/image";
import Link from "next/link";

type PropertyPanelProps = {
  name: string;
  description: string;
  imageSrc: string;
  href: string;
  /** True for the panel whose photograph is the page's LCP element. Only one
   * panel may set it: on a phone the panels stack, so the second photograph
   * starts below the fold, and preloading both made them compete for the
   * same slow connection as the one the visitor actually sees first. */
  priority?: boolean;
};

/**
 * One half of the homepage's Seminyak/Ubud picker.
 *
 * **The landing page is now the choice itself.** It used to be two square
 * cards floating in a padded container between a dark header and a dark
 * footer, each photo sitting under a flat `ink/50` wash — half the image's
 * light thrown away — with a full paragraph of copy stacked over the middle
 * of it. Both properties ended up looking like the same grey-brown rectangle.
 *
 * Each panel is now a full-height plane of photography meeting its neighbour
 * at a seam, with a gradient weighted to the bottom so only the area behind
 * the text is darkened and the rest of the picture is left alone. The name is
 * set at display scale, the description sits under it at a proper reading
 * measure, and the gold rule between them extends on hover.
 *
 * **Every panel's name is an `<h2>`, so the landing page has no `<h1>` — on
 * purpose.** The first panel used to carry it, which told search engines the
 * page was about Seminyak and Ubud was a section of it. The two properties are
 * equal, so their headings are. Do not add an `<h1>` here or anywhere else on
 * that page, visible or hidden, when an SEO tool reports it missing; every
 * other page keeps its single one.
 */
export function PropertyPanel({
  name,
  description,
  imageSrc,
  href,
  priority = false,
}: PropertyPanelProps) {
  return (
    // `group` lets everything inside react to hovering anywhere on the panel.
    // `overflow-hidden` clips the image's zoom to the panel edges.
    <Link
      href={href}
      className="group relative flex min-h-[62vh] items-end overflow-hidden focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-primary md:min-h-screen"
    >
      <Image
        src={imageSrc}
        alt={name}
        fill
        sizes="(min-width: 768px) 50vw, 100vw"
        className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
        // `priority` alone emits the preload but not `fetchpriority`, so the
        // browser still queued the LCP photograph behind the fonts.
        priority={priority}
        fetchPriority={priority ? "high" : undefined}
      />

      {/* Two gradients, not one flat wash. The top one exists only so the
          overlaying header stays legible; the bottom one carries the text.
          Between them the middle of the photograph is left at full strength,
          which is the entire point — the photography is what's being chosen
          between. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink/60 to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-ink/90 via-ink/50 to-transparent transition-opacity duration-700 group-hover:opacity-85"
      />

      {/* The bottom padding has to clear the footer, which floats over the
          panels rather than sitting below them. HomeFooter measures ~88px on a
          390px screen after the spacing pass, so `pb-28` (112px) keeps the last
          line of the description clear of it with room to spare. Don't reduce
          this without re-measuring the footer. */}
      <div className="relative w-full px-7 pb-28 sm:px-10 md:px-14 md:pb-32">
        <h2 className="text-display font-heading font-light tracking-[0.06em] text-white uppercase">
          {name}
        </h2>

        {/* A widening gold rule instead of a "read more" label — it gives the
            panel a hover affordance without inventing any copy that isn't on
            the original site. */}
        <span
          aria-hidden
          className="mt-5 block h-px w-14 bg-primary transition-all duration-700 ease-out group-hover:w-28"
        />

        <p className="mt-5 max-w-[460px] text-[15px] leading-[1.9] font-light text-white/80">
          {description}
        </p>
      </div>
    </Link>
  );
}
