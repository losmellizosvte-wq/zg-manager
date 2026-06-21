'use client';
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateExecutiveSummary } from '@/ai/flows/generate-executive-summary';
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

        const result = await generateExecutiveSummary({
            invoices: simplifiedInvoices,
            cheques: simplifiedCheques,
            tasks: simplifiedTasks,
        });
        
        if (result.summary) {
            setSummary(result.summary);
        } else {
            throw new Error('La IA no devolvió un resumen.');
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
          <div className="p-4 bg-muted/50 rounded-lg border">
            <div className="whitespace-pre-wrap font-sans text-sm"
              dangerouslySetInnerHTML={{
                  // NOTE: Genkit output is trusted for this prototype
                  __html: summary
                      .replace(/### (.*)/g, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
                      .replace(/-\s(?!-)/g, '• ')
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
