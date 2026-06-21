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
import { extractInvoiceData } from '@/ai/flows/extract-invoice-data';
import { Loader2, Upload } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { expenseCategories, type ExpenseCategory } from '@/lib/types';

const FormSchema = z.object({
  provider: z.string().min(1, 'El proveedor es requerido.'),
  date: z.string().min(1, 'La fecha es requerida.'),
  documentNumber: z.string().min(1, 'El número de documento es requerido.'),
  totalAmount: z.string().min(1, 'El monto total es requerido.'),
  description: z.string().min(1, 'La descripción es requerida.'),
  file: z.instanceof(File, { message: 'El archivo es requerido.' }),
  category: z.string({ required_error: 'La categoría es requerida.'}).min(1, 'La categoría es requerida.'),
});

type InvoiceFormValues = z.infer<typeof FormSchema>;

export function InvoiceForm({ setOpen }: { setOpen: (open: boolean) => void }) {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isExtracting, setIsExtracting] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      provider: '',
      date: '',
      documentNumber: '',
      totalAmount: '',
      description: '',
      category: undefined,
    },
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    form.setValue('file', file, { shouldValidate: true });
    setIsExtracting(true);
    toast({ title: 'Procesando...', description: 'Extrayendo datos de la factura con IA.' });
    
    try {
        const dataUri = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
        
        const extractedData = await extractInvoiceData({ invoiceDataUri: dataUri });
        
        if (extractedData) {
            form.setValue('provider', extractedData.provider || '', { shouldValidate: true });
            form.setValue('date', extractedData.date || '', { shouldValidate: true });
            form.setValue('documentNumber', extractedData.documentNumber || '', { shouldValidate: true });
            form.setValue('totalAmount', extractedData.totalAmount || '', { shouldValidate: true });
            form.setValue('description', extractedData.description || '', { shouldValidate: true });
            if (extractedData.category && expenseCategories.includes(extractedData.category as ExpenseCategory)) {
                form.setValue('category', extractedData.category, { shouldValidate: true });
            }
            toast({ title: 'Éxito', description: 'Datos extraídos. Por favor, verifique y guarde.' });
        } else {
            throw new Error('La IA no pudo extraer datos.');
        }

    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error de Extracción',
        description: 'No se pudieron extraer los datos. Por favor, ingréselos manualmente.',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  async function onSubmit(data: InvoiceFormValues) {
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
    try {
        const storage = getStorage();
        const fileExtension = data.file.name.split('.').pop();
        const fileName = `invoices/${uuidv4()}.${fileExtension}`;
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
    
    try {
      toast({ title: 'Guardando datos...', description: 'Registrando la factura en la base de datos.' });
      const invoicesCollection = collection(firestore, 'invoices');
      const { file, ...invoiceData } = data; // Exclude file from the data being sent to Firestore
      
      await addDoc(invoicesCollection, {
        ...invoiceData,
        fileUrl: fileUrl, // Add the download URL
        userId: user.uid,
        registrationDate: serverTimestamp(),
        internalStatus: 'Recibida',
      });
      toast({ title: 'Éxito', description: 'Factura agregada exitosamente.' });
      setOpen(false);
    } catch (error: any) {
      console.error("Firestore Write Error:", error);
      toast({ 
          variant: 'destructive', 
          title: 'Error al guardar la factura', 
          description: `No se pudo registrar la factura. Código: ${error.code}. Mensaje: ${error.message}`,
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
        {isExtracting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Upload className="mr-2 h-4 w-4" />
        )}
        Subir archivo (imagen o PDF)
      </Button>
      <div className='text-center text-xs text-muted-foreground pt-1'>
          {form.watch('file')?.name}
      </div>

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
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione una categoría..." />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {expenseCategories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                  <FormDescription>
                    La IA puede sugerir una categoría. Aún así, puede cambiarla manualmente.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
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
              Guardar Factura
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
