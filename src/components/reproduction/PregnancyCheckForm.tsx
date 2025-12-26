
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
import type { PregnancyResult } from '@/types/reproduction';
import { pregnancyResultOptions } from '@/types/reproduction';

export const pregnancyCheckFormSchema = z.object({
  checkDate: z.date({ required_error: "Check date is required." }),
  result: z.enum(['pregnant', 'not_pregnant', 'recheck'], { required_error: "Result is required." }),
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

export type PregnancyCheckFormValues = z.infer<typeof pregnancyCheckFormSchema>;

interface PregnancyCheckFormProps {
  onSubmit: (data: PregnancyCheckFormValues) => void;
  isLoading?: boolean;
  defaultValues?: Partial<PregnancyCheckFormValues>;
}

export default function PregnancyCheckForm({ onSubmit, isLoading, defaultValues }: PregnancyCheckFormProps) {
  const { translate, language } = useLanguage();
  
  const methods = useForm<PregnancyCheckFormValues>({
    resolver: zodResolver(pregnancyCheckFormSchema),
    defaultValues: {
      checkDate: new Date(),
      ...defaultValues,
    }
  });
  const { control, register, handleSubmit, formState: { errors } } = methods;

  const labelClass = language === 'ur' ? 'text-right block' : '';

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="checkDate" className={labelClass}>{translate({ en: 'Check Date', ur: 'چیک کرنے کی تاریخ' })}</Label>
            <Controller
              name="checkDate"
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
            {errors.checkDate && <p className="text-sm text-destructive mt-1">{errors.checkDate.message}</p>}
          </div>
          <div>
            <Label htmlFor="result" className={labelClass}>{translate({ en: 'Result', ur: 'نتیجہ' })}</Label>
            <Controller
              name="result"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} dir={language === 'ur' ? 'rtl' : 'ltr'}>
                  <SelectTrigger id="result">
                    <SelectValue placeholder={translate({ en: 'Select result', ur: 'نتیجہ منتخب کریں' })} />
                  </SelectTrigger>
                  <SelectContent>
                    {pregnancyResultOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {translate(option.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.result && <p className="text-sm text-destructive mt-1">{errors.result.message}</p>}
          </div>
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
              placeholder={translate({en: 'e.g. 500', ur: 'مثلاً 500'})} 
              className={language === 'ur' ? 'text-right' : ''} 
            />
            {errors.expense && <p className="text-sm text-destructive mt-1">{errors.expense.message}</p>}
          </div>
        </div>
        
        <div>
          <Label htmlFor="notes" className={labelClass}>{translate({ en: 'Notes (Optional)', ur: 'نوٹس (اختیاری)' })}</Label>
          <Textarea id="notes" {...register('notes')} placeholder={translate({en: 'e.g. Confirmed via ultrasound...', ur: 'مثلاً الٹراساؤنڈ سے تصدیق شدہ...'})} className={language === 'ur' ? 'text-right' : ''} />
          {errors.notes && <p className="text-sm text-destructive mt-1">{errors.notes.message}</p>}
        </div>

        <Button type="submit" className="w-full text-lg py-3" disabled={isLoading}>
          {isLoading ? translate({ en: 'Saving...', ur: 'محفوظ کیا جا رہا ہے...' }) : translate({ en: 'Log Pregnancy Check', ur: 'حمل کا چیک لاگ کریں' })}
        </Button>
      </form>
    </FormProvider>
  );
}

