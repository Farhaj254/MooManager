
import type { FeedRecord, FeedType, FeedUnit, MonthlyFeedReport, AnimalFeedSummary, FeedUsageDetail } from '@/types/feed';
import { feedTypeOptions } from '@/types/feed';
import type { Animal } from '@/types/animal';
import { getAllAnimals } from '@/lib/animal-store';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, getYear, getMonth, isValid } from 'date-fns';
import { enUS, arSA } from 'date-fns/locale';
import type { PeriodFilter } from './milk-store'; // Import PeriodFilter

const FEED_RECORDS_STORAGE_KEY = 'mooManagerFeedRecords';

// Helper type for period filtering
// export type PeriodFilter = { year?: number; month?: number }; // Now imported from milk-store

function getFeedRecordsFromStorage(): FeedRecord[] {
  if (typeof window === 'undefined') return [];
  const storedRecords = localStorage.getItem(FEED_RECORDS_STORAGE_KEY);
  return storedRecords ? JSON.parse(storedRecords) : [];
}

function saveFeedRecordsToStorage(records: FeedRecord[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FEED_RECORDS_STORAGE_KEY, JSON.stringify(records));
}

export function addFeedRecord(recordData: Omit<FeedRecord, 'id' | 'createdAt'>): FeedRecord {
  const records = getFeedRecordsFromStorage();
  const newRecord: FeedRecord = {
    ...recordData,
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  records.push(newRecord);
  saveFeedRecordsToStorage(records);
  return newRecord;
}

export function getAllFeedRecords(): FeedRecord[] {
  return getFeedRecordsFromStorage().sort((a, b) => {
    const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateComparison !== 0) return dateComparison;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function getFeedRecordsByDate(date: Date): FeedRecord[] {
  const records = getFeedRecordsFromStorage();
  const targetDateString = format(date, 'yyyy-MM-dd');
  return records.filter(record => record.date === targetDateString)
                .sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function deleteFeedRecord(id: string): boolean {
  let records = getFeedRecordsFromStorage();
  const initialLength = records.length;
  records = records.filter(record => record.id !== id);
  if (records.length < initialLength) {
    saveFeedRecordsToStorage(records);
    return true;
  }
  return false;
}

export function getFeedSummaryForDate(date: Date): { totalCost: number, records: FeedRecord[] } {
  const records = getFeedRecordsByDate(date);
  const totalCost = records.reduce((sum, record) => sum + Number(record.cost || 0), 0);
  return { totalCost: parseFloat(totalCost.toFixed(2)), records };
}

// --- Report Functions ---

export function getFeedRecordsFiltered(period?: PeriodFilter): FeedRecord[] {
  let records = getAllFeedRecords();

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
    // This case (period.year is undefined but period.month is defined) should not happen with current UI logic
    // which disables month selection if "All Years" is chosen.
    // If it did, it would imply filtering only by month across all years, which is not a current requirement.
    // Returning true here would be equivalent to "All Time" if period.year is undefined.
    return true; 
  });
}


function calculateFeedUsageDetails(records: FeedRecord[]): { overallTotalCost: number, byType: FeedUsageDetail[] } {
  const usageMap = new Map<FeedType, { totalQuantity: number, totalCost: number, unit: FeedUnit }>();
  let overallTotalCost = 0;

  records.forEach(record => {
    overallTotalCost += record.cost;
    const feedOption = feedTypeOptions.find(fto => fto.value === record.feedType);
    const unit = feedOption ? feedOption.defaultUnit : record.unit;

    const current = usageMap.get(record.feedType) || { totalQuantity: 0, totalCost: 0, unit: unit };
    current.totalQuantity += record.quantity;
    current.totalCost += record.cost;
    usageMap.set(record.feedType, current);
  });

  const byType: FeedUsageDetail[] = [];
  usageMap.forEach((data, feedType) => {
    byType.push({
      feedType,
      totalQuantity: parseFloat(data.totalQuantity.toFixed(2)),
      unit: data.unit,
      totalCost: parseFloat(data.totalCost.toFixed(2)),
    });
  });

  return { overallTotalCost: parseFloat(overallTotalCost.toFixed(2)), byType };
}

export interface FeedReportResult {
  title: string;
  totalCost: number;
  usageByType: FeedUsageDetail[];
}

export function getFeedReport(period: PeriodFilter | undefined, language: 'en' | 'ur'): FeedReportResult {
  const recordsForPeriod = getFeedRecordsFiltered(period);
  const { overallTotalCost, byType } = calculateFeedUsageDetails(recordsForPeriod);
  
  let title: string;
  if (period?.year && period.month) {
    const dateForMonthName = new Date(period.year, period.month - 1, 1);
    let monthName = format(dateForMonthName, 'MMMM yyyy', { locale: language === 'ur' ? arSA : enUS });
    if (language === 'ur') {
        const urduMonths = ["جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون", "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر"];
        monthName = `${urduMonths[period.month -1]} ${period.year}`;
    }
    title = monthName;
  } else if (period?.year) { // Specific year, all months
    title = language === 'ur' ? `سال ${period.year}` : `Year ${period.year}`;
  } else { // All years (period.year is undefined, period.month is undefined)
    title = language === 'ur' ? 'تمام عرصہ' : 'All Time';
  }

  return {
    title: title,
    totalCost: overallTotalCost,
    usageByType: byType.sort((a,b) => b.totalCost - a.totalCost), 
  };
}

export function getPerAnimalFeedSummary(period: PeriodFilter | undefined): AnimalFeedSummary[] {
  const recordsForPeriod = getFeedRecordsFiltered(period);
  const animals = getAllAnimals(); 

  const animalRecordsMap = new Map<string, FeedRecord[]>();
  recordsForPeriod.forEach(record => {
    const existing = animalRecordsMap.get(record.animalId) || [];
    existing.push(record);
    animalRecordsMap.set(record.animalId, existing);
  });

  const summaries: AnimalFeedSummary[] = [];
  animalRecordsMap.forEach((animalRecords, animalId) => {
    const animalDetails = animals.find(a => a.id === animalId);
    const { overallTotalCost, byType } = calculateFeedUsageDetails(animalRecords);
    
    summaries.push({
      animalId,
      animalName: animalDetails ? (animalDetails.nameEn) : 'Unknown Animal', 
      animalTagNumber: animalDetails ? animalDetails.tagNumber : 'N/A',
      totalCost: overallTotalCost,
      usageByType: byType, 
    });
  });

  return summaries.sort((a,b) => b.totalCost - a.totalCost); 
}

export function getOverallFeedCost(period?: PeriodFilter): number {
  const records = getFeedRecordsFiltered(period);
  const totalCost = records.reduce((sum, record) => sum + Number(record.cost || 0), 0);
  return parseFloat(totalCost.toFixed(2));
}

// This one is for the dashboard and uses the original monthly logic
export function getMonthlyFeedReport(targetDate: Date, currentLanguage: 'en' | 'ur'): MonthlyFeedReport {
  const monthStart = startOfMonth(targetDate);
  const monthEnd = endOfMonth(targetDate);
  const recordsForMonth = getAllFeedRecords().filter(record => {
    const recordDate = parseISO(record.date);
    return isWithinInterval(recordDate, { start: monthStart, end: monthEnd });
  });

  const { overallTotalCost, byType } = calculateFeedUsageDetails(recordsForMonth);
  
  let monthName: string;
  try {
    monthName = format(targetDate, 'MMMM yyyy', { locale: currentLanguage === 'ur' ? arSA : enUS });
     if (currentLanguage === 'ur') {
      const urduMonths = ["جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون", "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر"];
      const monthIndex = getMonth(targetDate);
      const year = getYear(targetDate);
      monthName = `${urduMonths[monthIndex]} ${year}`;
    }
  } catch (e) {
    monthName = format(targetDate, 'MM/yyyy');
  }

  return {
    month: monthName,
    totalCost: overallTotalCost,
    usageByType: byType.sort((a,b) => b.totalCost - a.totalCost), 
  };
}

// This one is for the dashboard and uses the original monthly logic
export function getPerAnimalFeedSummaryForMonth(targetDate: Date): AnimalFeedSummary[] {
   const monthStart = startOfMonth(targetDate);
  const monthEnd = endOfMonth(targetDate);
  const recordsForMonth = getAllFeedRecords().filter(record => {
    const recordDate = parseISO(record.date);
    return isWithinInterval(recordDate, { start: monthStart, end: monthEnd });
  });
  const animals = getAllAnimals(); 

  const animalRecordsMap = new Map<string, FeedRecord[]>();
  recordsForMonth.forEach(record => {
    const existing = animalRecordsMap.get(record.animalId) || [];
    existing.push(record);
    animalRecordsMap.set(record.animalId, existing);
  });

  const summaries: AnimalFeedSummary[] = [];
  animalRecordsMap.forEach((animalRecords, animalId) => {
    const animalDetails = animals.find(a => a.id === animalId);
    const { overallTotalCost, byType } = calculateFeedUsageDetails(animalRecords);
    
    summaries.push({
      animalId,
      animalName: animalDetails ? (animalDetails.nameEn) : 'Unknown Animal', 
      animalTagNumber: animalDetails ? animalDetails.tagNumber : 'N/A',
      totalCost: overallTotalCost,
      usageByType: byType, 
    });
  });

  return summaries.sort((a,b) => b.totalCost - a.totalCost); 
}

