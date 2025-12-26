
"use client";

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';

export default function AnimalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { translate, language } = useLanguage();

  return (
    <div className={`min-h-screen bg-background flex flex-col ${language === 'ur' ? 'font-urdu' : 'font-body'}`}>
      <header className="sticky top-0 z-10 shadow-md bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2 rtl:ml-2 rtl:mr-0">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-headline font-bold text-primary">
            {translate({ en: 'Animal Management', ur: 'جانوروں کا انتظام' })}
          </h1>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
