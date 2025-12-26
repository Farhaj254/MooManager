
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getAnimalById, deleteAnimal, getAllAnimals } from '@/lib/animal-store';
import type { Animal } from '@/types/animal';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Edit3, Trash2, CalendarDays, Tag, Users, CheckCircle, XCircle, DollarSign, HelpCircle, GitMerge, UserSquare2 } from 'lucide-react';
import { format } from 'date-fns';
import { animalSpeciesOptions, animalGenderOptions, animalStatusOptions } from '@/types/animal';
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

export default function AnimalProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { translate, language } = useLanguage();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [mother, setMother] = useState<Animal | null>(null);
  const [father, setFather] = useState<Animal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const id = typeof params.id === 'string' ? params.id : undefined;

  useEffect(() => {
    if (id) {
      const fetchedAnimal = getAnimalById(id);
      if (fetchedAnimal) {
        setAnimal(fetchedAnimal);
        if (fetchedAnimal.motherId) {
          setMother(getAnimalById(fetchedAnimal.motherId));
        }
        if (fetchedAnimal.fatherId) {
          setFather(getAnimalById(fetchedAnimal.fatherId));
        }
      } else {
        toast({ variant: "destructive", title: translate({ en: "Not Found", ur: "نہیں ملا" }), description: translate({ en: "Animal not found.", ur: "جانور نہیں ملا۔" }) });
        router.push('/animals');
      }
      setIsLoading(false);
    }
  }, [id, router, translate, toast]);

  const handleDeleteAnimal = () => {
    if (!animal) return;
    const success = deleteAnimal(animal.id);
    if (success) {
      toast({
        title: translate({ en: "Animal Deleted", ur: "جانور حذف کر دیا گیا" }),
        description: translate({
          en: `${language === 'ur' ? animal.nameUr : animal.nameEn} has been successfully deleted.`,
          ur: `${language === 'ur' ? animal.nameUr : animal.nameEn} کامیابی سے حذف کر دیا گیا ہے۔`
        }),
      });
      router.push('/animals');
    } else {
      toast({
        variant: "destructive",
        title: translate({ en: "Error", ur: "خرابی" }),
        description: translate({ en: "Failed to delete animal.", ur: "جانور کو حذف کرنے میں ناکامی ہوئی۔" }),
      });
    }
  };
  
  const getLabel = (options: { value: string, labelKey: { en: string, ur: string } }[], value: string) => {
    const option = options.find(opt => opt.value === value);
    return option ? translate(option.labelKey) : value;
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-150px)]"><p>{translate({en: "Loading animal details...", ur: "جانور کی تفصیلات لوڈ ہو رہی ہیں..."})}</p></div>;
  }

  if (!animal) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-150px)]"><p>{translate({en: "Animal not found.", ur: "جانور نہیں ملا۔"})}</p></div>;
  }
  
  const animalName = language === 'ur' ? animal.nameUr : animal.nameEn;

  const detailItemClass = `flex items-start py-3 border-b ${language === 'ur' ? 'flex-row-reverse text-right' : ''}`;
  const labelClass = `w-1/3 font-medium text-muted-foreground ${language === 'ur' ? 'ml-4 text-right' : 'mr-4 text-left'}`;
  const valueClass = `w-2/3 ${language === 'ur' ? 'font-urdu' : ''}`;

  const StatusIcon = ({ status }: { status: Animal['status']}) => {
    if (status === 'active') return <CheckCircle className="h-5 w-5 text-green-500 inline-block ml-2 rtl:mr-2 rtl:ml-0" />;
    if (status === 'sold') return <DollarSign className="h-5 w-5 text-blue-500 inline-block ml-2 rtl:mr-2 rtl:ml-0" />;
    if (status === 'deceased') return <XCircle className="h-5 w-5 text-red-500 inline-block ml-2 rtl:mr-2 rtl:ml-0" />;
    return <HelpCircle className="h-5 w-5 text-gray-500 inline-block ml-2 rtl:mr-2 rtl:ml-0" />;
  };

  const ParentLink = ({ parentAnimal }: { parentAnimal: Animal | null}) => {
    if (!parentAnimal) return <span className={valueClass}>{translate({en: 'Unknown', ur: 'نامعلوم'})}</span>;
    return (
      <Link href={`/animals/${parentAnimal.id}`} className={`text-primary hover:underline ${valueClass}`}>
        {language === 'ur' ? parentAnimal.nameUr : parentAnimal.nameEn} ({parentAnimal.tagNumber})
      </Link>
    );
  };

  return (
    <Card className="shadow-2xl">
      <CardHeader className={`pb-4 ${language === 'ur' ? 'text-right' : ''}`}>
        <CardTitle className={`text-3xl font-bold text-primary ${language === 'ur' ? 'font-urdu' : ''}`}>
          {animalName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {animal.photoDataUrl && (
          <div className="mb-6 relative w-full aspect-video rounded-lg overflow-hidden shadow-md">
            <Image 
              src={animal.photoDataUrl} 
              alt={animalName} 
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
            />
          </div>
        )}
        
        <div className="space-y-1">
          <div className={detailItemClass}>
            <span className={labelClass}>{translate({ en: 'Tag Number', ur: 'ٹیگ نمبر' })}:</span>
            <span className={valueClass}>{animal.tagNumber}</span>
          </div>
          <div className={detailItemClass}>
            <span className={labelClass}>{translate({ en: 'Species', ur: 'قسم' })}:</span>
            <span className={valueClass}>{getLabel(animalSpeciesOptions, animal.species)}</span>
          </div>
          <div className={detailItemClass}>
            <span className={labelClass}>{translate({ en: 'Breed', ur: 'نسل' })}:</span>
            <span className={valueClass}>{animal.breed}</span>
          </div>
          <div className={detailItemClass}>
            <span className={labelClass}>{translate({ en: 'Gender', ur: 'جنس' })}:</span>
            <span className={valueClass}>{getLabel(animalGenderOptions, animal.gender)}</span>
          </div>
          <div className={detailItemClass}>
            <span className={labelClass}>{translate({ en: 'Date of Birth', ur: 'تاریخ پیدائش' })}:</span>
            <span className={valueClass}><CalendarDays className="inline h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" /> {format(new Date(animal.dateOfBirth), 'PPP')}</span>
          </div>
           <div className={detailItemClass}>
            <span className={labelClass}>{translate({ en: 'Status', ur: 'حیثیت' })}:</span>
            <span className={valueClass}>
              {getLabel(animalStatusOptions, animal.status)}
              <StatusIcon status={animal.status} />
            </span>
          </div>
          {animal.motherId && (
            <div className={detailItemClass}>
              <span className={labelClass}><GitMerge className="inline h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />{translate({ en: 'Mother', ur: 'ماں' })}:</span>
              <ParentLink parentAnimal={mother} />
            </div>
          )}
          {animal.fatherId && (
             <div className={detailItemClass}>
              <span className={labelClass}><UserSquare2 className="inline h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />{translate({ en: 'Father', ur: 'باپ' })}:</span>
              <ParentLink parentAnimal={father} />
            </div>
          )}
          {language === 'en' && animal.nameUr && (
            <div className={detailItemClass}>
              <span className={labelClass}>{translate({ en: 'Name (Urdu)', ur: 'نام (اردو)' })}:</span>
              <span className={valueClass + " font-urdu"}>{animal.nameUr}</span>
            </div>
          )}
          {language === 'ur' && animal.nameEn && (
             <div className={detailItemClass}>
              <span className={labelClass}>{translate({ en: 'Name (English)', ur: 'نام (انگریزی)' })}:</span>
              <span className={valueClass}>{animal.nameEn}</span>
            </div>
          )}
           <div className={detailItemClass}>
            <span className={labelClass}>{translate({ en: 'Added On', ur: 'شامل کرنے کی تاریخ' })}:</span>
            <span className={valueClass}>{format(new Date(animal.createdAt), 'PPP p')}</span>
          </div>
           <div className={detailItemClass}>
            <span className={labelClass}>{translate({ en: 'Last Updated', ur: 'آخری ترمیم' })}:</span>
            <span className={valueClass}>{format(new Date(animal.updatedAt), 'PPP p')}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="mt-6 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 rtl:sm:space-x-reverse">
        <Link href={`/animals/edit/${animal.id}`} passHref>
          <Button variant="outline" className="w-full sm:w-auto">
            <Edit3 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" /> {translate({ en: 'Edit', ur: 'ترمیم' })}
          </Button>
        </Link>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full sm:w-auto">
              <Trash2 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" /> {translate({ en: 'Delete', ur: 'حذف کریں' })}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent dir={language === 'ur' ? 'rtl' : 'ltr'}>
            <AlertDialogHeader>
              <AlertDialogTitle className={language === 'ur' ? 'font-urdu' : ''}>
                {translate({ en: "Are you sure?", ur: "کیا آپ واقعی حذف کرنا چاہتے ہیں؟" })}
              </AlertDialogTitle>
              <AlertDialogDescription className={language === 'ur' ? 'font-urdu' : ''}>
                {translate({ 
                  en: `This action cannot be undone. This will permanently delete ${animalName}.`,
                  ur: `یہ عمل واپس نہیں کیا جا سکتا۔ اس سے ${animalName} مستقل طور پر حذف ہو جائے گا۔`
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className={language === 'ur' ? 'font-urdu' : ''}>
                {translate({ en: "Cancel", ur: "منسوخ کریں" })}
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAnimal} className={language === 'ur' ? 'font-urdu' : ''}>
                {translate({ en: "Delete", ur: "حذف کریں" })}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
