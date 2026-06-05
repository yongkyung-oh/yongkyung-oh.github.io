export const profile = {
  name: "YongKyung Oh",
  role: "Postdoctoral Researcher",
  affiliation: "UCLA Health, David Geffen School of Medicine",
  group: "Medical & Imaging Informatics group",
  location: "Los Angeles, CA",
  email: "mailto:yongkyungoh@mednet.ucla.edu",
  personalEmail: "mailto:yongkyung-oh@outlook.com",
  // Optimized web assets (originals are multi-MB; do not reference the raw PNG).
  portrait: "/images/yongkyung-oh-speaking.webp",
  portraitFallback: "/images/yongkyung-oh-speaking-1100.jpg",
  portraitWidth: 1100,
  portraitHeight: 825,
  // Dedicated social/share card (1200x900, < 60 KB) — used for og:image/twitter:image.
  ogImage: "/images/og-card.jpg",
  cvUrl: "https://drive.google.com/file/d/12kr_OViGjSfBox5_kUnpnpop87liNlyV/view?usp=sharing",
  scholarUrl: "https://scholar.google.com/citations?user=YJ1L50YAAAAJ&hl=en",
  githubUrl: "https://github.com/yongkyung-oh",
  linkedinUrl: "http://www.linkedin.com/in/yongkyung-oh",
  summary:
    "Trustworthy machine learning for irregular time series, healthcare, and digital health systems.",
  themes: [
    "Trustworthy AI for healthcare",
    "Neural differential equations and irregular time series",
    "Reliable population and clinical inference",
    "Open, citable research software"
  ]
};

export type ResearchArea = {
  title: string;
  text: string;
  methods: string[];
  relatedPublicationIds?: string[];
  relatedProjectIds?: string[];
};

export const siteContent = {
  name: "YongKyung Oh",
  shortName: "YongKyung Oh",
  tagline: "Trustworthy machine learning for irregular health data.",
  path: "/",
  homeKicker: "Medical & Imaging Informatics / UCLA Health",
  mission:
    "I develop machine learning methods for irregularly observed, missing, and high-stakes data, with an emphasis on reliability, reproducibility, and scientific use.",
  statement:
    "My current work connects neural differential equations, domain adaptation, and clinical or population data. The focus is on models that remain useful when data are sparse, missing, irregularly sampled, or collected under complex observational designs.",
  heroLine:
    "I design models for sparse, missing, and irregularly sampled data in clinical, population, and scientific settings.",
  currentProgram: [
    {
      label: "Current Appointment",
      value: "Postdoctoral Researcher",
      detail: "UCLA Health, David Geffen School of Medicine"
    },
    {
      label: "Research Context",
      value: "Medical & Imaging Informatics",
      detail: "Clinical, imaging, and digital health data"
    },
    {
      label: "Funded Work",
      value: "NRF Postdoctoral Fellowship PI",
      detail: "Distribution shift and trustworthy longitudinal modeling"
    }
  ],
  focusAreas: [
    {
      title: "Irregular Time Series",
      text: "Continuous-time models, missingness-aware learning, and robust classification for temporal data collected outside ideal experimental settings.",
      methods: ["Neural SDEs", "Invertible flows", "Missingness"],
      relatedPublicationIds: ["C12", "C04"],
      relatedProjectIds: ["flowpath", "stable-neural-sdes"]
    },
    {
      title: "Trustworthy Health AI",
      text: "Reliable modeling and evaluation workflows for clinical, population, and multimodal health data.",
      methods: ["Domain adaptation", "Survey-aware ML", "Clinical text"],
      relatedPublicationIds: ["C07", "J12", "C14"],
      relatedProjectIds: ["saml"]
    },
    {
      title: "Research Software",
      text: "Open-source implementations that keep papers, code, and citation metadata connected.",
      methods: ["Reproducibility", "Code releases", "Citation metadata"],
      relatedPublicationIds: ["J11"],
      relatedProjectIds: ["tssi"]
    }
  ] satisfies ResearchArea[],
  nav: [
    { label: "Home", href: "/" },
    { label: "Research", href: "/research/" },
    { label: "Publications", href: "/publications/" },
    { label: "Projects", href: "/projects/" },
    { label: "Talks", href: "/talks/" },
    { label: "About", href: "/about/" },
    { label: "Contact", href: "/contact/" }
  ]
};
