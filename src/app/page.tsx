"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SplashScreen from '@/components/SplashScreen';
import Dashboard from '@/components/Dashboard';
import { useLanguage } from '@/hooks/useLanguage';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const { translate } = useLanguage();

  useEffect(() => {
    // This effect runs once on mount to handle splash screen and initial auth check.
    const splashTimer = setTimeout(() => {
      const storedUser = localStorage.getItem('mooManagerUser');
      if (storedUser) {
        setIsAuthenticated(true);
      } else {
        router.replace('/login');
      }
      setIsLoading(false); // Splash and auth check done
    }, 2500); // Splash screen duration

    return () => clearTimeout(splashTimer);
  }, [router]); // router is stable, so this effect runs effectively once

  if (isLoading) {
    return <SplashScreen />;
  }

  if (isAuthenticated) {
    return <Dashboard />;
  }

  // If not loading and not authenticated, user is being redirected by router.replace.
  // Show a loading indicator or null to prevent brief flashes.
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <p>{translate({ en: "Redirecting...", ur: "منتقل کیا جا رہا ہے۔.." })}</p>
    </div>
  );
}
