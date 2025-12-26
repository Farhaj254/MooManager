
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import LanguageToggle from '@/components/LanguageToggle';
import { useLanguage } from '@/hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Leaf, LogOut, Users, Droplets, Wheat, HeartPulse, ClipboardList, DollarSign, TrendingUp, Syringe, FileText, TrendingDown, MinusCircle, BarChart3, Filter } from 'lucide-react';
import Link from 'next/link';
import { getOverallMilkSummary, type OverallMilkSummary, type PeriodFilter } from '@/lib/milk-store';
import { getOverallFeedCost } from '@/lib/feed-store';
import { getOverallHealthExpenses } from '@/lib/health-store';
import { getOverallInseminationExpenses, getOverallPregnancyCheckExpenses, getOverallCalvingExpenses } from '@/lib/reproduction-store';
import { getYear, getMonth, subMonths, startOfMonth, endOfMonth } from 'date-fns';


interface User {
  name: string;
  phone: string;
}

type PeriodOptionValue = 'currentMonth' | 'lastMonth' | 'currentYear' | 'lastYear' | 'allTime';

export default function Dashboard() {
  const { translate, language } = useLanguage();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [milkSummary, setMilkSummary] = useState<OverallMilkSummary | null>(null);
  const [overallFeedCost, setOverallFeedCost] = useState<number | null>(null);
  const [overallHealthExpenses, setOverallHealthExpenses] = useState<number | null>(null);
  const [overallInseminationExpenses, setOverallInseminationExpenses] = useState<number | null>(null);
  const [overallPregnancyCheckExpenses, setOverallPregnancyCheckExpenses] = useState<number | null>(null);
  const [overallCalvingExpenses, setOverallCalvingExpenses] = useState<number | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [selectedPeriodOption, setSelectedPeriodOption] = useState<PeriodOptionValue>('allTime');

  const periodOptions: { value: PeriodOptionValue, labelKey: { en: string, ur: string } }[] = useMemo(() => [
    { value: 'currentMonth', labelKey: { en: 'Current Month', ur: 'موجودہ مہینہ' } },
    { value: 'lastMonth', labelKey: { en: 'Last Month', ur: 'پچھلا مہینہ' } },
    { value: 'currentYear', labelKey: { en: 'Current Year', ur: 'موجودہ سال' } },
    { value: 'lastYear', labelKey: { en: 'Last Year', ur: 'پچھلا سال' } },
    { value: 'allTime', labelKey: { en: 'All Time', ur: 'کل عرصہ' } },
  ], []);

  const getPeriodFilterFromOption = (option: PeriodOptionValue): PeriodFilter => {
    const now = new Date();
    const currentYr = getYear(now);
    const currentMon = getMonth(now) + 1; // 1-indexed

    switch (option) {
      case 'currentMonth':
        return { year: currentYr, month: currentMon };
      case 'lastMonth':
        const lastMonthDate = subMonths(now, 1);
        return { year: getYear(lastMonthDate), month: getMonth(lastMonthDate) + 1 };
      case 'currentYear':
        return { year: currentYr, month: undefined };
      case 'lastYear':
        return { year: currentYr - 1, month: undefined };
      case 'allTime':
      default:
        return undefined; // Or { year: undefined, month: undefined }
    }
  };
  
  const getSelectedPeriodTitle = (option: PeriodOptionValue): string => {
      const selectedOpt = periodOptions.find(o => o.value === option);
      return selectedOpt ? translate(selectedOpt.labelKey) : translate({en:"All Time", ur:"کل عرصہ"});
  };


  useEffect(() => {
    const storedUser = localStorage.getItem('mooManagerUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        localStorage.removeItem('mooManagerUser');
        router.replace('/login');
      }
    } else {
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    setIsLoadingSummary(true);
    const periodFilter = getPeriodFilterFromOption(selectedPeriodOption);
    try {
      setMilkSummary(getOverallMilkSummary(periodFilter));
      setOverallFeedCost(getOverallFeedCost(periodFilter));
      setOverallHealthExpenses(getOverallHealthExpenses(periodFilter));
      setOverallInseminationExpenses(getOverallInseminationExpenses(periodFilter));
      setOverallPregnancyCheckExpenses(getOverallPregnancyCheckExpenses(periodFilter));
      setOverallCalvingExpenses(getOverallCalvingExpenses(periodFilter));
    } catch (error) {
      console.error("Failed to load summaries for period:", selectedPeriodOption, error);
      // Reset summaries on error
      setMilkSummary(null);
      setOverallFeedCost(null);
      setOverallHealthExpenses(null);
      setOverallInseminationExpenses(null);
      setOverallPregnancyCheckExpenses(null);
      setOverallCalvingExpenses(null);
    } finally {
      setIsLoadingSummary(false);
    }
  }, [selectedPeriodOption, language]); // Re-fetch if language changes for titles

  const handleLogout = () => {
    localStorage.removeItem('mooManagerUser');
    router.replace('/login');
  };

  const mainActions = [
    { 
      label: { en: "Animals", ur: "جانور" }, 
      icon: <Users className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />,
      href: "/animals"
    },
    { 
      label: { en: "Milk", ur: "دودھ" }, 
      icon: <Droplets className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />,
      href: "/milk"
    },
    { 
      label: { en: "Health", ur: "صحت" }, 
      icon: <Syringe className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />,
      href: "/health"
    },
    { 
      label: { en: "Feed", ur: "خوراک" }, 
      icon: <Wheat className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />,
      href: "/feed" 
    },
    { 
      label: { en: "Reproduction", ur: "افزائش نسل" }, 
      icon: <HeartPulse className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />,
      href: "/reproduction"
    },
    { 
      label: { en: "Operational Reports", ur: "آپریشنل رپورٹس" }, 
      icon: <BarChart3 className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />,
      href: "/reports" 
    },
  ];
  
  let dynamicWelcomeMessage: string;
  if (user) {
    if (language === 'ur') {
      dynamicWelcomeMessage = `${user.name}، ${translate({ en: 'Welcome', ur: 'خوش آمدید' })} ${translate({ en: 'to MooManager!', ur: 'مو مینجر میں!' })}`;
    } else {
      dynamicWelcomeMessage = `${translate({ en: 'Welcome', ur: 'خوش آمدید' })}, ${user.name}, ${translate({ en: 'to MooManager!', ur: 'مو مینجر میں!' })}`;
    }
  } else {
    dynamicWelcomeMessage = translate({ en: 'Welcome to MooManager!', ur: 'مو مینجر میں خوش آمدید!' });
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return translate({en: 'N/A', ur: 'N/A'});
    return `${amount.toFixed(2)} ${translate({ en: 'PKR', ur: 'روپے' })}`;
  };

  let milkQuantityDisplay = translate({en: 'N/A', ur: 'N/A'});
  if (milkSummary) {
    let tempDisplay = "";
    if (milkSummary.totalQuantityLitre > 0) {
      tempDisplay += `${milkSummary.totalQuantityLitre.toFixed(2)} ${translate({en: "Ltr", ur: "لیٹر"})}`;
    }
    if (milkSummary.totalQuantityKg > 0) {
      if (tempDisplay.length > 0) tempDisplay += " / ";
      tempDisplay += `${milkSummary.totalQuantityKg.toFixed(2)} ${translate({en: "Kg", ur: "کلو"})}`;
    }
    if (tempDisplay.length === 0 && (milkSummary.totalQuantityLitre === 0 || milkSummary.totalQuantityKg === 0)) {
      // If one is zero and the other has data, this handles it. If both are zero:
      tempDisplay = `0 ${translate({en: "Ltr", ur: "لیٹر"})}`; 
    }
    milkQuantityDisplay = tempDisplay;
  }
  
  const totalReproductionExpenses = (overallInseminationExpenses ?? 0) + (overallPregnancyCheckExpenses ?? 0) + (overallCalvingExpenses ?? 0);
  const totalExpenses = (overallFeedCost ?? 0) + (overallHealthExpenses ?? 0) + totalReproductionExpenses;
  const netProfitOrLoss = milkSummary && typeof totalExpenses === 'number' 
    ? milkSummary.totalEarnings - totalExpenses 
    : null;
  const profitLossLabel = netProfitOrLoss !== null ? (netProfitOrLoss >= 0 ? translate({en:"Net Profit", ur:"خالص منافع"}) : translate({en:"Net Loss", ur:"خالص نقصان"})) : translate({en:"N/A", ur:"N/A"});
  const profitLossColor = netProfitOrLoss !== null ? (netProfitOrLoss >= 0 ? 'text-green-600' : 'text-red-600') : 'text-muted-foreground';
  const ProfitLossIcon = netProfitOrLoss !== null ? (netProfitOrLoss >= 0 ? TrendingUp : TrendingDown) : MinusCircle;

  const currentPeriodTitle = getSelectedPeriodTitle(selectedPeriodOption);

  return (
    <div className={`flex flex-col min-h-screen bg-background ${language === 'ur' ? 'font-urdu' : 'font-body'}`}>
      <header className="sticky top-0 z-10 shadow-md bg-card">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Leaf className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-headline font-bold text-primary">
              {translate({ en: 'MooManager', ur: 'مو مینجر' })}
            </h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4 rtl:space-x-reverse">
            <LanguageToggle />
            <Button variant="ghost" size="icon" onClick={handleLogout} title={translate({en: "Logout", ur: "لاگ آؤٹ"})}>
              <LogOut className="w-5 h-5 sm:w-6 sm:h-6 text-destructive" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
         <section className="mb-6">
          <h2 className={`text-2xl sm:text-3xl font-headline font-semibold text-foreground mb-2 ${language === 'ur' ? 'text-right' : 'text-left'}`}>
            {dynamicWelcomeMessage}
          </h2>
          <div className={`flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between ${language === 'ur' ? 'sm:flex-row-reverse' : ''}`}>
            <p className={`text-muted-foreground ${language === 'ur' ? 'text-right' : 'text-left'}`}>
              {translate({ 
                en: 'Manage your dairy farm efficiently.', 
                ur: 'اپنے ڈیری فارم کا موثر طریقے سے انتظام کریں۔' 
              })}
            </p>
            <div className="w-full sm:w-auto sm:min-w-[200px]">
                <Label htmlFor="dashboard-period-filter" className={language === 'ur' ? 'text-right block mb-1' : 'mb-1'}>
                    {translate({en: "Data for:", ur: "ڈیٹا برائے:"})}
                </Label>
                <Select value={selectedPeriodOption} onValueChange={(value) => setSelectedPeriodOption(value as PeriodOptionValue)} dir={language === 'ur' ? 'rtl' : 'ltr'}>
                    <SelectTrigger id="dashboard-period-filter" className="w-full">
                        <SelectValue placeholder={translate({en: "Select Period", ur: "مدت منتخب کریں"})} />
                    </SelectTrigger>
                    <SelectContent>
                        {periodOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {translate(opt.labelKey)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>
        </section>

        {isLoadingSummary ? (
            <div className="flex justify-center items-center py-10">
                <p>{translate({en: "Loading summary data...", ur: "خلاصہ ڈیٹا لوڈ ہو رہا ہے۔.."})}</p>
            </div>
        ) : (
          <>
            <Link href="/milk/summary" passHref>
              <Card className="mb-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer bg-primary/5 border-primary/20">
                <CardHeader className="pb-3">
                   <CardTitle className={`text-lg font-semibold text-primary flex items-center ${language === 'ur' ? 'justify-end font-urdu' : 'justify-start'}`}>
                    <TrendingUp className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />
                    {translate({ en: "Farm Milk Overview", ur: "فارم کا دودھ کا جائزہ" })} ({currentPeriodTitle})
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className={`p-3 rounded-md bg-card shadow ${language === 'ur' ? 'text-right' : ''}`}>
                    <div className="flex items-center text-muted-foreground mb-1">
                      <DollarSign className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                      <span className="font-medium">{translate({ en: "Total Est. Earnings", ur: "کل تخمینی آمدنی" })}</span>
                    </div>
                    <p className={`text-xl font-bold text-primary ${language === 'ur' ? 'font-urdu' : ''}`}>{formatCurrency(milkSummary?.totalEarnings)}</p>
                  </div>
                  <div className={`p-3 rounded-md bg-card shadow ${language === 'ur' ? 'text-right' : ''}`}>
                    <div className="flex items-center text-muted-foreground mb-1">
                      <Droplets className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                       <span className="font-medium">{translate({ en: "Total Milk Logged", ur: "کل دودھ لاگ ہوا" })}</span>
                    </div>
                    <p className={`text-xl font-bold text-primary ${language === 'ur' ? 'font-urdu' : ''}`}>{milkQuantityDisplay}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/feed/reports" passHref>
              <Card className="mb-8 shadow-lg hover:shadow-xl transition-shadow cursor-pointer bg-accent/10 border-accent/30">
                <CardHeader className="pb-3">
                  <CardTitle className={`text-lg font-semibold text-foreground flex items-center ${language === 'ur' ? 'justify-end font-urdu' : 'justify-start'}`}>
                    <FileText className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0 text-accent" />
                    {translate({ en: "Overall Financial Snapshot", ur: "مجموعی مالیاتی سنیپ شاٹ" })} ({currentPeriodTitle})
                  </CardTitle>
                   <p className={`text-xs text-muted-foreground ${language === 'ur' ? 'text-right' : 'text-left'}`}>
                      {translate({en: "Click for detailed monthly breakdown", ur: "تفصیلی ماہانہ بریک ڈاؤن کے لیے کلک کریں"})}
                  </p>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className={`p-3 rounded-md bg-card shadow ${language === 'ur' ? 'text-right' : ''}`}>
                    <div className="flex items-center text-muted-foreground mb-1">
                      <DollarSign className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                      <span className="font-medium">{translate({ en: "Total Milk Earnings", ur: "کل دودھ کی آمدنی" })}</span>
                    </div>
                    <p className={`text-xl font-bold text-primary ${language === 'ur' ? 'font-urdu' : ''}`}>
                      {formatCurrency(milkSummary?.totalEarnings)}
                    </p>
                  </div>
                  <div className={`p-3 rounded-md bg-card shadow ${language === 'ur' ? 'text-right' : ''}`}>
                    <div className="flex items-center text-muted-foreground mb-1">
                      <TrendingDown className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 text-destructive" />
                      <span className="font-medium">{translate({ en: "Total Expenses", ur: "کل اخراجات" })}</span>
                    </div>
                     <p className={`text-xs text-muted-foreground ${language === 'ur' ? 'font-urdu' : ''}`}>
                          ({translate({en: "Feed:", ur: "خوراک:"})} {formatCurrency(overallFeedCost)} + 
                          {translate({en: "Health:", ur: "صحت:"})} {formatCurrency(overallHealthExpenses)} +
                          {translate({en: "Repro:", ur: "افزائش:"})} {formatCurrency(totalReproductionExpenses)})
                      </p>
                    <p className={`text-xl font-bold text-destructive ${language === 'ur' ? 'font-urdu' : ''}`}>{formatCurrency(totalExpenses)}</p>
                  </div>
                  <div className={`p-3 rounded-md bg-card shadow ${language === 'ur' ? 'text-right' : ''} ${profitLossColor}`}>
                    <div className="flex items-center mb-1">
                      <ProfitLossIcon className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                      <span className="font-medium">{profitLossLabel}</span>
                    </div>
                    <p className={`text-xl font-bold ${language === 'ur' ? 'font-urdu' : ''}`}>
                      {formatCurrency(netProfitOrLoss !== null ? Math.abs(netProfitOrLoss) : null)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </>
        )}

        <section className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
          {mainActions.map(item => {
            const cardContent = (
              <Card 
                key={translate(item.label)} 
                className="shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer h-full"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && item.href) router.push(item.href);}}
                aria-label={translate(item.label)}
              >
                <CardContent className="flex flex-col items-center justify-center p-6 sm:p-8 aspect-square">
                  {item.icon}
                  <span className={`mt-3 text-base sm:text-lg font-medium text-center text-foreground ${language === 'ur' ? 'font-urdu' : 'font-body'}`}>
                    {translate(item.label)}
                  </span>
                </CardContent>
              </Card>
            );

            if (item.href) {
              return <Link href={item.href} key={translate(item.label)} passHref className="block h-full">{cardContent}</Link>;
            }
            return cardContent; 
          })}
        </section>
      </main>

      <footer className="py-6 text-center text-muted-foreground border-t border-border mt-auto">
        <p>&copy; {getYear(new Date())} MooManager. {translate({ en: 'All rights reserved.', ur: 'جملہ حقوق محفوظ ہیں۔' })}</p>
      </footer>
    </div>
  );
}
