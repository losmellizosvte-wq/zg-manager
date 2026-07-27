'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, AlertTriangle, XCircle, ShoppingBag, Store, Info, MapPin, Share2, Printer, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AIReportProps {
  report: any;
}

export function AIReport({ report }: AIReportProps) {
  if (!report) return null;

  const { extractedData, nationalBenchmark = [], regionalBenchmark = [], financials, verdict } = report;

  const formatCurrency = (value: any) => {
    const num = Number(value);
    if (isNaN(num) || value === null || value === undefined) return String(value || 'N/A');
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(num);
  };

  const getVerdictConfig = (status: string) => {
    switch (status) {
      case 'VIABLE': return { color: 'text-green-700', bg: 'bg-green-100', border: 'border-green-200', icon: CheckCircle2 };
      case 'RIESGOSO': return { color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-200', icon: AlertTriangle };
      case 'NO VIABLE': return { color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-200', icon: XCircle };
      default: return { color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-200', icon: Info };
    }
  };

  const vConfig = getVerdictConfig(verdict?.status);
  const VIcon = vConfig.icon;

  const handleWhatsAppShare = () => {
    const text = `📊 *Análisis de Pricing ZG Manager*
🛒 *Producto:* ${extractedData?.productName || 'N/A'}

💰 *Costo Base:* ${formatCurrency(financials?.baseCost)}
⚖️ *Punto Equilibrio:* ${formatCurrency(financials?.breakevenAmount)} (+${financials?.totalCostPercentage}%)
🎯 *Precio Sugerido:* ${formatCurrency(financials?.suggestedCashPrice)}
💵 *Margen Proyectado:* ${formatCurrency(financials?.projectedMarginAmount)}

⚖️ *Dictamen:* ${verdict?.status}
📝 ${verdict?.reasoning}

🏢 *Competencia Nacional:*
${nationalBenchmark.map((b: any) => `- ${b.store}: ${formatCurrency(b.price)}`).join('\n') || 'Sin datos'}

📍 *Competencia Regional:*
${regionalBenchmark.map((b: any) => `- ${b.store}: ${formatCurrency(b.price)}`).join('\n') || 'Sin datos'}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6 print:space-y-4 print:w-[190mm]" id="ai-report-container">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4; margin: 10mm; }
          body { background: white !important; }
          /* Esconder elementos de NextJS de layout general (Sidebar, Header, etc) */
          nav, aside, header, [data-sidebar="sidebar"] { display: none !important; }
        }
      `}} />

      <div className="hidden print:flex items-center gap-4 mb-4 border-b pb-2">
        <div className="w-10 h-10 bg-slate-900 text-white font-bold rounded-lg flex items-center justify-center text-lg">
          ZG
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Analista de Pricing y Mercado (IA)</h1>
          <p className="text-xs text-slate-500">ZAWADZKI GROUP - Confidencial</p>
        </div>
      </div>

      <div className="flex justify-end gap-2 print:hidden mb-[-1rem] z-10 relative">
        <Button variant="outline" size="sm" onClick={() => window.print()} className="h-8 text-xs bg-white">
          <Printer className="w-3 h-3 mr-2" /> PDF / Imprimir
        </Button>
        <Button variant="default" size="sm" onClick={handleWhatsAppShare} className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white">
          <Share2 className="w-3 h-3 mr-2" /> Enviar por WhatsApp
        </Button>
      </div>
      
      {/* 1. Header y Dictamen */}
      <Card className={`border-2 ${vConfig.border} shadow-sm overflow-hidden print:border-none print:shadow-none print:break-inside-avoid`}>
        <div className={`px-6 py-4 flex items-center gap-4 ${vConfig.bg} bg-opacity-50 print:px-0 print:py-2 print:bg-transparent`}>
          <div className={`p-3 bg-white rounded-full shadow-sm ${vConfig.color}`}>
            <VIcon className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-500">Dictamen de IA</h2>
            <div className={`text-2xl font-black ${vConfig.color}`}>
              COMPRA {verdict?.status}
            </div>
          </div>
        </div>
        <CardContent className="pt-4">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800 text-lg">{extractedData?.productName || 'Producto no identificado'}</h3>
            <p className="text-sm text-slate-500 mt-1">{extractedData?.specs}</p>
          </div>
          <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-100 italic">
            "{verdict?.reasoning}"
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
             {verdict?.strengths?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-green-700 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Fortalezas</h4>
                  <ul className="text-xs space-y-1 text-slate-600 list-disc pl-4">
                    {verdict.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
             )}
             {verdict?.risks?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-red-700 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Riesgos</h4>
                  <ul className="text-xs space-y-1 text-slate-600 list-disc pl-4">
                    {verdict.risks.map((s: string, i: number) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
             )}
          </div>
        </CardContent>
      </Card>

      {/* 2. Análisis Financiero */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2 print:break-inside-avoid">
        <Card className="shadow-sm border-slate-200 print:shadow-none print:border-b">
          <CardContent className="p-4 print:p-2 flex flex-col justify-center">
            <span className="text-[10px] uppercase font-semibold text-slate-400">Costo Base (c/ IVA)</span>
            <span className="text-xl font-bold text-slate-800 print:text-lg">{formatCurrency(financials?.baseCost)}</span>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200 bg-slate-50 print:bg-white print:shadow-none print:border-b">
          <CardContent className="p-4 print:p-2 flex flex-col justify-center">
            <span className="text-[10px] uppercase font-semibold text-slate-500">Punto de Equilibrio</span>
            <div className="flex items-end gap-2">
                <span className="text-xl font-bold text-slate-700 print:text-lg">{formatCurrency(financials?.breakevenAmount)}</span>
                <span className="text-[10px] text-slate-400 pb-1">(+{financials?.totalCostPercentage}%)</span>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-blue-200 bg-blue-50/30 print:bg-white print:shadow-none print:border-b">
          <CardContent className="p-4 print:p-2 flex flex-col justify-center">
            <span className="text-[10px] uppercase font-semibold text-blue-600">Precio Sugerido (Contado)</span>
            <span className="text-2xl font-black text-blue-700 print:text-xl">{formatCurrency(financials?.suggestedCashPrice)}</span>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-emerald-200 bg-emerald-50/30 print:bg-white print:shadow-none print:border-b">
          <CardContent className="p-4 print:p-2 flex flex-col justify-center">
            <span className="text-[10px] uppercase font-semibold text-emerald-600">Margen Proyectado</span>
            <span className="text-2xl font-black text-emerald-700 print:text-xl">{formatCurrency(financials?.projectedMarginAmount)}</span>
          </CardContent>
        </Card>
      </div>

      {/* 3. Benchmark */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 print:grid-cols-2 print:gap-4 print:break-inside-avoid">
        
        <Card className="shadow-sm print:shadow-none print:border">
          <CardHeader className="pb-3 border-b bg-slate-50/50 print:bg-white print:pb-2 print:pt-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700">
              <ShoppingBag className="w-4 h-4 text-blue-500" />
              Benchmark Nacional (Retail)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 p-0">
             {nationalBenchmark.length === 0 ? (
               <div className="p-4 text-xs text-slate-400 text-center">No se encontraron referencias exactas.</div>
             ) : (
                <div className="divide-y">
                  {nationalBenchmark.map((b: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-4 print:p-2 hover:bg-slate-50 transition-colors">
                      <div>
                        <div className="font-semibold text-sm text-slate-800">{b.store}</div>
                        {b.notes && <div className="text-[10px] text-slate-500 mt-0.5">{b.notes}</div>}
                        {b.url && (
                          <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 mt-1 print:hidden">
                            <ExternalLink className="w-3 h-3" /> Ver fuente
                          </a>
                        )}
                      </div>
                      <div className="font-bold text-slate-800 bg-white border px-2 py-1 print:border-none print:px-0 rounded-md shadow-sm print:shadow-none">
                        {formatCurrency(b.price)}
                      </div>
                    </div>
                  ))}
                </div>
             )}
          </CardContent>
        </Card>

        <Card className="shadow-sm print:shadow-none print:border">
          <CardHeader className="pb-3 border-b bg-amber-50/50 print:bg-white print:pb-2 print:pt-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-800">
              <MapPin className="w-4 h-4 text-amber-500" />
              Benchmark Regional (Mutuales/Locales)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 p-0">
             {regionalBenchmark.length === 0 ? (
               <div className="p-4 text-xs text-slate-400 text-center">No se encontraron referencias exactas en la zona.</div>
             ) : (
                <div className="divide-y">
                  {regionalBenchmark.map((b: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-4 print:p-2 hover:bg-amber-50/30 transition-colors">
                      <div>
                        <div className="font-semibold text-sm text-slate-800 flex items-center gap-1">
                          <Store className="w-3 h-3 text-slate-400"/> {b.store}
                        </div>
                        {b.notes && <div className="text-[10px] text-slate-500 mt-0.5">{b.notes}</div>}
                        {b.url && (
                          <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 mt-1 print:hidden">
                            <ExternalLink className="w-3 h-3" /> Ver fuente
                          </a>
                        )}
                      </div>
                      <div className="font-bold text-slate-800 bg-white border px-2 py-1 print:border-none print:px-0 rounded-md shadow-sm print:shadow-none">
                        {formatCurrency(b.price)}
                      </div>
                    </div>
                  ))}
                </div>
             )}
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
