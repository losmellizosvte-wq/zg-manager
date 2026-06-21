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
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Cheque, Invoice } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, getInvoicePaymentDetails } from '@/lib/utils';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const FormSchema = z.object({
  invoiceIds: z.array(z.string()),
});

type FormValues = z.infer<typeof FormSchema>;

export function AssociateInvoicesForm({ cheque, allInvoices, allCheques, setOpen }: { cheque: Cheque, allInvoices: Invoice[], allCheques: Cheque[], setOpen: (open: boolean) => void }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      invoiceIds: cheque.invoiceIds || [],
    },
  });

  const pendingInvoicesForBeneficiary = React.useMemo(() => {
    return allInvoices.filter(invoice => invoice.provider.toLowerCase() === cheque.beneficiary.toLowerCase());
  }, [allInvoices, cheque.beneficiary]);

  async function onSubmit(data: FormValues) {
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'La base de datos no está disponible.' });
        return;
    }
    setIsSubmitting(true);
    
    try {
        const chequeRef = doc(firestore, 'cheques', cheque.id);
        await updateDoc(chequeRef, { invoiceIds: data.invoiceIds });

        toast({ title: 'Éxito', description: "Asociación actualizada" });
        setOpen(false);

    } catch(error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Error', description: "No se pudo actualizar el cheque" });
    } finally {
        setIsSubmitting(false);
    }
  }

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(amount));
  };
  
  const getInvoiceDate = (invoice: Invoice) => {
    if (invoice.date?.toDate) {
      return invoice.date.toDate();
    }
    return new Date(String(invoice.date).split('-').join('/'));
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="invoiceIds"
          render={() => (
            <FormItem>
              <ScrollArea className="h-64">
                <div className="space-y-3 pr-4">
                  {pendingInvoicesForBeneficiary.length > 0 ? (
                    pendingInvoicesForBeneficiary.map((invoice) => {
                      const { isPaid } = getInvoicePaymentDetails(invoice, allCheques.filter(c => c.id !== cheque.id));
                      const currentlySelected = form.watch('invoiceIds').includes(invoice.id);
                      const disabled = isPaid && !currentlySelected;

                      return (
                        <FormField
                          key={invoice.id}
                          control={form.control}
                          name="invoiceIds"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={invoice.id}
                                className={cn(
                                  "flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 transition-colors",
                                  field.value?.includes(invoice.id) && "bg-accent/50 border-accent",
                                  disabled && "bg-muted/50 text-muted-foreground cursor-not-allowed"
                                )}
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(invoice.id)}
                                    disabled={disabled}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), invoice.id])
                                        : field.onChange(
                                            (field.value || [])?.filter(
                                              (value) => value !== invoice.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className={cn("font-normal w-full", !disabled && "cursor-pointer")}>
                                  <div className='flex justify-between items-center'>
                                      <span className='font-medium'>{invoice.documentNumber}</span>
                                      <span className='font-bold'>{formatCurrency(invoice.totalAmount)}</span>
                                  </div>
                                  <p className='text-xs text-muted-foreground'>{getInvoiceDate(invoice).toLocaleDateString('es-AR')}</p>
                                   {isPaid && <p className='text-xs font-semibold text-green-600'>Ya pagada</p>}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      )
                    })
                  ) : (
                    <div className="flex h-40 items-center justify-center text-center text-sm text-muted-foreground">
                        No hay facturas para este proveedor.
                    </div>
                  )}
                </div>
              </ScrollArea>
              <FormMessage className="pt-2" />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Asociación
          </Button>
        </div>
      </form>
    </Form>
  );
}
