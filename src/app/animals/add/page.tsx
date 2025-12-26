
"use client";

import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import AnimalForm, { animalFormSchema, type AnimalFormValues } from '@/components/animals/AnimalForm';
import { addAnimal, type NewAnimalData } from '@/lib/animal-store';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function AddAnimalPage() {
  const router = useRouter();
  const { translate } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const methods = useForm<AnimalFormValues>({
    resolver: zodResolver(animalFormSchema),
    defaultValues: {
      status: 'active', // Default status
      // dateOfBirth: new Date() // Could default to today or leave blank
    },
  });

  const onSubmit = async (data: AnimalFormValues) => {
    setIsLoading(true);
    try {
      const animalDataToSave: NewAnimalData = {
        ...data,
        dateOfBirth: data.dateOfBirth.toISOString(), // Convert Date object to ISO string
      };
      addAnimal(animalDataToSave);
      toast({
        title: translate({ en: "Animal Added", ur: "جانور شامل کر دیا گیا" }),
        description: translate({ 
          en: `${data.nameEn} has been successfully added.`,
          ur: `${data.nameUr} کامیابی سے شامل کر دیا گیا ہے۔`
        }),
      });
      router.push('/animals');
    } catch (error) {
      console.error("Failed to add animal:", error);
      toast({
        variant: "destructive",
        title: translate({ en: "Error", ur: "خرابی" }),
        description: translate({ en: "Failed to add animal. Please try again.", ur: "جانور شامل کرنے میں ناکامی ہوئی۔ براہ کرم دوبارہ کوشش کریں." }),
      });
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-center">
        {translate({ en: 'Add New Animal', ur: 'نیا جانور شامل کریں' })}
      </h2>
      <FormProvider {...methods}>
        <AnimalForm 
          onSubmit={onSubmit} 
          isLoading={isLoading} 
          submitButtonText={{ en: 'Add Animal', ur: 'جانور شامل کریں' }} 
        />
      </FormProvider>
    </div>
  );
}
