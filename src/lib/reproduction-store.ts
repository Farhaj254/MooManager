
import type { InseminationRecord, PregnancyCheckRecord, CalvingRecord, PregnancyResult } from '@/types/reproduction';
import { GESTATION_PERIODS } from '@/types/reproduction';
import type { Animal } from '@/types/animal';
import { getAnimalById, getAllAnimals } from './animal-store'; 
import { addDays, format, parseISO, startOfToday, differenceInDays, isToday, isPast, subDays, startOfMonth, endOfMonth, isWithinInterval, getYear, getMonth, isValid } from 'date-fns';
import type { PeriodFilter } from './milk-store'; 

const INSEMINATION_RECORDS_KEY = 'mooManagerInseminationRecords';
const PREGNANCY_CHECKS_KEY = 'mooManagerPregnancyChecks';
const CALVING_RECORDS_KEY = 'mooManagerCalvingRecords';

// --- Helper Functions ---
function getFromStorage<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  const storedData = localStorage.getItem(key);
  try {
    return storedData ? JSON.parse(storedData) : [];
  } catch (e) {
    console.error(`Error parsing ${key} from localStorage`, e);
    return [];
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

// Generic helper to filter reproduction-related records by period
function filterRecordsByDatePropertyAndPeriod<T extends Record<string, any>, K extends keyof T>(
  records: T[],
  datePropName: K,
  period?: PeriodFilter
): T[] {
  if (!period || (period.year === undefined && period.month === undefined)) {
    return records;
  }

  return records.filter(record => {
    const dateValue = record[datePropName];
    if (typeof dateValue !== 'string') return false; 
    const recordDate = parseISO(dateValue);
    if (!isValid(recordDate)) return false;

    const recordYear = getYear(recordDate);
    
    if (period.year !== undefined) {
      if (recordYear !== period.year) {
        return false;
      }
      if (period.month !== undefined) {
        const recordMonth = getMonth(recordDate) + 1;
        return recordMonth === period.month;
      }
      return true; 
    }
    return true;
  });
}


// --- Insemination Records ---
export function getAllInseminationRecords(): InseminationRecord[] {
  return getFromStorage<InseminationRecord>(INSEMINATION_RECORDS_KEY).sort((a,b) => 
    parseISO(b.inseminationDate).getTime() - parseISO(a.inseminationDate).getTime() ||
    parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime()
  );
}

export function getInseminationRecordById(id: string): InseminationRecord | undefined {
  return getAllInseminationRecords().find(record => record.id === id);
}

export function getInseminationRecordsByAnimal(animalId: string): InseminationRecord[] {
  return getAllInseminationRecords().filter(record => record.animalId === animalId);
}

export function addInseminationRecord(data: Omit<InseminationRecord, 'id' | 'expectedDeliveryDate' | 'createdAt' | 'updatedAt'>): InseminationRecord | null {
  const dam = getAnimalById(data.animalId);
  if (!dam) {
    console.error("Dam (mother animal) not found for insemination record.");
    return null; 
  }

  const gestationPeriod = GESTATION_PERIODS[dam.species];
  if (!gestationPeriod) {
    console.error(`Gestation period not defined for species: ${dam.species}`);
    return null; 
  }

  const inseminationDateObj = parseISO(data.inseminationDate);
  const expectedDeliveryDateObj = addDays(inseminationDateObj, gestationPeriod);
  const expectedDeliveryDate = format(expectedDeliveryDateObj, 'yyyy-MM-dd');

  const now = new Date().toISOString();
  const newRecord: InseminationRecord = {
    ...data,
    expense: data.expense ? Number(data.expense) : undefined,
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    expectedDeliveryDate,
    createdAt: now,
    updatedAt: now,
  };

  const records = getAllInseminationRecords();
  records.push(newRecord);
  saveToStorage(INSEMINATION_RECORDS_KEY, records);
  return newRecord;
}

export function updateInseminationRecord(id: string, updates: Partial<Omit<InseminationRecord, 'id' | 'animalId' | 'createdAt' | 'expectedDeliveryDate'>>): InseminationRecord | null {
  const records = getAllInseminationRecords();
  const recordIndex = records.findIndex(r => r.id === id);
  if (recordIndex === -1) return null;

  const originalRecord = records[recordIndex];
  
  let expectedDeliveryDate = originalRecord.expectedDeliveryDate;
  if (updates.inseminationDate && updates.inseminationDate !== originalRecord.inseminationDate) {
    const dam = getAnimalById(originalRecord.animalId);
    if (dam && GESTATION_PERIODS[dam.species]) {
      const inseminationDateObj = parseISO(updates.inseminationDate);
      const expectedDeliveryDateObj = addDays(inseminationDateObj, GESTATION_PERIODS[dam.species]);
      expectedDeliveryDate = format(expectedDeliveryDateObj, 'yyyy-MM-dd');
    } else {
      console.warn("Could not recalculate EDD: Dam or gestation period missing.");
    }
  }

  const updatedRecord: InseminationRecord = {
    ...originalRecord,
    ...updates,
    expense: updates.expense !== undefined ? Number(updates.expense) : originalRecord.expense,
    expectedDeliveryDate, 
    updatedAt: new Date().toISOString(),
  };
  records[recordIndex] = updatedRecord;
  saveToStorage(INSEMINATION_RECORDS_KEY, records);
  return updatedRecord;
}

export function deleteInseminationRecord(id: string): boolean {
  let records = getAllInseminationRecords();
  const initialLength = records.length;
  records = records.filter(record => record.id !== id);
  if (records.length < initialLength) {
    saveToStorage(INSEMINATION_RECORDS_KEY, records);
    deletePregnancyChecksByInseminationId(id);
    deleteCalvingRecordsByInseminationId(id);
    return true;
  }
  return false;
}


// --- Pregnancy Check Records ---
export function getAllPregnancyCheckRecords(): PregnancyCheckRecord[] {
  return getFromStorage<PregnancyCheckRecord>(PREGNANCY_CHECKS_KEY).sort((a,b) => 
    parseISO(b.checkDate).getTime() - parseISO(a.checkDate).getTime() ||
    parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime()
  );
}

export function getPregnancyCheckRecordById(id: string): PregnancyCheckRecord | undefined {
    return getAllPregnancyCheckRecords().find(record => record.id === id);
}

export function addPregnancyCheckRecord(data: Omit<PregnancyCheckRecord, 'id' | 'createdAt' | 'updatedAt'>): PregnancyCheckRecord {
  const now = new Date().toISOString();
  const newRecord: PregnancyCheckRecord = {
    ...data,
    expense: data.expense ? Number(data.expense) : undefined,
    id: `${Date.now()}-${Math.random().toString(36).substring(2,9)}`,
    createdAt: now,
    updatedAt: now,
  };
  const records = getAllPregnancyCheckRecords();
  records.push(newRecord);
  saveToStorage(PREGNANCY_CHECKS_KEY, records);
  
  const insemination = getInseminationRecordById(data.inseminationId);
  if (insemination) {
    updateInseminationRecord(data.inseminationId, { pregnancyCheckId: newRecord.id });
  }
  return newRecord;
}

export function deletePregnancyChecksByInseminationId(inseminationId: string): void {
  let records = getAllPregnancyCheckRecords();
  const initialLength = records.length;
  records = records.filter(r => r.inseminationId !== inseminationId);
  if (records.length < initialLength) {
    saveToStorage(PREGNANCY_CHECKS_KEY, records);
  }
}

export function deletePregnancyCheckRecord(id: string): boolean {
    let records = getAllPregnancyCheckRecords();
    const recordToDelete = records.find(r => r.id === id);
    if (!recordToDelete) return false;

    const initialLength = records.length;
    records = records.filter(r => r.id !== id);
    if (records.length < initialLength) {
        saveToStorage(PREGNANCY_CHECKS_KEY, records);
        const insemination = getInseminationRecordById(recordToDelete.inseminationId);
        if (insemination && insemination.pregnancyCheckId === id) {
            updateInseminationRecord(recordToDelete.inseminationId, { pregnancyCheckId: undefined });
        }
        return true;
    }
    return false;
}

// --- Calving Records (Basic CRUD placeholders) ---
export function getAllCalvingRecords(): CalvingRecord[] {
  return getFromStorage<CalvingRecord>(CALVING_RECORDS_KEY);
}

export function addCalvingRecord(data: Omit<CalvingRecord, 'id' | 'createdAt' | 'updatedAt'>): CalvingRecord {
  const now = new Date().toISOString();
  const newRecord: CalvingRecord = {
    ...data,
    expense: data.expense ? Number(data.expense) : undefined,
    id: `${Date.now()}-${Math.random().toString(36).substring(2,9)}`,
    createdAt: now,
    updatedAt: now,
  };
  const records = getAllCalvingRecords();
  records.push(newRecord);
  saveToStorage(CALVING_RECORDS_KEY, records);
  
  const insemination = getInseminationRecordById(data.inseminationId);
  if (insemination) {
    updateInseminationRecord(data.inseminationId, { calvingRecordId: newRecord.id });
  }
  return newRecord;
}

export function deleteCalvingRecordsByInseminationId(inseminationId: string): void {
  let records = getAllCalvingRecords();
  const initialLength = records.length;
  records = records.filter(r => r.inseminationId !== inseminationId);
   if (records.length < initialLength) {
    saveToStorage(CALVING_RECORDS_KEY, records);
  }
}

export function deleteCalvingRecord(id: string): boolean {
    let records = getAllCalvingRecords();
    const recordToDelete = records.find(r => r.id === id);
    if (!recordToDelete) return false;

    const initialLength = records.length;
    records = records.filter(r => r.id !== id);

    if (records.length < initialLength) {
        saveToStorage(CALVING_RECORDS_KEY, records);
        const insemination = getInseminationRecordById(recordToDelete.inseminationId);
        if (insemination && insemination.calvingRecordId === id) {
            updateInseminationRecord(recordToDelete.inseminationId, { calvingRecordId: undefined });
        }
        return true;
    }
    return false;
}


// --- Upcoming Deliveries ---
export function getUpcomingDeliveries(daysInFuture: number = 90, daysPastGrace: number = 7): InseminationRecord[] {
  const today = startOfToday();
  const futureLimit = addDays(today, daysInFuture);
  const pastLimit = subDays(today, daysPastGrace); 

  return getAllInseminationRecords()
    .filter(record => {
      if (record.calvingRecordId) return false; 

      if (record.pregnancyCheckId) {
        const check = getPregnancyCheckRecordById(record.pregnancyCheckId);
        if (check && check.result === 'not_pregnant') return false; 
      }
      
      const edd = parseISO(record.expectedDeliveryDate);
      if (!isValid(edd)) return false;
      return edd >= pastLimit && edd <= futureLimit;
    })
    .sort((a, b) => parseISO(a.expectedDeliveryDate).getTime() - parseISO(b.expectedDeliveryDate).getTime());
}

// --- Financials ---
// Monthly expenses (used by Operational Reports)
export function getMonthlyInseminationExpenses(targetDate: Date): number {
  const records = getAllInseminationRecords();
  const monthStart = startOfMonth(targetDate);
  const monthEnd = endOfMonth(targetDate);
  return parseFloat(records.reduce((sum, record) => {
    const recordDate = parseISO(record.inseminationDate);
    if (isValid(recordDate) && isWithinInterval(recordDate, { start: monthStart, end: monthEnd })) {
      return sum + Number(record.expense || 0);
    }
    return sum;
  }, 0).toFixed(2));
}

export function getMonthlyPregnancyCheckExpenses(targetDate: Date): number {
  const records = getAllPregnancyCheckRecords();
  const monthStart = startOfMonth(targetDate);
  const monthEnd = endOfMonth(targetDate);
  return parseFloat(records.reduce((sum, record) => {
    const recordDate = parseISO(record.checkDate);
     if (isValid(recordDate) && isWithinInterval(recordDate, { start: monthStart, end: monthEnd })) {
      return sum + Number(record.expense || 0);
    }
    return sum;
  }, 0).toFixed(2));
}

export function getMonthlyCalvingExpenses(targetDate: Date): number {
  const records = getAllCalvingRecords();
  const monthStart = startOfMonth(targetDate);
  const monthEnd = endOfMonth(targetDate);
  return parseFloat(records.reduce((sum, record) => {
    const recordDate = parseISO(record.calvingDate);
    if (isValid(recordDate) && isWithinInterval(recordDate, { start: monthStart, end: monthEnd })) {
      return sum + Number(record.expense || 0);
    }
    return sum;
  }, 0).toFixed(2));
}

// Overall expenses (used by Dashboard)
export function getOverallInseminationExpenses(period?: PeriodFilter): number {
  let records = getAllInseminationRecords();
  records = filterRecordsByDatePropertyAndPeriod(records, 'inseminationDate', period);
  return parseFloat(records.reduce((sum, record) => sum + Number(record.expense || 0), 0).toFixed(2));
}
export function getOverallPregnancyCheckExpenses(period?: PeriodFilter): number {
  let records = getAllPregnancyCheckRecords();
  records = filterRecordsByDatePropertyAndPeriod(records, 'checkDate', period);
  return parseFloat(records.reduce((sum, record) => sum + Number(record.expense || 0), 0).toFixed(2));
}
export function getOverallCalvingExpenses(period?: PeriodFilter): number {
  let records = getAllCalvingRecords();
  records = filterRecordsByDatePropertyAndPeriod(records, 'calvingDate', period);
  return parseFloat(records.reduce((sum, record) => sum + Number(record.expense || 0), 0).toFixed(2));
}


// Period-based expenses (used by Feed Reports financial summary)
export function getInseminationExpensesForPeriod(period?: PeriodFilter): number {
  let records = getAllInseminationRecords();
  records = filterRecordsByDatePropertyAndPeriod(records, 'inseminationDate', period);
  return parseFloat(records.reduce((sum, record) => sum + Number(record.expense || 0), 0).toFixed(2));
}

export function getPregnancyCheckExpensesForPeriod(period?: PeriodFilter): number {
  let records = getAllPregnancyCheckRecords();
  records = filterRecordsByDatePropertyAndPeriod(records, 'checkDate', period);
  return parseFloat(records.reduce((sum, record) => sum + Number(record.expense || 0), 0).toFixed(2));
}

export function getCalvingExpensesForPeriod(period?: PeriodFilter): number {
  let records = getAllCalvingRecords();
  records = filterRecordsByDatePropertyAndPeriod(records, 'calvingDate', period);
  return parseFloat(records.reduce((sum, record) => sum + Number(record.expense || 0), 0).toFixed(2));
}

export function getTotalReproductionExpensesForPeriod(period?: PeriodFilter): {
  insemination: number,
  pregnancyCheck: number,
  calving: number,
  total: number
} {
  const insemination = getInseminationExpensesForPeriod(period);
  const pregnancyCheck = getPregnancyCheckExpensesForPeriod(period);
  const calving = getCalvingExpensesForPeriod(period);
  const total = parseFloat((insemination + pregnancyCheck + calving).toFixed(2));
  return { insemination, pregnancyCheck, calving, total };
}

