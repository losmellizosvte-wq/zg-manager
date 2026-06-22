'use client';

import * as React from 'react';
import { PaymentCalendar } from "@/components/calendar/payment-calendar";
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Cheque } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function CalendarSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-4 w-3/4 mt-2" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="flex flex-col gap-8">
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 h-fit'>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>
        <div className="lg:col-span-2 flex flex-col gap-8">
          <Skeleton className="h-96" />
          <Skeleton className="h-64" />
        </div>
      </div>
      <Skeleton className="h-64" />
    </div>
  )
}

export default function CalendarioPage() {
  const firestore = useFirestore();

  const chequesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'cheques'));
  }, [firestore]);

  const { data: cheques, isLoading } = useCollection<Cheque>(chequesQuery, { listen: true });

  if (isLoading) {
    return <CalendarSkeleton />;
  }

  const pendingCheques = (cheques || []).filter(c => c.status !== 'Debitado');
  const emitidos = pendingCheques.filter(c => !c.type || c.type === 'emitido');
  const recibidos = pendingCheques.filter(c => c.type === 'tercero');

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendario de Pagos</h1>
          <p className="text-muted-foreground">
            Visualice los vencimientos de cheques emitidos y recibidos.
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="emitidos" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="emitidos">Emitidos (Propios)</TabsTrigger>
          <TabsTrigger value="recibidos">Recibidos (Terceros)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="emitidos">
          <div className="border rounded-xl bg-white shadow-sm overflow-hidden p-2">
            <PaymentCalendar cheques={emitidos} />
          </div>
        </TabsContent>
        
        <TabsContent value="recibidos">
          <div className="border rounded-xl bg-white shadow-sm overflow-hidden p-2">
            <PaymentCalendar cheques={recibidos} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
