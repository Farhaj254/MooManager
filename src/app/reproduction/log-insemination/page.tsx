
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import InseminationForm, { inseminationFormSchema, type InseminationFormValues } from '@/components/reproduction/InseminationForm';
import { getAllAnimals, type Animal } from '@/lib/animal-store';
import { addInseminationRecord } from '@/lib/reproduction-store';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';

export default function LogInseminationPage() {
  const router = useRouter();
  const { translate, language } = useLanguage();
  const { toast } = useToast();
  const [femaleAnimals, setFemaleAnimals] = useState<Animal[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const methods = useForm<InseminationFormValues>({
    resolver: zodResolver(inseminationFormSchema),
    defaultValues: {
      inseminationDate: new Date(),
      // animalId will be selected by user
    },
  });

  useEffect(() => {
    const all = getAllAnimals();
    // Filter for female animals that are 'active' - potentially add age filter later
    setFemaleAnimals(all.filter(animal => animal.gender === 'female' && animal.status === 'active'));
  }, []);

  const onSubmit = async (data: InseminationFormValues) => {
    setIsLoading(true);
    try {
      const recordData = {
        ...data,
        inseminationDate: format(data.inseminationDate, 'yyyy-MM-dd'),
      };
      const newRecord = addInseminationRecord(recordData);

      if (newRecord) {
        toast({
          title: translate({ en: "Insemination Logged", ur: "حمل ٹھہرانے کا اندراج ہوگیا" }),
          description: translate({
            en: `Insemination for ${femaleAnimals.find(a=>a.id === data.animalId)?.nameEn || 'animal'} recorded. EDD: ${format(new Date(newRecord.expectedDeliveryDate), 'PPP')}`,
            ur: `جانور ${femaleAnimals.find(a=>a.id === data.animalId)?.nameUr || 'کے لیے'} حمل ٹھہرانے کا اندراج ہوگیا. متوقع تاریخ پیدائش: ${format(new Date(newRecord.expectedDeliveryDate), 'PPP')}`
          }),
        });
        methods.reset({ 
            inseminationDate: new Date(), 
            animalId: undefined,
            type: undefined,
            semenDetails: '',
            vetName: '',
            notes: ''
        });
        // Potentially redirect to history or animal's reproduction tab
        // router.push('/reproduction/history'); 
      } else {
         toast({
          variant: "destructive",
          title: translate({ en: "Error", ur: "خرابی" }),
          description: translate({ en: "Failed to log insemination. Dam or species gestation period might be missing.", ur: "اندراج میں ناکامی ہوئی۔ مادہ جانور یا اس کی قسم کی حمل کی مدت دستیاب نہیں ہو سکتی۔" }),
        });
      }
    } catch (error) {
      console.error("Failed to log insemination:", error);
      toast({
        variant: "destructive",
        title: translate({ en: "Error", ur: "خرابی" }),
        description: translate({ en: "Failed to log insemination. Please try again.", ur: "اندراج میں ناکامی ہوئی۔ براہ کرم دوبارہ کوشش کریں." }),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-center">
        {translate({ en: 'Log New Insemination', ur: 'نیا حمل ٹھہرانے کا اندراج کریں' })}
      </h2>
      <FormProvider {...methods}>
        <InseminationForm 
          femaleAnimals={femaleAnimals} 
          onSubmit={onSubmit} 
          isLoading={isLoading} 
        />
      </FormProvider>
    </div>
  );
}
