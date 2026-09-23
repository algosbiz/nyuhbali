/**
 * Proves no page has gone missing, from every direction at once.
 *
 *   npm run build && npm run pages:check
 *
 * Reads only — it writes nothing, to Sanity or to disk, so it is safe against
 * production. It needs a build to compare against, because the build is the
 * only authority on what this site actually serves.
 *
 * ── Why each direction is checked separately ─────────────────────────
 *
 * A page can go missing in ways a single count would hide:
 *
 * - **A route loses its entry in `seo.ts`** and still builds, so the count
 *   stays right while the page publishes no title.
 * - **A document is unpublished.** This is the one that bites. `getRooms`,
 *   `getExperiences` and `getPostPaths` return Sanity's list *instead of*
 *   `src/data`'s once Sanity has anything at all — they do not merge — and
 *   those routes take their whole list from Sanity. Unpublish one room of ten
 *   and its URL 404s, with nothing else changing. That is correct behaviour
 *   for a deletion and a silent outage for an accident, which is why it is
 *   worth checking rather than trusting. Since the catch-alls went
 *   `dynamicParams = true` this is immediate rather than deferred to the next
 *   deploy — which makes an accident faster to notice and no less silent.
 * - **A post is published under a prefix no route file covers.** It appears
 *   in the Studio, publishes cleanly, and 404s: the root catch-all answers
 *   `page` documents, not posts. A *page* at a new path does now resolve.
 *   See README-SANITY.md §8.
 * - **The sitemap drifts** from what is served, in either direction.
 *
 * The `src/data` comparison is the one that catches an accidental unpublish:
 * the file is the fallback the site shipped with, so a document missing from
 * Sanity that exists there is either a deliberate deletion or a mistake, and
 * this cannot tell the difference — it reports, and a human decides.
 */

import fs from "node:fs";
import path from "node:path";

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

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || "production";
const token = process.env.SANITY_API_READ_TOKEN?.trim();

if (!fs.existsSync(".next/server/app")) {
  console.error("\n  No build to check. Run `npm run build` first.\n");
  process.exit(1);
}

const walk = (dir, suffix) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p, suffix) : e.name.endsWith(suffix) ? [p] : [];
  });

const built = new Set(
  walk(".next/server/app", ".html")
    .map((f) => f.split(path.sep).join("/").replace(".next/server/app", "").replace(/\.html$/, ""))
    .map((p) => (p === "/index" ? "/" : p))
    .filter((p) => !p.startsWith("/_")),
);

const problems = [];
const notes = [];

/**
 * Paths that answer with a permanent redirect rather than a page of their own.
 *
 * A redirected URL is not an outage — it resolves, just somewhere else — so a
 * document still pointing at one is worth *seeing* without being counted as
 * missing. Without this the check fails on every run, and a check that always
 * fails stops being read, which is the failure that matters.
 *
 * `/life-coach-retreat-benefits` is the live case: WordPress retired that URL,
 * next.config.ts mirrors it, and its `post` document is still published in
 * Sanity. Unpublishing that document clears the note.
 *
 * Read out of next.config.ts rather than listed here, so retiring the next URL
 * does not also mean remembering to edit this file. Two narrowings keep it
 * honest: only the `redirects()` body is scanned, because `headers()` above it
 * declares `source` too and a header rule moves nothing; and a source carrying
 * `:` or `*` is skipped, because a parameterised source like `/studio/:path*`
 * is a pattern rather than a path to compare against.
 *
 * The match is deliberately not anchored to a whole line. The 86 legacy
 * WordPress permalinks are written one entry per line to stay readable at that
 * length, so `source:` is mid-line for most of the table; anchoring would have
 * silently seen only the nine older multi-line entries.
 */
const nextConfig = fs.readFileSync("next.config.ts", "utf8");
const redirectBlock = nextConfig.slice(nextConfig.indexOf("async redirects()"));
const redirected = new Set(
  [...redirectBlock.matchAll(/source: "(\/[^":*]*)"/g)].map((m) => m[1]),
);

const check = (label, wanted) => {
  const all = [...new Set(wanted)].filter(Boolean);
  const absent = all.filter((p) => !built.has(p));
  const moved = absent.filter((p) => redirected.has(p));
  const missing = absent.filter((p) => !redirected.has(p));
  console.log(
    "  " + label.padEnd(30) + String(all.length).padStart(3) +
      " expected, " + missing.length + " missing" +
      (moved.length ? ", " + moved.length + " redirected" : ""),
  );
  missing.forEach((p) => problems.push(label + " -> " + p + " is not served"));
  moved.forEach((p) => notes.push(label + " -> " + p + " is redirected, not served"));
};

