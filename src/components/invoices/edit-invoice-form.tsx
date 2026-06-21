'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Invoice } from '@/lib/types';

const FormSchema = z.object({
  provider: z.string().min(1, 'El proveedor es requerido.'),
  date: z.string().min(1, 'La fecha es requerida.'),
  documentNumber: z.string().min(1, 'El número de documento es requerido.'),
  totalAmount: z.string().min(1, 'El monto total es requerido.'),
  description: z.string().min(1, 'La descripción es requerida.'),
});

type EditInvoiceFormValues = z.infer<typeof FormSchema>;

// Helper para convertir Timestamps de Firebase a formato YYYY-MM-DD
const formatDateForInput = (dateValue: any) => {
    if (!dateValue) return '';
    try {
        const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
        // Asegurarse de que la fecha es un objeto Date válido
        if (isNaN(date.getTime())) {
            // Si no es válido, intenta parsear el string original
             const parsedDate = new Date(dateValue.split('-').join('/'));
             if (isNaN(parsedDate.getTime())) return ''; // Si sigue sin ser válido, retorna vacío
             return parsedDate.toISOString().split('T')[0];
        }
        return date.toISOString().split('T')[0];
    } catch {
        return '';
    }
}

export function EditInvoiceForm({ setOpen, invoice }: { setOpen: (open: boolean) => void, invoice: Invoice }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<EditInvoiceFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      provider: invoice.provider || '',
      date: formatDateForInput(invoice.date),
      documentNumber: invoice.documentNumber || '',
      totalAmount: invoice.totalAmount.toString() || '',
      description: invoice.description || '',
    },
  });


  async function onSubmit(data: EditInvoiceFormValues) {
    setIsSubmitting(true);
    if (!firestore) {
      toast({ 
        variant: 'destructive', 
        title: 'Error de Conexión', 
        description: 'No se pudo conectar a la base de datos. Intente de nuevo.' 
      });
      setIsSubmitting(false);
      return;
    }
    
    try {
      toast({ title: 'Actualizando...', description: 'Guardando los cambios en la factura.' });
      const invoiceRef = doc(firestore, 'invoices', invoice.id);
      
      await updateDoc(invoiceRef, {
        ...data,
        totalAmount: data.totalAmount // Firestore espera un número, pero nuestro estado es string.
      });

      toast({ title: 'Éxito', description: 'Factura actualizada exitosamente.' });
      setOpen(false);

    } catch (error: any) {
      console.error("Firestore Update Error:", error);
      toast({ 
          variant: 'destructive', 
          title: 'Error al actualizar', 
          description: `No se pudo guardar la factura. Código: ${error.code}. Mensaje: ${error.message}`,
          duration: 9000,
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const canSubmit = !isSubmitting;

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proveedor</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del proveedor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="documentNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nro. Documento</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: 0001-00012345" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha</FormLabel>
                  <FormControl>
                    <Input type="date" placeholder="YYYY-MM-DD" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="totalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto Total</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea placeholder="Descripción de la factura" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Form>
  );
}
