
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { getAllAnimals, type Animal } from '@/lib/animal-store';
import { 
  getAllInseminationRecords, 
  getPregnancyCheckRecordById,
  deleteInseminationRecord,
  type InseminationRecord, 
  type PregnancyCheckRecord 
} from '@/lib/reproduction-store';
import { inseminationTypeOptions, pregnancyResultOptions } from '@/types/reproduction';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, PlusCircle, Trash2, CalendarPlus, Stethoscope } from 'lucide-react';
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

interface EnrichedInseminationRecord extends InseminationRecord {
  damName: string;
  damTagNumber: string;
  pregnancyCheck?: PregnancyCheckRecord;
  // calvingRecord?: CalvingRecord; // For future
}

export default function ReproductionHistoryPage() {
  const { translate, language } = useLanguage();
  const { toast } = useToast();
  const [allInseminations, setAllInseminations] = useState<EnrichedInseminationRecord[]>([]);
  const [animalsMap, setAnimalsMap] = useState<Map<string, Animal>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const animals = getAllAnimals();
    const map = new Map(animals.map(animal => [animal.id, animal]));
    setAnimalsMap(map);

    const inseminations = getAllInseminationRecords();
    const enrichedRecords = inseminations.map(ins => {
      const dam = map.get(ins.animalId);
      let pregnancyCheck;
      if (ins.pregnancyCheckId) {
        pregnancyCheck = getPregnancyCheckRecordById(ins.pregnancyCheckId);
      }
      return {
        ...ins,
        damName: dam ? (language === 'ur' ? dam.nameUr : dam.nameEn) : translate({en: 'Unknown Dam', ur: 'نامعلوم مادہ'}),
        damTagNumber: dam ? dam.tagNumber : 'N/A',
        pregnancyCheck: pregnancyCheck,
      };
    });
    setAllInseminations(enrichedRecords);
    setIsLoading(false);
  }, [language, translate]);

  const getInseminationTypeLabel = (value: InseminationRecord['type']) => {
    const option = inseminationTypeOptions.find(opt => opt.value === value);
    return option ? translate(option.labelKey) : value;
  };

  const getPregnancyResultLabel = (value?: PregnancyCheckRecord['result']) => {
    if (!value) return '-';
    const option = pregnancyResultOptions.find(opt => opt.value === value);
    return option ? translate(option.labelKey) : value;
  };

  const handleDeleteInsemination = (id: string, damName: string) => {
    const success = deleteInseminationRecord(id);
    if (success) {
      setAllInseminations(prev => prev.filter(r => r.id !== id));
      toast({
        title: translate({ en: "Record Deleted", ur: "ریکارڈ حذف کر دیا گیا" }),
        description: translate({
            en: `Insemination record for ${damName} deleted.`,
            ur: `${damName} کا حمل ٹھہرانے کا ریکارڈ حذف کر دیا گیا۔`
        })
      });
    } else {
      toast({
        variant: "destructive",
        title: translate({ en: "Error", ur: "خرابی" }),
        description: translate({ en: "Failed to delete record.", ur: "ریکارڈ حذف کرنے میں ناکامی ہوئی۔" }),
      });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-150px)]"><p>{translate({en: "Loading history...", ur: "تاریخچہ لوڈ ہو رہا ہے۔۔۔"})}</p></div>;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className={`pb-4 ${language === 'ur' ? 'text-right' : ''}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <CardTitle className={`text-2xl font-bold ${language === 'ur' ? 'font-urdu' : ''}`}>
              {translate({ en: 'Reproduction History', ur: 'افزائش نسل کا تاریخچہ' })}
            </CardTitle>
            <CardDescription>
              {translate({ en: 'View all insemination, pregnancy, and calving records.', ur: 'تمام حمل ٹھہرانے، حمل، اور زچگی کے ریکارڈز دیکھیں۔' })}
            </CardDescription>
          </div>
          <Link href="/reproduction/log-insemination" passHref>
            <Button className="mt-4 sm:mt-0">
              <PlusCircle className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
              {translate({ en: 'Log New Insemination', ur: 'نیا حمل ٹھہرانے کا اندراج' })}
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {allInseminations.length === 0 ? (
          <p className={`text-muted-foreground text-center py-10 ${language === 'ur' ? 'text-right' : ''}`}>
            {translate({ en: 'No reproduction records found yet.', ur: 'ابھی تک افزائش نسل کا کوئی ریکارڈ نہیں ملا۔' })}<br/>
            <Link href="/reproduction/log-insemination" passHref>
              <Button variant="link" className="text-base px-0">
                 {translate({ en: 'Start by logging an insemination.', ur: 'حمل ٹھہرانے کا اندراج کرکے شروع کریں۔' })}
              </Button>
            </Link>
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={language === 'ur' ? 'text-right' : ''}>{translate({ en: 'Dam', ur: 'مادہ جانور' })}</TableHead>
                  <TableHead className={language === 'ur' ? 'text-right' : ''}>{translate({ en: 'Insemination', ur: 'حمل ٹھہرانے کی تاریخ/قسم' })}</TableHead>
                  <TableHead className={`${language === 'ur' ? 'text-right' : ''} hidden md:table-cell`}>{translate({ en: 'Semen/Bull', ur: 'سیمن/بیل' })}</TableHead>
                  <TableHead className={language === 'ur' ? 'text-right' : ''}>{translate({ en: 'EDD', ur: 'متوقع تاریخ پیدائش' })}</TableHead>
                  <TableHead className={language === 'ur' ? 'text-right' : ''}>{translate({ en: 'Pregnancy Check', ur: 'حمل کا چیک' })}</TableHead>
                  <TableHead className={`${language === 'ur' ? 'text-right' : ''} hidden sm:table-cell`}>{translate({ en: 'Calving', ur: 'زچگی' })}</TableHead>
                  <TableHead className="text-right rtl:text-left">{translate({ en: 'Actions', ur: 'کارروائیاں' })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allInseminations.map(record => (
                  <TableRow key={record.id}>
                    <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''}`}>
                      <Link href={`/animals/${record.animalId}`} className="hover:underline text-primary">
                        {record.damName}
                      </Link>
                      <br/><span className="text-xs text-muted-foreground">({record.damTagNumber})</span>
                    </TableCell>
                    <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''}`}>
                      {format(parseISO(record.inseminationDate), 'PPP')}
                      <br/><span className="text-xs text-muted-foreground">{getInseminationTypeLabel(record.type)}</span>
                    </TableCell>
                    <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''} hidden md:table-cell max-w-xs truncate`}>{record.semenDetails}</TableCell>
                    <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''}`}>{format(parseISO(record.expectedDeliveryDate), 'PPP')}</TableCell>
                    <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''}`}>
                      {record.pregnancyCheck ? (
                        <>
                          {getPregnancyResultLabel(record.pregnancyCheck.result)}
                          <br/><span className="text-xs text-muted-foreground">{format(parseISO(record.pregnancyCheck.checkDate), 'PP')}</span>
                        </>
                      ) : (
                        <Link href={`/reproduction/log-pregnancy-check/${record.id}`} passHref>
                          <Button variant="outline" size="sm">
                            <Stethoscope className="mr-1 h-3 w-3 rtl:ml-1 rtl:mr-0" />
                            {translate({ en: 'Log Check', ur: 'چیک لاگ کریں' })}
                          </Button>
                        </Link>
                      )}
                    </TableCell>
                    <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''} hidden sm:table-cell`}>
                      {record.calvingRecordId ? (
                        translate({en: "Calved", ur: "زچگی ہوچکی"}) // Placeholder
                      ) : record.pregnancyCheck?.result === 'pregnant' ? (
                        <Button variant="outline" size="sm" disabled> {/* Will link to log-calving later */}
                           <CalendarPlus className="mr-1 h-3 w-3 rtl:ml-1 rtl:mr-0" />
                           {translate({ en: 'Log Calving', ur: 'زچگی لاگ کریں' })}
                        </Button>
                      ) : (
                        '-'
                      )}
                    </TableCell>
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
                              {translate({ en: "Delete Record?", ur: "ریکارڈ حذف کریں؟" })}
                            </AlertDialogTitle>
                            <AlertDialogDescription className={language === 'ur' ? 'font-urdu' : ''}>
                              {translate({ 
                                en: `This will delete the insemination record for ${record.damName} on ${format(parseISO(record.inseminationDate), 'PPP')}. Related pregnancy checks will also be removed. This cannot be undone.`,
                                ur: `${record.damName} کا ${format(parseISO(record.inseminationDate), 'PPP')} والا حمل ٹھہرانے کا ریکارڈ حذف ہو جائے گا۔ متعلقہ حمل کے چیک بھی حذف ہو جائیں گے۔ یہ عمل واپس نہیں کیا جا سکتا۔`
                              })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className={language === 'ur' ? 'font-urdu' : ''}>{translate({ en: "Cancel", ur: "منسوخ کریں" })}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteInsemination(record.id, record.damName)} className={`bg-destructive hover:bg-destructive/90 ${language === 'ur' ? 'font-urdu' : ''}`}>{translate({ en: "Delete", ur: "حذف کریں" })}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
