
"use client";

import type { Control } from 'react-hook-form';
import { Controller, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, UploadCloud } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import type { AnimalSpecies, AnimalGender, AnimalStatus } from '@/types/animal';
import { animalSpeciesOptions, animalGenderOptions, animalStatusOptions } from '@/types/animal';
import Image from 'next/image';
import { useState, ChangeEvent } from 'react';

export const animalFormSchema = z.object({
  nameEn: z.string().min(1, { message: "English name is required." }),
  nameUr: z.string().min(1, { message: "Urdu name is required." }),
  species: z.enum(['cow', 'buffalo', 'sheep', 'goat'], { required_error: "Species is required." }),
  breed: z.string().min(1, { message: "Breed is required." }),
  gender: z.enum(['male', 'female'], { required_error: "Gender is required." }),
  tagNumber: z.string().min(1, { message: "Tag number is required." }),
  dateOfBirth: z.date({ required_error: "Date of birth is required." }),
  photoDataUrl: z.string().optional(),
  status: z.enum(['active', 'sold', 'deceased'], { required_error: "Status is required." }),
  motherId: z.string().optional(),
  fatherId: z.string().optional(),
});

export type AnimalFormValues = z.infer<typeof animalFormSchema>;

interface AnimalFormProps {
  onSubmit: (data: AnimalFormValues) => void;
  defaultValues?: Partial<AnimalFormValues>;
  isLoading?: boolean;
  submitButtonText?: { en: string, ur: string };
}

export default function AnimalForm({ onSubmit, defaultValues, isLoading, submitButtonText }: AnimalFormProps) {
  const { translate, language } = useLanguage();
  const { control, register, handleSubmit, formState: { errors }, setValue, watch } = useFormContext<AnimalFormValues>();
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(defaultValues?.photoDataUrl);

  const watchedPhoto = watch('photoDataUrl');

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setValue('photoDataUrl', dataUrl, { shouldValidate: true });
        setPhotoPreview(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="nameEn" className={language === 'ur' ? 'text-right block' : ''}>{translate({ en: 'Name (English)', ur: 'نام (انگریزی)' })}</Label>
          <Input id="nameEn" {...register('nameEn')} placeholder={translate({ en: 'e.g. Daisy', ur: 'مثلاً ڈیزی' })} />
          {errors.nameEn && <p className="text-sm text-destructive mt-1">{errors.nameEn.message}</p>}
        </div>
        <div>
          <Label htmlFor="nameUr" className={language === 'ur' ? 'text-right block' : ''}>{translate({ en: 'Name (Urdu)', ur: 'نام (اردو)' })}</Label>
          <Input id="nameUr" {...register('nameUr')} dir="rtl" className="text-right font-urdu" placeholder="مثلاً گل بہار" />
          {errors.nameUr && <p className="text-sm text-destructive mt-1">{errors.nameUr.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="species" className={language === 'ur' ? 'text-right block' : ''}>{translate({ en: 'Species', ur: 'قسم' })}</Label>
          <Controller
            name="species"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value} dir={language === 'ur' ? 'rtl' : 'ltr'}>
                <SelectTrigger id="species">
                  <SelectValue placeholder={translate({ en: 'Select species', ur: 'قسم منتخب کریں' })} />
                </SelectTrigger>
                <SelectContent>
                  {animalSpeciesOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {translate(option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.species && <p className="text-sm text-destructive mt-1">{errors.species.message}</p>}
        </div>
        <div>
          <Label htmlFor="breed" className={language === 'ur' ? 'text-right block' : ''}>{translate({ en: 'Breed', ur: 'نسل' })}</Label>
          <Input id="breed" {...register('breed')} placeholder={translate({ en: 'e.g. Sahiwal', ur: 'مثلاً ساہیوال' })} />
          {errors.breed && <p className="text-sm text-destructive mt-1">{errors.breed.message}</p>}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="gender" className={language === 'ur' ? 'text-right block' : ''}>{translate({ en: 'Gender', ur: 'جنس' })}</Label>
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value} dir={language === 'ur' ? 'rtl' : 'ltr'}>
                <SelectTrigger id="gender">
                  <SelectValue placeholder={translate({ en: 'Select gender', ur: 'جنس منتخب کریں' })} />
                </SelectTrigger>
                <SelectContent>
                  {animalGenderOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {translate(option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.gender && <p className="text-sm text-destructive mt-1">{errors.gender.message}</p>}
        </div>
        <div>
          <Label htmlFor="tagNumber" className={language === 'ur' ? 'text-right block' : ''}>{translate({ en: 'Tag Number', ur: 'ٹیگ نمبر' })}</Label>
          <Input id="tagNumber" {...register('tagNumber')} placeholder={translate({ en: 'e.g. A123', ur: 'مثلاً A123' })} />
          {errors.tagNumber && <p className="text-sm text-destructive mt-1">{errors.tagNumber.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="dateOfBirth" className={language === 'ur' ? 'text-right block' : ''}>{translate({ en: 'Date of Birth', ur: 'تاریخ پیدائش' })}</Label>
          <Controller
            name="dateOfBirth"
            control={control}
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? format(field.value, "PPP") : <span>{translate({ en: 'Pick a date', ur: 'تاریخ منتخب کریں' })}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                  />
                </PopoverContent>
              </Popover>
            )}
          />
          {errors.dateOfBirth && <p className="text-sm text-destructive mt-1">{errors.dateOfBirth.message}</p>}
        </div>
        <div>
           <Label htmlFor="status" className={language === 'ur' ? 'text-right block' : ''}>{translate({ en: 'Status', ur: 'حیثیت' })}</Label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value} dir={language === 'ur' ? 'rtl' : 'ltr'}>
                <SelectTrigger id="status">
                  <SelectValue placeholder={translate({ en: 'Select status', ur: 'حیثیت منتخب کریں' })} />
                </SelectTrigger>
                <SelectContent>
                  {animalStatusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {translate(option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.status && <p className="text-sm text-destructive mt-1">{errors.status.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="photo" className={language === 'ur' ? 'text-right block' : ''}>{translate({ en: 'Photo', ur: 'تصویر' })}</Label>
        <div className="mt-2 flex items-center gap-4">
          {photoPreview || watchedPhoto ? (
            <Image
              src={photoPreview || watchedPhoto!}
              alt={translate({ en: 'Animal photo preview', ur: 'جانور کی تصویر کا پیش نظارہ' })}
              width={100}
              height={100}
              className="rounded-md object-cover h-24 w-24"
            />
          ) : (
            <div className="h-24 w-24 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
              <UploadCloud size={32} />
            </div>
          )}
          <Input id="photo" type="file" accept="image/*" onChange={handlePhotoChange} className="flex-1" />
        </div>
         {errors.photoDataUrl && <p className="text-sm text-destructive mt-1">{errors.photoDataUrl.message}</p>}
      </div>

      {/* MotherId and FatherId are not directly editable here but part of the schema for programmatic setting */}

      <Button type="submit" className="w-full text-lg py-3" disabled={isLoading}>
        {isLoading ? translate({ en: 'Saving...', ur: 'محفوظ کیا جا رہا ہے...' }) : 
        submitButtonText ? translate(submitButtonText) : translate({ en: 'Save Animal', ur: 'جانور محفوظ کریں' })
        }
      </Button>
    </form>
  );
}
