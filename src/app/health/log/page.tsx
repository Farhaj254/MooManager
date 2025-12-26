
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { format, parseISO } from 'date-fns';
import HealthRecordForm, { type HealthRecordFormValues, healthRecordFormSchema } from '@/components/health/HealthRecordForm';
import { addHealthRecord, getHealthRecordsByDate, deleteHealthRecord } from '@/lib/health-store';
import { getAllAnimals, type Animal } from '@/lib/animal-store';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import type { HealthRecord } from '@/types/health';
import { healthRecordTypeOptions } from '@/types/health';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Edit3, Info } from 'lucide-react';
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

export default function LogHealthEventPage() {
  const { translate, language } = useLanguage();
  const { toast } = useToast();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [recordsForSelectedDate, setRecordsForSelectedDate] = useState<HealthRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDisplayDate, setCurrentDisplayDate] = useState(new Date()); // For displaying which date's records are shown

  const methods = useForm<HealthRecordFormValues>({
    resolver: zodResolver(healthRecordFormSchema),
    defaultValues: {
      date: new Date(), // Initialize date here
      // animalId, type, etc., will be undefined or set by user
    },
  });
  const { watch, reset } = methods;
  const watchedFormDate = watch("date");

  const fetchRecordsForDate = useCallback((date: Date) => {
    const records = getHealthRecordsByDate(date);
    setRecordsForSelectedDate(records);
    setCurrentDisplayDate(date); // Update the date for which records are displayed
  }, []); // Dependencies: setRecordsForSelectedDate, setCurrentDisplayDate are stable

  useEffect(() => {
    setAnimals(getAllAnimals());
  }, []);

  useEffect(() => {
    if (watchedFormDate) {
      fetchRecordsForDate(watchedFormDate);
    } else {
      // Fallback if date is somehow not set, though defaultValues should handle it
      const initialDate = new Date();
      methods.setValue("date", initialDate, { shouldValidate: false }); // Ensure form state has a date
      fetchRecordsForDate(initialDate);
    }
  }, [fetchRecordsForDate, watchedFormDate, methods]);


  const onSubmit = async (data: HealthRecordFormValues) => {
    setIsLoading(true);
    try {
      const recordData = {
        ...data,
        date: format(data.date, 'yyyy-MM-dd'),
        nextDueDate: data.nextDueDate ? format(data.nextDueDate, 'yyyy-MM-dd') : undefined,
      };
      addHealthRecord(recordData);
      toast({
        title: translate({ en: "Health Event Logged", ur: "صحت کا واقعہ لاگ ہوگیا" }),
        description: translate({
          en: `Event for ${animals.find(a=>a.id === data.animalId)?.nameEn || 'animal'} recorded.`,
          ur: `جانور ${animals.find(a=>a.id === data.animalId)?.nameUr || 'کے لیے'} واقعہ ریکارڈ ہوگیا۔`
        }),
      });
      reset({ // Reset form, keep selected animal and date
        animalId: data.animalId,
        date: data.date,
        type: undefined, // Reset type to force re-selection or clear conditional fields
        notes: '',
        medication: '',
        nextDueDate: undefined,
      });
      // fetchRecordsForDate will be called by the useEffect watching watchedFormDate
    } catch (error) {
      console.error("Failed to log health event:", error);
      toast({
        variant: "destructive",
        title: translate({ en: "Error", ur: "خرابی" }),
        description: translate({ en: "Failed to log event. Please try again.", ur: "واقعہ لاگ کرنے میں ناکامی ہوئی۔ براہ کرم دوبارہ کوشش کریں." }),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRecord = (recordId: string) => {
    const success = deleteHealthRecord(recordId);
    if (success) {
      toast({
        title: translate({ en: "Record Deleted", ur: "ریکارڈ حذف کر دیا گیا" }),
      });
      if (watchedFormDate) {
        fetchRecordsForDate(watchedFormDate); // Refetch for the current form date
      }
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

  const getRecordTypeLabel = (type: HealthRecord['type']) => {
    const option = healthRecordTypeOptions.find(opt => opt.value === type);
    return option ? translate(option.labelKey) : type;
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className={`text-xl font-bold ${language === 'ur' ? 'text-right font-urdu' : ''}`}>
            {translate({ en: 'Log Health Event', ur: 'صحت کا واقعہ لاگ کریں' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormProvider {...methods}>
            <HealthRecordForm animals={animals} onSubmit={onSubmit} isLoading={isLoading} />
          </FormProvider>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className={`text-xl font-bold ${language === 'ur' ? 'text-right font-urdu' : ''}`}>
            {translate({ en: "Logged Events for:", ur: "کے لیے لاگ شدہ واقعات:" })} {format(currentDisplayDate, 'PPP')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recordsForSelectedDate.length === 0 ? (
            <p className={`text-muted-foreground ${language === 'ur' ? 'text-right' : ''}`}>
              {translate({ en: 'No health events logged for this date yet.', ur: 'اس تاریخ کے لیے ابھی تک کوئی صحت کا واقعہ لاگ نہیں ہوا۔' })}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={language === 'ur' ? 'text-right' : ''}>{translate({ en: 'Animal', ur: 'جانور' })}</TableHead>
                  <TableHead className={language === 'ur' ? 'text-right' : ''}>{translate({ en: 'Type', ur: 'قسم' })}</TableHead>
                  <TableHead className={language === 'ur' ? 'text-right' : ''}>{translate({ en: 'Notes', ur: 'نوٹس' })}</TableHead>
                  <TableHead className={language === 'ur' ? 'text-right' : ''}>{translate({ en: 'Medication', ur: 'دوا' })}</TableHead>
                  <TableHead className={language === 'ur' ? 'text-right' : ''}>{translate({ en: 'Next Due', ur: 'اگلی تاریخ' })}</TableHead>
                  <TableHead className="text-right rtl:text-left">{translate({ en: 'Actions', ur: 'کارروائیاں' })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recordsForSelectedDate.map(record => (
                  <TableRow key={record.id}>
                    <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''}`}>{getAnimalName(record.animalId)}</TableCell>
                    <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''}`}>{getRecordTypeLabel(record.type)}</TableCell>
                    <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''} max-w-xs truncate`}>{record.notes || '-'}</TableCell>
                    <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''} max-w-xs truncate`}>{record.medication || '-'}</TableCell>
                    <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''}`}>{record.nextDueDate ? format(parseISO(record.nextDueDate), 'PPP') : '-'}</TableCell>
                    <TableCell className="text-right rtl:text-left">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir={language === 'ur' ? 'rtl' : 'ltr'}>
                          <AlertDialogHeader>
                            <AlertDialogTitle className={language === 'ur' ? 'font-urdu' : ''}>
                              {translate({ en: "Delete Health Record?", ur: "صحت کا ریکارڈ حذف کریں؟" })}
                            </AlertDialogTitle>
                            <AlertDialogDescription className={language === 'ur' ? 'font-urdu' : ''}>
                              {translate({ 
                                en: `Are you sure you want to delete this health record? This action cannot be undone.`,
                                ur: `کیا آپ واقعی اس صحت کے ریکارڈ کو حذف کرنا چاہتے ہیں؟ یہ عمل واپس نہیں کیا جا سکتا۔`
                              })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className={language === 'ur' ? 'font-urdu' : ''}>
                              {translate({ en: "Cancel", ur: "منسوخ کریں" })}
                            </AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteRecord(record.id)} className={`bg-destructive hover:bg-destructive/90 ${language === 'ur' ? 'font-urdu' : ''}`}>
                              {translate({ en: "Delete", ur: "حذف کریں" })}
                            </AlertDialogAction>
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

    