"use client";

import { Leaf } from 'lucide-react';

export default function SplashScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <div className="text-center">
        <Leaf className="w-24 h-24 mx-auto text-primary mb-6" />
        <h1 className="text-5xl font-headline font-bold text-primary">MooManager</h1>
        <p className="text-lg text-muted-foreground mt-2">Your Dairy Farming Companion</p>
      </div>
    </div>
  );
}
