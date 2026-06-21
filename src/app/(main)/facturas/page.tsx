'use client';

import * as React from 'react';
import InvoicesTable from "@/components/invoices/invoices-table";
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Invoice, Cheque } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

function InvoicesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 justify-between">
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="flex gap-2">
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

export default function FacturasPage() {
  const firestore = useFirestore();

  const invoicesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'invoices'));
  }, [firestore]);

  const chequesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'cheques'));
  }, [firestore]);

  const { data: invoices, isLoading: areInvoicesLoading } = useCollection<Invoice>(invoicesQuery, {
    listen: true,
  });

  const { data: allCheques, isLoading: areChequesLoading } = useCollection<Cheque>(chequesQuery, {
    listen: true,
  });

  if (areInvoicesLoading || areChequesLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Facturas</h1>
          <p className="text-muted-foreground">
            Cargue, visualice y administre las facturas de proveedores.
          </p>
        </div>
        <InvoicesSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Facturas</h1>
        <p className="text-muted-foreground">
          Cargue, visualice y administre las facturas de proveedores.
        </p>
      </div>
      <InvoicesTable invoices={invoices || []} allCheques={allCheques || []} />
    </div>
  );
}
