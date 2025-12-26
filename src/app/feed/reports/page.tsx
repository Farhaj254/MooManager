
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Wheat, BarChart3, Users, TrendingUp, TrendingDown, MinusCircle, FileText, Syringe, HeartPulse, Info } from 'lucide-react';
import { getFeedReport, getPerAnimalFeedSummary, type PeriodFilter, type FeedReportResult } from '@/lib/feed-store';
import { getMilkEarningsForPeriod } from '@/lib/milk-store'; // Changed from getMilkEarningsForMonth
import { getHealthExpensesForPeriod } from '@/lib/health-store'; // Changed from getMonthlyHealthExpenses
import { getTotalReproductionExpensesForPeriod } from '@/lib/reproduction-store'; // Changed
import type { AnimalFeedSummary, FeedUsageDetail, FeedType, FeedUnit } from '@/types/feed';
import { feedTypeOptions, feedUnitOptions } from '@/types/feed';
import { format, parseISO, getYear, getMonth } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';

const currentSystemYear = getYear(new Date());
const yearOptions = [
  { value: 'all', labelKey: { en: 'All Years', ur: 'تمام سال' } },
  ...Array.from({ length: 6 }, (_, i) => {
    const year = currentSystemYear - i;
    return { value: year.toString(), labelKey: { en: year.toString(), ur: year.toString() } };
  })
];

interface PeriodReproductionExpenses {
  insemination: number;
  pregnancyCheck: number;
  calving: number;
  total: number;
}

