/**
 * Reading numbers out of the CMS's own sentences.
 *
 * Prices, sizes and occupancy are stored as the text a visitor reads —
 * "Available at IDR 1.490.000++ for a private session", "65 sqm", "2 adults
 * and one child (under five years old)" — because that is what the pages
 * display. The structured data needs the numbers, and it takes them from that
 * same text so the two cannot disagree.
 *
 * **Every parser returns `undefined` rather than guessing.** A price written
 * in a shape nobody anticipated drops out of the schema, which costs a little;
 * a misread one publishes a number the business never agreed to.
 *
 * Pure on purpose, like `server/purgeTargets.ts`: what these get wrong is
 * invisible in a browser.
 */

export type Price = {
  amount: number;
  /** Written with "++", the Indonesian shorthand for tax and service on top. */
  plusPlus: boolean;
  /** What the price buys — "per person", "two persons", "private session". */
  unit?: string;
};

/**
 * "IDR 1.490.000++ for a private session" → 1490000, ++, "private session".
 *
 * Both thousands separators are accepted and nothing else: an amount like
 * "IDR 1.5 million" does not match, because reading it as 15 or 1 would be
 * worse than reading nothing.
 */
export function parsePrice(text: string | null | undefined): Price | undefined {
  const match = text?.match(
    /\bIDR\s*(\d{1,3}(?:[.,]\d{3})+|\d{4,})(?![.,]?\d)\s*(\+\+)?([\s\S]*)$/i,
  );
  if (!match) return undefined;
  return {
    amount: Number(match[1].replace(/[.,]/g, "")),
    plusPlus: Boolean(match[2]),
    unit: parseUnit(match[3]),
  };
}

/**
 * What follows the amount: "/ car" → "per car", "for two persons" → "two
 * persons", "for up to 2 people in private session." → "up to 2 people,
 * private session". Anything else is prose and is left out.
 */
function parseUnit(rest: string): string | undefined {
  // One clause only — a sentence after the price is not part of the unit.
  const clause = rest.split(/[.;(\n]/)[0].trim();

  const per = clause.match(/^\/\s*(.+)$/);
  if (per) return `per ${per[1].trim()}`;

  const buys = clause.match(/^for\s+(?:an?\s+)?(.+)$/i);
  if (!buys) return undefined;
  return buys[1].trim().replace(/\s+in\s+(?:an?\s+)?/i, ", ");
}

/** "65 sqm" → 65. */
export function parseSquareMetres(text: string | undefined): number | undefined {
  const match = text?.match(/(\d+(?:\.\d+)?)\s*(?:sqm|sq\.?\s*m|m2|m²)/i);
  return match ? Number(match[1]) : undefined;
}

/** "6 adults and two children (under five years old)" → 6. */
export function parseAdults(text: string | undefined): number | undefined {
  const match = text?.match(/(\d+)\s*adults?\b/i);
  return match ? Number(match[1]) : undefined;
}

const NUMBER_WORDS = ["one", "two", "three", "four", "five", "six"];

/**
 * "Four-Bedroom Pool Villa" → 4. There is no bedroom-count field; a villa's
 * name is where it is stated, and the rooms that do not say (the suites, the
 * honeymoon villas) get no count rather than an assumed one.
 */
export function bedroomsFromName(name: string): number | undefined {
  const match = name.match(/\b(one|two|three|four|five|six|\d+)[\s-]bedroom/i);
  if (!match) return undefined;
  const word = NUMBER_WORDS.indexOf(match[1].toLowerCase());
  return word >= 0 ? word + 1 : Number(match[1]);
}

/** "Eat, Pray, and Love" → "eat-pray-and-love", for an `@id` fragment. */
export function fragment(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .replace(/['’]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const SMALL_WORDS = new Set(["a", "an", "and", "at", "by", "for", "in", "of", "on", "the", "to", "with"]);

/** A dash or a middle dot standing between two parts of a label. Only with
 *  space around it, so "Anti-Cellulite" stays whole. */
const SPACED_SEPARATOR = /\s+[–—·-]\s+/;

/**
 * A spa menu heading as a name. "SPA PACKAGE – ROMANTIC SPA FOR COUPLE" →
 * "Spa Package: Romantic Spa for Couple".
 *
 * Only a heading typed entirely in capitals is re-cased; one an editor has
 * already written in mixed case is theirs.
 */
export function menuHeading(text: string): string {
  return text
    .trim()
    .split(SPACED_SEPARATOR)
    .map((part) => {
      if (part !== part.toUpperCase()) return part;
      return part
        .toLowerCase()
        .split(/\s+/)
        .map((word, index) =>
          index > 0 && SMALL_WORDS.has(word)
            ? word
            : word.replace(/^[^a-z]*[a-z]/, (start) => start.toUpperCase()),
        )
        .join(" ");
    })
    .join(": ");
}

/**
 * One priced line of a spa menu: "Full Leg · 60 mins | IDR 790.000++" →
 * "Full Leg, 60 mins" and its price.
 */
export function parseTreatmentOption(
  label: string,
): { variant: string; price: Price } | undefined {
  const bar = label.indexOf("|");
  if (bar < 0) return undefined;
  const price = parsePrice(label.slice(bar + 1));
  if (!price) return undefined;
  const variant = label
    .slice(0, bar)
    .trim()
    .split(SPACED_SEPARATOR)
    .join(", ");
  return { variant, price };
}

/**
 * The photograph's own address: no resizing parameters, and absolute. A
 * Sanity URL arrives with the width this site asked its CDN for, which is the
 * layout's business and not a property of the picture.
 */
export function schemaImage(
  url: string | null | undefined,
  origin: string,
): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("/")) return `${origin}${url}`;
  return url.split("?")[0];
}
