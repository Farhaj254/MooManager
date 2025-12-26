
export type MilkUnit = 'litre' | 'kg';
export type TimeOfDay = 'morning' | 'evening';

export interface MilkRecord {
  id: string;
  animalId: string; // Link to Animal
  date: string; // ISO string for date (YYYY-MM-DD)
  timeOfDay: TimeOfDay;
  quantity: number;
  unit: MilkUnit; // The unit of the 'quantity' field
  rateSnapshot: number; // Rate at the time of logging
  rateUnitSnapshot: MilkUnit; // The unit for which rateSnapshot is defined (e.g. if rate is 100/litre, this is 'litre')
  createdAt: string; // ISO string for datetime
}

export interface MilkSettings {
  ratePerUnit: number;
  defaultUnit: MilkUnit;
}

export const milkUnitOptions: { value: MilkUnit, labelKey: { en: string, ur: string } }[] = [
  { value: 'litre', labelKey: { en: 'Litre', ur: 'لیٹر' } },
  { value: 'kg', labelKey: { en: 'Kg', ur: 'کلوگرام' } },
];

export const timeOfDayOptions: { value: TimeOfDay, labelKey: { en: string, ur: string } }[] = [
  { value: 'morning', labelKey: { en: 'Morning', ur: 'صبح' } },
  { value: 'evening', labelKey: { en: 'Evening', ur: 'شام' } },
];

// Interfaces for summaries
export interface OverallMilkSummary {
  totalEarnings: number;
  totalQuantityLitre: number;
  totalQuantityKg: number;
}

export interface AnimalMilkSummary {
  animalId: string;
  totalEarnings: number;
  totalQuantityLitre: number;
  totalQuantityKg: number;
}

export interface DailyIncome {
  date: string; // YYYY-MM-DD
  income: number;
}
