import type { InfoCard } from "../components/InfoCardList.astro";

export const currentWork: InfoCard[] = [
  {
    title: "Longitudinal Health Data",
    text: "Modeling clinical and wearable time series where measurements are sparse, missing, and collected under changing conditions."
  },
  {
    title: "Distribution Shift",
    text: "Studying adaptation and evaluation workflows that remain useful when training and deployment populations differ."
  },
  {
    title: "Reusable Methods",
    text: "Maintaining links between papers, code, and citation metadata so research artifacts can be inspected and reused."
  }
];
