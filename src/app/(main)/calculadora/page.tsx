'use client';

import * as React from 'react';
import PriceCalculator from '@/components/calculator/price-calculator';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Provider } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

function CalculatorSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-4 w-3/4 mt-2" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <Skeleton className="h-[700px]" />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-[250px]" />
          <Skeleton className="h-[200px]" />
        </div>
      </div>
    </div>
  )
}

export default function CalculadoraPage() {
  const firestore = useFirestore();

  const providersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'providers'));
  }, [firestore]);

  const { data: providers, isLoading } = useCollection<Provider>(providersQuery, { listen: true });

  if (isLoading) {
    return <CalculatorSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calculadora de Precios</h1>
        <Alert className="mt-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Flujo de Trabajo Recomendado</AlertTitle>
          <AlertDescription>
            Para un cálculo preciso, consulte primero la lista de precios del proveedor en su sección. Luego, ingrese el costo y seleccione el proveedor para cargar sus reglas, o realice un cálculo manual.
          </AlertDescription>
        </Alert>
      </div>
      <PriceCalculator providers={providers || []} />
    </div>
  );
}
