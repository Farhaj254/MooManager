
import type { MilkRecord, MilkSettings, MilkUnit, OverallMilkSummary, AnimalMilkSummary, DailyIncome } from '@/types/milk';
import { format, subDays, eachDayOfInterval, parseISO, startOfMonth, endOfMonth, isWithinInterval, getYear, getMonth, isValid } from 'date-fns';

const MILK_RECORDS_STORAGE_KEY = 'mooManagerMilkRecords';
const MILK_SETTINGS_STORAGE_KEY = 'mooManagerMilkSettings';

// Conversion factor: 1 Litre of milk approx. 1.03 Kg.
// Therefore, 1 Kg of milk approx. 1 / 1.03 Litres.
const KG_PER_LITRE = 1.03;
const LITRES_PER_KG = 1 / KG_PER_LITRE;


// --- Milk Settings ---

export function getMilkSettings(): MilkSettings {
  if (typeof window === 'undefined') return { ratePerUnit: 0, defaultUnit: 'litre' };
  
  const storedSettings = localStorage.getItem(MILK_SETTINGS_STORAGE_KEY);
  const defaultSettings: MilkSettings = { ratePerUnit: 0, defaultUnit: 'litre' };

  if (!storedSettings) {
    return defaultSettings;
  }

  try {
    const parsed = JSON.parse(storedSettings);
    // Ensure ratePerUnit is a number, default to 0 if NaN or not a number
    const ratePerUnit = (typeof parsed.ratePerUnit === 'number' && !isNaN(parsed.ratePerUnit)) ? parsed.ratePerUnit : 0;
    const defaultUnit = (typeof parsed.defaultUnit === 'string' && ['litre', 'kg'].includes(parsed.defaultUnit)) ? parsed.defaultUnit as MilkUnit : 'litre';
    return { ratePerUnit, defaultUnit };
  } catch (error) {
    console.error("Failed to parse milk settings from localStorage, returning defaults:", error);
    return defaultSettings;
  }
}

export function saveMilkSettings(settings: MilkSettings): void {
  if (typeof window === 'undefined') return;
  const settingsToSave = {
    ...settings,
    ratePerUnit: Number(settings.ratePerUnit) || 0, // Ensure it's a number, default to 0
  };
  localStorage.setItem(MILK_SETTINGS_STORAGE_KEY, JSON.stringify(settingsToSave));
}

// --- Milk Records ---

function getMilkRecordsFromStorage(): MilkRecord[] {
  if (typeof window === 'undefined') return [];
  const storedRecords = localStorage.getItem(MILK_RECORDS_STORAGE_KEY);
  return storedRecords ? JSON.parse(storedRecords) : [];
}

function saveMilkRecordsToStorage(records: MilkRecord[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MILK_RECORDS_STORAGE_KEY, JSON.stringify(records));
}

export function addMilkRecord(recordData: Omit<MilkRecord, 'id' | 'createdAt' | 'rateSnapshot' | 'rateUnitSnapshot'>): MilkRecord {
  const records = getMilkRecordsFromStorage();
  const settings = getMilkSettings();
  const newRecord: MilkRecord = {
    ...recordData,
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    rateSnapshot: settings.ratePerUnit, 
    rateUnitSnapshot: settings.defaultUnit,
    createdAt: new Date().toISOString(),
  };
  records.push(newRecord);
  saveMilkRecordsToStorage(records);
  return newRecord;
}

