
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wheat, ListChecks, LineChart } from 'lucide-react'; // Replaced NotebookText with LineChart for consistency
import { useLanguage } from '@/hooks/useLanguage';

export default function FeedPage() {
  const { translate, language } = useLanguage();

  const feedActions = [
    {
      labelKey: { en: "Log Feed", ur: "خوراک لاگ کریں" },
      href: "/feed/log",
      icon: <ListChecks className="w-8 h-8 mb-2 text-primary" />,
      descriptionKey: { en: "Record daily feed consumption.", ur: "روزانہ خوراک کی کھپت ریکارڈ کریں۔" }
    },
    {
      labelKey: { en: "View Reports", ur: "رپورٹس دیکھیں" },
      href: "/feed/reports", // This page will be implemented later
      icon: <LineChart className="w-8 h-8 mb-2 text-primary" />,
      descriptionKey: { en: "Analyze feed usage and costs.", ur: "خوراک کے استعمال اور اخراجات کا تجزیہ کریں۔" }
    },
  ];

  return (
    <div className={`space-y-8 ${language === 'ur' ? 'text-right' : ''}`}>
      <div className="text-center">
        <Wheat className="w-16 h-16 mx-auto text-primary mb-4" />
        <h2 className="text-3xl font-bold text-primary">
          {translate({ en: 'Feed Module', ur: 'خوراک ماڈیول' })}
        </h2>
        <p className="text-muted-foreground">
          {translate({ en: 'Manage and track your farm\'s feed consumption and costs.', ur: 'اپنے فارم کی خوراک کی کھپت اور اخراجات کا انتظام اور ٹریک کریں۔' })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {feedActions.map(action => (
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
