
"use client";

import { useForm, Controller, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import type { Animal } from '@/types/animal';
import type { InseminationType } from '@/types/reproduction';
import { inseminationTypeOptions } from '@/types/reproduction';
import { useEffect, useState } from 'react';

export const inseminationFormSchema = z.object({
  animalId: z.string().min(1, { message: "Dam selection is required." }),
  inseminationDate: z.date({ required_error: "Insemination date is required." }),
  type: z.enum(['ai', 'natural'], { required_error: "Insemination type is required." }),
  semenDetails: z.string().min(1, { message: "Semen/Bull details are required." }),
  vetName: z.string().optional(),
  expense: z.preprocess(
    (val) => {
      if (val === "" || val === undefined || val === null) return undefined;
      const parsed = parseFloat(z.string().parse(val));
      return isNaN(parsed) ? undefined : parsed;
    },
    z.number().min(0, "Expense must be a positive number or zero.").optional()
  ),
  notes: z.string().optional(),
});

export type InseminationFormValues = z.infer<typeof inseminationFormSchema>;

interface InseminationFormProps {
  femaleAnimals: Animal[]; // Only female animals eligible for insemination
  onSubmit: (data: InseminationFormValues) => void;
  isLoading?: boolean;
  defaultValues?: Partial<InseminationFormValues>;
}

export default function InseminationForm({ femaleAnimals, onSubmit, isLoading, defaultValues }: InseminationFormProps) {
  const { translate, language } = useLanguage();
  
  const methods = useForm<InseminationFormValues>({
    resolver: zodResolver(inseminationFormSchema),
    defaultValues: {
      inseminationDate: new Date(),
      ...defaultValues,
    }
  });
  const { control, register, handleSubmit, formState: { errors }, watch } = methods;

  const watchedType = watch("type");

  const labelClass = language === 'ur' ? 'text-right block' : '';
  const semenDetailsLabel = watchedType === 'ai' ? 
    translate({ en: 'Semen Straw ID / AI Details', ur: 'سیمن سٹرا آئی ڈی / مصنوعی حمل کی تفصیلات' }) : 
    translate({ en: 'Bull ID / Name', ur: 'بیل کا آئی ڈی / نام' });

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="animalId" className={labelClass}>{translate({ en: 'Dam (Female Animal)', ur: 'مادہ جانور (ماں)' })}</Label>
          <Controller
            name="animalId"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value} dir={language === 'ur' ? 'rtl' : 'ltr'}>
                <SelectTrigger id="animalId">
                  <SelectValue placeholder={translate({ en: 'Select dam', ur: 'مادہ جانور منتخب کریں' })} />
                </SelectTrigger>
                <SelectContent>
                  {femaleAnimals.length > 0 ? (
                    femaleAnimals.map(animal => (
                      <SelectItem key={animal.id} value={animal.id}>
                        {`${language === 'ur' ? animal.nameUr : animal.nameEn} (${animal.tagNumber})`}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-animals" disabled>
                      {translate({en: "No female animals found.", ur: "کوئی مادہ جانور نہیں ملا۔"})}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          />
          {errors.animalId && <p className="text-sm text-destructive mt-1">{errors.animalId.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="inseminationDate" className={labelClass}>{translate({ en: 'Insemination Date', ur: 'حمل ٹھہرانے کی تاریخ' })}</Label>
            <Controller
              name="inseminationDate"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                      {field.value ? format(field.value, "PPP") : <span>{translate({ en: 'Pick a date', ur: 'تاریخ منتخب کریں' })}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus disabled={(date) => date > new Date()} />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.inseminationDate && <p className="text-sm text-destructive mt-1">{errors.inseminationDate.message}</p>}
          </div>
          <div>
            <Label htmlFor="type" className={labelClass}>{translate({ en: 'Insemination Type', ur: 'حمل ٹھہرانے کی قسم' })}</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} dir={language === 'ur' ? 'rtl' : 'ltr'}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder={translate({ en: 'Select type', ur: 'قسم منتخب کریں' })} />
                  </SelectTrigger>
                  <SelectContent>
                    {inseminationTypeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {translate(option.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && <p className="text-sm text-destructive mt-1">{errors.type.message}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="semenDetails" className={labelClass}>{semenDetailsLabel}</Label>
          <Input id="semenDetails" {...register('semenDetails')} placeholder={translate({en: 'e.g. Bull #123 or Straw XYZ', ur: 'مثلاً بیل نمبر 123 یا سٹرا XYZ'})} />
          {errors.semenDetails && <p className="text-sm text-destructive mt-1">{errors.semenDetails.message}</p>}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="vetName" className={labelClass}>{translate({ en: 'Veterinarian/Technician (Optional)', ur: 'ڈاکٹر/ٹیکنیشن (اختیاری)' })}</Label>
            <Input id="vetName" {...register('vetName')} placeholder={translate({en: 'e.g. Dr. Khan', ur: 'مثلاً ڈاکٹر خان'})} />
            {errors.vetName && <p className="text-sm text-destructive mt-1">{errors.vetName.message}</p>}
          </div>
          <div>
            <Label htmlFor="expense" className={labelClass}>{translate({ en: 'Expense (PKR, Optional)', ur: 'خرچہ (روپے، اختیاری)' })}</Label>
            <Input 
              id="expense" 
              type="number" 
              step="0.01" 
              {...register('expense')} 
              placeholder={translate({en: 'e.g. 1500', ur: 'مثلاً 1500'})} 
              className={language === 'ur' ? 'text-right' : ''} 
            />
            {errors.expense && <p className="text-sm text-destructive mt-1">{errors.expense.message}</p>}
          </div>
        </div>
        
        <div>
          <Label htmlFor="notes" className={labelClass}>{translate({ en: 'Notes (Optional)', ur: 'نوٹس (اختیاری)' })}</Label>
          <Textarea id="notes" {...register('notes')} placeholder={translate({en: 'e.g. Observed heat signs...', ur: 'مثلاً گرمی کی علامات دیکھیں...'})} className={language === 'ur' ? 'text-right' : ''} />
          {errors.notes && <p className="text-sm text-destructive mt-1">{errors.notes.message}</p>}
        </div>

        <Button type="submit" className="w-full text-lg py-3" disabled={isLoading || femaleAnimals.length === 0}>
          {isLoading ? translate({ en: 'Saving...', ur: 'محفوظ کیا جا رہا ہے...' }) : translate({ en: 'Log Insemination', ur: 'حمل ٹھہرانے کا اندراج کریں' })}
        </Button>
      </form>
    </FormProvider>
  );
}

