"use client";

import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export default function LanguageToggle() {
  const { language, setLanguage, translate } = useLanguage();

  return (
    <div className="flex items-center space-x-2 rtl:space-x-reverse p-2 rounded-lg shadow-md bg-card">
      <Globe className="w-5 h-5 text-primary" />
      <Button
        variant={language === 'en' ? 'default' : 'ghost'}
        onClick={() => setLanguage('en')}
        className={`px-4 py-2 rounded-md ${language === 'en' ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}
      >
        English
      </Button>
      <Button
        variant={language === 'ur' ? 'default' : 'ghost'}
        onClick={() => setLanguage('ur')}
        className={`px-4 py-2 rounded-md ${language === 'ur' ? 'bg-primary text-primary-foreground font-urdu' : 'text-foreground font-urdu'}`}
      >
        اردو
      </Button>
    </div>
  );
}
