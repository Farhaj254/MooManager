
"use client";

import { useEffect, useState } from 'react';
import { useForm, Controller, useFormContext } from 'react-hook-form'; // useFormContext is no longer needed here
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import { getMilkSettings, saveMilkSettings, type MilkSettings } from '@/lib/milk-store';
import { milkUnitOptions, type MilkUnit } from '@/types/milk';

const milkSettingsSchema = z.object({
  ratePerUnit: z.coerce.number().min(0, { message: "Rate must be a positive number or zero." }),
  defaultUnit: z.enum(['litre', 'kg'], { required_error: "Default unit is required." }),
});

type MilkSettingsFormValues = z.infer<typeof milkSettingsSchema>;

export default function MilkSettingsPage() {
  const { translate, language } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { control, register, handleSubmit, reset, formState: { errors }, watch: formWatch } = useForm<MilkSettingsFormValues>({
    resolver: zodResolver(milkSettingsSchema),
    defaultValues: {
      ratePerUnit: 0,
      defaultUnit: 'litre',
    }
  });

  useEffect(() => {
    const currentSettings = getMilkSettings();
    reset(currentSettings);
  }, [reset]);

  const onSubmit = (data: MilkSettingsFormValues) => {
    setIsLoading(true);
    try {
      saveMilkSettings(data);
      toast({
        title: translate({ en: "Settings Saved", ur: "ترتیبات محفوظ ہوگئیں" }),
        description: translate({ en: "Milk rate and unit settings updated.", ur: "دودھ کے ریٹ اور یونٹ کی ترتیبات اپ ڈیٹ ہوگئیں۔" }),
      });
    } catch (error) {
      console.error("Failed to save milk settings:", error);
      toast({
        variant: "destructive",
        title: translate({ en: "Error", ur: "خرابی" }),
        description: translate({ en: "Failed to save settings.", ur: "ترتیبات محفوظ کرنے میں ناکامی ہوئی۔" }),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const labelClass = language === 'ur' ? 'text-right block' : '';
  const watchedDefaultUnit = formWatch('defaultUnit');

  return (
    <Card className="max-w-2xl mx-auto shadow-lg">
      <CardHeader className={language === 'ur' ? 'text-right' : ''}>
        <CardTitle className={`text-2xl font-bold ${language === 'ur' ? 'font-urdu' : ''}`}>
          {translate({ en: 'Milk Settings', ur: 'دودھ کی ترتیبات' })}
        </CardTitle>
        <CardDescription>
          {translate({ en: 'Configure the rate per unit and default measurement unit for milk.', ur: 'دودھ کے لیے فی یونٹ ریٹ اور پہلے سے طے شدہ پیمائشی یونٹ کنفیگر کریں۔' })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="ratePerUnit" className={labelClass}>
              {translate({ en: 'Rate per Unit', ur: 'فی یونٹ ریٹ' })} ({translate(milkUnitOptions.find(o => o.value === (watchedDefaultUnit || 'litre'))?.labelKey || {en: 'Unit', ur: 'یونٹ'})})
            </Label>
            <Input
              id="ratePerUnit"
              type="number"
              step="0.01"
              {...register('ratePerUnit')}
              placeholder={translate({ en: 'e.g. 150', ur: 'مثلاً 150' })}
              className={language === 'ur' ? 'text-right' : ''}
            />
            {errors.ratePerUnit && <p className="text-sm text-destructive mt-1">{errors.ratePerUnit.message}</p>}
          </div>

          <div>
            <Label htmlFor="defaultUnit" className={labelClass}>
              {translate({ en: 'Default Unit', ur: 'پہلے سے طے شدہ یونٹ' })}
            </Label>
            <Controller
              name="defaultUnit"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} dir={language === 'ur' ? 'rtl' : 'ltr'}>
                  <SelectTrigger id="defaultUnit">
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
            {errors.defaultUnit && <p className="text-sm text-destructive mt-1">{errors.defaultUnit.message}</p>}
          </div>

          <Button type="submit" className="w-full text-lg py-3" disabled={isLoading}>
            {isLoading ? translate({ en: 'Saving...', ur: 'محفوظ کیا جا رہا ہے...' }) : translate({ en: 'Save Settings', ur: 'ترتیبات محفوظ کریں' })}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Removed custom watch and useFormContextSafe functions as they are no longer needed.
// The 'watch' function from useForm (aliased to 'formWatch') is used directly.
