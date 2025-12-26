
import type { Animal } from '@/types/animal';

const ANIMALS_STORAGE_KEY = 'mooManagerAnimals';

function getAnimalsFromStorage(): Animal[] {
  if (typeof window === 'undefined') return [];
  const storedAnimals = localStorage.getItem(ANIMALS_STORAGE_KEY);
  return storedAnimals ? JSON.parse(storedAnimals) : [];
}

function saveAnimalsToStorage(animals: Animal[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ANIMALS_STORAGE_KEY, JSON.stringify(animals));
}

export function getAllAnimals(): Animal[] {
  return getAnimalsFromStorage().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getAnimalById(id: string): Animal | undefined {
  const animals = getAnimalsFromStorage();
  return animals.find(animal => animal.id === id);
}

export type NewAnimalData = Omit<Animal, 'id' | 'createdAt' | 'updatedAt'>;

export function addAnimal(animalData: NewAnimalData): Animal {
  const animals = getAnimalsFromStorage();
  const now = new Date().toISOString();
  const newAnimal: Animal = {
    ...animalData,
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    createdAt: now,
    updatedAt: now,
  };
  animals.push(newAnimal);
  saveAnimalsToStorage(animals);
  return newAnimal;
}

export type UpdateAnimalData = Partial<Omit<Animal, 'id' | 'createdAt' | 'updatedAt'>>;

export function updateAnimal(id: string, updates: UpdateAnimalData): Animal | undefined {
  const animals = getAnimalsFromStorage();
  const animalIndex = animals.findIndex(animal => animal.id === id);
  if (animalIndex === -1) return undefined;

  const updatedAnimal = {
    ...animals[animalIndex],
    ...updates,
    motherId: updates.motherId !== undefined ? updates.motherId : animals[animalIndex].motherId,
    fatherId: updates.fatherId !== undefined ? updates.fatherId : animals[animalIndex].fatherId,
    updatedAt: new Date().toISOString(),
  };
  animals[animalIndex] = updatedAnimal;
  saveAnimalsToStorage(animals);
  return updatedAnimal;
}

export function deleteAnimal(id: string): boolean {
  let animals = getAnimalsFromStorage();
  const initialLength = animals.length;
  animals = animals.filter(animal => animal.id !== id);
  if (animals.length < initialLength) {
    saveAnimalsToStorage(animals);
    // TODO: Consider what to do with reproduction records if an animal is deleted.
    // For now, they will remain, potentially orphaned.
    return true;
  }
  return false;
}
