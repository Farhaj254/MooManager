
import type { AnimalSpecies } from './animal';

export type InseminationType = 'ai' | 'natural'; // Artificial Insemination or Natural Service
export type PregnancyResult = 'pregnant' | 'not_pregnant' | 'recheck';
export type CalvingEase = 'easy' | 'assisted' | 'difficult';

export interface InseminationRecord {
  id: string;
  animalId: string; // Dam's ID
  inseminationDate: string; // ISO string for date
  type: InseminationType;
  semenDetails: string; // e.g., Bull ID/Name if natural, Semen Straw ID if AI
  vetName?: string; // Veterinarian or technician
  expense?: number; // Cost of insemination
  expectedDeliveryDate: string; // Calculated, ISO string for date
  pregnancyCheckId?: string; // Link to a pregnancy check record
  calvingRecordId?: string; // Link to a calving record
  notes?: string;
  createdAt: string; // ISO string for datetime
  updatedAt: string; // ISO string for datetime
}

export interface PregnancyCheckRecord {
  id: string;
  inseminationId: string; // Link to the InseminationRecord
  animalId: string; // Dam's ID, for easier querying
  checkDate: string; // ISO string for date
  result: PregnancyResult;
  vetName?: string;
  expense?: number; // Cost of pregnancy check
  notes?: string;
  createdAt: string; // ISO string for datetime
  updatedAt: string; // ISO string for datetime
}

export interface CalfData {
  calfTagNumber: string; // Temp tag or final tag
  calfGender: 'male' | 'female';
  newAnimalId?: string; // If the calf is added to the animal records
  birthWeight?: number; // in kgs
  notes?: string;
}

export interface CalvingRecord {
  id: string;
  inseminationId: string; // Link to the InseminationRecord
  animalId: string; // Dam's ID
  calvingDate: string; // ISO string for date
  numberOfCalves: number;
  calvesData: CalfData[];
  calvingEase: CalvingEase;
  expense?: number; // Cost associated with calving
  notes?: string;
  createdAt: string; // ISO string for datetime
  updatedAt: string; // ISO string for datetime
}

// Options for UI
export const inseminationTypeOptions: { value: InseminationType, labelKey: { en: string, ur: string } }[] = [
  { value: 'ai', labelKey: { en: 'Artificial Insemination (AI)', ur: 'مصنوعی حمل ٹھہرانا' } },
  { value: 'natural', labelKey: { en: 'Natural Service', ur: 'قدرتی ملاپ' } },
];

export const pregnancyResultOptions: { value: PregnancyResult, labelKey: { en: string, ur: string } }[] = [
  { value: 'pregnant', labelKey: { en: 'Pregnant', ur: 'حاملہ' } },
  { value: 'not_pregnant', labelKey: { en: 'Not Pregnant', ur: 'حاملہ نہیں' } },
  { value: 'recheck', labelKey: { en: 'Recheck Needed', ur: 'دوبارہ چیک کریں' } },
];

export const calvingEaseOptions: { value: CalvingEase, labelKey: { en: string, ur: string } }[] = [
  { value: 'easy', labelKey: { en: 'Easy (Unassisted)', ur: 'آسان (بغیر مدد)' } },
  { value: 'assisted', labelKey: { en: 'Assisted', ur: 'مدد کے ساتھ' } },
  { value: 'difficult', labelKey: { en: 'Difficult', ur: 'مشکل' } },
];

// Gestation periods in days
export const GESTATION_PERIODS: Record<AnimalSpecies, number> = {
  cow: 283,
  buffalo: 315, // Average for buffaloes
  goat: 150,
  sheep: 147,
};

