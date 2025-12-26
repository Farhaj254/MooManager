
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO } from 'date-fns';
import PregnancyCheckForm, { pregnancyCheckFormSchema, type PregnancyCheckFormValues } from '@/components/reproduction/PregnancyCheckForm';
import { getAnimalById, type Animal } from '@/lib/animal-store';
import { getInseminationRecordById, addPregnancyCheckRecord, type InseminationRecord } from '@/lib/reproduction-store';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LogPregnancyCheckPage() {
  const params = useParams();
  const router = useRouter();
  const { translate, language } = useLanguage();
  const { toast } = useToast();
  const [inseminationRecord, setInseminationRecord] = useState<InseminationRecord | null>(null);
  const [dam, setDam] = useState<Animal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const inseminationId = typeof params.inseminationId === 'string' ? params.inseminationId : undefined;

  const methods = useForm<PregnancyCheckFormValues>({
    resolver: zodResolver(pregnancyCheckFormSchema),
    defaultValues: {
      checkDate: new Date(),
    },
  });

  useEffect(() => {
    if (inseminationId) {
      const record = getInseminationRecordById(inseminationId);
      if (record) {
        setInseminationRecord(record);
        const motherAnimal = getAnimalById(record.animalId);
        if (motherAnimal) {
          setDam(motherAnimal);
        } else {
          toast({ variant: "destructive", title: translate({en: "Error", ur: "خرابی"}), description: translate({en: "Dam not found.", ur: "مادہ جانور نہیں ملا۔"}) });
        }
      } else {
        toast({ variant: "destructive", title: translate({en: "Not Found", ur: "نہیں ملا"}), description: translate({en: "Insemination record not found.", ur: "حمل ٹھہرانے کا ریکارڈ نہیں ملا۔"}) });
        router.replace('/reproduction/history');
      }
      setIsFetching(false);
    } else {
      router.replace('/reproduction/history');
    }
  }, [inseminationId, router, translate, toast]);

  const onSubmit = async (data: PregnancyCheckFormValues) => {
    if (!inseminationRecord || !dam) return;
    setIsLoading(true);
    try {
      const checkData = {
        ...data,
        checkDate: format(data.checkDate, 'yyyy-MM-dd'),
        inseminationId: inseminationRecord.id,
        animalId: dam.id,
      };
      addPregnancyCheckRecord(checkData);
      toast({
        title: translate({ en: "Pregnancy Check Logged", ur: "حمل کا چیک لاگ ہوگیا" }),
        description: translate({
          en: `Check for ${language === 'ur' ? dam.nameUr : dam.nameEn} recorded.`,
          ur: `جانور ${language === 'ur' ? dam.nameUr : dam.nameEn} کے لیے چیک ریکارڈ ہوگیا۔`
        }),
      });
      router.push('/reproduction/history'); 
    } catch (error) {
      console.error("Failed to log pregnancy check:", error);
      toast({
        variant: "destructive",
        title: translate({ en: "Error", ur: "خرابی" }),
        description: translate({ en: "Failed to log check. Please try again.", ur: "چیک لاگ کرنے میں ناکامی ہوئی۔ براہ کرم دوبارہ کوشش کریں." }),
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isFetching) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-150px)]"><p>{translate({en: "Loading data...", ur: "ڈیٹا لوڈ ہو رہا ہے۔۔۔"})}</p></div>;
  }

  if (!inseminationRecord || !dam) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-150px)]"><p>{translate({en: "Required data not found.", ur: "مطلوبہ ڈیٹا نہیں ملا۔"})}</p></div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center">
        {translate({ en: 'Log Pregnancy Check', ur: 'حمل کا چیک لاگ کریں' })}
      </h2>
      
      <Card className="shadow-md">
        <CardHeader className={language === 'ur' ? 'text-right' : ''}>
          <CardTitle className={language === 'ur' ? 'font-urdu' : ''}>{translate({en: "For Dam:", ur: "مادہ جانور:"})} {language === 'ur' ? dam.nameUr : dam.nameEn} ({dam.tagNumber})</CardTitle>
          <CardDescription>
            {translate({en: "Insemination Date:", ur: "حمل ٹھہرانے کی تاریخ:"})} {format(parseISO(inseminationRecord.inseminationDate), "PPP")} <br/>
            {translate({en: "Expected Delivery:", ur: "متوقع تاریخ پیدائش:"})} {format(parseISO(inseminationRecord.expectedDeliveryDate), "PPP")}
          </CardDescription>
        </CardHeader>
      </Card>

      <FormProvider {...methods}>
        <PregnancyCheckForm 
          onSubmit={onSubmit} 
          isLoading={isLoading} 
        />
      </FormProvider>
    </div>
  );
}
