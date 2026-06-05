export type PortfolioTrack = "research-software" | "research-development" | "industry-consulting";

export type PortfolioRecord = {
  title: string;
  track: PortfolioTrack;
  organization: string;
  role: string;
  period?: string;
  location?: string;
  summary: string;
  href?: string;
  links?: { label: string; href: string }[];
  legacySlug?: string;
  sourcePath: string;
  verificationStatus: "verified" | "partially_verified";
};

export const portfolioRecords: PortfolioRecord[] = [
  {
    title: "Battery Laser Welding Advisor",
    track: "research-development",
    organization: "General Motors Global R&D Center",
    role: "Visiting Scientist",
    period: "2017",
    location: "Warren / Detroit, MI, USA",
    summary:
      "Research and tooling work for battery laser-welding experiments, process-parameter exploration, and manufacturing decision support.",
    links: [{ label: "Video", href: "https://youtu.be/z8hetHABj9M" }],
    legacySlug: "GM-internship",
    sourcePath: "achievement_records/career/general_motors_visiting_scientist_2017.yaml",
    verificationStatus: "partially_verified"
  },
  {
    title: "Conversational Chatbot Studio Project",
    track: "research-development",
    organization: "Carnegie Mellon University",
    role: "Visiting Researcher / Team Lead",
    period: "2020",
    location: "Pittsburgh, PA, USA",
    summary:
      "Project-based conversational AI application work using a software engineering pipeline and applied machine-learning stack.",
    links: [
      { label: "Repository", href: "https://github.com/yongkyung-oh/CMU-Studio-Project" },
      { label: "Video", href: "https://youtu.be/e33-9wViLc4" }
    ],
    legacySlug: "CMU_studio_project",
    sourcePath: "achievement_records/career/cmu_intensive_ai_program_2020.yaml",
    verificationStatus: "partially_verified"
  },
  {
    title: "Bayesian Bootstrap for AIS Data Analysis",
    track: "research-development",
    organization: "UNIST Data Analytics Lab",
    role: "Researcher",
    summary:
      "Research software and analysis workflow for abnormal vessel-behavior detection from AIS maritime data.",
    links: [
      { label: "Repository", href: "https://github.com/yongkyung-oh/Bayesian_Bootstrap_for_AIS" },
      { label: "Paper", href: "https://doi.org/10.1109/TASE.2023.3329041" }
    ],
    legacySlug: "Bayesian_Boostrap_for_AIS",
    sourcePath: "achievement_records/publications/journal/oh_grid-based_2024.yaml",
    verificationStatus: "partially_verified"
  },
  {
    title: "Multichannel CNN for Gas Mixture Classification",
    track: "research-development",
    organization: "UNIST Data Analytics Lab",
    role: "Researcher",
    summary:
      "Research software and method work for gas sensor-array classification using multichannel convolutional models.",
    links: [
      { label: "Repository", href: "https://github.com/yongkyung-oh/Multichannel-CNN" },
      { label: "Paper", href: "https://doi.org/10.1007/s10479-022-04715-2" }
    ],
    legacySlug: "Multichannel_CNN",
    sourcePath: "achievement_records/publications/journal/oh_multichannel_2024.yaml",
    verificationStatus: "partially_verified"
  },
  {
    title: "Transfer Entropy Analysis for Congestion Propagation",
    track: "research-development",
    organization: "UNIST Data Analytics Lab",
    role: "Researcher",
    summary:
      "Traffic-congestion propagation analysis using transfer entropy and statistical causality.",
    links: [
      { label: "Repository", href: "https://github.com/yongkyung-oh/TransferEntropy-Propagation" },
      { label: "Paper", href: "https://doi.org/10.3934/era.2023034" }
    ],
    legacySlug: "TE_for_propagation",
    sourcePath: "achievement_records/publications/journal/oh_transfer_2021.yaml",
    verificationStatus: "partially_verified"
  }
];
