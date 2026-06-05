export type VerificationStatus = "verified" | "partially_verified";

export type NewsItem = {
  date: string;
  dateLabel?: string;
  title: string;
  text: string;
  href: string;
  sourcePath: string;
  verificationStatus: VerificationStatus;
};

export const news: NewsItem[] = [
  {
    date: "2026",
    title: "FlowPath appears in AAAI 2026 proceedings.",
    text: "The paper studies invertible-flow manifolds for robust irregularly sampled time-series classification.",
    href: "https://ojs.aaai.org/index.php/AAAI/article/view/39643",
    sourcePath: "achievement_records/publications/conference/oh_flowpath_2026.yaml",
    verificationStatus: "partially_verified"
  },
  {
    date: "2025",
    title: "CHIL 2025 Best Paper Award.",
    text: "Multi-view contrastive learning was recognized in the Models & Methods Track.",
    href: "https://proceedings.mlr.press/v287/oh25a.html",
    sourcePath: "achievement_records/awards/award_chil_2025_best_paper.yaml",
    verificationStatus: "partially_verified"
  },
  {
    date: "2025",
    title: "UCLA Chancellor's Award finalist.",
    text: "Recognized as a finalist for postdoctoral research at UCLA.",
    href: "/about/",
    sourcePath: "achievement_records/awards/award_ucla_chancellors_2025_postdoctoral_research_finalist.yaml",
    verificationStatus: "partially_verified"
  }
];
