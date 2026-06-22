'use client';
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Loader2, Share2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Cheque, Invoice, Task } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

type ExecutiveSummaryProps = {
  tasks: Task[];
  cheques: Cheque[];
  invoices: Invoice[];
};

const formatDateForAI = (date: any) => {
    if (!date) return 'N/A';
    try {
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toISOString().split('T')[0];
    } catch {
        return String(date);
    }
}

export function ExecutiveSummary({ tasks, cheques, invoices }: ExecutiveSummaryProps) {
  const [summary, setSummary] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setSummary('');

    try {
        const simplifiedInvoices = invoices.map(i => ({
            provider: i.provider,
            totalAmount: i.totalAmount,
            date: formatDateForAI(i.date),
            internalStatus: i.internalStatus,
            category: i.category,
        }));
        const simplifiedCheques = cheques.map(c => ({
            beneficiary: c.beneficiary,
            amount: c.amount,
            dueDate: c.dueDate,
            status: c.status,
        }));
        const simplifiedTasks = tasks.map(t => ({
            title: t.title,
            assignee: t.assignee,
            dueDate: formatDateForAI(t.dueDate),
            isCompleted: t.isCompleted,
        }));

        const response = await fetch('/api/summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                invoices: simplifiedInvoices,
                cheques: simplifiedCheques,
                tasks: simplifiedTasks,
            })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader available');
        
        const decoder = new TextDecoder();
        let done = false;

        while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) {
                const chunkText = decoder.decode(value, { stream: true });
                setSummary(prev => prev + chunkText);
            }
        }

    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error al generar el resumen',
        description: 'Hubo un problema al contactar al asistente de IA.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-primary" />
          <span>Asistente Gerencial IA</span>
        </CardTitle>
        <CardDescription>
          Obtenga un resumen ejecutivo de la situación actual, alertas, análisis de costos y oportunidades.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleGenerateSummary} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <BrainCircuit className="mr-2 h-4 w-4" />
          )}
          Generar Resumen Ejecutivo
        </Button>
        {isLoading && (
            <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                 <Skeleton className="h-4 w-1/4 mt-4" />
                <Skeleton className="h-4 w-3/4" />
            </div>
        )}
        {summary && (
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg border">
              <div className="whitespace-pre-wrap font-sans text-sm printable-summary"
                dangerouslySetInnerHTML={{
                    __html: summary
                        .replace(/### (.*)/g, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
                        .replace(/-\s(?!-)/g, '• ')
                }}
              />
            </div>
            <div className="flex gap-2 justify-end">
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                    onClick={() => {
                        const text = `*Resumen Ejecutivo ZG MANAGER*\n\n${summary.replace(/### /g, '').replace(/\*\*/g, '*')}`;
                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                >
                    <Share2 className="w-4 h-4 mr-2" /> WhatsApp
                </Button>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                        // Print the summary
                        const printWindow = window.open('', '_blank');
                        if (printWindow) {
                            printWindow.document.write(`
                                <html>
                                <head>
                                    <title>Resumen Ejecutivo - ZG MANAGER</title>
                                    <style>
                                        body { font-family: system-ui, sans-serif; padding: 40px; color: #1e293b; }
                                        h3 { color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
                                        strong { color: #334155; }
                                    </style>
                                </head>
                                <body>
                                    ${summary
                                        .replace(/### (.*)/g, '<h3>$1</h3>')
                                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                        .replace(/\n/g, '<br>')}
                                </body>
                                </html>
                            `);
                            printWindow.document.close();
                            printWindow.print();
                        }
                    }}
                >
                    <FileText className="w-4 h-4 mr-2" /> PDF / Imprimir
                </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
