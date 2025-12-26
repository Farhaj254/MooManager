
// This file can be used for more complex, shared report types if needed in the future.
// For now, specific report data structures are defined within their respective pages or stores.

export interface MonthlyComparisonDataPoint {
  month: string; // e.g., "Jul 2024" or localized
  milkEarnings: number;
  feedExpenses: number;
  healthExpenses?: number; // Optional, if we add it to the main comparison chart
  reproductionExpenses?: number; // Optional
  // Potentially other expenses or profit figures
}

export interface AnimalReportSummary {
  animalId: string;
  animalName: string;
  animalTagNumber: string;
  // Milk specific
  totalMilkQuantityLitre?: number;
  totalMilkQuantityKg?: number;
  totalMilkEarnings?: number;
  // Health specific
  totalHealthCost?: number;
  vaccinationCount?: number;
  treatmentCount?: number;
  checkupCount?: number;
  // Feed specific
  totalFeedCost?: number;
  // Reproduction specific
  inseminationCount?: number;
  successfulPregnancies?: number;
  calvesBorn?: number;
}
