
export type AnimalSpecies = 'cow' | 'buffalo' | 'sheep' | 'goat';
export type AnimalGender = 'male' | 'female';
export type AnimalStatus = 'active' | 'sold' | 'deceased';

export interface Animal {
  id: string;
  nameEn: string;
  nameUr: string;
  species: AnimalSpecies;
  breed: string;
  gender: AnimalGender;
  tagNumber: string;
  dateOfBirth: string; // ISO string for date
  photoDataUrl?: string; // Base64 data URL
  status: AnimalStatus;
  motherId?: string; // ID of the mother
  fatherId?: string; // ID of the father (e.g., bull if known)
  createdAt: string; // ISO string for datetime
  updatedAt: string; // ISO string for datetime
}

export const animalSpeciesOptions: { value: AnimalSpecies, labelKey: { en: string, ur: string } }[] = [
  { value: 'cow', labelKey: { en: 'Cow', ur: 'گائے' } },
  { value: 'buffalo', labelKey: { en: 'Buffalo', ur: 'بھینس' } },
  { value: 'sheep', labelKey: { en: 'Sheep', ur: 'بھیڑ' } },
  { value: 'goat', labelKey: { en: 'Goat', ur: 'بکری' } },
];

export const animalGenderOptions: { value: AnimalGender, labelKey: { en: string, ur: string } }[] = [
  { value: 'male', labelKey: { en: 'Male', ur: 'نر' } },
  { value: 'female', labelKey: { en: 'Female', ur: 'مادہ' } },
];

export const animalStatusOptions: { value: AnimalStatus, labelKey: { en: string, ur: string } }[] = [
  { value: 'active', labelKey: { en: 'Active', ur: 'فعال' } },
  { value: 'sold', labelKey: { en: 'Sold', ur: 'فروخت شدہ' } },
  { value: 'deceased', labelKey: { en: 'Deceased', ur: 'فوت شدہ' } },
];
