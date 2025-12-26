
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AnimalForm, { animalFormSchema, type AnimalFormValues } from '@/components/animals/AnimalForm';
import { getAnimalById, updateAnimal, type UpdateAnimalData } from '@/lib/animal-store';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';

export default function EditAnimalPage() {
  const params = useParams();
  const router = useRouter();
  const { translate } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const id = typeof params.id === 'string' ? params.id : undefined;

  const methods = useForm<AnimalFormValues>({
    resolver: zodResolver(animalFormSchema),
  });

  useEffect(() => {
    if (id) {
      const animal = getAnimalById(id);
      if (animal) {
        methods.reset({
          ...animal,
          dateOfBirth: new Date(animal.dateOfBirth), // Convert ISO string back to Date object
        });
      } else {
        toast({ variant: "destructive", title: translate({ en: "Not Found", ur: "نہیں ملا" }), description: translate({ en: "Animal not found.", ur: "جانور نہیں ملا۔" }) });
        router.replace('/animals');
      }
      setIsFetching(false);
    } else {
        router.replace('/animals'); // Should not happen if route is matched correctly
    }
  }, [id, methods, router, translate, toast]);

  const onSubmit = async (data: AnimalFormValues) => {
    if (!id) return;
    setIsLoading(true);
    try {
      const animalDataToUpdate: UpdateAnimalData = {
        ...data,
        dateOfBirth: data.dateOfBirth.toISOString(),
      };
      updateAnimal(id, animalDataToUpdate);
      toast({
        title: translate({ en: "Animal Updated", ur: "جانور اپ ڈیٹ کر دیا گیا" }),
        description: translate({ 
          en: `${data.nameEn} has been successfully updated.`,
          ur: `${data.nameUr} کامیابی سے اپ ڈیٹ کر دیا گیا ہے۔`
        }),
      });
      router.push(`/animals/${id}`); // Navigate to profile page after edit
    } catch (error) {
      console.error("Failed to update animal:", error);
      toast({
        variant: "destructive",
        title: translate({ en: "Error", ur: "خرابی" }),
        description: translate({ en: "Failed to update animal. Please try again.", ur: "جانور اپ ڈیٹ کرنے میں ناکامی ہوئی۔ براہ کرم دوبارہ کوشش کریں." }),
      });
      setIsLoading(false);
    }
  };
  
  if (isFetching) {
     return <div className="flex justify-center items-center min-h-[calc(100vh-150px)]"><p>{translate({en: "Loading animal data...", ur: "جانور کا ڈیٹا لوڈ ہو رہا ہے۔۔۔"})}</p></div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-center">
        {translate({ en: 'Edit Animal', ur: 'جانور میں ترمیم کریں' })}
      </h2>
      <FormProvider {...methods}>
        <AnimalForm 
          onSubmit={onSubmit} 
          defaultValues={methods.getValues()}
          isLoading={isLoading}
          submitButtonText={{ en: 'Update Animal', ur: 'جانور اپ ڈیٹ کریں' }}
        />
      </FormProvider>
    </div>
  );
}
