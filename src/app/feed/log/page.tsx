
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { format, parseISO } from 'date-fns';
import FeedRecordForm, { type FeedRecordFormValues, feedRecordSchema } from '@/components/feed/FeedRecordForm';
import { addFeedRecord, getFeedSummaryForDate, deleteFeedRecord } from '@/lib/feed-store';
import { getAllAnimals, type Animal } from '@/lib/animal-store';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import type { FeedRecord, FeedType } from '@/types/feed';
import { feedTypeOptions, feedUnitOptions } from '@/types/feed';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { zodResolver } from '@hookform/resolvers/zod';

export default function LogFeedPage() {
  const { translate, language } = useLanguage();
  const { toast } = useToast();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [recordsForSelectedDate, setRecordsForSelectedDate] = useState<FeedRecord[]>([]);
  const [dailyTotalCost, setDailyTotalCost] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDisplayDate, setCurrentDisplayDate] = useState(new Date());

  const methods = useForm<FeedRecordFormValues>({
    resolver: zodResolver(feedRecordSchema),
    defaultValues: {
      date: new Date(),
      feedType: undefined, // Start with no feed type selected
      unit: undefined, // Start with no unit selected
      quantity: undefined,
      cost: undefined,
    },
  });
  const { watch, reset, setValue } = methods;
  const watchedFormDate = watch("date");

  const fetchRecordsForDate = useCallback((date: Date) => {
    const { totalCost, records } = getFeedSummaryForDate(date);
    setRecordsForSelectedDate(records);
    setDailyTotalCost(totalCost);
    setCurrentDisplayDate(date);
  }, []);

  useEffect(() => {
    setAnimals(getAllAnimals());
  }, []);

  useEffect(() => {
    if (watchedFormDate) {
      fetchRecordsForDate(watchedFormDate);
    } else {
      const initialDate = new Date();
      setValue("date", initialDate, { shouldValidate: false });
      fetchRecordsForDate(initialDate);
    }
  }, [fetchRecordsForDate, watchedFormDate, setValue]);

  const onSubmit = async (data: FeedRecordFormValues) => {
    setIsLoading(true);
    try {
      const recordData = {
        ...data,
        date: format(data.date, 'yyyy-MM-dd'),
      };
      addFeedRecord(recordData);
      toast({
        title: translate({ en: "Feed Entry Logged", ur: "خوراک کا اندراج لاگ ہوگیا" }),
        description: translate({
          en: `Feed for ${animals.find(a=>a.id === data.animalId)?.nameEn || 'animal'} recorded.`,
          ur: `جانور ${animals.find(a=>a.id === data.animalId)?.nameUr || 'کے لیے'} خوراک ریکارڈ ہوگئی۔`
        }),
      });
      reset({
        animalId: data.animalId, // Keep animal selected
        date: data.date, // Keep date selected
        feedType: undefined, // Clear feed type for next entry
        unit: undefined, // Clear unit, will be auto-set when feedType is chosen
        quantity: undefined,
        cost: undefined,
      });
      fetchRecordsForDate(data.date); // Refetch for the current form date
    } catch (error) {
      console.error("Failed to log feed entry:", error);
      toast({
        variant: "destructive",
        title: translate({ en: "Error", ur: "خرابی" }),
        description: translate({ en: "Failed to log entry. Please try again.", ur: "اندراج لاگ کرنے میں ناکامی ہوئی۔ براہ کرم دوبارہ کوشش کریں." }),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRecord = (recordId: string) => {
    const success = deleteFeedRecord(recordId);
    if (success) {
      toast({ title: translate({ en: "Record Deleted", ur: "ریکارڈ حذف کر دیا گیا" }) });
      if (watchedFormDate) fetchRecordsForDate(watchedFormDate);
    } else {
      toast({
        variant: "destructive",
        title: translate({ en: "Error", ur: "خرابی" }),
        description: translate({ en: "Failed to delete record.", ur: "ریکارڈ حذف کرنے میں ناکامی ہوئی۔" }),
      });
    }
  };

  const getAnimalName = (animalId: string) => {
    const animal = animals.find(a => a.id === animalId);
    return animal ? (language === 'ur' ? animal.nameUr : animal.nameEn) : translate({en: 'Unknown', ur: 'نامعلوم'});
  };

  const getFeedTypeLabel = (type: FeedType) => {
    const option = feedTypeOptions.find(opt => opt.value === type);
    return option ? translate(option.labelKey) : type;
  };
  
  const getFeedUnitLabel = (unitValue: FeedRecord['unit']) => {
    const option = feedUnitOptions.find(opt => opt.value === unitValue);
    return option ? translate(option.labelKey) : unitValue;
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className={`text-xl font-bold ${language === 'ur' ? 'text-right font-urdu' : ''}`}>
            {translate({ en: 'Log Feed Entry', ur: 'خوراک کا اندراج لاگ کریں' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormProvider {...methods}>
            <FeedRecordForm animals={animals} onSubmit={onSubmit} isLoading={isLoading} />
          </FormProvider>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className={`text-xl font-bold ${language === 'ur' ? 'text-right font-urdu' : ''}`}>
            {translate({ en: "Logged Entries for:", ur: "کے لیے لاگ شدہ اندراجات:" })} {format(currentDisplayDate, 'PPP')}
          </CardTitle>
           <CardDescription className={`${language === 'ur' ? 'text-right' : ''}`}>
            {translate({en: `Total Cost for ${format(currentDisplayDate, 'PPP')}:`, ur: `${format(currentDisplayDate, 'PPP')} کے لیے کل لاگت:`})} {dailyTotalCost.toFixed(2)} {translate({en: 'PKR', ur: 'روپے'})}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recordsForSelectedDate.length === 0 ? (
            <p className={`text-muted-foreground ${language === 'ur' ? 'text-right' : ''}`}>
              {translate({ en: 'No feed entries logged for this date yet.', ur: 'اس تاریخ کے لیے ابھی تک کوئی خوراک کا اندراج لاگ نہیں ہوا۔' })}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={language === 'ur' ? 'text-right' : ''}>{translate({ en: 'Animal', ur: 'جانور' })}</TableHead>
                  <TableHead className={language === 'ur' ? 'text-right' : ''}>{translate({ en: 'Type', ur: 'قسم' })}</TableHead>
                  <TableHead className={language === 'ur' ? 'text-right' : ''}>{translate({ en: 'Qty', ur: 'مقدار' })}</TableHead>
                  <TableHead className={language === 'ur' ? 'text-right' : ''}>{translate({ en: 'Unit', ur: 'یونٹ' })}</TableHead>
                  <TableHead className={language === 'ur' ? 'text-right' : ''}>{translate({ en: 'Cost (PKR)', ur: 'لاگت (روپے)' })}</TableHead>
                  <TableHead className="text-right rtl:text-left">{translate({ en: 'Actions', ur: 'کارروائیاں' })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recordsForSelectedDate.map(record => (
                  <TableRow key={record.id}>
                    <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''}`}>{getAnimalName(record.animalId)}</TableCell>
                    <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''}`}>{getFeedTypeLabel(record.feedType)}</TableCell>
                    <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''}`}>{record.quantity.toFixed(2)}</TableCell>
                    <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''}`}>{getFeedUnitLabel(record.unit)}</TableCell>
                    <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''}`}>{record.cost.toFixed(2)}</TableCell>
                    <TableCell className="text-right rtl:text-left">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir={language === 'ur' ? 'rtl' : 'ltr'}>
                          <AlertDialogHeader>
                            <AlertDialogTitle className={language === 'ur' ? 'font-urdu' : ''}>{translate({ en: "Delete Feed Entry?", ur: "خوراک کا اندراج حذف کریں؟" })}</AlertDialogTitle>
                            <AlertDialogDescription className={language === 'ur' ? 'font-urdu' : ''}>
                              {translate({ 
                                en: `Are you sure you want to delete this feed entry? This action cannot be undone.`,
                                ur: `کیا آپ واقعی اس خوراک کے اندراج کو حذف کرنا چاہتے ہیں؟ یہ عمل واپس نہیں کیا جا سکتا۔`
                              })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className={language === 'ur' ? 'font-urdu' : ''}>{translate({ en: "Cancel", ur: "منسوخ کریں" })}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteRecord(record.id)} className={`bg-destructive hover:bg-destructive/90 ${language === 'ur' ? 'font-urdu' : ''}`}>{translate({ en: "Delete", ur: "حذف کریں" })}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


    