export function getAllMilkRecords(): MilkRecord[] {
  return getMilkRecordsFromStorage().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getMilkRecordsByDate(date: Date): MilkRecord[] {
  const records = getMilkRecordsFromStorage();
  const targetDateString = format(date, 'yyyy-MM-dd');
  return records.filter(record => record.date === targetDateString)
                .sort((a,b) => (a.timeOfDay === 'morning' ? -1 : 1) - (b.timeOfDay === 'morning' ? -1 : 1) || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function getMilkRecordsByAnimalId(animalId: string): MilkRecord[] {
  const records = getMilkRecordsFromStorage();
  return records.filter(record => record.animalId === animalId);
}

export function deleteMilkRecord(id: string): boolean {
  let records = getMilkRecordsFromStorage();
  const initialLength = records.length;
  records = records.filter(record => record.id !== id);
  if (records.length < initialLength) {
    saveMilkRecordsToStorage(records);
    return true;
  }
  return false;
}

// --- Milk Summaries & Earnings ---
function calculateRecordIncome(record: MilkRecord): number {
  const quantity = Number(record.quantity);
  const rate = Number(record.rateSnapshot);
  const loggedUnit = record.unit;
  const rateIsForUnit = record.rateUnitSnapshot || getMilkSettings().defaultUnit;

  if (isNaN(quantity) || quantity <= 0 || isNaN(rate) || rate <= 0) {
    return 0;
  }

  let effectiveQuantity = quantity;
  if (loggedUnit === 'kg' && rateIsForUnit === 'litre') {
    effectiveQuantity = quantity * LITRES_PER_KG;
  } else if (loggedUnit === 'litre' && rateIsForUnit === 'kg') {
    effectiveQuantity = quantity * KG_PER_LITRE;
  }
  return effectiveQuantity * rate;
}

export type PeriodFilter = { year?: number; month?: number } | undefined;

function filterRecordsByPeriod<T extends { date: string }>(
  records: T[],
  period?: PeriodFilter
): T[] {
  if (!period || (period.year === undefined && period.month === undefined)) {
    return records; // Return all records if period is undefined or if both year and month are undefined
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
    // This case should ideally not be reached if UI ensures year is set or 'all' (undefined)
    // If period.year is undefined but period.month is somehow defined, it's ambiguous.
    // Current logic implies 'all records' if year is undefined.
    return true; 
  });
}


export function getOverallMilkSummary(period?: PeriodFilter): OverallMilkSummary {
  let records = getAllMilkRecords();
  records = filterRecordsByPeriod(records, period);
  
  let totalEarnings = 0;
  let totalQuantityLitre = 0;
  let totalQuantityKg = 0;

  records.forEach(record => {
    const quantity = Number(record.quantity);
    if (!isNaN(quantity) && quantity > 0) {
      if (record.unit === 'litre') {
        totalQuantityLitre += quantity;
      } else if (record.unit === 'kg') {
        totalQuantityKg += quantity;
      }
    }
    totalEarnings += calculateRecordIncome(record);
  });

  return { 
    totalEarnings: parseFloat(totalEarnings.toFixed(2)), 
    totalQuantityLitre: parseFloat(totalQuantityLitre.toFixed(2)),
    totalQuantityKg: parseFloat(totalQuantityKg.toFixed(2)),
  };
}

export function getMilkSummaryPerAnimal(period?: PeriodFilter): AnimalMilkSummary[] {
  let records = getAllMilkRecords();
  records = filterRecordsByPeriod(records, period);

  const statsMap = new Map<string, { earnings: number; qtyLitre: number; qtyKg: number }>();

  records.forEach(record => {
    const currentStats = statsMap.get(record.animalId) || { earnings: 0, qtyLitre: 0, qtyKg: 0 };
    const quantity = Number(record.quantity);

    if (!isNaN(quantity) && quantity > 0) {
      if (record.unit === 'litre') {
        currentStats.qtyLitre += quantity;
      } else if (record.unit === 'kg') {
        currentStats.qtyKg += quantity;
      }
    }
    currentStats.earnings += calculateRecordIncome(record);
    statsMap.set(record.animalId, currentStats);
  });

  const summary: AnimalMilkSummary[] = [];
  statsMap.forEach((stats, animalId) => {
    summary.push({ 
      animalId, 
      totalEarnings: parseFloat(stats.earnings.toFixed(2)),
      totalQuantityLitre: parseFloat(stats.qtyLitre.toFixed(2)),
      totalQuantityKg: parseFloat(stats.qtyKg.toFixed(2)),
    });
  });

  return summary.sort((a, b) => b.totalEarnings - a.totalEarnings);
}

export function getDailyIncomeTrend(numberOfDays: number = 7): DailyIncome[] {
  const allRecords = getAllMilkRecords(); 
  const endDate = new Date();
  const startDate = subDays(endDate, numberOfDays - 1);
  
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
  
  const dailyIncomeData: DailyIncome[] = dateRange.map(date => {
    const dateString = format(date, 'yyyy-MM-dd');
    let incomeForDay = 0;
    
    allRecords.forEach(record => {
      if (record.date === dateString) {
        incomeForDay += calculateRecordIncome(record);
      }
    });
    
    return {
      date: dateString, 
      income: parseFloat(incomeForDay.toFixed(2)),
    };
  });
  
  return dailyIncomeData;
}

export function getMilkEarningsForMonth(targetDate: Date): number {
  const allRecords = getAllMilkRecords();
  const monthStart = startOfMonth(targetDate);
  const monthEnd = endOfMonth(targetDate);
  
  let totalEarningsForMonth = 0;

  allRecords.forEach(record => {
    const recordDate = parseISO(record.date);
    if (!isValid(recordDate)) return;
    if (isWithinInterval(recordDate, { start: monthStart, end: monthEnd })) {
      totalEarningsForMonth += calculateRecordIncome(record);
    }
  });

  return parseFloat(totalEarningsForMonth.toFixed(2));
}

export function getMilkEarningsForPeriod(period?: PeriodFilter): number {
  let records = getAllMilkRecords();
  records = filterRecordsByPeriod(records, period); // Use the existing filter
  
  let totalEarnings = 0;
  records.forEach(record => {
    totalEarnings += calculateRecordIncome(record);
  });

  return parseFloat(totalEarnings.toFixed(2));
}
