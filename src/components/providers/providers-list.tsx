'use client';

import * as React from 'react';
import type { Provider } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ProviderForm } from './provider-form';
import { ProviderCard } from './provider-card';

export function ProvidersList({ providers }: { providers: any[] }) {
  const [isFormOpen, setFormOpen] = React.useState(false);
  const [selectedProvider, setSelectedProvider] = React.useState<any | null>(null);

  const handleEdit = (provider: any) => {
    setSelectedProvider(provider);
    setFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedProvider(null);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2" />
              Nuevo Proveedor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl w-[90vw] max-h-[90svh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{selectedProvider ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
              <DialogDescription>
                {selectedProvider
                  ? 'Modifique los datos del proveedor y sus reglas de cálculo.'
                  : 'Añada un nuevo proveedor y configure sus reglas de cálculo y listas de precios.'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto -mr-6 pr-6">
              <ProviderForm setOpen={setFormOpen} existingProvider={selectedProvider} />
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {providers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} onEdit={handleEdit} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center border-2 border-dashed rounded-lg p-12 min-h-[400px]">
          <h3 className="text-xl font-semibold">No hay proveedores</h3>
          <p className="text-muted-foreground mt-2">
            Añada su primer proveedor para empezar a gestionar sus precios y condiciones.
          </p>
        </div>
      )}
    </div>
  );
}
