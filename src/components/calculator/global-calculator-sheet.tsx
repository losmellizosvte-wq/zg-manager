'use client';

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Calculator } from "lucide-react";
import PriceCalculator from "./price-calculator";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query } from "firebase/firestore";
import type { Provider } from "@/lib/types";

export function GlobalCalculatorSheet() {
  const firestore = useFirestore();

  const providersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'providers'));
  }, [firestore]);

  const { data: providers, isLoading } = useCollection<Provider>(providersQuery, { listen: true });

  return (
    <Sheet>
      <SheetTrigger className="relative p-2 rounded-full hover:bg-slate-100 transition-colors">
        <Calculator className="h-5 w-5 text-slate-700" />
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto backdrop-blur-xl bg-background/95 border-l-slate-200/60 shadow-2xl">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl font-bold">Calculadora Rápida</SheetTitle>
          <SheetDescription>
            Calcule precios de venta en tiempo real sin perder de vista su trabajo actual.
          </SheetDescription>
        </SheetHeader>
        
        {isLoading ? (
          <div className="flex justify-center p-8 text-muted-foreground">Cargando calculadora...</div>
        ) : (
          <PriceCalculator providers={providers || []} />
        )}
      </SheetContent>
    </Sheet>
  );
}
