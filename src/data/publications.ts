// Curated publication subset for launch.
// Source policy: only records verified in the local Achivement upstream are included here.
// Do not expand this into a comprehensive CV record without an explicit export pass.

export type PublicationStatus = "published" | "accepted" | "in_press" | "preprint";

export type PublicationLink = {
  label: "Paper" | "Proceedings" | "DOI" | "Preprint" | "Code";
  href: string;
};

export type Publication = {
  title: string;
  apaTitle?: string;
  authors: string;
  apaAuthors?: string;
  apaDetails?: string;
  venue: string;
  year: number;
  summary: string;
  tags: string[];
  links: PublicationLink[];
  kind?: "journal" | "conference" | "workshop" | "preprint";
  id?: string;
  status?: PublicationStatus;
  featured?: boolean;
  displayNote?: string;
  sourcePath: string;
  verificationStatus: string;
};

export const publications: Publication[] = [
  {
    id: "C12",
    kind: "conference",
    status: "published",
    title:
      "FlowPath: Learning Data-Driven Manifolds with Invertible Flows for Robust Irregularly-sampled Time Series Classification",
    apaTitle:
      "FlowPath: Learning data-driven manifolds with invertible flows for robust irregularly-sampled time series classification",
    authors: "Oh, YongKyung, Lim, Dong-Young, Kim, Sungil",
    apaAuthors: "Oh, Y., Lim, D.-Y., & Kim, S.",
    apaDetails: "40(29), 24594-24603",
    venue: "Proceedings of the AAAI Conference on Artificial Intelligence",
    year: 2026,
    summary: "Invertible-flow method for robust classification under irregular sampling.",
    tags: ["Irregular time series", "Invertible flows", "AAAI"],
    links: [
      { label: "Paper", href: "https://ojs.aaai.org/index.php/AAAI/article/view/39643" },
      { label: "DOI", href: "https://doi.org/10.1609/aaai.v40i29.39643" },
      { label: "Preprint", href: "https://arxiv.org/abs/2511.10841" },
      { label: "Code", href: "https://github.com/yongkyung-oh/FlowPath" }
    ],
    featured: true,
    sourcePath: "achievement_records/publications/conference/oh_flowpath_2026.yaml",
    verificationStatus: "partially_verified"
  },
  {
    id: "C07",
    kind: "conference",
    status: "published",
    title: "Multi-View Contrastive Learning for Robust Domain Adaptation in Medical Time Series Analysis",
    apaTitle: "Multi-view contrastive learning for robust domain adaptation in medical time series analysis",
    authors: "Oh, YongKyung, Bui, Alex",
    apaAuthors: "Oh, Y., & Bui, A.",
    apaDetails: "287, 502-526",
    venue: "Proceedings of the Sixth Conference on Health, Inference, and Learning",
    year: 2025,
    summary: "Domain adaptation method for medical time-series robustness.",
    tags: ["Health AI", "Domain adaptation", "CHIL"],
    links: [
      { label: "Paper", href: "https://proceedings.mlr.press/v287/oh25a.html" },
      { label: "Code", href: "https://github.com/yongkyung-oh/Multi-View_Contrastive_Learning" }
    ],
    featured: true,
    displayNote: "CHIL 2025 Best Paper Award",
    sourcePath: "achievement_records/publications/conference/oh_multi-view_2025.yaml",
    verificationStatus: "partially_verified"
  },
  {
    id: "C04",
    kind: "conference",
    status: "published",
    title: "Stable Neural Stochastic Differential Equations in Analyzing Irregular Time Series Data",
    apaTitle: "Stable neural stochastic differential equations in analyzing irregular time series data",
    authors: "Oh, YongKyung, Lim, Dongyoung, Kim, Sungil",
    apaAuthors: "Oh, Y., Lim, D., & Kim, S.",
    venue: "The Twelfth International Conference on Learning Representations",
    year: 2024,
    summary: "Stable neural SDE method for irregular time-series analysis.",
    tags: ["Neural SDE", "Irregular time series", "ICLR"],
    links: [
      { label: "Paper", href: "https://openreview.net/forum?id=4VIgNuQ1pY" },
      { label: "Code", href: "https://github.com/yongkyung-oh/Stable-Neural-SDEs" }
    ],
    featured: true,
    displayNote: "ICLR 2024 Spotlight Presentation",
    sourcePath: "achievement_records/publications/conference/oh_stable_2024.yaml",
    verificationStatus: "partially_verified"
  },
  {
    id: "J12",
    kind: "journal",
    status: "published",
    title:
      "SmokeBERT: A Bidirectional Encoder Representations From Transformers-Based Model for Quantitative Smoking History Extraction From Clinical Narratives to Improve Lung Cancer Screening",
    apaTitle:
      "SmokeBERT: A bidirectional encoder representations from transformers-based model for quantitative smoking history extraction from clinical narratives to improve lung cancer screening",
    authors:
      "Xue, Yiming, Zhu, Yunzheng, Zhuang, Luoting, Oh, YongKyung, Taira, Ricky, Aberle, Denise R., Prosper, Ashley Elizabeth, Hsu, William, Lin, Yannan",
    apaAuthors:
      "Xue, Y., Zhu, Y., Zhuang, L., Oh, Y., Taira, R., Aberle, D. R., Prosper, A. E., Hsu, W., & Lin, Y.",
    apaDetails: "9, e2500223",
    venue: "JCO Clinical Cancer Informatics",
    year: 2025,
    summary: "Clinical NLP model for quantitative smoking-history extraction.",
    tags: ["Clinical NLP", "Cancer informatics", "Health AI"],
    links: [
      { label: "Paper", href: "https://ascopubs.org/doi/10.1200/CCI-25-00223" },
      { label: "DOI", href: "https://doi.org/10.1200/CCI-25-00223" }
    ],
    featured: false,
    sourcePath: "achievement_records/publications/journal/xue_smokebert_2025.yaml",
    verificationStatus: "partially_verified"
  },
  {
    id: "J11",
    kind: "journal",
    status: "published",
    title:
      "TSSI: Time Series as Screenshot Images for multivariate time series classification using convolutional neural networks",
    apaTitle:
      "TSSI: Time series as screenshot images for multivariate time series classification using convolutional neural networks",
    authors: "Oh, YongKyung, Kim, Heeyoung, Kim, Sungil",
    apaAuthors: "Oh, Y., Kim, H., & Kim, S.",
    apaDetails: "209, 111393",
    venue: "Computers & Industrial Engineering",
    year: 2025,
    summary: "Image-based representation pipeline for multivariate time-series classification.",
    tags: ["Time-series representation", "Classification", "Software"],
    links: [
      { label: "Paper", href: "https://www.sciencedirect.com/science/article/pii/S036083522500539X" },
      { label: "DOI", href: "https://doi.org/10.1016/j.cie.2025.111393" },
      { label: "Code", href: "https://github.com/yongkyung-oh/TSSI" }
    ],
    featured: false,
    sourcePath: "achievement_records/publications/journal/oh_tssi_2025.yaml",
    verificationStatus: "partially_verified"
  },
  {
    id: "C14",
    kind: "conference",
    status: "accepted",
    title:
      "Survey-aware machine learning: A guideline for valid population health inference based on scoping review",
    apaTitle:
      "Survey-aware machine learning: A guideline for valid population health inference based on scoping review",
    authors: "Oh, YongKyung, Zheng, H. W., Feng, J., Bui, A. A. T.",
    apaAuthors: "Oh, Y., Zheng, H. W., Feng, J., & Bui, A. A. T.",
    venue: "Proceedings of the Seventh Conference on Health, Inference, and Learning",
    year: 2026,
    summary: "Accepted guidance work for valid population-health inference with complex survey data.",
    tags: ["Population health", "Survey-aware ML", "Accepted"],
    links: [
      { label: "Preprint", href: "https://arxiv.org/abs/2605.08963" },
      { label: "Code", href: "https://github.com/yongkyung-oh/SaML" }
    ],
    featured: false,
    displayNote: "Accepted, in press",
    sourcePath: "achievement_records/accepted_in_press/conference/oh_survey_aware_2026_accepted_in_press.yaml",
    verificationStatus: "partially_verified"
  }
];
