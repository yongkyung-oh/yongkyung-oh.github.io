export type Person = {
  id: string;
  name: string;
  role: "PI" | "postdoc" | "phd" | "ms" | "visiting" | "alumni";
  title: string;
  active: boolean;
  focus: string;
  image?: string;
  links?: { label: string; href: string }[];
  sourcePath?: string;
  verificationStatus?: "verified" | "partially_verified";
};

export const people: Person[] = [
  {
    id: "yongkyung-oh",
    name: "YongKyung Oh",
    role: "postdoc",
    title: "Postdoctoral Researcher",
    active: true,
    focus: "Trustworthy AI, irregular time series, healthcare machine learning",
    image: "/images/yongkyung-oh-speaking.webp",
    links: [
      { label: "Scholar", href: "https://scholar.google.com/citations?user=YJ1L50YAAAAJ&hl=en" },
      { label: "GitHub", href: "https://github.com/yongkyung-oh" }
    ],
    sourcePath: "achievement_records/career/ucla_health_postdoctoral_researcher_2023.yaml",
    verificationStatus: "partially_verified"
  }
];
