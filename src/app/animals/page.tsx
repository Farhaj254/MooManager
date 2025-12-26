
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Edit3, Trash2 } from 'lucide-react';
import { getAllAnimals, deleteAnimal } from '@/lib/animal-store';
import type { Animal } from '@/types/animal';
import { useLanguage } from '@/hooks/useLanguage';
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
import { animalSpeciesOptions, animalStatusOptions } from '@/types/animal';

export default function AnimalsListPage() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const { translate, language } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    setAnimals(getAllAnimals());
  }, []);

  const handleDeleteAnimal = (animalId: string, animalName: string) => {
    const success = deleteAnimal(animalId);
    if (success) {
      setAnimals(prevAnimals => prevAnimals.filter(animal => animal.id !== animalId));
      toast({
        title: translate({ en: "Animal Deleted", ur: "جانور حذف کر دیا گیا" }),
        description: translate({
          en: `${animalName} has been successfully deleted.`,
          ur: `${animalName} کامیابی سے حذف کر دیا گیا ہے۔`
        }),
      });
    } else {
      toast({
        variant: "destructive",
        title: translate({ en: "Error", ur: "خرابی" }),
        description: translate({
          en: `Failed to delete ${animalName}.`,
          ur: `${animalName} کو حذف کرنے میں ناکامی ہوئی۔`
        }),
      });
    }
  };

  const getSpeciesLabel = (value: Animal['species']) => {
    const option = animalSpeciesOptions.find(opt => opt.value === value);
    return option ? translate(option.labelKey) : value;
  };

  const getStatusLabel = (value: Animal['status']) => {
    const option = animalStatusOptions.find(opt => opt.value === value);
    return option ? translate(option.labelKey) : value;
  };


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {translate({ en: 'Your Animals', ur: 'آپ کے جانور' })}
        </h2>
        <Link href="/animals/add" passHref>
          <Button>
            <PlusCircle className="mr-2 h-5 w-5" />
            {translate({ en: 'Add Animal', ur: 'جانور شامل کریں' })}
          </Button>
        </Link>
      </div>

      {animals.length === 0 ? (
        <Card className="text-center py-10">
          <CardHeader>
            <CardTitle>{translate({ en: 'No Animals Yet', ur: 'ابھی تک کوئی جانور نہیں' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {translate({ en: 'Start by adding your first animal.', ur: 'اپنا پہلا جانور شامل کرکے شروع کریں۔' })}
            </p>
            <Link href="/animals/add" passHref>
              <Button>
                <PlusCircle className="mr-2 h-5 w-5" />
                {translate({ en: 'Add First Animal', ur: 'پہلا جانور شامل کریں' })}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {animals.map(animal => (
            <Card key={animal.id} className="shadow-lg overflow-hidden">
              <Link href={`/animals/${animal.id}`} passHref className="block hover:shadow-xl transition-shadow">
                {animal.photoDataUrl ? (
                  <div className="relative w-full h-48">
                    <Image 
                      src={animal.photoDataUrl} 
                      alt={language === 'ur' ? animal.nameUr : animal.nameEn} 
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority={animals.indexOf(animal) < 3} // Prioritize loading for first few images
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-muted flex items-center justify-center text-muted-foreground">
                    {translate({ en: 'No Photo', ur: 'کوئی تصویر نہیں' })}
                  </div>
                )}
                <CardContent className="p-4">
                  <h3 className={`text-xl font-semibold mb-1 ${language === 'ur' ? 'font-urdu text-right' : ''}`}>
                    {language === 'ur' ? animal.nameUr : animal.nameEn}
                  </h3>
                  <p className={`text-sm text-muted-foreground ${language === 'ur' ? 'text-right' : ''}`}>
                    {getSpeciesLabel(animal.species)} - {animal.tagNumber}
                  </p>
                   <p className={`text-sm capitalize ${language === 'ur' ? 'text-right' : ''} ${
                      animal.status === 'active' ? 'text-green-600' : 
                      animal.status === 'sold' ? 'text-blue-600' : 'text-red-600'
                    }`}>
                    {translate({en: 'Status:', ur: 'حیثیت:'})} {getStatusLabel(animal.status)}
                  </p>
                </CardContent>
              </Link>
              <div className="p-4 border-t flex justify-end space-x-2 rtl:space-x-reverse">
                <Link href={`/animals/edit/${animal.id}`} passHref>
                  <Button variant="outline" size="sm">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent dir={language === 'ur' ? 'rtl' : 'ltr'}>
                    <AlertDialogHeader>
                      <AlertDialogTitle className={language === 'ur' ? 'font-urdu' : ''}>
                        {translate({ en: "Are you sure?", ur: "کیا آپ واقعی حذف کرنا چاہتے ہیں؟" })}
                      </AlertDialogTitle>
                      <AlertDialogDescription className={language === 'ur' ? 'font-urdu' : ''}>
                        {translate({ 
                          en: `This action cannot be undone. This will permanently delete ${language === 'ur' ? animal.nameUr : animal.nameEn}.`,
                          ur: `یہ عمل واپس نہیں کیا جا سکتا۔ اس سے ${language === 'ur' ? animal.nameUr : animal.nameEn} مستقل طور پر حذف ہو جائے گا۔`
                        })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className={language === 'ur' ? 'font-urdu' : ''}>
                        {translate({ en: "Cancel", ur: "منسوخ کریں" })}
                      </AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteAnimal(animal.id, language === 'ur' ? animal.nameUr : animal.nameEn)} className={language === 'ur' ? 'font-urdu' : ''}>
                        {translate({ en: "Delete", ur: "حذف کریں" })}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

