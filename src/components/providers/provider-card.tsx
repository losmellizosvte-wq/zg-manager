'use client';
import * as React from 'react';
import type { Provider } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Building, Edit, ExternalLink, FileText, MoreVertical, Trash2, Mail, MessageSquare, BookText } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

// This function now checks for the new `priceLists` array first.
// If it's not found, it falls back to checking for the old `priceListUrl` field.
// This ensures that providers saved before the multi-list update are still displayed correctly.
const getDisplayablePriceLists = (provider: any): any[] => {
    // 1. Check for the new format (an array of lists)
    if (Array.isArray(provider.priceLists) && provider.priceLists.length > 0) {
        return provider.priceLists;
    }
    // 2. Fallback for LEGACY format (a single file)
    if (provider.priceListUrl) {
        return [{
            name: provider.priceListName || 'Lista de Precios',
            url: provider.priceListUrl,
            // Use URL as a fallback key if storagePath is missing, for rendering only
            storagePath: provider.priceListStoragePath || provider.priceListUrl,
        }];
    }
    // 3. If neither is found, return an empty array
    return [];
};


export function ProviderCard({ provider, onEdit }: { provider: any; onEdit: (provider: any) => void }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const handleDelete = async () => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo conectar a la base de datos.' });
      return;
    }
    const docRef = doc(firestore, 'providers', provider.id);
    try {
      await deleteDoc(docRef);
      toast({ title: 'Éxito', description: 'Proveedor eliminado.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el proveedor.' });
      console.error("Error deleting provider:", error);
    }
  };

  const handleWhatsApp = () => {
    if (provider.salespersonPhone) {
      const phone = provider.salespersonPhone.replace(/\D/g, '');
      window.open(`https://wa.me/${phone}`, '_blank');
    }
  }

  const handleEmail = () => {
    if (provider.salespersonEmail) {
      window.location.href = `mailto:${provider.salespersonEmail}`;
    }
  }

  const priceLists = getDisplayablePriceLists(provider);


  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <div className="flex-shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Building className="h-6 w-6 text-primary" />
          </div>
        </div>
        <div className="flex-1">
          <CardTitle>{provider.name}</CardTitle>
          <CardDescription>Contacto: {provider.salespersonName || 'No especificado'}</CardDescription>
        </div>
        <div className="-mt-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onEdit(provider)}>
                        <Edit className="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                                <AlertDialogDescription>Esta acción es permanente y eliminará al proveedor y sus reglas asociadas.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {provider.observation && (
            <div className="flex items-start gap-3 text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg border border-dashed">
                <BookText className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                <p>{provider.observation}</p>
            </div>
        )}
        <div className="space-y-2">
            <h4 className="text-sm font-medium">Acciones de Contacto</h4>
            <div className="flex gap-2">
                 {provider.salespersonPhone && (
                    <Button variant="outline" size="sm" onClick={handleWhatsApp}>
                        <MessageSquare className="mr-2 h-4 w-4"/> WhatsApp
                    </Button>
                 )}
                 {provider.salespersonEmail && (
                    <Button variant="outline" size="sm" onClick={handleEmail}>
                        <Mail className="mr-2 h-4 w-4"/> Email
                    </Button>
                 )}
                 {!provider.salespersonPhone && !provider.salespersonEmail && (
                    <p className='text-xs text-muted-foreground'>Sin datos de contacto rápido.</p>
                 )}
            </div>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Lista de Precios</h4>
            <div className="flex flex-wrap gap-2">
                {priceLists.length > 0 ? (
                  priceLists.map((list: any) => (
                    <Button key={list.storagePath} variant="outline" size="sm" onClick={() => window.open(list.url, '_blank')}>
                      <FileText className="mr-2 h-4 w-4" /> Ver "{list.name}"
                    </Button>
                  ))
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    <FileText className="mr-2 h-4 w-4" /> Sin PDFs
                  </Button>
                )}
                 <Button variant="outline" size="sm" disabled={!provider.priceListLink} onClick={() => window.open(provider.priceListLink, '_blank')}>
                    <ExternalLink className="mr-2 h-4 w-4"/> Abrir Link
                </Button>
            </div>
        </div>
      </CardContent>
       <CardFooter>
            <Button className="w-full" onClick={() => onEdit(provider)}>
                <Edit className="mr-2 h-4 w-4" /> Ver/Editar Reglas
            </Button>
       </CardFooter>
    </Card>
  );
}
