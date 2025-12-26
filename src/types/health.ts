
export type HealthRecordType = 'vaccination' | 'treatment' | 'checkup';

export interface HealthRecord {
  id: string;
  animalId: string;
  type: HealthRecordType;
  date: string; // ISO string for date of event
  notes?: string;
  medication?: string; // For treatments
  nextDueDate?: string; // ISO string for date, for vaccinations/checkups
  expense?: number; // Optional expense for the health event
  createdAt: string; // ISO string for datetime
}

export const healthRecordTypeOptions: { value: HealthRecordType, labelKey: { en: string, ur: string } }[] = [
  { value: 'vaccination', labelKey: { en: 'Vaccination', ur: 'ویکسینیشن' } },
  { value: 'treatment', labelKey: { en: 'Treatment', ur: 'علاج' } },
  { value: 'checkup', labelKey: { en: 'Checkup', ur: 'چیک اپ' } },
];
