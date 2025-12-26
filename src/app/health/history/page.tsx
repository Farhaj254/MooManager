
"use client";

import { useEffect, useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { getAllAnimals, type Animal } from '@/lib/animal-store';
import { getAllHealthRecords, type HealthRecord, deleteHealthRecord } from '@/lib/health-store';
import { useLanguage } from '@/hooks/useLanguage';
import { healthRecordTypeOptions } from '@/types/health';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2, Filter } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';

export default function HealthHistoryPage() {
  const { translate, language } = useLanguage();
  const { toast } = useToast();
  const [allRecords, setAllRecords] = useState<HealthRecord[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>('all');

  useEffect(() => {
    setAllRecords(getAllHealthRecords());
    setAnimals(getAllAnimals());
  }, []);

  const filteredRecords = useMemo(() => {
    if (selectedAnimalId === 'all') {
      return allRecords;
    }
    return allRecords.filter(record => record.animalId === selectedAnimalId);
  }, [allRecords, selectedAnimalId]);

  const getAnimalName = (animalId: string) => {
    const animal = animals.find(a => a.id === animalId);
    return animal ? (language === 'ur' ? animal.nameUr : animal.nameEn) : translate({en: 'Unknown', ur: 'نامعلوم'});
  };

  const getRecordTypeLabel = (type: HealthRecord['type']) => {
    const option = healthRecordTypeOptions.find(opt => opt.value === type);
    return option ? translate(option.labelKey) : type;
  };

  const handleDeleteRecord = (recordId: string) => {
    const success = deleteHealthRecord(recordId);
    if (success) {
      setAllRecords(prev => prev.filter(r => r.id !== recordId));
      toast({
        title: translate({ en: "Record Deleted", ur: "ریکارڈ حذف کر دیا گیا" }),
      });
    } else {
      toast({
        variant: "destructive",
        title: translate({ en: "Error", ur: "خرابی" }),
        description: translate({ en: "Failed to delete record.", ur: "ریکارڈ حذف کرنے میں ناکامی ہوئی۔" }),
      });
    }
  };


  return (
    <Card className="shadow-lg">
      <CardHeader className={language === 'ur' ? 'text-right' : ''}>
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${language === 'ur' ? 'sm:flex-row-reverse' : ''}`}>
          <div>
            <CardTitle className={`text-2xl font-bold ${language === 'ur' ? 'font-urdu' : ''}`}>
              {translate({ en: 'Health History', ur: 'صحت کی تاریخ' })}
            </CardTitle>
            <CardDescription>
              {translate({ en: 'View all logged health events.', ur: 'تمام لاگ شدہ صحت کے واقعات دیکھیں۔' })}
            </CardDescription>
          </div>
          <div className="w-full sm:w-auto min-w-[200px]">
            <Select value={selectedAnimalId} onValueChange={setSelectedAnimalId} dir={language === 'ur' ? 'rtl' : 'ltr'}>
              <SelectTrigger className="w-full">
                <div className="flex items-center">
                  <Filter className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                  <SelectValue placeholder={translate({ en: 'Filter by animal...', ur: 'جانور کے لحاظ سے فلٹر کریں...' })} />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translate({ en: 'All Animals', ur: 'تمام جانور' })}</SelectItem>
                {animals.map(animal => (
                  <SelectItem key={animal.id} value={animal.id}>
                    {language === 'ur' ? animal.nameUr : animal.nameEn} ({animal.tagNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredRecords.length === 0 ? (
          <p className={`text-muted-foreground text-center py-6 ${language === 'ur' ? 'text-right' : ''}`}>
            {selectedAnimalId === 'all' 
              ? translate({ en: 'No health records found for any animal.', ur: 'کسی بھی جانور کے لیے صحت کا کوئی ریکارڈ نہیں ملا۔' })
              : translate({ en: 'No health records found for the selected animal.', ur: 'منتخب جانور کے لیے صحت کا کوئی ریکارڈ نہیں ملا۔' })
            }
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={language === 'ur' ? 'text-right' : ''}>{translate({ en: 'Date', ur: 'تاریخ' })}</TableHead>
                <TableHead className={language === 'ur' ? 'text-right' : ''}>{translate({ en: 'Animal', ur: 'جانور' })}</TableHead>
                <TableHead className={language === 'ur' ? 'text-right' : ''}>{translate({ en: 'Type', ur: 'قسم' })}</TableHead>
                <TableHead className={`${language === 'ur' ? 'text-right' : ''} hidden md:table-cell`}>{translate({ en: 'Notes', ur: 'نوٹس' })}</TableHead>
                <TableHead className={`${language === 'ur' ? 'text-right' : ''} hidden md:table-cell`}>{translate({ en: 'Medication', ur: 'دوا' })}</TableHead>
                <TableHead className={`${language === 'ur' ? 'text-right' : ''} hidden sm:table-cell`}>{translate({ en: 'Next Due', ur: 'اگلی تاریخ' })}</TableHead>
                <TableHead className="text-right rtl:text-left">{translate({ en: 'Actions', ur: 'کارروائیاں' })}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map(record => (
                <TableRow key={record.id}>
                  <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''}`}>{format(parseISO(record.date), 'PPP')}</TableCell>
                  <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''}`}>{getAnimalName(record.animalId)}</TableCell>
                  <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''}`}>{getRecordTypeLabel(record.type)}</TableCell>
                  <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''} hidden md:table-cell max-w-[200px] truncate`}>{record.notes || '-'}</TableCell>
                  <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''} hidden md:table-cell max-w-[200px] truncate`}>{record.medication || '-'}</TableCell>
                  <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''} hidden sm:table-cell`}>{record.nextDueDate ? format(parseISO(record.nextDueDate), 'PPP') : '-'}</TableCell>
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
  );
}

