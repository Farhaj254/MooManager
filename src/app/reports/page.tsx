
"use client";

import { useEffect, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Wheat, BarChart3, Users, Droplets, LineChart, HeartPulse, CheckCircle, AlertCircle, Search, TrendingUp, TrendingDown, MinusCircle } from 'lucide-react';
import { getMonthlyFeedReport, type MonthlyFeedReport } from '@/lib/feed-store';
import { getMilkEarningsForMonth, getMilkSummaryPerAnimal, type AnimalMilkSummary } from '@/lib/milk-store';
import { getPerAnimalHealthSummary, type AnimalHealthSummary, getMonthlyHealthExpenses } from '@/lib/health-store';
import { 
  getAllInseminationRecords, 
  getPregnancyCheckRecordById,
  getMonthlyInseminationExpenses,
  getMonthlyPregnancyCheckExpenses,
  getMonthlyCalvingExpenses,
  type InseminationRecord, 
  type PregnancyCheckRecord 
} from '@/lib/reproduction-store';
import { inseminationTypeOptions, pregnancyResultOptions } from '@/types/reproduction';
import { getAllAnimals, type Animal } from '@/lib/animal-store';

import { format, subMonths, startOfMonth, parseISO } from 'date-fns';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Legend, Tooltip as RechartsTooltip, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { arSA, enUS } from 'date-fns/locale';


interface MonthlyDataPoint {
  month: string; 
  milkEarnings: number;
  feedExpenses: number;
  healthExpenses: number;
  reproductionExpenses: number;
  totalExpenses: number;
  netProfitLoss: number;
}

interface EnrichedInseminationReportItem extends InseminationRecord {
  damName: string;
  damTagNumber: string;
  pregnancyCheckResult?: PregnancyCheckRecord['result'];
  pregnancyCheckDate?: string; // Formatted
  calvingStatus: string; 
}


