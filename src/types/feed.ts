
export type FeedType = 'green' | 'dry' | 'concentrate' | 'water';
export type FeedUnit = 'kg' | 'litre';

export interface FeedRecord {
  id: string;
  animalId: string;
  date: string; // YYYY-MM-DD
  feedType: FeedType;
  quantity: number;
  unit: FeedUnit; // kg for green, dry, concentrate; litre for water
  cost: number; // Total cost for this specific feeding record
  createdAt: string; // ISO datetime
}

export const feedTypeOptions: { value: FeedType, labelKey: { en: string, ur: string }, defaultUnit: FeedUnit }[] = [
  { value: 'green', labelKey: { en: 'Green Fodder', ur: 'سبز چارہ' }, defaultUnit: 'kg' },
  { value: 'dry', labelKey: { en: 'Dry Fodder', ur: 'خشک چارہ' }, defaultUnit: 'kg' },
  { value: 'concentrate', labelKey: { en: 'Concentrate', ur: 'ونڈا' }, defaultUnit: 'kg' },
  { value: 'water', labelKey: { en: 'Water', ur: 'پانی' }, defaultUnit: 'litre' },
];

export const feedUnitOptions: { value: FeedUnit, labelKey: { en: string, ur: string } }[] = [
  { value: 'kg', labelKey: { en: 'Kg', ur: 'کلوگرام' } },
  { value: 'litre', labelKey: { en: 'Litre', ur: 'لیٹر' } },
];

// For Reports
export interface FeedUsageDetail {
  feedType: FeedType;
  totalQuantity: number;
  unit: FeedUnit; // Should be consistent for a given feedType in the summary
  totalCost: number;
}

export interface MonthlyFeedReport {
  month: string; // e.g., "July 2024" or "جولائی ۲۰۲۴"
  totalCost: number;
  usageByType: FeedUsageDetail[];
}

export interface AnimalFeedSummary {
  animalId: string;
  animalName: string; // Added for display
  animalTagNumber: string; // Added for display
  totalCost: number;
  usageByType: FeedUsageDetail[]; // Optional: if we want to show per-animal type breakdown later
}
