'use client';

import * as React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Provider } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ProvidersList } from '@/components/providers/providers-list';

function ProvidersSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

export default function ProveedoresPage() {
  const firestore = useFirestore();

  const providersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'providers'));
  }, [firestore]);

  const { data: providers, isLoading } = useCollection(providersQuery, { listen: true });

  if (isLoading) {
    return <ProvidersSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Proveedores</h1>
        <p className="text-muted-foreground">
          Centralice la información de sus proveedores, listas de precios y reglas de negocio.
        </p>
      </div>
      <ProvidersList providers={providers || []} />
    </div>
  );
}