export default function ReportsPage() {
  const { translate, language } = useLanguage();
  const [monthlyComparisonData, setMonthlyComparisonData] = useState<MonthlyDataPoint[]>([]);
  const [animalMilkSummaries, setAnimalMilkSummaries] = useState<AnimalMilkSummary[]>([]);
  const [animalHealthSummaries, setAnimalHealthSummaries] = useState<AnimalHealthSummary[]>([]);
  const [inseminationReportData, setInseminationReportData] = useState<EnrichedInseminationReportItem[]>([]);
  const [animalsMap, setAnimalsMap] = useState<Map<string, Animal>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  const chartConfig = {
    milkEarnings: {
      label: translate({ en: "Milk Earnings", ur: "دودھ کی آمدنی" }),
      color: "hsl(var(--chart-1))",
    },
    totalExpenses: {
      label: translate({ en: "Total Expenses", ur: "کل اخراجات" }),
      color: "hsl(var(--chart-2))",
    },
    netProfitLoss: {
        label: translate({ en: "Net Profit/Loss", ur: "خالص منافع/نقصان" }),
        color: "hsl(var(--chart-3))", // A distinct color
    }
  } satisfies ChartConfig;

  useEffect(() => {
    setIsLoading(true);
    const today = new Date();
    const comparisonData: MonthlyDataPoint[] = [];
    const numMonthsToCompare = 6; 

    for (let i = numMonthsToCompare - 1; i >= 0; i--) {
      const targetMonthDate = subMonths(today, i);
      const monthStart = startOfMonth(targetMonthDate);
      
      let monthLabel = format(monthStart, 'MMM yyyy', { locale: language === 'ur' ? arSA : enUS });
      // Fallback for Urdu month names if arSA is not perfect
      if (language === 'ur') {
        const urduMonths = ["جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون", "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر"];
        monthLabel = `${urduMonths[getMonth(monthStart)]} ${getYear(monthStart)}`;
      }


      const milkEarnings = getMilkEarningsForMonth(monthStart);
      const feedReport = getMonthlyFeedReport(monthStart, language);
      const healthExpenses = getMonthlyHealthExpenses(monthStart);
      const inseminationExpenses = getMonthlyInseminationExpenses(monthStart);
      const pregnancyCheckExpenses = getMonthlyPregnancyCheckExpenses(monthStart);
      const calvingExpenses = getMonthlyCalvingExpenses(monthStart);
      
      const totalReproductionExpenses = inseminationExpenses + pregnancyCheckExpenses + calvingExpenses;
      const totalExpenses = feedReport.totalCost + healthExpenses + totalReproductionExpenses;
      const netProfitLoss = milkEarnings - totalExpenses;
      
      comparisonData.push({
        month: monthLabel,
        milkEarnings: milkEarnings,
        feedExpenses: feedReport.totalCost, // Keep for potential other charts or data points
        healthExpenses: healthExpenses,     // Keep
        reproductionExpenses: totalReproductionExpenses, // Keep
        totalExpenses: totalExpenses,
        netProfitLoss: netProfitLoss,
      });
    }
    setMonthlyComparisonData(comparisonData);

    const allAnimals = getAllAnimals();
    const map = new Map(allAnimals.map(animal => [animal.id, animal]));
    setAnimalsMap(map);

    const milkSummaries = getMilkSummaryPerAnimal();
    const enrichedMilkSummaries = milkSummaries.map(summary => {
      const animal = map.get(summary.animalId);
      return {
        ...summary,
        animalName: animal ? (language === 'ur' ? animal.nameUr : animal.nameEn) : translate({en:'Unknown', ur:'نامعلوم'}),
        animalTagNumber: animal ? animal.tagNumber : 'N/A',
      };
    });
    setAnimalMilkSummaries(enrichedMilkSummaries);

    const healthSummariesData = getPerAnimalHealthSummary();
    const localizedHealthSummaries = healthSummariesData.map(summary => {
        const animal = map.get(summary.animalId);
        return {
            ...summary,
            animalName: animal ? (language === 'ur' ? animal.nameUr : animal.nameEn) : translate({en:'Unknown', ur:'نامعلوم'}),
            animalTagNumber: animal ? animal.tagNumber : 'N/A',
        };
    });
    setAnimalHealthSummaries(localizedHealthSummaries);

    const allInseminations = getAllInseminationRecords();
    const enrichedInseminations = allInseminations.map(ins => {
      const dam = map.get(ins.animalId);
      let pregnancyCheckResult: PregnancyCheckRecord['result'] | undefined;
      let pregnancyCheckDate: string | undefined;
      let calvingStatus = translate({en: 'Pending Check', ur: 'چیک ہونا باقی'});

      if (ins.pregnancyCheckId) {
        const check = getPregnancyCheckRecordById(ins.pregnancyCheckId);
        if (check) {
          pregnancyCheckResult = check.result;
          pregnancyCheckDate = format(parseISO(check.checkDate), 'PP');
          if (check.result === 'pregnant') {
            calvingStatus = ins.calvingRecordId ? translate({en: 'Calved', ur: 'زچگی ہوچکی'}) : translate({en: 'Awaiting Calving', ur: 'زچگی کا انتظار'});
          } else if (check.result === 'not_pregnant') {
            calvingStatus = translate({en: 'Not Pregnant', ur: 'حاملہ نہیں'});
          } else { 
            calvingStatus = translate({en: 'Recheck Pending', ur: 'دوبارہ چیک ہونا باقی'});
          }
        }
      } else if (parseISO(ins.expectedDeliveryDate) < new Date() && !ins.calvingRecordId) {
         calvingStatus = translate({en: 'EDD Passed, Status Unknown', ur: 'متوقع تاریخ گزر گئی، کیفیت نامعلوم'});
      }

      return {
        ...ins,
        damName: dam ? (language === 'ur' ? dam.nameUr : dam.nameEn) : translate({en:'Unknown Dam', ur:'نامعلوم مادہ'}),
        damTagNumber: dam ? dam.tagNumber : 'N/A',
        pregnancyCheckResult,
        pregnancyCheckDate,
        calvingStatus,
      };
    });
    setInseminationReportData(enrichedInseminations);

    setIsLoading(false);
  }, [language, translate]);

  const formatCurrency = (amount: number, showDecimals = false) => {
    const options = showDecimals ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumFractionDigits: 0 };
    return `${amount.toLocaleString(undefined, options)} ${translate({ en: 'PKR', ur: 'روپے' })}`;
  };

  const getInseminationTypeLabel = (value: InseminationRecord['type']) => {
    const option = inseminationTypeOptions.find(opt => opt.value === value);
    return option ? translate(option.labelKey) : value;
  };

  const getPregnancyResultLabel = (value?: PregnancyCheckRecord['result']) => {
    if (!value) return '-';
    const option = pregnancyResultOptions.find(opt => opt.value === value);
    return option ? translate(option.labelKey) : value;
  };
  
  const NetProfitLossBar = (props: any) => {
    const { fill, x, y, width, height, value } = props;
    const barColor = value >= 0 ? 'hsl(var(--chart-1))' : 'hsl(var(--destructive))'; // Green for profit, Red for loss
    return <rect x={x} y={value >=0 ? y : y + height - (height * (Math.abs(value) / (props.yAxis.domain[1] - props.yAxis.domain[0])))} width={width} height={value !== 0 ? Math.abs(height * (value / (props.yAxis.domain[1] - props.yAxis.domain[0]))) : 0} fill={barColor} />;
  };


  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><p>{translate({ en: "Loading reports...", ur: "رپورٹس لوڈ ہو رہی ہیں..."})}</p></div>;
  }

  return (
    <div className="space-y-8" id="operational-reports-content">
      <Card className="shadow-lg">
        <CardHeader className={language === 'ur' ? 'text-right' : ''}>
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <LineChart className="w-7 h-7 text-primary" />
            <CardTitle className={`text-2xl font-bold ${language === 'ur' ? 'font-urdu' : ''}`}>
              {translate({ en: 'Monthly Financial Overview', ur: 'ماہانہ مالیاتی جائزہ' })}
            </CardTitle>
          </div>
          <CardDescription>
            {translate({ en: 'Comparison over the last 6 months.', ur: 'پچھلے 6 مہینوں کا موازنہ۔' })}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-96">
          {monthlyComparisonData.length > 0 ? (
             <ChartContainer config={chartConfig} className="h-full w-full">
              <BarChart 
                accessibilityLayer 
                data={monthlyComparisonData}
                margin={{ top: 5, right: language === 'ur' ? 20 : 5, left: language === 'ur' ? 5 : 10, bottom: 5 }}
                dir={language === 'ur' ? 'rtl' : 'ltr'}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  reversed={language === 'ur'}
                />
                <YAxis 
                  tickFormatter={(value) => value !==0 ? formatCurrency(value).replace(` ${translate({ en: 'PKR', ur: 'روپے' })}`, '') : '0'}
                  orientation={language === 'ur' ? 'right' : 'left'}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={language === 'ur' ? 5 : 0}
                  allowDataOverflow={true}
                  domain={['auto', 'auto']} // Allows negative values
                />
                 <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent 
                              formatter={(value, name, item) => (
                                <>
                                  <div className="font-medium" style={{color: chartConfig[name as keyof typeof chartConfig]?.color}}>{chartConfig[name as keyof typeof chartConfig]?.label}</div>
                                  <div className="text-muted-foreground">{formatCurrency(value as number, true)}</div>
                                </>
                              )}
                              labelFormatter={(label) => label} 
                          />}
                />
                <Legend />
                <Bar dataKey="milkEarnings" fill="var(--color-milkEarnings)" radius={language === 'ur' ? [0, 4, 4, 0] : [4, 4, 0, 0]} name={chartConfig.milkEarnings.label} />
                <Bar dataKey="totalExpenses" fill="var(--color-totalExpenses)" radius={language === 'ur' ? [0, 4, 4, 0] : [4, 4, 0, 0]} name={chartConfig.totalExpenses.label}/>
                <Bar dataKey="netProfitLoss" name={chartConfig.netProfitLoss.label}>
                    {monthlyComparisonData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.netProfitLoss >= 0 ? 'hsl(var(--chart-5))' : 'hsl(var(--destructive))'} />
                    ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <p className={`text-muted-foreground text-center py-6 ${language === 'ur' ? 'text-right' : ''}`}>
              {translate({ en: 'Not enough data to display comparison chart.', ur: 'موازنہ چارٹ دکھانے کے لیے کافی ڈیٹا نہیں ہے۔' })}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader className={language === 'ur' ? 'text-right' : ''}>
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Droplets className="w-7 h-7 text-primary" />
            <CardTitle className={`text-xl font-bold ${language === 'ur' ? 'font-urdu' : ''}`}>
              {translate({ en: 'Animal-wise Milk Production Summary', ur: 'جانور کے لحاظ سے دودھ کی پیداوار کا خلاصہ' })}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {animalMilkSummaries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={language === 'ur' ? 'text-right font-urdu' : ''}>{translate({ en: 'Animal', ur: 'جانور' })}</TableHead>
                  <TableHead className={`text-right rtl:text-left ${language === 'ur' ? 'font-urdu' : ''}`}>{translate({ en: 'Total Qty (Ltr)', ur: 'کل مقدار (لیٹر)' })}</TableHead>
                  <TableHead className={`text-right rtl:text-left ${language === 'ur' ? 'font-urdu' : ''}`}>{translate({ en: 'Total Qty (Kg)', ur: 'کل مقدار (کلو)' })}</TableHead>
                  <TableHead className={`text-right rtl:text-left ${language === 'ur' ? 'font-urdu' : ''}`}>{translate({ en: 'Total Est. Earnings', ur: 'کل تخمینی آمدنی' })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {animalMilkSummaries.map(summary => (
                  <TableRow key={summary.animalId}>
                    <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''} font-medium`}>
                      {summary.animalName} ({summary.animalTagNumber})
                    </TableCell>
                    <TableCell className={`text-right rtl:text-left ${language === 'ur' ? 'font-urdu' : ''}`}>{summary.totalQuantityLitre.toFixed(2)}</TableCell>
                    <TableCell className={`text-right rtl:text-left ${language === 'ur' ? 'font-urdu' : ''}`}>{summary.totalQuantityKg.toFixed(2)}</TableCell>
                    <TableCell className={`text-right rtl:text-left font-semibold ${language === 'ur' ? 'font-urdu' : ''}`}>{formatCurrency(summary.totalEarnings, true)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
             <p className={`text-muted-foreground text-center py-6 ${language === 'ur' ? 'text-right' : ''}`}>
              {translate({ en: 'No milk production data available to summarize by animal.', ur: 'جانور کے لحاظ سے خلاصہ کرنے کے لیے دودھ کی پیداوار کا کوئی ڈیٹا دستیاب نہیں ہے۔' })}
            </p>
          )}
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader className={language === 'ur' ? 'text-right' : ''}>
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Users className="w-7 h-7 text-primary" />
            <CardTitle className={`text-xl font-bold ${language === 'ur' ? 'font-urdu' : ''}`}>
              {translate({ en: 'Detailed Animal Health Summary', ur: 'جانور کے لحاظ سے صحت کا تفصیلی خلاصہ' })}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {animalHealthSummaries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={language === 'ur' ? 'text-right font-urdu' : ''}>{translate({ en: 'Animal', ur: 'جانور' })}</TableHead>
                  <TableHead className={`text-right rtl:text-left ${language === 'ur' ? 'font-urdu' : ''}`}>{translate({ en: 'Health Cost', ur: 'صحت کی لاگت' })}</TableHead>
                  <TableHead className={`text-right rtl:text-left ${language === 'ur' ? 'font-urdu' : ''}`}>{translate({ en: 'Vaccinations', ur: 'ویکسینیشنز' })}</TableHead>
                  <TableHead className={`text-right rtl:text-left ${language === 'ur' ? 'font-urdu' : ''}`}>{translate({ en: 'Treatments', ur: 'علاج' })}</TableHead>
                  <TableHead className={`text-right rtl:text-left ${language === 'ur' ? 'font-urdu' : ''}`}>{translate({ en: 'Checkups', ur: 'چیک اپ' })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {animalHealthSummaries.map(summary => (
                  <TableRow key={summary.animalId}>
                    <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''} font-medium`}>
                      {summary.animalName} ({summary.animalTagNumber})
                    </TableCell>
                    <TableCell className={`text-right rtl:text-left ${language === 'ur' ? 'font-urdu' : ''}`}>{formatCurrency(summary.totalHealthCost, true)}</TableCell>
                    <TableCell className={`text-right rtl:text-left ${language === 'ur' ? 'font-urdu' : ''}`}>{summary.vaccinationCount}</TableCell>
                    <TableCell className={`text-right rtl:text-left ${language === 'ur' ? 'font-urdu' : ''}`}>{summary.treatmentCount}</TableCell>
                    <TableCell className={`text-right rtl:text-left ${language === 'ur' ? 'font-urdu' : ''}`}>{summary.checkupCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
             <p className={`text-muted-foreground text-center py-6 ${language === 'ur' ? 'text-right' : ''}`}>
              {translate({ en: 'No health data available to summarize by animal.', ur: 'جانور کے لحاظ سے خلاصہ کرنے کے لیے صحت کا کوئی ڈیٹا دستیاب نہیں ہے۔' })}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader className={language === 'ur' ? 'text-right' : ''}>
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <HeartPulse className="w-7 h-7 text-primary" />
            <CardTitle className={`text-xl font-bold ${language === 'ur' ? 'font-urdu' : ''}`}>
              {translate({ en: 'Detailed Insemination Report', ur: 'تفصیلی حمل ٹھہرانے کی رپورٹ' })}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {inseminationReportData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={language === 'ur' ? 'text-right font-urdu' : ''}>{translate({ en: 'Dam', ur: 'مادہ جانور' })}</TableHead>
                  <TableHead className={language === 'ur' ? 'text-right font-urdu' : ''}>{translate({ en: 'Insemination Date', ur: 'حمل ٹھہرانے کی تاریخ' })}</TableHead>
                  <TableHead className={language === 'ur' ? 'text-right font-urdu' : ''}>{translate({ en: 'Type', ur: 'قسم' })}</TableHead>
                  <TableHead className={`${language === 'ur' ? 'text-right font-urdu' : ''} hidden md:table-cell`}>{translate({ en: 'Semen/Bull', ur: 'سیمن/بیل' })}</TableHead>
                  <TableHead className={language === 'ur' ? 'text-right font-urdu' : ''}>{translate({ en: 'EDD', ur: 'متوقع تاریخ پیدائش' })}</TableHead>
                  <TableHead className={language === 'ur' ? 'text-right font-urdu' : ''}>{translate({ en: 'Preg. Check', ur: 'حمل چیک' })}</TableHead>
                  <TableHead className={language === 'ur' ? 'text-right font-urdu' : ''}>{translate({ en: 'Calving Status', ur: 'زچگی کی کیفیت' })}</TableHead>
                  <TableHead className={`text-right rtl:text-left ${language === 'ur' ? 'font-urdu' : ''}`}>{translate({ en: 'Expense', ur: 'خرچہ' })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inseminationReportData.map(record => (
                  <TableRow key={record.id}>
                    <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''} font-medium`}>
                      {record.damName} ({record.damTagNumber})
                    </TableCell>
                    <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''}`}>{format(parseISO(record.inseminationDate), 'PP')}</TableCell>
                    <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''}`}>{getInseminationTypeLabel(record.type)}</TableCell>
                    <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''} hidden md:table-cell max-w-[150px] truncate`}>{record.semenDetails}</TableCell>
                    <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''}`}>{format(parseISO(record.expectedDeliveryDate), 'PP')}</TableCell>
                    <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''}`}>
                      {record.pregnancyCheckResult ? (
                        <>
                          {getPregnancyResultLabel(record.pregnancyCheckResult)}
                          {record.pregnancyCheckDate && <span className="text-xs block text-muted-foreground">({record.pregnancyCheckDate})</span>}
                        </>
                      ) : '-'}
                    </TableCell>
                    <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''}`}>{record.calvingStatus}</TableCell>
                    <TableCell className={`text-right rtl:text-left ${language === 'ur' ? 'font-urdu' : ''}`}>{record.expense ? formatCurrency(record.expense, true) : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
             <p className={`text-muted-foreground text-center py-6 ${language === 'ur' ? 'text-right' : ''}`}>
              {translate({ en: 'No insemination records found.', ur: 'حمل ٹھہرانے کا کوئی ریکارڈ نہیں ملا۔' })}
            </p>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

