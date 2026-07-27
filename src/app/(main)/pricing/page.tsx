'use client';

import * as React from 'react';
import { OpportunityForm } from '@/components/pricing/opportunity-form';
import { CostSettings, PricingSettings } from '@/components/pricing/cost-settings';
import { AIReport } from '@/components/pricing/ai-report';
import { analyzePricing } from '@/app/actions/pricing';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/ui/page-header'; // Wait, let's just use standard header

export default function PricingPage() {
  const { toast } = useToast();
  const [costsConfig, setCostsConfig] = React.useState<PricingSettings | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [report, setReport] = React.useState<any>(null);

  const handleAnalyze = async (payload: { productText: string; imageBase64: string; imageMimeType: string; baseCost: number }) => {
    if (!costsConfig) {
      toast({ variant: 'destructive', title: 'Error', description: 'Los parámetros de costos aún no se han cargado.' });
      return;
    }

    setIsLoading(true);
    setReport(null);

    try {
      const response = await analyzePricing({
        ...payload,
        costsConfig,
      });

      if (response.success) {
        setReport(response.data);
      } else {
        toast({ variant: 'destructive', title: 'Error de Análisis', description: response.error });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 pb-24 max-w-7xl mx-auto print:p-0 print:m-0 print:block">
      <div className="print:hidden">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Analista de Pricing y Mercado (IA)</h1>
        <p className="text-sm text-slate-500 mt-1">
          Evalúa propuestas comerciales, calcula rentabilidad y busca precios de referencia en tiempo real.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start print:block print:w-full">
        {/* Columna Izquierda: Configuración y Formulario */}
        <div className="xl:col-span-1 space-y-6 print:hidden">
          <CostSettings onSettingsChange={setCostsConfig} />
          <OpportunityForm onAnalyze={handleAnalyze} isLoading={isLoading} />
        </div>

        {/* Columna Derecha: Reporte */}
        <div className="xl:col-span-2 print:w-full print:block">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-xl bg-slate-50/50">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-600 font-medium animate-pulse">Analizando propuesta, calculando breakeven...</p>
              <p className="text-slate-400 text-sm mt-1">Rastreando precios en la zona y e-commerce nacional.</p>
            </div>
          )}
          
          {!isLoading && report && (
            <AIReport report={report} />
          )}

          {!isLoading && !report && (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-xl bg-slate-50 text-slate-400">
              Carga una propuesta y presiona Analizar para ver el dictamen.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
