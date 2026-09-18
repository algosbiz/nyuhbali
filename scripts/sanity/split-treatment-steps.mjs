/**
 * Splits the Healthy Look medi-facial treatments' run-on step strings into the
 * step arrays every other treatment on the page already uses.
 *
 *   npm run sanity:spa-steps:dry   # report only, writes nothing
 *   npm run sanity:spa-steps       # apply
 *
 * ── The problem ──────────────────────────────────────────────────────
 *
 * `/ubud/spa` lists 23 treatments that carry an `includes` list — the steps a
 * package contains. Eleven of them (the resort's own spa packages) hold a
 * proper array, so they render as one gold-dashed step per row. The twelve
 * medi-facials under "MEDI FACIAL BY HEALTHY LOOK AESTHETIC" hold *one* string
 * with every step run together by dashes, because that is how the partner
 * clinic's menu was scraped:
 *
 *   "Deep Cleansing – Radiofrequency – Steam & Extraction – Face Massage - …"
 *
 * That renders as a single bullet wrapping to five lines, next to neighbours
 * that render as tidy lists — which is what the client reported. The fix is the
 * data, not the component: an editor opening one of these in the Studio sees a
 * single field they cannot reorder or edit a step of, while the eleven others
 * are editable step by step.
 *
 * ── The split rule ───────────────────────────────────────────────────
 *
 * Split on an en/em dash (spaces optional) or on a hyphen with whitespace on
 * BOTH sides. Three things that rule deliberately gets right:
 *
 *   "Oil-Free Acne Moisturizer"   stays whole (hyphen, no spaces)
 *   "Soft Peel- ing" / "Se- rum"  stay whole (space only *after* the hyphen) —
 *                                 these are hyphenation artifacts from the
 *                                 scrape and are repaired, not split
 *   "Ultrasound—Radiofrequency"   splits (em dash whose spaces the source lost)
 *
 * ── Safety ───────────────────────────────────────────────────────────
 *
 * Every split is checked before it is kept: the sequence of word tokens after
 * splitting must equal the sequence before it, so no step can be dropped,
 * reordered or invented. A treatment that fails that check is left exactly as
 * it is and named in the output. Only single-string `includes` are touched, so
 * the eleven already-split treatments are never rewritten, which also makes
 * this idempotent — a second run finds nothing to do and writes nothing, so the
 * publish webhook does not fire again.
 *
 * `src/data/pages/ubud-spa.ts` carries the same 12 changes, so the CMS and the
 * fallback stay in step.
 */

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@sanity/client";

for (const file of [".env.local", ".env"]) {
  let contents;
  try {
    contents = fs.readFileSync(path.resolve(process.cwd(), file), "utf8");
  } catch {
    continue;
  }
  for (const line of contents.split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}

const dryRun = process.argv.includes("--dry-run");
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || "production";
const token = process.env.SANITY_API_WRITE_TOKEN?.trim();

if (!projectId || !token) {
  console.error("\n  Missing NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_API_WRITE_TOKEN.\n");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2025-02-19",
  token,
  useCdn: false,
});

const SEPARATOR = /\s*[–—]\s*|\s+-\s+/;
const HYPHENATION = [
  [/Peel-\s+ing/g, "Peeling"],
  [/Se-\s+rum/g, "Serum"],
];

/** A run-on string is only worth splitting if it is long and holds a separator. */
const isRunOn = (list) => list?.length === 1 && typeof list[0] === "string" && list[0].length > 60;

const repairHyphenation = (s) => HYPHENATION.reduce((acc, [re, to]) => acc.replace(re, to), s);

function splitSteps(s) {
  return repairHyphenation(s)
    .split(SEPARATOR)
    .map((x) => x.trim())
    .filter(Boolean);
}

/**
 * Word tokens only. The separator dashes are not word characters so they fall
 * out of both sides of the comparison; an intra-word hyphen ("Oil-Free")
 * survives, because it sits between two word characters.
 */
const words = (s) => (s.match(/[A-Za-z0-9&]+(?:-[A-Za-z0-9]+)*/g) ?? []).join(" ");

console.log(`\n  ${dryRun ? "DRY RUN — nothing will be written" : "WRITING"}  ${projectId}/${dataset}\n`);

// The whole document, not a projection — it is written back with
// `createOrReplace`, so anything left out would be lost.
const docs = await client.fetch('*[_type == "page" && path == "/ubud/spa"]');

let written = 0;
let split = 0;
let stepsProduced = 0;
let refused = 0;

for (const doc of docs) {
  const copy = JSON.parse(JSON.stringify(doc));
  const hits = [];

  for (const section of copy.sections ?? []) {
    if (section._type !== "treatmentListSection") continue;
    for (const category of section.categories ?? []) {
      for (const treatment of category.treatments ?? []) {
        if (!isRunOn(treatment.includes)) continue;

        const original = treatment.includes[0];
        const steps = splitSteps(original);

        if (steps.length < 2) continue;

        if (words(repairHyphenation(original)) !== words(steps.join(" "))) {
          refused += 1;
          console.log(`  !! refused — words would change: ${treatment.name}`);
          continue;
        }

        treatment.includes = steps;
        hits.push(`${treatment.name}: 1 string -> ${steps.length} steps`);
        split += 1;
        stepsProduced += steps.length;
      }
    }
  }

  if (!hits.length) {
    console.log(`  ${doc.path} — already split`);
    continue;
  }

  written += 1;
  console.log(`  ${doc.path}`);
  hits.forEach((h) => console.log("      " + h));
  if (!dryRun) await client.createOrReplace(copy);
}

console.log(
  `\n  ${dryRun ? "would update" : "updated"} ${written} document${written === 1 ? "" : "s"}, ` +
    `${split} treatment${split === 1 ? "" : "s"}, ${stepsProduced} steps` +
    (refused ? `, ${refused} refused` : "") +
    ".\n",
);
if (dryRun) console.log("  Dry run complete — nothing was written.\n");
