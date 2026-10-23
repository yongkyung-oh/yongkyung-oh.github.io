import type cv from './cv.generated.json';

type Publication = (typeof cv.publications)[number];

// Display the exported publication snapshot. Bibliographic corrections are
// applied before export, so rendering never reads private curation records.
export function publicationDisplay(source: Publication): Publication {
  return source;
}
