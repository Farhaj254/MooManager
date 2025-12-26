
"use client";

import { useRouter } from 'next/navigation';
import { ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { translate, language } = useLanguage();
  const { toast } = useToast();

  const handleDownloadReport = async () => {
    const reportContentElement = document.getElementById('operational-reports-content');
    if (!reportContentElement) {
      toast({
        variant: "destructive",
        title: translate({ en: "Error", ur: "خرابی" }),
        description: translate({ 
          en: "Could not find report content to download.",
          ur: "ڈاؤن لوڈ کرنے کے لیے رپورٹ کا مواد نہیں ملا۔"
        }),
      });
      return;
    }

    toast({
      title: translate({ en: "Generating PDF...", ur: "پی ڈی ایف تیار کی جا رہی ہے۔.." }),
      description: translate({ 
        en: "This may take a moment. The PDF will contain an image of the report.",
        ur: "اس میں کچھ وقت لگ سکتا ہے۔ پی ڈی ایف میں رپورٹ کی تصویر ہوگی۔"
      }),
    });

    try {
      // Ensure charts are fully rendered, slight delay might help
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(reportContentElement, {
        scale: 2, // Increase scale for better resolution
        useCORS: true, // If you have external images
        logging: false, // Disable html2canvas logging to console
         onclone: (document) => {
          // Attempt to make chart rendering more consistent for PDF
          // This is experimental and might not work for all chart types/scenarios
          const charts = document.querySelectorAll('.recharts-wrapper');
          charts.forEach(chart => {
            const svg = chart.querySelector('svg');
            if (svg) {
              svg.style.fontFamily = 'sans-serif'; // Use a common font
            }
          });
        }
      });

      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt', // points
        format: 'a4' 
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = imgProps.width;
      const imgHeight = imgProps.height;

      // Calculate aspect ratio
      const ratio = imgWidth / imgHeight;
      
      let finalImgWidth = pdfWidth - 40; // pdfWidth with some margin
      let finalImgHeight = finalImgWidth / ratio;

      // If the image height is still too large for one page, scale based on height
      // This will likely make the content very small for long reports.
      // True multi-page PDF generation from HTML is much more complex.
      if (finalImgHeight > pdfHeight - 40) {
        finalImgHeight = pdfHeight - 40; // pdfHeight with some margin
        finalImgWidth = finalImgHeight * ratio;
      }
      
      // Center the image on the page
      const x = (pdfWidth - finalImgWidth) / 2;
      const y = 20; // Top margin

      pdf.addImage(imgData, 'PNG', x, y, finalImgWidth, finalImgHeight);
      pdf.save(`MooManager_Operational_Report_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        variant: "destructive",
        title: translate({ en: "PDF Generation Failed", ur: "پی ڈی ایف تیار کرنے میں ناکامی" }),
        description: translate({ 
          en: "An error occurred while trying to generate the PDF.",
          ur: "پی ڈی ایف تیار کرنے کی کوشش کے دوران ایک خرابی پیش آئی۔"
        }),
      });
    }
  };

  return (
    <div className={`min-h-screen bg-background flex flex-col ${language === 'ur' ? 'font-urdu' : 'font-body'}`}>
      <header className="sticky top-0 z-10 shadow-md bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2 rtl:ml-2 rtl:mr-0">
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-xl font-headline font-bold text-primary">
              {translate({ en: 'Farm Reports', ur: 'فارم رپورٹس' })}
            </h1>
          </div>
          <Button onClick={handleDownloadReport} variant="outline">
            <Download className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
            {translate({ en: 'Download Report', ur: 'رپورٹ ڈائون لوڈ کریں' })}
          </Button>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
