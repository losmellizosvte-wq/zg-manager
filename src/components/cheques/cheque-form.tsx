'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { extractChequeData } from '@/ai/flows/extract-cheque-data';
import { Loader2, Upload } from 'lucide-react';
import type { Cheque, Invoice } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { cn, getInvoicePaymentDetails, isSemanticallySimilar } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFirestore, useUser } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';


const FormSchema = z.object({
  beneficiary: z.string().min(1, 'El beneficiario es requerido.'),
  amount: z.string().min(1, 'El monto es requerido.'),
  dueDate: z.string().min(1, 'La fecha de vencimiento es requerida.'),
  chequeNumber: z.string().min(1, 'El número de cheque es requerido.'),
  observation: z.string().optional(),
  invoiceIds: z.array(z.string()).optional(),
  file: z.instanceof(File).optional(),
  type: z.enum(['emitido', 'tercero']).default('emitido'),
});

type ChequeFormValues = z.infer<typeof FormSchema>;

export function ChequeForm({ setOpen, pendingInvoices, allCheques }: { setOpen: (open: boolean) => void, pendingInvoices: Invoice[], allCheques: Cheque[] }) {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isExtracting, setIsExtracting] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [availableInvoices, setAvailableInvoices] = React.useState<Invoice[]>([]);

  const form = useForm<ChequeFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      beneficiary: '',
      amount: '',
      dueDate: '',
      chequeNumber: '',
      observation: '',
      invoiceIds: [],
      type: 'emitido',
    },
  });
  
  const beneficiary = form.watch('beneficiary');

  React.useEffect(() => {
    if (beneficiary) {
      setAvailableInvoices(pendingInvoices.filter(inv => isSemanticallySimilar(inv.provider, beneficiary)));
    } else {
      setAvailableInvoices([]);
    }
    form.setValue('invoiceIds', []);
  }, [beneficiary, pendingInvoices, form]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    form.setValue('file', file, { shouldValidate: true });
    setIsExtracting(true);
    toast({ title: 'Procesando...', description: 'Extrayendo datos del cheque con IA.' });
    
    try {
      const dataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      const extractedData = await extractChequeData({ photoDataUri: dataUri });
      
      if (extractedData) {
        form.setValue('beneficiary', extractedData.beneficiary, { shouldValidate: true });
        form.setValue('amount', extractedData.amount, { shouldValidate: true });
        form.setValue('dueDate', extractedData.dueDate, { shouldValidate: true });
        form.setValue('chequeNumber', extractedData.chequeNumber, { shouldValidate: true });
        toast({ title: 'Éxito', description: 'Datos extraídos. Por favor, verifique y guarde.' });
      } else {
        throw new Error('La IA no pudo extraer datos.');
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error de Extracción',
        description: 'No se pudieron extraer los datos. Ingréselos manualmente.',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  async function onSubmit(data: ChequeFormValues) {
    setIsSubmitting(true);
    if (!user || !user.uid || !firestore) {
      toast({ 
        variant: 'destructive', 
        title: 'Error de Autenticación', 
        description: 'Su sesión no está activa. Por favor, recargue la página e intente de nuevo.' 
      });
      setIsSubmitting(false);
      return;
    }
    
    let fileUrl = '';
    if (data.file) {
        try {
            const storage = getStorage();
            const fileExtension = data.file.name.split('.').pop();
            const fileName = `cheques/${uuidv4()}.${fileExtension}`;
            const storageRef = ref(storage, fileName);

            toast({ title: 'Subiendo archivo...', description: 'Por favor espere.' });
            await uploadBytes(storageRef, data.file);
            fileUrl = await getDownloadURL(storageRef);

        } catch (error: any) {
            console.error("File Upload Error:", error);
            toast({
                variant: "destructive",
                title: "Error al subir el archivo",
                description: `Hubo un problema al subir el archivo. Código: ${error.code}. Mensaje: ${error.message}`,
                duration: 9000,
            });
            setIsSubmitting(false);
            return;
        }
    }


    try {
        toast({ title: 'Guardando datos...', description: 'Registrando el cheque en la base de datos.' });
        const chequesCollection = collection(firestore, 'cheques');
        const { file, ...chequeData } = data;

        await addDoc(chequesCollection, {
            ...chequeData,
            fileUrl: fileUrl,
            observation: data.observation || '',
            invoiceIds: data.invoiceIds || [],
            status: 'Pendiente' as const,
        });

        toast({ title: 'Éxito', description: "Cheque agregado exitosamente" });
        setOpen(false);

    } catch (error: any) {
      console.error("Firestore Write Error:", error);
      toast({ 
          variant: 'destructive', 
          title: 'Error al guardar el cheque', 
          description: `No se pudo registrar el cheque. Código: ${error.code}. Mensaje: ${error.message}`,
          duration: 9000,
      });
    } finally {
        setIsSubmitting(false);
    }
  }
  
  const canSubmit = !isSubmitting && !isExtracting && !isUserLoading;

  return (
    <>
      <Input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,application/pdf"
      />
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={isExtracting}
        className='w-full'
      >
        {isExtracting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
        Subir E-Cheq (imagen o PDF)
      </Button>
      <div className='text-center text-xs text-muted-foreground pt-1'>
          {form.watch('file')?.name}
      </div>


      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="beneficiary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beneficiario</FormLabel>
                  <FormControl><Input placeholder="Nombre del beneficiario" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="chequeNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nro. Cheque</FormLabel>
                  <FormControl><Input placeholder="Ej: 0001001" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vencimiento</FormLabel>
                  <FormControl><Input type="date" placeholder="YYYY-MM-DD" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto</FormLabel>
                  <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Cheque</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione el tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="emitido">Emitido (Salida)</SelectItem>
                      <SelectItem value="tercero">Tercero (Ingreso)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

           <FormField
            control={form.control}
            name="invoiceIds"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>Asociar Facturas (opcional)</FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button
                        variant="outline"
                        role="combobox"
                        disabled={!beneficiary || availableInvoices.length === 0}
                        className={cn(
                            "w-full justify-between",
                            !field.value?.length && "text-muted-foreground"
                        )}
                        >
                        {field.value?.length ? `${field.value.length} seleccionada(s)` : "Seleccionar facturas"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandInput placeholder="Buscar factura..." />
                        <CommandEmpty>No hay facturas pendientes para este proveedor.</CommandEmpty>
                        <CommandGroup>
                        <ScrollArea className="h-48">
                        {availableInvoices.map((invoice) => {
                            const { isPaid } = getInvoicePaymentDetails(invoice, allCheques)
                            return (
                            <CommandItem
                                value={invoice.id}
                                key={invoice.id}
                                disabled={isPaid}
                                onSelect={() => {
                                    if(isPaid) return;
                                    const selected = field.value || [];
                                    const newSelection = selected.includes(invoice.id)
                                    ? selected.filter(id => id !== invoice.id)
                                    : [...selected, invoice.id];
                                    form.setValue("invoiceIds", newSelection);
                                }}
                                className={cn(isPaid && 'text-muted-foreground opacity-50 cursor-not-allowed')}
                            >
                            <Check
                                className={cn(
                                "mr-2 h-4 w-4",
                                (field.value || []).includes(invoice.id)
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                            />
                            {invoice.documentNumber} - ${invoice.totalAmount}
                            </CommandItem>
                        )})}
                        </ScrollArea>
                        </CommandGroup>
                    </Command>
                    </PopoverContent>
                </Popover>
                <FormDescription>
                    Seleccione un beneficiario para ver sus facturas pendientes.
                </FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />

          <FormField
            control={form.control}
            name="observation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observación (opcional)</FormLabel>
                <FormControl><Textarea placeholder="Observaciones adicionales" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cheque
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
