
import type { HealthRecord } from '@/types/health';
import { format, parseISO, isFuture, startOfToday, startOfMonth, endOfMonth, isWithinInterval, getYear, getMonth, isValid } from 'date-fns';
import { getAllAnimals, type Animal } from './animal-store'; 
import type { PeriodFilter } from './milk-store'; 

const HEALTH_RECORDS_STORAGE_KEY = 'mooManagerHealthRecords';

function getHealthRecordsFromStorage(): HealthRecord[] {
  if (typeof window === 'undefined') return [];
  const storedRecords = localStorage.getItem(HEALTH_RECORDS_STORAGE_KEY);
  return storedRecords ? JSON.parse(storedRecords) : [];
}

function saveHealthRecordsToStorage(records: HealthRecord[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HEALTH_RECORDS_STORAGE_KEY, JSON.stringify(records));
}

export function addHealthRecord(recordData: Omit<HealthRecord, 'id' | 'createdAt'>): HealthRecord {
  const records = getHealthRecordsFromStorage();
  const newRecord: HealthRecord = {
    ...recordData,
    expense: recordData.expense ? Number(recordData.expense) : undefined, 
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  records.push(newRecord);
  saveHealthRecordsToStorage(records);
  return newRecord;
}

export function getAllHealthRecords(): HealthRecord[] {
  return getHealthRecordsFromStorage().sort((a, b) => {
    const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateComparison !== 0) return dateComparison;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function getHealthRecordsByAnimalId(animalId: string): HealthRecord[] {
  const records = getHealthRecordsFromStorage();
  return records.filter(record => record.animalId === animalId)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getHealthRecordsByDate(date: Date): HealthRecord[] {
  const records = getHealthRecordsFromStorage();
  const targetDateString = format(date, 'yyyy-MM-dd');
  return records.filter(record => record.date === targetDateString)
                .sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}


export function deleteHealthRecord(id: string): boolean {
  let records = getHealthRecordsFromStorage();
  const initialLength = records.length;
  records = records.filter(record => record.id !== id);
  if (records.length < initialLength) {
    saveHealthRecordsToStorage(records);
    return true;
  }
  return false;
}

export function getUpcomingHealthEvents(): HealthRecord[] {
  const records = getAllHealthRecords();
  const today = startOfToday();
  return records.filter(record => record.nextDueDate && isFuture(parseISO(record.nextDueDate)))
                .sort((a, b) => parseISO(a.nextDueDate!).getTime() - parseISO(b.nextDueDate!).getTime());
}

export function getMonthlyHealthExpenses(targetDate: Date): number {
  const allRecords = getAllHealthRecords();
  const monthStart = startOfMonth(targetDate);
  const monthEnd = endOfMonth(targetDate);
  
  let totalExpenses = 0;
  allRecords.forEach(record => {
    const recordDate = parseISO(record.date);
    if (!isValid(recordDate)) return;
    if (isWithinInterval(recordDate, { start: monthStart, end: monthEnd })) {
      totalExpenses += Number(record.expense || 0);
    }
  });
  return parseFloat(totalExpenses.toFixed(2));
}

// Helper to filter health records by period
function filterHealthRecordsByPeriod(records: HealthRecord[], period?: PeriodFilter): HealthRecord[] {
  if (!period || (period.year === undefined && period.month === undefined)) {
    return records; // All records if no specific period
  }

  return records.filter(record => {
    const recordDate = parseISO(record.date);
    if (!isValid(recordDate)) return false;

    const recordYear = getYear(recordDate);
    
    if (period.year !== undefined) {
      if (recordYear !== period.year) {
        return false; // Year doesn't match
      }
      // If year matches and month is defined, check month
      if (period.month !== undefined) {
        const recordMonth = getMonth(recordDate) + 1; // 1-indexed month
        return recordMonth === period.month;
      }
      return true; // Year matches, month is undefined (so all months for this year)
    }
    return true; 
  });
}

export function getOverallHealthExpenses(period?: PeriodFilter): number {
  let records = getAllHealthRecords();
  records = filterHealthRecordsByPeriod(records, period);
  let totalExpenses = 0;
  records.forEach(record => {
    totalExpenses += Number(record.expense || 0);
  });
  return parseFloat(totalExpenses.toFixed(2));
}


export function getHealthExpensesForPeriod(period?: PeriodFilter): number {
  let records = getAllHealthRecords();
  records = filterHealthRecordsByPeriod(records, period);
  
  let totalExpenses = 0;
  records.forEach(record => {
    totalExpenses += Number(record.expense || 0);
  });
  return parseFloat(totalExpenses.toFixed(2));
}

export interface AnimalHealthSummary {
  animalId: string;
  animalName: string; 
  animalTagNumber: string; 
  totalHealthCost: number;
  vaccinationCount: number;
  treatmentCount: number;
  checkupCount: number;
}

export function getPerAnimalHealthSummary(): AnimalHealthSummary[] {
  const allAnimals = getAllAnimals();
  const allHealthRecords = getAllHealthRecords();
  
  const summaries: AnimalHealthSummary[] = allAnimals.map(animal => {
    const animalRecords = allHealthRecords.filter(record => record.animalId === animal.id);
    
    let totalHealthCost = 0;
    let vaccinationCount = 0;
    let treatmentCount = 0;
    let checkupCount = 0;
    
    animalRecords.forEach(record => {
      totalHealthCost += Number(record.expense || 0);
      if (record.type === 'vaccination') vaccinationCount++;
      else if (record.type === 'treatment') treatmentCount++;
      else if (record.type === 'checkup') checkupCount++;
    });
    
    return {
      animalId: animal.id,
      animalName: animal.nameEn, 
      animalTagNumber: animal.tagNumber,
      totalHealthCost: parseFloat(totalHealthCost.toFixed(2)),
      vaccinationCount,
      treatmentCount,
      checkupCount,
    };
  });
  
  return summaries.sort((a, b) => b.totalHealthCost - a.totalHealthCost); 
}

