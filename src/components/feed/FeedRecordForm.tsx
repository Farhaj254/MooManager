
"use client";

import { useEffect } from 'react';
import { useForm, Controller, FormProvider, useFormContext } from 'react-hook-form';
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
import type { FeedType, FeedUnit } from '@/types/feed';
import { feedTypeOptions, feedUnitOptions } from '@/types/feed';

export const feedRecordSchema = z.object({
  animalId: z.string().min(1, { message: "Animal selection is required." }),
  date: z.date({ required_error: "Date is required." }),
  feedType: z.enum(['green', 'dry', 'concentrate', 'water'], { required_error: "Feed type is required." }),
  quantity: z.preprocess(
    (val) => {
        const parsed = parseFloat(z.string().parse(val));
        return isNaN(parsed) ? undefined : parsed;
    },
    z.number({required_error: "Quantity is required."}).min(0.01, { message: "Quantity must be greater than 0." })
  ).optional(),
  unit: z.enum(['kg', 'litre'], { required_error: "Unit is required." }),
  cost: z.preprocess(
    (val) => {
        const parsed = parseFloat(z.string().parse(val));
        return isNaN(parsed) ? undefined : parsed;
    },
    z.number({required_error: "Cost is required."}).min(0, { message: "Cost must be a positive number or zero." })
  ).optional(),
});

export type FeedRecordFormValues = z.infer<typeof feedRecordSchema>;

interface FeedRecordFormProps {
  animals: Animal[];
  onSubmit: (data: FeedRecordFormValues) => void;
  isLoading?: boolean;
  defaultValues?: Partial<FeedRecordFormValues>; // This prop is not used if form is within FormProvider
}

// Using useFormContext to connect to the form provider in the parent (LogFeedPage)
export default function FeedRecordForm({ animals, onSubmit, isLoading }: FeedRecordFormProps) {
  const { translate, language } = useLanguage();
  const { control, register, handleSubmit, formState: { errors }, watch, setValue } = useFormContext<FeedRecordFormValues>();

  const watchedFeedType = watch('feedType');

  useEffect(() => {
    const selectedOption = feedTypeOptions.find(option => option.value === watchedFeedType);
    if (selectedOption) {
      setValue('unit', selectedOption.defaultUnit, { shouldValidate: true });
    } else {
      // If feedType is undefined (e.g., after reset or initial load), clear unit
      setValue('unit', undefined, { shouldValidate: true });
    }
  }, [watchedFeedType, setValue]);

  const labelClass = language === 'ur' ? 'text-right block' : '';

  return (
    // Removed FormProvider wrapper, using context from parent
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
        <Label htmlFor="feedType" className={labelClass}>{translate({ en: 'Feed Type', ur: 'خوراک کی قسم' })}</Label>
        <Controller
          name="feedType"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value} dir={language === 'ur' ? 'rtl' : 'ltr'}>
              <SelectTrigger id="feedType">
                <SelectValue placeholder={translate({ en: 'Select feed type', ur: 'خوراک کی قسم منتخب کریں' })} />
              </SelectTrigger>
              <SelectContent>
                {feedTypeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {translate(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.feedType && <p className="text-sm text-destructive mt-1">{errors.feedType.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="quantity" className={labelClass}>{translate({ en: 'Quantity', ur: 'مقدار' })}</Label>
          <Input id="quantity" type="number" step="0.01" {...register('quantity')} placeholder="e.g. 10.5" className={language === 'ur' ? 'text-right' : ''} />
          {errors.quantity && <p className="text-sm text-destructive mt-1">{errors.quantity.message}</p>}
        </div>
        <div>
          <Label htmlFor="unit" className={labelClass}>{translate({ en: 'Unit', ur: 'یونٹ' })}</Label>
          <Controller
            name="unit"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value} dir={language === 'ur' ? 'rtl' : 'ltr'} disabled>
                <SelectTrigger id="unit">
                  <SelectValue placeholder={translate({ en: 'Unit (auto)', ur: 'یونٹ (خودکار)' })} />
                </SelectTrigger>
                <SelectContent>
                  {feedUnitOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {translate(option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.unit && <p className="text-sm text-destructive mt-1">{errors.unit.message}</p>}
           <p className="text-xs text-muted-foreground mt-1">
              {language === 'ur' ? 'یونٹ خوراک کی قسم کی بنیاد پر خود بخود منتخب ہوتا ہے۔' : 'Unit is auto-selected based on feed type.'}
          </p>
        </div>
      </div>
      
      <div>
        <Label htmlFor="cost" className={labelClass}>{translate({ en: 'Total Cost for this entry (PKR)', ur: 'اس اندراج کی کل لاگت (روپے)' })}</Label>
        <Input id="cost" type="number" step="0.01" {...register('cost')} placeholder="e.g. 500" className={language === 'ur' ? 'text-right' : ''} />
        {errors.cost && <p className="text-sm text-destructive mt-1">{errors.cost.message}</p>}
      </div>

      <Button type="submit" className="w-full text-lg py-3" disabled={isLoading || animals.length === 0}>
        {isLoading ? translate({ en: 'Saving...', ur: 'محفوظ کیا جا رہا ہے...' }) : translate({ en: 'Log Feed Entry', ur: 'خوراک کا اندراج لاگ کریں' })}
      </Button>
    </form>
  );
}


    