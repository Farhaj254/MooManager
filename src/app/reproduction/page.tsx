
"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusSquare, ListChecks, CalendarDays, HeartPulse } from 'lucide-react'; 
import { useLanguage } from '@/hooks/useLanguage';

export default function ReproductionPage() {
  const { translate, language } = useLanguage();

  const reproductionActions = [
    {
      labelKey: { en: "Log Insemination", ur: "حمل ٹھہرانے کا اندراج" },
      href: "/reproduction/log-insemination",
      icon: <PlusSquare className="w-8 h-8 mb-2 text-primary" />,
      descriptionKey: { en: "Record new insemination events.", ur: "نئے حمل ٹھہرانے کے واقعات ریکارڈ کریں۔" }
    },
    {
      labelKey: { en: "View History", ur: "تاریخچہ دیکھیں" },
      href: "/reproduction/history", 
      icon: <ListChecks className="w-8 h-8 mb-2 text-primary" />,
      descriptionKey: { en: "Browse all reproduction records.", ur: "تمام افزائش نسل کے ریکارڈز دیکھیں۔" }
    },
    {
      labelKey: { en: "Upcoming Deliveries", ur: "متوقع زچگیاں" },
      href: "/reproduction/upcoming-deliveries", 
      icon: <CalendarDays className="w-8 h-8 mb-2 text-primary" />,
      descriptionKey: { en: "Check expected delivery dates.", ur: "متوقع زچگی کی تاریخیں چیک کریں۔" }
    },
  ];

  return (
    <div className={`space-y-8 ${language === 'ur' ? 'text-right' : ''}`}>
      <div className="text-center">
        <HeartPulse className="w-16 h-16 mx-auto text-primary mb-4" />
        <h2 className="text-3xl font-bold text-primary">
          {translate({ en: 'Reproduction Module', ur: 'افزائش نسل ماڈیول' })}
        </h2>
        <p className="text-muted-foreground">
          {translate({ en: 'Manage your farm\'s breeding and calving records.', ur: 'اپنے فارم کے افزائش نسل اور زچگی کے ریکارڈز کا نظم کریں۔' })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reproductionActions.map(action => (
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