console.log("\n  Pages this build serves: " + built.size + "\n");

// ── 1. The routes the project declares ────────────────────────────────
const seoSrc = fs.readFileSync("src/data/seo.ts", "utf8");
check("routes in seo.ts", [...seoSrc.matchAll(/^ {2}"(\/[^"]*)":\s*\{/gm)].map((m) => m[1]));

// ── 2. The sitemap's promises ─────────────────────────────────────────
const sitemapFile = ".next/server/app/sitemap.xml.body";
if (fs.existsSync(sitemapFile)) {
  const xml = fs.readFileSync(sitemapFile, "utf8");
  check(
    "URLs in sitemap.xml",
    [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname.replace(/\/$/, "") || "/"),
  );
}

// ── 3. Everything published in Sanity that owns a URL ─────────────────
if (!projectId || !token) {
  console.log("\n  Sanity not configured — skipping the document checks.\n");
} else {
  const q = async (query) => {
    const u = new URL(`https://${projectId}.api.sanity.io/v2025-02-19/data/query/${dataset}`);
    u.searchParams.set("query", query);
    const r = await fetch(u, { headers: { Authorization: "Bearer " + token } });
    const d = await r.json();
    if (d.error) throw new Error(JSON.stringify(d.error).slice(0, 200));
    return d.result ?? [];
  };

  check("Sanity page documents", await q('*[_type=="page"].path'));
  const rooms = await q('*[_type=="room"]{property,"s":slug.current}');
  check("Sanity rooms", rooms.map((r) => `/${r.property}/villa/${r.s}`));
  check("Sanity experiences", (await q('*[_type=="experience"].slug')).map((s) => `/ubud/${s}`));
  check("Sanity posts", await q('*[_type=="post"].path'));
  check("Sanity legal pages", await q('*[_type=="legalPage"].path'));

  // ── 4. Anything in src/data that Sanity no longer has ───────────────
  // Sanity replaces these lists rather than merging with them, so a document
  // that has quietly gone leaves a 404 behind.
  const pairs = (file, re) => [...fs.readFileSync(file, "utf8").matchAll(re)];
  const dataRooms = new Set(
    pairs("src/data/rooms.ts", /slug: "([^"]+)",[\s\S]{0,200}?property: "([^"]+)"/g)
      .map((m) => `/${m[2]}/villa/${m[1]}`),
  );
  const dataExperiences = new Set(
    pairs("src/data/experiences.ts", /^\s*slug: "([^"]+)"/gm).map((m) => `/ubud/${m[1]}`),
  );
  const dataPosts = new Set(pairs("src/data/posts.ts", /^\s*path: "([^"]+)"/gm).map((m) => m[1]));

  const live = {
    rooms: new Set(rooms.map((r) => `/${r.property}/villa/${r.s}`)),
    experiences: new Set((await q('*[_type=="experience"].slug')).map((s) => `/ubud/${s}`)),
    posts: new Set(await q('*[_type=="post"].path')),
  };
  const gone = (label, fileSet, sanitySet) => {
    const missing = [...fileSet].filter((p) => !sanitySet.has(p));
    console.log(
      "  " + (label + " vs src/data").padEnd(30) + String(fileSet.size).padStart(3) +
        " in the file, " + missing.length + " absent from Sanity",
    );
    missing.forEach((p) =>
      problems.push(label + " -> " + p + " exists in src/data but not in Sanity (deleted on purpose, or unpublished by accident?)"),
    );
  };
  console.log("");
  gone("rooms", dataRooms, live.rooms);
  gone("experiences", dataExperiences, live.experiences);
  gone("posts", dataPosts, live.posts);
}

if (notes.length) {
  console.log("\n  NOTES (" + notes.length + "):\n" + notes.map((p) => "   " + p).join("\n"));
}

console.log(
  problems.length
    ? "\n  PROBLEMS (" + problems.length + "):\n" + problems.map((p) => "   " + p).join("\n") + "\n"
    : "\n  Nothing missing.\n",
);
process.exit(problems.length ? 1 : 0);
