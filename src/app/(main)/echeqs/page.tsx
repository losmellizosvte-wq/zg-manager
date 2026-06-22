'use client';

import * as React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Cheque, Invoice } from '@/lib/types';
import ChequesTable from "@/components/cheques/cheques-table";
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function ChequesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <div className="flex-1 flex flex-col sm:flex-row gap-2">
          <Skeleton className="h-10 w-full max-w-xs" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-[260px]" />
        </div>
        <div className='flex gap-2 self-end sm:self-auto'>
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>
      <div className="border rounded-lg">
        <TableSkeleton />
      </div>
    </div>
  );
}

function TableSkeleton() {
    return (
        <div className="p-4">
            <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        </div>
    )
}


export default function EcheqsPage() {
  const firestore = useFirestore();

  const chequesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'cheques'));
  }, [firestore]);

  const invoicesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'invoices'));
  }, [firestore]);

  const { data: cheques, isLoading: areChequesLoading } = useCollection<Cheque>(chequesQuery, { listen: true });
  const { data: allInvoices, isLoading: areInvoicesLoading } = useCollection<Invoice>(invoicesQuery, { listen: true });
  

  const isLoading = areChequesLoading || areInvoicesLoading;

  if (isLoading) {
    return (
       <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Libro de E-Cheqs</h1>
          <p className="text-muted-foreground">
            Gestione los cheques emitidos, pendientes y debitados.
          </p>
        </div>
        <ChequesSkeleton />
      </div>
    );
  }


  const emitidos = (cheques || []).filter(c => !c.type || c.type === 'emitido');
  const recibidos = (cheques || []).filter(c => c.type === 'tercero');

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Libro de E-Cheqs</h1>
          <p className="text-muted-foreground">
            Gestione los cheques emitidos, pendientes y de terceros.
          </p>
        </div>
      </div>
      <Tabs defaultValue="emitidos" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="emitidos">Emitidos (Propios)</TabsTrigger>
          <TabsTrigger value="recibidos">Recibidos (Terceros)</TabsTrigger>
        </TabsList>
        <TabsContent value="emitidos">
          <ChequesTable cheques={emitidos} allInvoices={allInvoices || []} />
        </TabsContent>
        <TabsContent value="recibidos">
          <ChequesTable cheques={recibidos} allInvoices={allInvoices || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
