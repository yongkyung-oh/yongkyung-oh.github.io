export type CareerRecord = {
  organization: string;
  unit?: string;
  title: string;
  location: string;
  period: string;
  status: "active" | "completed";
  summary: string[];
  sourcePath: string;
  verificationStatus: "verified" | "partially_verified" | "visually_verified";
};

export const career: CareerRecord[] = [
  {
    organization: "UCLA Health - David Geffen School of Medicine",
    unit: "Medical & Imaging Informatics Group",
    title: "Postdoctoral Researcher",
    location: "Los Angeles, CA, USA",
    period: "2023-present",
    status: "active",
    summary: [
      "Develops AI models for longitudinal clinical and wearable time-series data.",
      "Contributes to trustworthy AI and digital phenotyping research."
    ],
    sourcePath: "achievement_records/career/ucla_health_postdoctoral_researcher_2023.yaml",
    verificationStatus: "partially_verified"
  },
  {
    organization: "Ulsan National Institute of Science and Technology",
    unit: "Industry Intelligentization Institute",
    title: "Postdoctoral Researcher",
    location: "Ulsan, Republic of Korea",
    period: "2023-2024",
    status: "completed",
    summary: [
      "Conducted postdoctoral research on AI models for industrial systems and real-world data applications."
    ],
    sourcePath: "achievement_records/career/unist_industry_intelligentization_postdoctoral_researcher_2023.yaml",
    verificationStatus: "verified"
  },
  {
    organization: "Carnegie Mellon University",
    unit: "Language Technologies Institute, School of Computer Science",
    title: "Visiting Student & Researcher",
    location: "Pittsburgh, PA, USA",
    period: "2020",
    status: "completed",
    summary: [
      "Completed a non-degree intensive AI program with project-based AI and software development coursework."
    ],
    sourcePath: "achievement_records/career/cmu_intensive_ai_program_2020.yaml",
    verificationStatus: "partially_verified"
  },
  {
    organization: "General Motors Global Research and Development Center",
    unit: "Manufacturing Systems Research Laboratory",
    title: "Visiting Scientist",
    location: "Warren / Detroit, MI, USA",
    period: "2017",
    status: "completed",
    summary: [
      "Worked on battery laser-welding advisor research and tooling in a visiting scientist program."
    ],
    sourcePath: "achievement_records/career/general_motors_visiting_scientist_2017.yaml",
    verificationStatus: "visually_verified"
  }
];
