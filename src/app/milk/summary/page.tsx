
"use client";

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';
import { getAllAnimals, type Animal } from '@/lib/animal-store'; // Animal type import
import { getOverallMilkSummary, getMilkSummaryPerAnimal, getDailyIncomeTrend, type PeriodFilter } from '@/lib/milk-store';
import type { OverallMilkSummary, AnimalMilkSummary, DailyIncome } from '@/types/milk';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label'; 
import { DollarSign, Droplets, Info, TrendingUp, Filter } from 'lucide-react'; 
import { format, parseISO, getYear, getMonth } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale'; // Import arSA and enUS locales
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';


interface AnimalIncomeDetail extends AnimalMilkSummary {
  animalName: string;
  animalTag: string;
}

const currentSystemYear = getYear(new Date());
const yearOptions = [
  { value: 'all', labelKey: { en: 'All Years', ur: 'تمام سال' } },
  ...Array.from({ length: 6 }, (_, i) => {
    const year = currentSystemYear - i;
    return { value: year.toString(), labelKey: { en: year.toString(), ur: year.toString() } };
  })
];

export default function MilkSummaryPage() {
  const { translate, language } = useLanguage();
  const [overallSummary, setOverallSummary] = useState<OverallMilkSummary | null>(null);
  const [animalSummaries, setAnimalSummaries] = useState<AnimalIncomeDetail[]>([]);
  const [dailyIncomeData, setDailyIncomeData] = useState<DailyIncome[]>([]); 
  const [isLoading, setIsLoading] = useState(true);

  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

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
  }, [language, arSA, enUS]); 

  const chartConfig = {
    income: {
      label: translate({ en: "Income", ur: "آمدنی" }),
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  useEffect(() => {
    const fetchSummaries = () => {
      setIsLoading(true);
      try {
        const periodFilter: PeriodFilter = {
          year: selectedYear === 'all' ? undefined : parseInt(selectedYear),
          month: selectedMonth === 'all' || selectedYear === 'all' ? undefined : parseInt(selectedMonth),
        };

        // Ensure month is not applied if year is 'all'
        if (selectedYear === 'all' && periodFilter.month) {
            periodFilter.month = undefined;
        }

        const overall = getOverallMilkSummary(periodFilter);
        setOverallSummary(overall);

        const perAnimal = getMilkSummaryPerAnimal(periodFilter);
        const allAnimalsData = getAllAnimals();

        const detailedAnimalSummaries: AnimalIncomeDetail[] = perAnimal.map(summary => {
          const animal = allAnimalsData.find(a => a.id === summary.animalId);
          return {
            ...summary,
            animalName: animal ? (language === 'ur' ? animal.nameUr : animal.nameEn) : translate({ en: 'Unknown Animal', ur: 'نامعلوم جانور' }),
            animalTag: animal ? animal.tagNumber : 'N/A',
          };
        }).sort((a,b) => b.totalEarnings - a.totalEarnings);

        setAnimalSummaries(detailedAnimalSummaries);

        const trendData = getDailyIncomeTrend(7); // Trend data is not filtered by period for now
        setDailyIncomeData(trendData);

      } catch (error) {
        console.error("Error fetching milk summaries:", error);
        // Set states to indicate error or empty data
        setOverallSummary(null);
        setAnimalSummaries([]);
        setDailyIncomeData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummaries();
  }, [language, translate, selectedYear, selectedMonth]);

  // Effect to reset month if year is set to 'all'
  useEffect(() => {
    if (selectedYear === 'all' && selectedMonth !== 'all') {
      setSelectedMonth('all');
    }
  }, [selectedYear, selectedMonth]);


  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} ${translate({ en: 'PKR', ur: 'روپے' })}`;
  };

  const formatDateForChart = (dateString: string) => {
    return format(parseISO(dateString), 'd MMM');
  };
  
  const formatTooltipDate = (dateString: string) => {
    return format(parseISO(dateString), 'PPP', { locale: language === 'ur' && arSA ? arSA : enUS });
  };


  const getPeriodTitle = () => {
    if (selectedYear === 'all') {
      return translate({ en: 'All Time', ur: 'کل عرصہ' });
    }
    const yearText = selectedYear; 
    const monthLabel = selectedMonth === 'all' 
      ? '' 
      : monthOptions.find(m => m.value === selectedMonth)?.labelKey[language as 'en' | 'ur'] || '';

    if (selectedMonth === 'all') {
      return `${translate({ en: 'For Year', ur: 'سال کے لیے' })} ${yearText}`;
    }
    return `${translate({ en: 'For', ur: 'برائے' })} ${monthLabel} ${yearText}`;
  };

  const pageTitle = `${translate({en: "Milk Summaries", ur: "دودھ کے خلاصے"})}${getPeriodTitle() === translate({ en: 'All Time', ur: 'کل عرصہ' }) ? '' : ` - ${getPeriodTitle()}`}`;


  let overallSummaryContent;
  if (isLoading) {
    overallSummaryContent = (
      <p className={`text-muted-foreground text-center py-4 ${language === 'ur' ? 'font-urdu' : ''}`}>
        {translate({ en: "Loading summaries...", ur: "خلاصے لوڈ ہو رہے ہیں..." })}
      </p>
    );
  } else if (overallSummary) {
    if (overallSummary.totalEarnings > 0) {
      overallSummaryContent = (
        <p className={`text-3xl font-semibold text-center py-4 ${language === 'ur' ? 'font-urdu' : ''}`}>
          {formatCurrency(overallSummary.totalEarnings)}
        </p>
      );
    } else if (overallSummary.totalQuantityLitre > 0 || overallSummary.totalQuantityKg > 0) {
      overallSummaryContent = (
        <div className={`text-center py-4 px-2 ${language === 'ur' ? 'font-urdu' : ''}`}>
          <div className="flex items-center justify-center text-amber-600 mb-2">
            <Info className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />
            <p className="font-medium">
              {translate({
                en: 'Milk logged, but estimated earnings are zero for the selected period.',
                ur: 'دودھ لاگ کیا گیا ہے، لیکن منتخب مدت کے لیے تخمینی آمدنی صفر ہے۔'
              })}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {translate({
              en: 'Ensure a non-zero rate was set in "Milk Settings" when records were logged. Earnings are based on the rate at the time of logging.',
              ur: 'یقینی بنائیں کہ ریکارڈز لاگ کرتے وقت "دودھ کی ترتیبات" میں ایک غیر صفر شرح مقرر کی گئی تھی۔ آمدنی لاگنگ کے وقت کی شرح پر مبنی ہوتی ہے۔'
            })} <Link href="/milk/settings" className="text-primary hover:underline">{translate({en: "Check Settings", ur: "ترتیبات چیک کریں"})}</Link>
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {translate({en: "Total Logged:", ur: "کل لاگ شدہ:"})}
            {overallSummary.totalQuantityLitre > 0 && ` ${overallSummary.totalQuantityLitre.toFixed(2)} ${translate({en:"Ltr", ur:"لیٹر"})}`}
            {(overallSummary.totalQuantityLitre > 0 && overallSummary.totalQuantityKg > 0) && <span className="mx-1">/</span>}
            {overallSummary.totalQuantityKg > 0 && ` ${overallSummary.totalQuantityKg.toFixed(2)} ${translate({en:"Kg", ur:"کلوگرام"})}`}
          </p>
        </div>
      );
    } else {
      overallSummaryContent = (
      <p className={`text-muted-foreground text-center py-4 ${language === 'ur' ? 'font-urdu' : ''}`}>
        {translate({ en: 'No milk income or quantity recorded for the selected period.', ur: 'منتخب مدت کے لیے دودھ کی کوئی آمدنی یا مقدار ریکارڈ نہیں ہوئی۔' })}
      </p>
    );
    }
  } else {
     overallSummaryContent = (
      <p className={`text-muted-foreground text-center py-4 ${language === 'ur' ? 'font-urdu' : ''}`}>
        {translate({ en: 'Could not load summary. Please try again.', ur: 'خلاصہ لوڈ نہیں کیا جا سکا۔ براہ کرم دوبارہ کوشش کریں.' })}
      </p>
    );
  }


  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className={language === 'ur' ? 'text-right' : ''}>
            <CardTitle className={`text-2xl font-bold ${language === 'ur' ? 'font-urdu' : ''}`}>
                {pageTitle}
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

      <Card className="shadow-xl">
        <CardHeader className={language === 'ur' ? 'text-right' : ''}>
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <DollarSign className="w-8 h-8 text-primary" />
            <CardTitle className={`text-2xl font-bold ${language === 'ur' ? 'font-urdu' : ''}`}>
              {translate({ en: 'Overall Milk Income', ur: 'دودھ کی مجموعی آمدنی' })} ({getPeriodTitle()})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {overallSummaryContent}
        </CardContent>
      </Card>

      <Card className="shadow-xl">
        <CardHeader className={language === 'ur' ? 'text-right' : ''}>
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <TrendingUp className="w-8 h-8 text-primary" />
            <CardTitle className={`text-2xl font-bold ${language === 'ur' ? 'font-urdu' : ''}`}>
              {translate({ en: 'Daily Income Trend (Last 7 Days)', ur: 'روزانہ آمدنی کا رجحان (آخری 7 دن)' })}
            </CardTitle>
          </div>
           <CardDescription className={language === 'ur' ? 'text-right' : 'text-left'}>
            {translate({ en: 'This chart is not affected by the period filter above.', ur: 'یہ چارٹ اوپر دیے گئے مدت کے فلٹر سے متاثر نہیں ہوتا ہے۔' })}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          {isLoading ? (
            <p className={`text-muted-foreground text-center py-4 ${language === 'ur' ? 'font-urdu' : ''}`}>
              {translate({ en: "Loading income trend...", ur: "آمدنی کا رجحان لوڈ ہو رہا ہے۔.." })}
            </p>
          ) : dailyIncomeData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <BarChart
                accessibilityLayer
                data={dailyIncomeData}
                margin={{ top: 5, right: language === 'ur' ? 20 : 5, left: language === 'ur' ? 5 : 10, bottom: 5 }}
                dir={language === 'ur' ? 'rtl' : 'ltr'}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={formatDateForChart}
                  reversed={language === 'ur'}
                />
                <YAxis
                  tickFormatter={(value) => value > 0 ? formatCurrency(value).replace(` ${translate({ en: 'PKR', ur: 'روپے' })}`, '') : '0'}
                  orientation={language === 'ur' ? 'right' : 'left'}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={language === 'ur' ? 5 : 0}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent
                              formatter={(value, name, item) => (
                                <>
                                  <div className="font-medium">{chartConfig[name as keyof typeof chartConfig]?.label}</div>
                                  <div className="text-muted-foreground">{formatCurrency(value as number)}</div>
                                </>
                              )}
                              labelFormatter={(label) => formatTooltipDate(label)}
                          />}
                />
                <Bar dataKey="income" fill="var(--color-income)" radius={language === 'ur' ? [0, 4, 4, 0] : [4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className={`text-muted-foreground text-center py-4 ${language === 'ur' ? 'font-urdu' : ''}`}>
              {translate({ en: 'Not enough data to display income trend.', ur: 'آمدنی کا رجحان دکھانے کے لیے کافی ڈیٹا نہیں ہے۔' })}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-xl">
        <CardHeader className={language === 'ur' ? 'text-right' : ''}>
           <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Droplets className="w-8 h-8 text-primary" />
            <CardTitle className={`text-2xl font-bold ${language === 'ur' ? 'font-urdu' : ''}`}>
              {translate({ en: 'Milk Production & Income per Animal', ur: 'فی جانور دودھ کی پیداوار اور آمدنی' })} ({getPeriodTitle()})
            </CardTitle>
          </div>
          <CardDescription className={language === 'ur' ? 'text-right' : ''}>
            {translate({ en: 'Breakdown of milk production and estimated income by animal for the selected period.', ur: 'منتخب مدت کے لیے جانور کے لحاظ سے دودھ کی پیداوار اور تخمینی آمدنی کی تفصیل۔' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <p className={`text-muted-foreground text-center py-4 ${language === 'ur' ? 'font-urdu' : ''}`}>
                {translate({ en: "Loading animal summaries...", ur: "جانوروں کے خلاصے لوڈ ہو رہے ہیں..." })}
             </p>
          ) : animalSummaries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={language === 'ur' ? 'text-right font-urdu' : ''}>{translate({ en: 'Animal Name', ur: 'جانور کا نام' })}</TableHead>
                  <TableHead className={language === 'ur' ? 'text-right' : ''}>{translate({ en: 'Tag #', ur: 'ٹیگ #' })}</TableHead>
                  <TableHead className={`text-right rtl:text-left ${language === 'ur' ? 'font-urdu' : ''}`}>{translate({ en: 'Qty (Ltr)', ur: 'مقدار (لیٹر)' })}</TableHead>
                  <TableHead className={`text-right rtl:text-left ${language === 'ur' ? 'font-urdu' : ''}`}>{translate({ en: 'Qty (Kg)', ur: 'مقدار (کلو)' })}</TableHead>
                  <TableHead className={`text-right rtl:text-left ${language === 'ur' ? 'font-urdu' : ''}`}>{translate({ en: 'Est. Income', ur: 'تخمینی آمدنی' })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {animalSummaries.map((summary) => (
                  <TableRow key={summary.animalId}>
                    <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''} font-medium`}>{summary.animalName}</TableCell>
                    <TableCell className={language === 'ur' ? 'text-right' : ''}>{summary.animalTag}</TableCell>
                    <TableCell className={`text-right rtl:text-left ${language === 'ur' ? 'font-urdu' : ''}`}>
                      {summary.totalQuantityLitre > 0 ? summary.totalQuantityLitre.toFixed(2) : '-'}
                    </TableCell>
                    <TableCell className={`text-right rtl:text-left ${language === 'ur' ? 'font-urdu' : ''}`}>
                      {summary.totalQuantityKg > 0 ? summary.totalQuantityKg.toFixed(2) : '-'}
                    </TableCell>
                    <TableCell className={`text-right rtl:text-left font-semibold ${language === 'ur' ? 'font-urdu' : ''}`}>
                      {formatCurrency(summary.totalEarnings)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className={`text-muted-foreground text-center py-4 ${language === 'ur' ? 'font-urdu' : ''}`}>
              {translate({ en: 'No milk records found for any animal for the selected period.', ur: 'منتخب مدت کے لیے کسی بھی جانور کے لیے دودھ کا کوئی ریکارڈ نہیں ملا۔' })}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

