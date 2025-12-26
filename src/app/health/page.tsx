
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Syringe, Activity, CalendarCheck, Stethoscope } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

export default function HealthPage() {
  const { translate, language } = useLanguage();

  const healthActions = [
    {
      labelKey: { en: "Log Health Event", ur: "صحت کا واقعہ لاگ کریں" },
      href: "/health/log",
      icon: <Activity className="w-8 h-8 mb-2 text-primary" />,
      descriptionKey: { en: "Record vaccinations, treatments, checkups.", ur: "ویکسینیشن، علاج، چیک اپ ریکارڈ کریں۔" }
    },
    {
      labelKey: { en: "View Health History", ur: "صحت کی تاریخ دیکھیں" },
      href: "/health/history",
      icon: <Stethoscope className="w-8 h-8 mb-2 text-primary" />,
      descriptionKey: { en: "Check past health records for animals.", ur: "جانوروں کے ماضی کے صحت کے ریکارڈ چیک کریں۔" }
    },
    {
      labelKey: { en: "Upcoming Events", ur: "آنے والے واقعات" },
      href: "/health/upcoming",
      icon: <CalendarCheck className="w-8 h-8 mb-2 text-primary" />,
      descriptionKey: { en: "See scheduled vaccinations, checkups.", ur: "طے شدہ ویکسینیشن، چیک اپ دیکھیں۔" }
    },
  ];

  return (
    <div className={`space-y-8 ${language === 'ur' ? 'text-right' : ''}`}>
      <div className="text-center">
        <Syringe className="w-16 h-16 mx-auto text-primary mb-4" />
        <h2 className="text-3xl font-bold text-primary">
          {translate({ en: 'Health Module', ur: 'صحت ماڈیول' })}
        </h2>
        <p className="text-muted-foreground">
          {translate({ en: 'Manage your farm\'s animal health records and upcoming events.', ur: 'اپنے فارم کے جانوروں کے صحت کے ریکارڈ اور آنے والے واقعات کا نظم کریں۔' })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {healthActions.map(action => (
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
