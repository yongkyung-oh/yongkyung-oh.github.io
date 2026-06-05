// Single source of derived, NON-FABRICATED facts shared by the launch site.
// All numbers here are computed from the selected publication records in
// publications.ts. They are NOT full-CV counts.
// Do NOT add citation counts, h-index, GitHub stars, funding, student names,
// or any metric not derivable from this data.
import { publications, type Publication } from "./publications";

export const featuredPublications: Publication[] = publications.filter((p) => p.featured);
export const recentPublications: Publication[] = [...publications]
  .sort((a, b) => b.year - a.year || (a.id ?? "").localeCompare(b.id ?? ""))
  .slice(0, 4);

const years = publications.map((p) => p.year);

export const stats = {
  totalPublications: publications.length,
  journalCount: publications.filter((p) => p.kind === "journal").length,
  conferenceCount: publications.filter((p) => p.kind === "conference").length,
  featuredCount: featuredPublications.length,
  earliestYear: Math.min(...years),
  latestYear: Math.max(...years),
  // publications per year, ascending — safe to render as a real bar/sparkline
  perYear: Object.entries(
    publications.reduce<Record<number, number>>((acc, p) => {
      acc[p.year] = (acc[p.year] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([year, count]) => ({ year: Number(year), count }))
    .sort((a, b) => a.year - b.year)
};

// Documented, verifiable recognitions only (mirrors the About page).
export type Recognition = {
  award: string;
  venue: string;
  title: string;
  href: string;
};

export const recognitions: Recognition[] = [
  {
    award: "Best Paper Award",
    venue: "CHIL 2025",
    title:
      "Multi-View Contrastive Learning for Robust Domain Adaptation in Medical Time Series Analysis",
    href: "https://proceedings.mlr.press/v287/oh25a.html"
  },
  {
    award: "Spotlight Presentation",
    venue: "ICLR 2024",
    title:
      "Stable Neural Stochastic Differential Equations in Analyzing Irregular Time Series Data",
    href: "https://openreview.net/forum?id=4VIgNuQ1pY"
  }
];

// Short venue label for compact display (e.g. "AAAI 2026", "ICLR 2024").
export function shortVenue(p: Publication): string {
  const v = p.venue;
  let abbr = v;
  if (/AAAI/i.test(v)) abbr = "AAAI";
  else if (/Learning Representations|ICLR/i.test(v)) abbr = "ICLR";
  else if (/Information and Knowledge Management|CIKM/i.test(v)) abbr = "CIKM";
  else if (/Health, Inference, and Learning|CHIL/i.test(v)) abbr = "CHIL";
  else if (/Neural Information|NeurIPS/i.test(v)) abbr = "NeurIPS";
  return `${abbr} ${p.year}`;
}
