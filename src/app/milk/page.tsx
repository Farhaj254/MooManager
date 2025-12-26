
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks, Settings, LineChart, Droplets } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

export default function MilkPage() {
  const { translate, language } = useLanguage();

  const milkActions = [
    {
      labelKey: { en: "Log Milk", ur: "دودھ لاگ کریں" },
      href: "/milk/log",
      icon: <ListChecks className="w-8 h-8 mb-2 text-primary" />,
      descriptionKey: { en: "Record daily milk production.", ur: "روزانہ دودھ کی پیداوار ریکارڈ کریں۔" }
    },
    {
      labelKey: { en: "View Summaries", ur: "خلاصے دیکھیں" },
      href: "/milk/summary",
      icon: <LineChart className="w-8 h-8 mb-2 text-primary" />,
      descriptionKey: { en: "Analyze milk data and trends.", ur: "دودھ کے ڈیٹا اور رجحانات کا تجزیہ کریں۔" }
    },
    {
      labelKey: { en: "Milk Settings", ur: "دودھ کی ترتیبات" },
      href: "/milk/settings",
      icon: <Settings className="w-8 h-8 mb-2 text-primary" />,
      descriptionKey: { en: "Configure rate and units.", ur: "ریٹ اور یونٹس کنفیگر کریں۔" }
    },
  ];

  return (
    <div className={`space-y-8 ${language === 'ur' ? 'text-right' : ''}`}>
      <div className="text-center">
        <Droplets className="w-16 h-16 mx-auto text-primary mb-4" />
        <h2 className="text-3xl font-bold text-primary">
          {translate({ en: 'Milk Module', ur: 'دودھ ماڈیول' })}
        </h2>
        <p className="text-muted-foreground">
          {translate({ en: 'Manage and track your farm\'s milk production.', ur: 'اپنے فارم کی دودھ کی پیداوار کا انتظام اور ٹریک کریں۔' })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {milkActions.map(action => (
          <Link key={action.href} href={action.href} passHref>
            <Card className="hover:shadow-lg transition-shadow h-full flex flex-col text-center">
              <CardHeader>
                <div className="flex justify-center items-center">
                  {action.icon}
                </div>
                <CardTitle className={`text-xl ${language === 'ur' ? 'font-urdu' : ''}`}>
                  {translate(action.labelKey)}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground text-sm">
                  {translate(action.descriptionKey)}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
