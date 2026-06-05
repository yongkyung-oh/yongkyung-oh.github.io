export type Talk = {
  title: string;
  venue: string;
  organization?: string;
  date: string;
  type: "invited" | "keynote" | "conference" | "workshop" | "seminar" | "guest lecture";
  links?: { label: string; href: string }[];
  sourcePath: string;
  verificationStatus: "verified" | "partially_verified";
};

export const talks: Talk[] = [
  {
    title: "FlowPath: Learning Data-Driven Manifolds with Invertible Flows for Robust Irregularly-sampled Time Series Classification",
    venue: "Proceedings of the AAAI Conference on Artificial Intelligence",
    organization: "AAAI 2026",
    date: "2026-01-24",
    type: "conference",
    links: [
      { label: "Paper", href: "https://ojs.aaai.org/index.php/AAAI/article/view/39643" }
    ],
    sourcePath: "achievement_records/presentations/zotero_keyed/oh_flowpath_2026__20260124__proceedings_aaai_conference.yaml",
    verificationStatus: "partially_verified"
  },
  {
    title: "Modeling Temporal Evolution with Neural Differential Equations",
    venue: "ISE Colloquium, Department of Industrial and Systems Engineering",
    organization: "KAIST",
    date: "2025-03-21",
    type: "invited",
    links: [
      { label: "Slide", href: "https://drive.google.com/file/d/1AJMMg9wWa4clMacT9SInmGQ4YLdf4M-e" }
    ],
    sourcePath: "achievement_records/presentations/talks/oh_modeling_temporal_evolution_2025_talk__20250321__ise_colloquium_department.yaml",
    verificationStatus: "partially_verified"
  },
  {
    title: "Multi-view Contrastive Learning for Medical Time Series Domain Adaptation",
    venue: "AI for Medicine and Healthcare, AAAI Bridge Program",
    organization: "AAAI 2025",
    date: "2025-02-25",
    type: "workshop",
    links: [
      { label: "Poster", href: "https://drive.google.com/file/d/1-oLyJqT0RG3ePhB0nHxABgkbTISEUBQV" }
    ],
    sourcePath: "achievement_records/presentations/workshops/oh_multi_view_contrastive_2025_workshop__20250225__ai_medicine_healthcare.yaml",
    verificationStatus: "partially_verified"
  },
  {
    title: "Hands-on Practices for Neural Differential Equations",
    venue: "IE552/AI603: Neural Differential Equations",
    organization: "UNIST",
    date: "2024-12-03",
    type: "guest lecture",
    links: [
      { label: "Tutorial", href: "https://github.com/yongkyung-oh/Stable-Neural-SDEs/tree/main/tutorial" }
    ],
    sourcePath: "achievement_records/presentations/talks/oh_hands_practices_neural_2024_talk__20241203__ie552_ai603_neural.yaml",
    verificationStatus: "partially_verified"
  },
  {
    title: "Attention-guided Neural Differential Equations Framework for Missingness in Time Series Classification",
    venue: "The 10th Mining and Learning from Time Series Workshop, KDD 2024",
    organization: "MiLeTS / KDD",
    date: "2024-08-26",
    type: "workshop",
    links: [
      { label: "Poster", href: "https://drive.google.com/file/d/1kjQdpOew69nsXKsgb-QW8q7rGBTYw1DS" }
    ],
    sourcePath: "achievement_records/presentations/workshops/oh_attention_guided_neural_2024_workshop__20240826__10th_mining_learning.yaml",
    verificationStatus: "partially_verified"
  },
  {
    title: "Stable Neural Stochastic Differential Equations in Analyzing Irregular Time Series Data",
    venue: "The Twelfth International Conference on Learning Representations",
    organization: "ICLR 2024",
    date: "2024-05-09",
    type: "conference",
    links: [
      { label: "Paper", href: "https://openreview.net/forum?id=4VIgNuQ1pY" },
      { label: "Slide", href: "https://drive.google.com/file/d/1Ci0FK_tJKtVNRQFa-Ck3oaiXvWgFHbV-" }
    ],
    sourcePath: "achievement_records/presentations/zotero_keyed/oh_stable_2024__20240509__twelfth_international_conference.yaml",
    verificationStatus: "partially_verified"
  }
];
