export type EducationRecord = {
  institution: string;
  degree: string;
  field?: string;
  period: string;
  detail?: string;
  sourcePath: string;
  verificationStatus: "verified";
};

export const education: EducationRecord[] = [
  {
    institution: "Ulsan National Institute of Science and Technology",
    degree: "Ph.D. in Industrial Engineering",
    field: "Industrial Engineering",
    period: "2018-2023",
    detail: "Dissertation: A Comprehensive Study of Deep Learning for Real-World Multivariate Time Series Classification",
    sourcePath: "achievement_records/education/unist_phd_industrial_engineering_2023.yaml",
    verificationStatus: "verified"
  },
  {
    institution: "Ulsan National Institute of Science and Technology",
    degree: "M.S. in Technology and Innovation Management",
    field: "Technology and Innovation Management",
    period: "2015-2017",
    sourcePath: "achievement_records/education/unist_ms_technology_innovation_management_2017.yaml",
    verificationStatus: "verified"
  },
  {
    institution: "Ulsan National Institute of Science and Technology",
    degree: "B.Sc. in Physics",
    field: "Physics",
    period: "2011-2015",
    sourcePath: "achievement_records/education/unist_bs_physics_2015.yaml",
    verificationStatus: "verified"
  }
];
