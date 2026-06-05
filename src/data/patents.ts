export type Patent = {
  title: string;
  jurisdiction: string;
  status: string;
  year: number;
  inventors: string;
  sourcePath: string;
  verificationStatus: "verified" | "partially_verified";
};

export const patents: Patent[] = [
  {
    title: "Encoding method of converting time series data into image",
    jurisdiction: "KR / US",
    status: "KR granted; US notice of allowance",
    year: 2025,
    inventors: "Sungil Kim, YongKyung Oh",
    sourcePath: "achievement_records/patents/time_series_image_encoding_tssi_2022.yaml",
    verificationStatus: "verified"
  },
  {
    title: "Method and device for compensating for sensor drift",
    jurisdiction: "KR / PCT / US",
    status: "KR granted; international applications published",
    year: 2022,
    inventors: "Sungil Kim, Juhee Lee, Chihyun Lim, Junghye Lee, Yejin Kim, Yeram Kim, Namu Kim, Saewon Kim, YongKyung Oh",
    sourcePath: "achievement_records/patents/sensor_drift_compensation_2020.yaml",
    verificationStatus: "verified"
  },
  {
    title: "Method of anomaly detection of vessels applying Bayesian bootstrap",
    jurisdiction: "KR",
    status: "granted",
    year: 2023,
    inventors: "Sungil Kim, YongKyung Oh",
    sourcePath: "achievement_records/patents/vessel_anomaly_detection_bayesian_bootstrap_2020.yaml",
    verificationStatus: "verified"
  },
  {
    title: "Apparatus and method for human activity recognition through hybrid fusion of dynamic and static data",
    jurisdiction: "KR",
    status: "application pending",
    year: 2024,
    inventors: "Sungil Kim, YongKyung Oh",
    sourcePath: "achievement_records/patents/human_activity_recognition_hybrid_fusion_2024.yaml",
    verificationStatus: "partially_verified"
  }
];
