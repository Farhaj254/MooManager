"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Leaf } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import LanguageToggle from '@/components/LanguageToggle';

export default function LoginPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { translate, language } = useLanguage();

  useEffect(() => {
    // Redirect if already logged in
    const storedUser = localStorage.getItem('mooManagerUser');
    if (storedUser) {
      router.replace('/');
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    if (!name.trim() || !phone.trim()) {
      setError(translate({ en: 'Name and phone number are required.', ur: 'نام اور فون نمبر درکار ہیں۔' }));
      return;
    }
    
    // Basic phone validation (example: must be digits, certain length - adjust as needed)
    if (!/^\d+$/.test(phone.trim())) {
      setError(translate({ en: 'Phone number must contain only digits.', ur: 'فون نمبر میں صرف ہندسے ہونے چاہئیں۔'}));
      return;
    }

    localStorage.setItem('mooManagerUser', JSON.stringify({ name: name.trim(), phone: phone.trim() }));
    router.push('/');
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen bg-background p-4 ${language === 'ur' ? 'font-urdu' : 'font-body'}`}>
      <div className="absolute top-4 right-4 z-20">
        <LanguageToggle />
      </div>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <Leaf className="w-16 h-16 mx-auto text-primary mb-4" />
          <CardTitle className="text-3xl font-headline font-bold text-primary">
            {translate({ en: 'MooManager Login', ur: 'مو مینجر لاگ ان' })}
          </CardTitle>
          <CardDescription>
            {translate({ en: 'Enter your details to continue.', ur: 'جاری رکھنے کے لیے اپنی تفصیلات درج کریں۔' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className={`${language === 'ur' ? 'text-right block' : ''}`}>
                {translate({ en: 'Full Name', ur: 'پورا نام' })}
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={translate({ en: 'e.g. John Doe', ur: 'مثلاً جان ڈو' })}
                required
                className={`${language === 'ur' ? 'text-right' : ''}`}
                dir={language === 'ur' ? 'rtl' : 'ltr'}
                aria-describedby={error && name.trim() === '' ? "name-error" : undefined}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className={`${language === 'ur' ? 'text-right block' : ''}`}>
                {translate({ en: 'Phone Number', ur: 'فون نمبر' })}
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={translate({ en: 'e.g. 03001234567', ur: 'مثلاً 03001234567' })}
                required
                className={`${language === 'ur' ? 'text-right' : ''}`}
                dir={language === 'ur' ? 'rtl' : 'ltr'}
                aria-describedby={error && (phone.trim() === '' || !/^\d+$/.test(phone.trim())) ? "phone-error" : undefined}
              />
            </div>
            {error && <p id="form-error" className="text-sm text-destructive text-center" role="alert">{error}</p>}
            <Button type="submit" className="w-full text-lg py-3">
              {translate({ en: 'Login', ur: 'لاگ ان کریں' })}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-xs text-muted-foreground mt-4">
          <p>
            {translate({ 
              en: 'This is an offline login. Your data is stored locally on this device.', 
              ur: 'یہ ایک آف لائن لاگ ان ہے۔ آپ کا ڈیٹا مقامی طور پر اس ڈیوائس پر محفوظ ہے۔' 
            })}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
