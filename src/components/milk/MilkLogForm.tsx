
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
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import type { Animal } from '@/types/animal';
import type { MilkUnit, TimeOfDay } from '@/types/milk';
import { milkUnitOptions, timeOfDayOptions } from '@/types/milk';
import { getMilkSettings } from '@/lib/milk-store';
import { useEffect } from 'react';

export const milkLogSchema = z.object({
  animalId: z.string().min(1, { message: "Animal selection is required." }),
  date: z.date({ required_error: "Date is required." }),
  timeOfDay: z.enum(['morning', 'evening'], { required_error: "Time of day is required." }),
  quantity: z.preprocess(
    (val) => parseFloat(z.string().parse(val)),
    z.number().min(0.1, { message: "Quantity must be greater than 0." })
  ),
  unit: z.enum(['litre', 'kg'], { required_error: "Unit is required." }),
});

export type MilkLogFormValues = z.infer<typeof milkLogSchema>;

interface MilkLogFormProps {
  animals: Animal[];
  onSubmit: (data: MilkLogFormValues) => void;
  isLoading?: boolean;
  defaultValues?: Partial<MilkLogFormValues>;
}

export default function MilkLogForm({ animals, onSubmit, isLoading, defaultValues }: MilkLogFormProps) {
  const { translate, language } = useLanguage();
  
  const methods = useForm<MilkLogFormValues>({
    resolver: zodResolver(milkLogSchema),
    defaultValues: {
      date: new Date(), // Default to today
      timeOfDay: 'morning',
      unit: getMilkSettings().defaultUnit,
      ...defaultValues,
    }
  });
  const { control, register, handleSubmit, formState: { errors }, watch, setValue } = methods;

  const selectedAnimalId = watch('animalId');
  const selectedAnimal = animals.find(a => a.id === selectedAnimalId);
  
  // Update default unit if settings change
  useEffect(() => {
    setValue('unit', getMilkSettings().defaultUnit);
  }, [setValue]);


  const labelClass = language === 'ur' ? 'text-right block' : '';

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="animalId" className={labelClass}>{translate({ en: 'Animal', ur: 'جانور' })}</Label>
          <Controller
            name="animalId"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value} dir={language === 'ur' ? 'rtl' : 'ltr'}>
                <SelectTrigger id="animalId">
                  <SelectValue placeholder={translate({ en: 'Select animal', ur: 'جانور منتخب کریں' })} />
                </SelectTrigger>
                <SelectContent>
                  {animals.length > 0 ? (
                    animals.map(animal => (
                      <SelectItem key={animal.id} value={animal.id}>
                        {`${language === 'ur' ? animal.nameUr : animal.nameEn} (${animal.tagNumber})`}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-animals" disabled>
                      {translate({en: "No animals found. Add animals first.", ur: "کوئی جانور نہیں ملا۔ پہلے جانور شامل کریں۔"})}
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
            <Label htmlFor="date" className={labelClass}>{translate({ en: 'Date', ur: 'تاریخ' })}</Label>
            <Controller
              name="date"
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
            {errors.date && <p className="text-sm text-destructive mt-1">{errors.date.message}</p>}
          </div>
          <div>
            <Label htmlFor="timeOfDay" className={labelClass}>{translate({ en: 'Time of Day', ur: 'دن کا وقت' })}</Label>
            <Controller
              name="timeOfDay"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} dir={language === 'ur' ? 'rtl' : 'ltr'}>
                  <SelectTrigger id="timeOfDay">
                    <SelectValue placeholder={translate({ en: 'Select time', ur: 'وقت منتخب کریں' })} />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOfDayOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {translate(option.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.timeOfDay && <p className="text-sm text-destructive mt-1">{errors.timeOfDay.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="quantity" className={labelClass}>{translate({ en: 'Quantity', ur: 'مقدار' })}</Label>
            <Input id="quantity" type="number" step="0.1" {...register('quantity')} placeholder="e.g. 10.5" className={language === 'ur' ? 'text-right' : ''} />
            {errors.quantity && <p className="text-sm text-destructive mt-1">{errors.quantity.message}</p>}
          </div>
          <div>
            <Label htmlFor="unit" className={labelClass}>{translate({ en: 'Unit', ur: 'یونٹ' })}</Label>
            <Controller
              name="unit"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} dir={language === 'ur' ? 'rtl' : 'ltr'}>
                  <SelectTrigger id="unit">
                    <SelectValue placeholder={translate({ en: 'Select unit', ur: 'یونٹ منتخب کریں' })} />
                  </SelectTrigger>
                  <SelectContent>
                    {milkUnitOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {translate(option.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.unit && <p className="text-sm text-destructive mt-1">{errors.unit.message}</p>}
          </div>
        </div>

        <Button type="submit" className="w-full text-lg py-3" disabled={isLoading || animals.length === 0}>
          {isLoading ? translate({ en: 'Saving...', ur: 'محفوظ کیا جا رہا ہے...' }) : translate({ en: 'Log Milk', ur: 'دودھ لاگ کریں' })}
        </Button>
      </form>
    </FormProvider>
  );
}
