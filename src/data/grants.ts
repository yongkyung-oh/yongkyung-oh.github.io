export type Grant = {
  title: string;
  funder: string;
  role: "PI" | "co-PI" | "fellowship" | "researcher" | "trainee";
  period: string;
  host?: string;
  projectTitle?: string;
  relatedProjectIds?: string[];
  sourcePath: string;
  verificationStatus: "verified" | "partially_verified";
};

export const grants: Grant[] = [
  {
    title: "Postdoctoral Fellowship Program (Nurturing Next-generation Researchers)",
    funder: "National Research Foundation of Korea",
    role: "PI",
    period: "2024-2025",
    host: "UCLA",
    projectTitle:
      "Approach to Detect Distribution Shifts Over Time and Evaluate Model Trustworthy with Retraining in Longitudinal Medical Data",
    sourcePath: "achievement_records/grants/nrf_postdoctoral_fellowship_2024.yaml",
    verificationStatus: "verified"
  },
  {
    title: "Intensive AI Program for Korean Students",
    funder: "Institute for Information & Communication Technology Planning & Evaluation",
    role: "trainee",
    period: "2020",
    host: "Carnegie Mellon University",
    sourcePath: "achievement_records/grants/iitp_intensive_ai_training_program_2020.yaml",
    verificationStatus: "partially_verified"
  }
];