export default function FeedReportsPage() {
  const { translate, language } = useLanguage();
  const [feedReport, setFeedReport] = useState<FeedReportResult | null>(null);
  const [animalSummaries, setAnimalSummaries] = useState<AnimalFeedSummary[]>([]);
  
  const [periodMilkEarnings, setPeriodMilkEarnings] = useState<number | null>(null);
  const [periodHealthExpenses, setPeriodHealthExpenses] = useState<number | null>(null);
  const [periodReproductionExpenses, setPeriodReproductionExpenses] = useState<PeriodReproductionExpenses | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFinancialSummary, setIsLoadingFinancialSummary] = useState(true);

  const [selectedYear, setSelectedYear] = useState<string>(currentSystemYear.toString()); 
  const [selectedMonth, setSelectedMonth] = useState<string>((getMonth(new Date()) + 1).toString()); 

  const monthOptions = useMemo(() => {
    return [
      { value: 'all', labelKey: { en: 'All Months', ur: 'تمام مہینے' } },
      ...Array.from({ length: 12 }, (_, i) => ({
        value: (i + 1).toString(),
        labelKey: {
          en: format(new Date(2000, i, 1), 'MMMM', { locale: enUS }),
          ur: language === 'ur' && arSA ? format(new Date(2000, i, 1), 'MMMM', { locale: arSA }) : format(new Date(2000, i, 1), 'MMMM', { locale: enUS }) 
        }
      }))
    ];
  }, [language]);


  useEffect(() => {
    setIsLoading(true);
    setIsLoadingFinancialSummary(true);

    const periodFilter: PeriodFilter = {
      year: selectedYear === 'all' ? undefined : parseInt(selectedYear),
      month: selectedMonth === 'all' || selectedYear === 'all' ? undefined : parseInt(selectedMonth),
    };
    
    if (selectedYear === 'all' && periodFilter.month) {
        periodFilter.month = undefined;
    }

    try {
      const reportData = getFeedReport(periodFilter, language);
      setFeedReport(reportData);

      const animalSummaryData = getPerAnimalFeedSummary(periodFilter);
      const localizedAnimalSummaries = animalSummaryData.map(summary => ({
        ...summary,
        animalName: translate({ en: summary.animalName, ur: summary.animalName }) 
      }));
      setAnimalSummaries(localizedAnimalSummaries);
      
      // Financial summary calculations for the selected period
      const milkEarningsData = getMilkEarningsForPeriod(periodFilter);
      setPeriodMilkEarnings(milkEarningsData);
      const healthExpensesData = getHealthExpensesForPeriod(periodFilter);
      setPeriodHealthExpenses(healthExpensesData);
      const reproductionExpensesData = getTotalReproductionExpensesForPeriod(periodFilter);
      setPeriodReproductionExpenses(reproductionExpensesData);

    } catch (error) {
      console.error("Error fetching reports:", error);
      setFeedReport(null);
      setAnimalSummaries([]);
      setPeriodMilkEarnings(null);
      setPeriodHealthExpenses(null);
      setPeriodReproductionExpenses(null);
    } finally {
      setIsLoading(false); 
      setIsLoadingFinancialSummary(false);
    }
  }, [selectedYear, selectedMonth, language, translate]);
  
  useEffect(() => {
    if (selectedYear === 'all' && selectedMonth !== 'all') {
      setSelectedMonth('all');
    }
  }, [selectedYear, selectedMonth]);


  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} ${translate({ en: 'PKR', ur: 'روپے' })}`;
  };
  
  const getFeedTypeLabel = (type: FeedType) => {
    const option = feedTypeOptions.find(opt => opt.value === type);
    return option ? translate(option.labelKey) : type;
  };
  
  const getFeedUnitLabel = (unitValue: FeedUnit) => {
    const option = feedUnitOptions.find(opt => opt.value === unitValue);
    return option ? translate(option.labelKey) : unitValue;
  };

  const getAnimalName = (summary: AnimalFeedSummary) => {
    return language === 'ur' && summary.animalName.match(/[a-zA-Z]/) 
           ? `${summary.animalName}` 
           : summary.animalName;
  };
  
  const totalReproductionExpensesForPeriod = periodReproductionExpenses?.total ?? 0;
  
  let netProfitOrLoss: number | null = null;
  if (feedReport && periodMilkEarnings !== null && periodHealthExpenses !== null && periodReproductionExpenses !== null) {
    netProfitOrLoss = periodMilkEarnings - feedReport.totalCost - periodHealthExpenses - periodReproductionExpenses.total;
  }

  const profitLossLabel = netProfitOrLoss !== null ? (netProfitOrLoss >= 0 ? translate({en:"Net Profit", ur:"خالص منافع"}) : translate({en:"Net Loss", ur:"خالص نقصان"})) : translate({en:"N/A", ur:"N/A"});
  const profitLossColor = netProfitOrLoss !== null ? (netProfitOrLoss >= 0 ? 'text-green-600' : 'text-red-600') : 'text-muted-foreground';
  const ProfitLossIcon = netProfitOrLoss !== null ? (netProfitOrLoss >= 0 ? TrendingUp : TrendingDown) : MinusCircle;


  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <p>{translate({ en: "Loading feed reports...", ur: "خوراک کی رپورٹس لوڈ ہو رہی ہیں..."})}</p>
      </div>
    );
  }
  
  const financialSummaryTitle = feedReport ? feedReport.title : 
    (selectedYear === 'all' ? translate({en: 'All Time', ur: 'کل عرصہ'}) : 
    (selectedMonth === 'all' ? `${translate({en: 'For Year', ur: 'برائے سال'})} ${selectedYear}` : 
    format(new Date(parseInt(selectedYear), parseInt(selectedMonth)-1, 1), 'MMMM yyyy', {locale: language === 'ur' ? arSA : enUS})));


  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className={language === 'ur' ? 'text-right' : ''}>
            <CardTitle className={`text-2xl font-bold ${language === 'ur' ? 'font-urdu' : ''}`}>
                {translate({en: "Feed Reports", ur: "خوراک کی رپورٹس"})}
            </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 w-full sm:w-auto">
                <Label htmlFor="year-filter" className={language === 'ur' ? 'text-right block' : ''}>{translate({en: "Year", ur: "سال"})}</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear} dir={language === 'ur' ? 'rtl' : 'ltr'}>
                    <SelectTrigger id="year-filter">
                        <SelectValue placeholder={translate({en: "Select Year", ur: "سال منتخب کریں"})} />
                    </SelectTrigger>
                    <SelectContent>
                        {yearOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {translate(opt.labelKey)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex-1 w-full sm:w-auto">
                <Label htmlFor="month-filter" className={language === 'ur' ? 'text-right block' : ''}>{translate({en: "Month", ur: "مہینہ"})}</Label>
                 <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={selectedYear === 'all'} dir={language === 'ur' ? 'rtl' : 'ltr'}>
                    <SelectTrigger id="month-filter">
                        <SelectValue placeholder={translate({en: "Select Month", ur: "مہینہ منتخب کریں"})} />
                    </SelectTrigger>
                    <SelectContent>
                        {monthOptions.map(opt => (
                             <SelectItem key={opt.value} value={opt.value}>
                                {translate(opt.labelKey)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </CardContent>
      </Card>


      <Card className="shadow-lg">
        <CardHeader className={language === 'ur' ? 'text-right' : ''}>
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
             <FileText className="w-7 h-7 text-primary" />
            <CardTitle className={`text-2xl font-bold ${language === 'ur' ? 'font-urdu' : ''}`}>
              {translate({ en: 'Financial Summary', ur: 'مالی خلاصہ' })}
            </CardTitle>
          </div>
          <CardDescription>
            {financialSummaryTitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className={`p-4 border rounded-lg shadow-sm ${language === 'ur' ? 'text-right' : ''}`}>
              <div className="flex items-center text-muted-foreground mb-1">
                <DollarSign className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0 text-primary" />
                <span className="font-medium">{translate({ en: "Total Milk Earnings", ur: "کل دودھ کی آمدنی" })}</span>
              </div>
              <p className={`text-2xl font-bold ${language === 'ur' ? 'font-urdu' : ''}`}>
                {isLoadingFinancialSummary ? translate({en:'Loading...', ur:'لوڈ ہو رہا ہے۔..'}) : periodMilkEarnings !== null ? formatCurrency(periodMilkEarnings) : translate({en:'N/A', ur:'N/A'})}
              </p>
            </div>
            <div className={`p-4 border rounded-lg shadow-sm ${language === 'ur' ? 'text-right' : ''}`}>
              <div className="flex items-center text-muted-foreground mb-1">
                <Wheat className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0 text-destructive" />
                <span className="font-medium">{translate({ en: "Total Feed Cost", ur: "کل خوراک کی لاگت" })}</span>
              </div>
              <p className={`text-2xl font-bold text-destructive ${language === 'ur' ? 'font-urdu' : ''}`}>
                {isLoadingFinancialSummary || !feedReport ? translate({en:'Loading...', ur:'لوڈ ہو رہا ہے۔..'}) : formatCurrency(feedReport.totalCost)}
              </p>
            </div>
             <div className={`p-4 border rounded-lg shadow-sm ${language === 'ur' ? 'text-right' : ''}`}>
              <div className="flex items-center text-muted-foreground mb-1">
                <Syringe className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0 text-destructive" />
                <span className="font-medium">{translate({ en: "Total Health Expenses", ur: "کل صحت کے اخراجات" })}</span>
              </div>
              <p className={`text-2xl font-bold text-destructive ${language === 'ur' ? 'font-urdu' : ''}`}>
                {isLoadingFinancialSummary ? translate({en:'Loading...', ur:'لوڈ ہو رہا ہے۔..'}) : periodHealthExpenses !== null ? formatCurrency(periodHealthExpenses) : translate({en:'N/A', ur:'N/A'})}
              </p>
            </div>
            <div className={`p-4 border rounded-lg shadow-sm ${language === 'ur' ? 'text-right' : ''}`}>
              <div className="flex items-center text-muted-foreground mb-1">
                <HeartPulse className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0 text-destructive" />
                <span className="font-medium">{translate({ en: "Reproduction Expenses", ur: "افزائش نسل کے اخراجات" })}</span>
              </div>
              <p className={`text-2xl font-bold text-destructive ${language === 'ur' ? 'font-urdu' : ''}`}>
                {isLoadingFinancialSummary ? translate({en:'Loading...', ur:'لوڈ ہو رہا ہے۔..'}) : periodReproductionExpenses !== null ? formatCurrency(periodReproductionExpenses.total) : translate({en:'N/A', ur:'N/A'})}
              </p>
               {periodReproductionExpenses && (
                 <p className="text-xs text-muted-foreground mt-1">
                  ({translate({en:"Ins:", ur:"حمل:"})} {formatCurrency(periodReproductionExpenses.insemination)} + {translate({en:"Preg:", ur:"چیک:"})} {formatCurrency(periodReproductionExpenses.pregnancyCheck)} + {translate({en:"Calv:", ur:"زچگی:"})} {formatCurrency(periodReproductionExpenses.calving)})
                </p>
               )}
            </div>
            <div className={`p-4 border rounded-lg shadow-sm ${profitLossColor} ${language === 'ur' ? 'text-right' : ''} md:col-span-2 lg:col-span-4`}>
              <div className="flex items-center justify-center mb-1">
                <ProfitLossIcon className={`w-6 h-6 mr-2 rtl:ml-2 rtl:mr-0`} />
                <span className="text-xl font-medium">{profitLossLabel}</span>
              </div>
              <p className={`text-3xl font-bold text-center ${language === 'ur' ? 'font-urdu' : ''}`}>
                {isLoadingFinancialSummary || isLoading ? translate({en:'Calculating...', ur:'حساب کیا جا رہا ہے۔..'}) : netProfitOrLoss !== null ? formatCurrency(Math.abs(netProfitOrLoss)) : translate({en:'N/A', ur:'N/A'})}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader className={language === 'ur' ? 'text-right' : ''}>
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <BarChart3 className="w-7 h-7 text-primary" />
            <CardTitle className={`text-xl font-bold ${language === 'ur' ? 'font-urdu' : ''}`}>
              {translate({ en: 'Feed Usage by Type', ur: 'خوراک کا قسم کے لحاظ سے استعمال' })}
            </CardTitle>
          </div>
           <CardDescription>
            {translate({en:"Details of feed consumption for", ur:"کے لیے خوراک کی کھپت کی تفصیلات"})}{' '}
            {feedReport ? feedReport.title : translate({en: 'selected period', ur: 'منتخب شدہ مدت'})}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {feedReport && feedReport.usageByType.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className={language === 'ur' ? 'text-right font-urdu' : ''}>{translate({ en: 'Feed Type', ur: 'خوراک کی قسم' })}</TableHead>
                    <TableHead className={`text-right rtl:text-left ${language === 'ur' ? 'font-urdu' : ''}`}>{translate({ en: 'Total Quantity', ur: 'کل مقدار' })}</TableHead>
                    <TableHead className={`text-right rtl:text-left ${language === 'ur' ? 'font-urdu' : ''}`}>{translate({ en: 'Unit', ur: 'یونٹ' })}</TableHead>
                    <TableHead className={`text-right rtl:text-left ${language === 'ur' ? 'font-urdu' : ''}`}>{translate({ en: 'Total Cost', ur: 'کل لاگت' })}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedReport.usageByType.map(item => (
                    <TableRow key={item.feedType}>
                      <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''} font-medium`}>{getFeedTypeLabel(item.feedType)}</TableCell>
                      <TableCell className={`text-right rtl:text-left ${language === 'ur' ? 'font-urdu' : ''}`}>{item.totalQuantity.toFixed(2)}</TableCell>
                      <TableCell className={`text-right rtl:text-left ${language === 'ur' ? 'font-urdu' : ''}`}>{getFeedUnitLabel(item.unit)}</TableCell>
                      <TableCell className={`text-right rtl:text-left ${language === 'ur' ? 'font-urdu' : ''}`}>{formatCurrency(item.totalCost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          ) : (
            <p className={`text-muted-foreground text-center py-6 ${language === 'ur' ? 'text-right' : ''}`}>
              {translate({ en: 'No feed data available for this period to show usage details.', ur: 'استعمال کی تفصیلات دکھانے کے لیے اس مدت میں خوراک کا کوئی ڈیٹا دستیاب نہیں ہے۔' })}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader className={language === 'ur' ? 'text-right' : ''}>
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Users className="w-7 h-7 text-primary" />
            <CardTitle className={`text-xl font-bold ${language === 'ur' ? 'font-urdu' : ''}`}>
              {translate({ en: 'Per Animal Feed Cost Summary', ur: 'فی جانور خوراک کی لاگت کا خلاصہ' })}
            </CardTitle>
          </div>
          <CardDescription>
             {translate({en:"Total feed cost per animal for", ur:"کے لیے فی جانور کل خوراک کی لاگت"})}{' '}
             {feedReport ? feedReport.title : translate({en: 'selected period', ur: 'منتخب شدہ مدت'})}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {animalSummaries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={language === 'ur' ? 'text-right font-urdu' : ''}>{translate({ en: 'Animal Name', ur: 'جانور کا نام' })}</TableHead>
                  <TableHead className={language === 'ur' ? 'text-right' : ''}>{translate({ en: 'Tag #', ur: 'ٹیگ #' })}</TableHead>
                  <TableHead className={`text-right rtl:text-left ${language === 'ur' ? 'font-urdu' : ''}`}>{translate({ en: 'Total Feed Cost', ur: 'کل خوراک کی لاگت' })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {animalSummaries.map(summary => (
                  <TableRow key={summary.animalId}>
                    <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''} font-medium`}>
                        {getAnimalName(summary)}
                    </TableCell>
                    <TableCell className={language === 'ur' ? 'text-right' : ''}>{summary.animalTagNumber}</TableCell>
                    <TableCell className={`text-right rtl:text-left ${language === 'ur' ? 'font-urdu' : ''}`}>{formatCurrency(summary.totalCost)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className={`text-muted-foreground text-center py-6 ${language === 'ur' ? 'text-right' : ''}`}>
              {translate({ en: 'No feed data available for any animal for this period.', ur: 'اس مدت میں کسی بھی جانور کے لیے خوراک کا کوئی ڈیٹا دستیاب نہیں ہے۔' })}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
