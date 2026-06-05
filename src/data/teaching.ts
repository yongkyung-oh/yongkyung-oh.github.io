export type TeachingRecord = {
  course: string;
  institution: string;
  term: string;
  role: string;
  sourcePath: string;
  verificationStatus: "verified" | "partially_verified";
};

export const teaching: TeachingRecord[] = [];
