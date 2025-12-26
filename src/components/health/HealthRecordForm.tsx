
"use client";

import { useFormContext, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import type { Animal } from '@/types/animal';
import { healthRecordTypeOptions, type HealthRecordType } from '@/types/health';
import { useEffect } from 'react';

const healthRecordFormSchemaBase = z.object({
  animalId: z.string().min(1, { message: "Animal selection is required." }),
  type: z.enum(['vaccination', 'treatment', 'checkup'], { required_error: "Record type is required." }),
  date: z.date({ required_error: "Date of event is required." }),
  notes: z.string().optional(),
  medication: z.string().optional(),
  nextDueDate: z.date().optional().nullable(),
  expense: z.preprocess(
    (val) => {
      if (val === "" || val === undefined || val === null) return undefined; // Allow empty string to be treated as undefined
      const parsed = parseFloat(z.string().parse(val));
      return isNaN(parsed) ? undefined : parsed;
    },
    z.number().min(0, "Expense must be a positive number or zero.").optional()
  ),
});

export const healthRecordFormSchema = healthRecordFormSchemaBase.superRefine((data, ctx) => {
  if (data.type === 'treatment' && (!data.medication || data.medication.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Medication details are required for treatments.",
      path: ['medication'],
    });
  }
});


export type HealthRecordFormValues = z.infer<typeof healthRecordFormSchema>;

interface HealthRecordFormProps {
  animals: Animal[];
  onSubmit: (data: HealthRecordFormValues) => void;
  isLoading?: boolean;
}

export default function HealthRecordForm({ animals, onSubmit, isLoading }: HealthRecordFormProps) {
  const { translate, language } = useLanguage();
  const { control, register, handleSubmit, formState: { errors }, watch, setValue } = useFormContext<HealthRecordFormValues>();

  const selectedType = watch('type');
  
  useEffect(() => {
    if (selectedType === 'treatment') {
      setValue('nextDueDate', null, { shouldValidate: true }); 
    } else if (selectedType === 'vaccination' || selectedType === 'checkup') {
      setValue('medication', '', { shouldValidate: true }); 
    }
  }, [selectedType, setValue]);


  const labelClass = language === 'ur' ? 'text-right block' : '';

  return (
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
          <Label htmlFor="type" className={labelClass}>{translate({ en: 'Record Type', ur: 'ریکارڈ کی قسم' })}</Label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value} dir={language === 'ur' ? 'rtl' : 'ltr'}>
                <SelectTrigger id="type">
                  <SelectValue placeholder={translate({ en: 'Select type', ur: 'قسم منتخب کریں' })} />
                </SelectTrigger>
                <SelectContent>
                  {healthRecordTypeOptions.map(option => (
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
        <div>
          <Label htmlFor="date" className={labelClass}>{translate({ en: 'Date of Event', ur: 'واقعہ کی تاریخ' })}</Label>
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
      </div>

      {selectedType === 'treatment' && (
        <div>
          <Label htmlFor="medication" className={labelClass}>{translate({ en: 'Medication / Treatment Details', ur: 'دوا / علاج کی تفصیلات' })}</Label>
          <Textarea id="medication" {...register('medication')} placeholder={translate({en: 'e.g. Painkiller injection, dosage...', ur: 'مثلاً درد کش انجیکشن، خوراک...' })} className={language === 'ur' ? 'text-right' : ''} />
          {errors.medication && <p className="text-sm text-destructive mt-1">{errors.medication.message}</p>}
        </div>
      )}

      {(selectedType === 'vaccination' || selectedType === 'checkup') && (
        <div>
          <Label htmlFor="nextDueDate" className={labelClass}>{translate({ en: 'Next Due Date (Optional)', ur: 'اگلی مقررہ تاریخ (اختیاری)' })}</Label>
          <Controller
            name="nextDueDate"
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
                  <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus disabled={(date) => date < new Date()} />
                </PopoverContent>
              </Popover>
            )}
          />
          {errors.nextDueDate && <p className="text-sm text-destructive mt-1">{errors.nextDueDate.message}</p>}
        </div>
      )}

      <div>
        <Label htmlFor="expense" className={labelClass}>{translate({ en: 'Expense (PKR, Optional)', ur: 'خرچہ (روپے، اختیاری)' })}</Label>
        <Input 
          id="expense" 
          type="number" 
          step="0.01" 
          {...register('expense')} 
          placeholder={translate({en: 'e.g. 250', ur: 'مثلاً 250'})} 
          className={language === 'ur' ? 'text-right' : ''} 
        />
        {errors.expense && <p className="text-sm text-destructive mt-1">{errors.expense.message}</p>}
      </div>

      <div>
        <Label htmlFor="notes" className={labelClass}>{translate({ en: 'Notes (Optional)', ur: 'نوٹس (اختیاری)' })}</Label>
        <Textarea id="notes" {...register('notes')} placeholder={translate({en: 'e.g. Animal was lethargic...', ur: 'مثلاً جانور سست تھا...' })} className={language === 'ur' ? 'text-right' : ''} />
        {errors.notes && <p className="text-sm text-destructive mt-1">{errors.notes.message}</p>}
      </div>
      
      <Button type="submit" className="w-full text-lg py-3" disabled={isLoading || animals.length === 0}>
        {isLoading ? translate({ en: 'Saving...', ur: 'محفوظ کیا جا رہا ہے...' }) : translate({ en: 'Log Health Event', ur: 'صحت کا واقعہ لاگ کریں' })}
      </Button>
    </form>
  );
}
