
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { format } from 'date-fns';
import MilkLogForm, { type MilkLogFormValues } from '@/components/milk/MilkLogForm';
import { addMilkRecord, getMilkRecordsByDate, getMilkSettings, deleteMilkRecord } from '@/lib/milk-store';
import { getAllAnimals, type Animal } from '@/lib/animal-store';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import type { MilkRecord } from '@/types/milk';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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

export default function LogMilkPage() {
  const { translate, language } = useLanguage();
  const { toast } = useToast();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [todaysRecords, setTodaysRecords] = useState<MilkRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dailyTotal, setDailyTotal] = useState({ quantityLitre: 0, quantityKg: 0, income: 0, unitSetting: 'litre' });
  const [currentDate, setCurrentDate] = useState(new Date()); // For potential future date navigation

  const methods = useForm<MilkLogFormValues>();

  const fetchRecordsAndCalculateTotal = useCallback(() => {
    const records = getMilkRecordsByDate(currentDate);
    setTodaysRecords(records);

    const settings = getMilkSettings();
    let totalQtyLitre = 0;
    let totalQtyKg = 0;
    let totalIncome = 0;

    records.forEach(record => {
      const quantity = Number(record.quantity);
      const rate = Number(record.rateSnapshot);
      if (!isNaN(quantity)) {
        if (record.unit === 'litre') totalQtyLitre += quantity;
        else if (record.unit === 'kg') totalQtyKg += quantity;
        
        if (!isNaN(rate) && rate > 0) {
          totalIncome += quantity * rate;
        }
      }
    });

    setDailyTotal({
      quantityLitre: parseFloat(totalQtyLitre.toFixed(2)),
      quantityKg: parseFloat(totalQtyKg.toFixed(2)),
      income: parseFloat(totalIncome.toFixed(2)),
      unitSetting: settings.defaultUnit
    });
  }, [currentDate]);

  useEffect(() => {
    setAnimals(getAllAnimals());
    fetchRecordsAndCalculateTotal();
  }, [fetchRecordsAndCalculateTotal]);

  const onSubmit = async (data: MilkLogFormValues) => {
    setIsLoading(true);
    try {
      const recordData = {
        ...data,
        date: format(data.date, 'yyyy-MM-dd'), 
      };
      addMilkRecord(recordData);
      toast({
        title: translate({ en: "Milk Logged", ur: "دودھ لاگ ہوگیا" }),
        description: translate({
          en: `Milk for ${animals.find(a=>a.id === data.animalId)?.nameEn || 'animal'} recorded.`,
          ur: `جانور ${animals.find(a=>a.id === data.animalId)?.nameUr || 'کے لیے'} دودھ ریکارڈ ہوگیا۔`
        }),
      });
      methods.reset({
        animalId: data.animalId, // Keep animal selected
        date: data.date, // Keep date selected
        timeOfDay: data.timeOfDay === 'morning' ? 'evening' : 'morning', // Toggle time of day or reset as preferred
        quantity: undefined, 
        unit: getMilkSettings().defaultUnit,
      });
      fetchRecordsAndCalculateTotal(); 
    } catch (error) {
      console.error("Failed to log milk:", error);
      toast({
        variant: "destructive",
        title: translate({ en: "Error", ur: "خرابی" }),
        description: translate({ en: "Failed to log milk. Please try again.", ur: "دودھ لاگ کرنے میں ناکامی ہوئی۔ براہ کرم دوبارہ کوشش کریں." }),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRecord = (recordId: string) => {
    const success = deleteMilkRecord(recordId);
    if (success) {
      toast({
        title: translate({ en: "Record Deleted", ur: "ریکارڈ حذف کر دیا گیا" }),
        description: translate({ en: "Milk record has been deleted.", ur: "دودھ کا ریکارڈ حذف کر دیا گیا ہے۔" }),
      });
      fetchRecordsAndCalculateTotal();
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
  
  const unitLabel = (unit: 'litre' | 'kg') => unit === 'litre' ? translate({en: "Ltr", ur: "لیٹر"}) : translate({en: "Kg", ur: "کلو"});
  const dailyTotalUnitLabel = dailyTotal.unitSetting === 'litre' ? translate({en: "Litres", ur: "لیٹر"}) : translate({en: "Kgs", ur: "کلوگرام"});

  let totalQuantityDisplay = "";
  if (dailyTotal.quantityLitre > 0) {
    totalQuantityDisplay += `${dailyTotal.quantityLitre} ${unitLabel('litre')}`;
  }
  if (dailyTotal.quantityKg > 0) {
    if (totalQuantityDisplay.length > 0) totalQuantityDisplay += " / ";
    totalQuantityDisplay += `${dailyTotal.quantityKg} ${unitLabel('kg')}`;
  }
  if (totalQuantityDisplay.length === 0) {
    totalQuantityDisplay = `0 ${dailyTotalUnitLabel}`;
  }


  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className={`text-xl font-bold ${language === 'ur' ? 'text-right font-urdu' : ''}`}>
            {translate({ en: 'Log Milk Production', ur: 'دودھ کی پیداوار لاگ کریں' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormProvider {...methods}>
            <MilkLogForm animals={animals} onSubmit={onSubmit} isLoading={isLoading} />
          </FormProvider>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className={`text-xl font-bold ${language === 'ur' ? 'text-right font-urdu' : ''}`}>
            {translate({ en: "Today's Milk Log", ur: "آج کا دودھ لاگ" })} ({format(currentDate, 'PPP')})
          </CardTitle>
          <CardDescription className={`${language === 'ur' ? 'text-right' : ''}`}>
            {translate({en: `Total Quantity:`, ur: `کل مقدار:`})} {totalQuantityDisplay} | {translate({en: `Estimated Income:`, ur: `تخمینی آمدنی:`})} {dailyTotal.income.toFixed(2)} {translate({en: 'PKR', ur: 'روپے'})}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todaysRecords.length === 0 ? (
            <p className={`text-muted-foreground ${language === 'ur' ? 'text-right' : ''}`}>
              {translate({ en: 'No milk logged for today yet.', ur: 'آج کے لیے ابھی تک کوئی دودھ لاگ نہیں ہوا۔' })}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={language === 'ur' ? 'text-right' : ''}>{translate({ en: 'Animal', ur: 'جانور' })}</TableHead>
                  <TableHead className={language === 'ur' ? 'text-right' : ''}>{translate({ en: 'Time', ur: 'وقت' })}</TableHead>
                  <TableHead className={`text-center ${language === 'ur' ? 'font-urdu' : ''}`}>{translate({ en: 'Qty', ur: 'مقدار' })}</TableHead>
                  <TableHead className={`text-center ${language === 'ur' ? 'font-urdu' : ''}`}>{translate({ en: 'Unit', ur: 'یونٹ' })}</TableHead>
                  <TableHead className={`text-center ${language === 'ur' ? 'font-urdu' : ''}`}>{translate({ en: 'Rate Applied', ur: 'لاگو ریٹ' })}</TableHead>
                  <TableHead className="text-right rtl:text-left">{translate({ en: 'Actions', ur: 'کارروائیاں' })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todaysRecords.map(record => (
                  <TableRow key={record.id}>
                    <TableCell className={language === 'ur' ? 'text-right font-urdu' : ''}>{getAnimalName(record.animalId)}</TableCell>
                    <TableCell className={language === 'ur' ? 'text-right font-urdu' : ''}>
                      {record.timeOfDay === 'morning' ? translate({en: 'Morning', ur: 'صبح'}) : translate({en: 'Evening', ur: 'شام'})}
                    </TableCell>
                    <TableCell className="text-center">{record.quantity}</TableCell>
                    <TableCell className="text-center">
                        {unitLabel(record.unit)}
                    </TableCell>
                    <TableCell className="text-center">{record.rateSnapshot.toFixed(2)}</TableCell>
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
                              {translate({ en: "Delete Milk Record?", ur: "دودھ کا ریکارڈ حذف کریں؟" })}
                            </AlertDialogTitle>
                            <AlertDialogDescription className={language === 'ur' ? 'font-urdu' : ''}>
                              {translate({ 
                                en: `Are you sure you want to delete this milk record? This action cannot be undone.`,
                                ur: `کیا آپ واقعی اس دودھ کے ریکارڈ کو حذف کرنا چاہتے ہیں؟ یہ عمل واپس نہیں کیا جا سکتا۔`
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
