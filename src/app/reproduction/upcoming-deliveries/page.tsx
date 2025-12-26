
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format, parseISO, differenceInDays, isToday, isPast, startOfToday } from 'date-fns';
import { getAllAnimals, type Animal } from '@/lib/animal-store';
import { getUpcomingDeliveries, type InseminationRecord } from '@/lib/reproduction-store';
import { inseminationTypeOptions } from '@/types/reproduction';
import { useLanguage } from '@/hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, CheckCircle2, CalendarClock, Baby } from 'lucide-react';

interface EnrichedUpcomingDelivery extends InseminationRecord {
  damName: string;
  damTagNumber: string;
}

export default function UpcomingDeliveriesPage() {
  const { translate, language } = useLanguage();
  const [upcomingDeliveries, setUpcomingDeliveries] = useState<EnrichedUpcomingDelivery[]>([]);
  const [animalsMap, setAnimalsMap] = useState<Map<string, Animal>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const animals = getAllAnimals();
    const map = new Map(animals.map(animal => [animal.id, animal]));
    setAnimalsMap(map);

    const deliveries = getUpcomingDeliveries(); // Uses default daysInFuture=90, daysPastGrace=7
    const enrichedDeliveries = deliveries.map(ins => {
      const dam = map.get(ins.animalId);
      return {
        ...ins,
        damName: dam ? (language === 'ur' ? dam.nameUr : dam.nameEn) : translate({en: 'Unknown Dam', ur: 'نامعلوم مادہ'}),
        damTagNumber: dam ? dam.tagNumber : 'N/A',
      };
    });
    setUpcomingDeliveries(enrichedDeliveries);
    setIsLoading(false);
  }, [language, translate]);

  const getInseminationTypeLabel = (value: InseminationRecord['type']) => {
    const option = inseminationTypeOptions.find(opt => opt.value === value);
    return option ? translate(option.labelKey) : value;
  };

  const getDueDateStatus = (dueDateString: string): { text: string; className: string; icon: React.ReactNode } => {
    const dueDate = parseISO(dueDateString);
    const daysDifference = differenceInDays(dueDate, startOfToday());

    if (daysDifference < 0) { // Overdue
      return { 
        text: translate({ en: `Overdue by ${Math.abs(daysDifference)} day(s)`, ur: `${Math.abs(daysDifference)} دن سے زائد المیعاد` }), 
        className: 'text-red-600 font-semibold',
        icon: <AlertTriangle className="h-4 w-4 inline-block mr-1 rtl:ml-1 rtl:mr-0 text-red-600" />
      };
    }
    if (daysDifference === 0) { // Due Today
      return { 
        text: translate({ en: 'Due Today', ur: 'آج متوقع' }), 
        className: 'text-orange-500 font-semibold',
        icon: <CalendarClock className="h-4 w-4 inline-block mr-1 rtl:ml-1 rtl:mr-0 text-orange-500" />
      };
    }
    // Due in the future
    if (daysDifference <= 7) {
      return { 
        text: translate({ en: `Due in ${daysDifference} day(s)`, ur: `${daysDifference} دن میں متوقع` }), 
        className: 'text-yellow-600',
        icon: <CalendarClock className="h-4 w-4 inline-block mr-1 rtl:ml-1 rtl:mr-0 text-yellow-600" />
      };
    }
    return { 
      text: translate({ en: `Due in ${daysDifference} day(s)`, ur: `${daysDifference} دن میں متوقع` }), 
      className: 'text-green-600',
      icon: <CheckCircle2 className="h-4 w-4 inline-block mr-1 rtl:ml-1 rtl:mr-0 text-green-600" />
    };
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-150px)]"><p>{translate({en: "Loading upcoming deliveries...", ur: "متوقع زچگیاں لوڈ ہو رہی ہیں..."})}</p></div>;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className={language === 'ur' ? 'text-right' : ''}>
         <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Baby className="w-7 h-7 text-primary" />
            <CardTitle className={`text-2xl font-bold ${language === 'ur' ? 'font-urdu' : ''}`}>
              {translate({ en: 'Upcoming & Overdue Deliveries', ur: 'متوقع اور زائد المیعاد زچگیاں' })}
            </CardTitle>
          </div>
        <CardDescription>
          {translate({ en: 'View animals expected to give birth soon or that are overdue.', ur: 'جلد زچگی متوقع یا زائد المیعاد جانوروں کو دیکھیں۔' })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {upcomingDeliveries.length === 0 ? (
          <p className={`text-muted-foreground text-center py-10 ${language === 'ur' ? 'text-right' : ''}`}>
            {translate({ en: 'No upcoming or recently overdue deliveries found.', ur: 'کوئی متوقع یا حال ہی میں زائد المیعاد زچگیاں نہیں ملیں۔' })}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={language === 'ur' ? 'text-right' : ''}>{translate({ en: 'Dam', ur: 'مادہ جانور' })}</TableHead>
                  <TableHead className={language === 'ur' ? 'text-right' : ''}>{translate({ en: 'Expected Delivery', ur: 'متوقع تاریخ پیدائش' })}</TableHead>
                  <TableHead className={language === 'ur' ? 'text-right' : ''}>{translate({ en: 'Status', ur: 'حیثیت' })}</TableHead>
                  <TableHead className={`${language === 'ur' ? 'text-right' : ''} hidden md:table-cell`}>{translate({ en: 'Insemination Type', ur: 'حمل کی قسم' })}</TableHead>
                  <TableHead className={`${language === 'ur' ? 'text-right' : ''} hidden sm:table-cell`}>{translate({ en: 'Semen/Bull', ur: 'سیمن/بیل' })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingDeliveries.map(delivery => {
                  const statusInfo = getDueDateStatus(delivery.expectedDeliveryDate);
                  return (
                    <TableRow key={delivery.id}>
                      <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''}`}>
                         <Link href={`/animals/${delivery.animalId}`} className="hover:underline text-primary">
                           {delivery.damName}
                         </Link>
                         <br/><span className="text-xs text-muted-foreground">({delivery.damTagNumber})</span>
                      </TableCell>
                      <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''} ${statusInfo.className}`}>
                        {format(parseISO(delivery.expectedDeliveryDate), 'PPP')}
                      </TableCell>
                      <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''} ${statusInfo.className}`}>
                        {statusInfo.icon}
                        {statusInfo.text}
                      </TableCell>
                      <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''} hidden md:table-cell`}>{getInseminationTypeLabel(delivery.type)}</TableCell>
                      <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''} hidden sm:table-cell max-w-[150px] truncate`}>{delivery.semenDetails}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

