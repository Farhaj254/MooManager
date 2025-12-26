
"use client";

import { useEffect, useState } from 'react';
import { format, parseISO, differenceInDays, isToday, isPast } from 'date-fns';
import { getAllAnimals, type Animal } from '@/lib/animal-store';
import { getUpcomingHealthEvents, type HealthRecord } from '@/lib/health-store';
import { useLanguage } from '@/hooks/useLanguage';
import { healthRecordTypeOptions } from '@/types/health';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, CheckCircle2, CalendarClock } from 'lucide-react';

export default function UpcomingHealthEventsPage() {
  const { translate, language } = useLanguage();
  const [upcomingEvents, setUpcomingEvents] = useState<HealthRecord[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);

  useEffect(() => {
    setUpcomingEvents(getUpcomingHealthEvents());
    setAnimals(getAllAnimals());
  }, []);

  const getAnimalName = (animalId: string) => {
    const animal = animals.find(a => a.id === animalId);
    return animal ? (language === 'ur' ? animal.nameUr : animal.nameEn) : translate({en: 'Unknown', ur: 'نامعلوم'});
  };

  const getRecordTypeLabel = (type: HealthRecord['type']) => {
    const option = healthRecordTypeOptions.find(opt => opt.value === type);
    return option ? translate(option.labelKey) : type;
  };

  const getDueDateStatus = (dueDateString: string): { text: string; className: string; icon: React.ReactNode } => {
    const dueDate = parseISO(dueDateString);
    const today = new Date();
    const daysDiff = differenceInDays(dueDate, today);

    if (isPast(dueDate) && !isToday(dueDate)) {
      return { 
        text: translate({ en: `Overdue by ${Math.abs(daysDiff)} day(s)`, ur: `${Math.abs(daysDiff)} دن سے زائد المیعاد` }), 
        className: 'text-red-600 font-semibold',
        icon: <AlertTriangle className="h-4 w-4 inline-block mr-1 rtl:ml-1 rtl:mr-0 text-red-600" />
      };
    }
    if (isToday(dueDate)) {
      return { 
        text: translate({ en: 'Due Today', ur: 'آج مقررہ' }), 
        className: 'text-orange-500 font-semibold',
        icon: <CalendarClock className="h-4 w-4 inline-block mr-1 rtl:ml-1 rtl:mr-0 text-orange-500" />
      };
    }
    if (daysDiff <= 7) {
      return { 
        text: translate({ en: `Due in ${daysDiff} day(s)`, ur: `${daysDiff} دن میں مقررہ` }), 
        className: 'text-yellow-600',
        icon: <CalendarClock className="h-4 w-4 inline-block mr-1 rtl:ml-1 rtl:mr-0 text-yellow-600" />
      };
    }
    return { 
      text: translate({ en: `Due in ${daysDiff} day(s)`, ur: `${daysDiff} دن میں مقررہ` }), 
      className: 'text-green-600',
      icon: <CheckCircle2 className="h-4 w-4 inline-block mr-1 rtl:ml-1 rtl:mr-0 text-green-600" />
    };
  };


  return (
    <Card className="shadow-lg">
      <CardHeader className={language === 'ur' ? 'text-right' : ''}>
        <CardTitle className={`text-2xl font-bold ${language === 'ur' ? 'font-urdu' : ''}`}>
          {translate({ en: 'Upcoming Health Events', ur: 'آنے والے صحت کے واقعات' })}
        </CardTitle>
        <CardDescription>
          {translate({ en: 'View scheduled vaccinations, checkups, and other follow-ups.', ur: 'طے شدہ ویکسینیشن، چیک اپ، اور دیگر فالو اپ دیکھیں۔' })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {upcomingEvents.length === 0 ? (
          <p className={`text-muted-foreground text-center py-6 ${language === 'ur' ? 'text-right' : ''}`}>
            {translate({ en: 'No upcoming health events scheduled.', ur: 'کوئی آنے والے صحت کے واقعات طے شدہ نہیں ہیں۔' })}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={language === 'ur' ? 'text-right' : ''}>{translate({ en: 'Due Date', ur: 'مقررہ تاریخ' })}</TableHead>
                <TableHead className={language === 'ur' ? 'text-right' : ''}>{translate({ en: 'Animal', ur: 'جانور' })}</TableHead>
                <TableHead className={language === 'ur' ? 'text-right' : ''}>{translate({ en: 'Event Type', ur: 'واقعہ کی قسم' })}</TableHead>
                <TableHead className={language === 'ur' ? 'text-right' : ''}>{translate({ en: 'Status', ur: 'حیثیت' })}</TableHead>
                <TableHead className={`${language === 'ur' ? 'text-right' : ''} hidden md:table-cell`}>{translate({ en: 'Original Event Date', ur: 'اصل واقعہ کی تاریخ' })}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingEvents.map(event => {
                if (!event.nextDueDate) return null; // Should not happen due to store logic but good practice
                const statusInfo = getDueDateStatus(event.nextDueDate);
                return (
                  <TableRow key={event.id}>
                    <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''} ${statusInfo.className}`}>
                      {format(parseISO(event.nextDueDate), 'PPP')}
                    </TableCell>
                    <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''}`}>{getAnimalName(event.animalId)}</TableCell>
                    <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''}`}>{getRecordTypeLabel(event.type)}</TableCell>
                    <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''} ${statusInfo.className}`}>
                      {statusInfo.icon}
                      {statusInfo.text}
                    </TableCell>
                    <TableCell className={`${language === 'ur' ? 'text-right font-urdu' : ''} hidden md:table-cell`}>
                      {format(parseISO(event.date), 'PPP')}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
