export type Project = {
  id: string;
  name: string;
  track: "research" | "industry";
  status: "active" | "completed";
  area: string;
  role?: string;
  period?: string;
  summary: string;
  href: string;
  relatedPublicationIds?: string[];
  relatedGrantId?: string;
};

export const projects: Project[] = [
  {
    id: "stable-neural-sdes",
    name: "Stable-Neural-SDEs",
    track: "research",
    status: "completed",
    area: "Neural differential equations",
    summary: "Reference implementation for stable neural SDEs on irregular time-series data.",
    href: "https://github.com/yongkyung-oh/Stable-Neural-SDEs",
    relatedPublicationIds: ["C04"]
  },
  {
    id: "flowpath",
    name: "FlowPath",
    track: "research",
    status: "active",
    area: "Irregular time-series classification",
    summary: "Invertible-flow method for robust classification under irregular sampling.",
    href: "https://github.com/yongkyung-oh/FlowPath",
    relatedPublicationIds: ["C12"]
  },
  {
    id: "tssi",
    name: "TSSI",
    track: "research",
    status: "completed",
    area: "Time-series representation",
    summary: "Screenshot-image representation pipeline for multivariate time series.",
    href: "https://github.com/yongkyung-oh/TSSI",
    relatedPublicationIds: ["J11"]
  },
  {
    id: "saml",
    name: "SaML",
    track: "research",
    status: "active",
    area: "Population health inference",
    summary: "Survey-aware machine learning guideline and reference material.",
    href: "https://github.com/yongkyung-oh/SaML",
    relatedPublicationIds: ["C14"]
  }
];
