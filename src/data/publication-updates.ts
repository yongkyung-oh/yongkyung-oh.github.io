import type cv from './cv.generated.json';
import curation from '../../data/curation.json';

type Publication = (typeof cv.publications)[number];
type DisplayPublication = {
  id: string;
  title: string;
  year: number;
  venue: string;
  category: string;
  status: string | null;
  authors: Publication['authors'];
  recognition: string | null;
  links: { label: string; url: string }[];
  citation: string;
  citationDoi: string | null;
  citationParts: { text: string; italic: boolean }[];
};
type Update = {
  sourcePath: string;
  expectedCitation: string;
  reviewedOn: string;
  evidence: string;
  paperUrl: string;
  paperLabel?: string;
  status: DisplayPublication['status'];
  citationDoi: string | null;
  citationParts: DisplayPublication['citationParts'];
};

// Official-source-reviewed display corrections to the imported CV snapshot.
// The imported snapshot and original CV remain intact. Retire these corrections
// when the upstream published records are exported. See docs/PUBLICATION_STATUS.md.
// 2026-10-02: the KDD C15, CHIL C13 and ICML C14 corrections were retired after the
// Achivement A1 Zotero sync exported them as published publication records.
const updates: Record<string, Update> = {};

export function publicationDisplay(source: Publication): DisplayPublication {
  const update = updates[source.id];
  if (!update) return source;
  const choice = curation.publications.find((item) => item.id === source.id);
  if (choice?.sourcePath !== update.sourcePath || source.citation !== update.expectedCitation || source.status !== 'Accepted · in press') {
    throw new Error(`Publication source changed: reconcile the verified display correction for ${source.id}.`);
  }
  return {
    ...source,
    status: update.status,
    citationDoi: update.citationDoi,
    citationParts: update.citationParts,
    links: [{ label: update.paperLabel ?? 'Paper', url: update.paperUrl }, ...source.links.filter((link) => link.label !== 'Paper')],
  };
}
