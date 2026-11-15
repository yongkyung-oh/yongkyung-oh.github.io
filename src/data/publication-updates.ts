import type cv from './cv.generated.json';

type Publication = (typeof cv.publications)[number];

// Return the publication fields used by the page.
export function publicationDisplay(source: Publication): Publication {
  return source;
}
