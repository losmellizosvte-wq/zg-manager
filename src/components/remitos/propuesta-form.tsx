'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { useToast } from '@/hooks/use-toast';
import { extractPropuestaData } from '@/ai/flows/extract-propuesta-data';
import { Loader2, Upload, Trash2, Camera } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent } from '@/components/ui/card';
import { useStockValidator } from '@/hooks/use-stock-validator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from 'lucide-react';

const FormSchema = z.object({
  provider: z.string().min(1, 'El proveedor es requerido.'),
  validityDate: z.string().min(1, 'Vigencia requerida.'),
  estimatedDelivery: z.string().optional(),
  paymentTerms: z.string().optional(),
  items: z.array(z.object({
      description: z.string().min(1, "Obligatorio"),
      quantity: z.coerce.number().min(1, "Debe ser mayor a 0")
  })).min(1, 'Debe haber al menos un artículo'),
  file: z.instanceof(File, { message: 'El archivo es requerido.' }),
});

type PropuestaFormValues = z.infer<typeof FormSchema>;

export function PropuestaForm({ setOpen }: { setOpen: (open: boolean) => void }) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const { isWarningOpen, setIsWarningOpen, warningData, validatePurchase, confirmPurchase } = useStockValidator();

  const [isExtracting, setIsExtracting] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<PropuestaFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      provider: '',
      validityDate: '',
      estimatedDelivery: '',
      paymentTerms: '',
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    form.setValue('file', file, { shouldValidate: true });
    setIsExtracting(true);
    toast({ title: 'Procesando Propuesta...', description: 'Analizando con IA.' });
    
    try {
        const dataUri = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
        
        const extractedData = await extractPropuestaData({ dataUri });
        
        if (extractedData) {
            form.setValue('provider', extractedData.provider || '', { shouldValidate: true });
            form.setValue('validityDate', extractedData.validityDate || '', { shouldValidate: true });
            form.setValue('estimatedDelivery', extractedData.estimatedDelivery || '', { shouldValidate: true });
            form.setValue('paymentTerms', extractedData.paymentTerms || '', { shouldValidate: true });
            
            if (extractedData.items) {
               form.setValue('items', extractedData.items, { shouldValidate: true });
            }
            toast({ title: 'Éxito', description: 'Datos extraídos correctamente.' });
        } else {
            throw new Error('La IA no pudo extraer datos.');
        }

    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error de Extracción',
        description: 'No se pudieron extraer los datos.',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  async function executeSave(data: PropuestaFormValues) {
    let fileUrl = '';
    try {
        const storage = getStorage();
        const fileExtension = data.file.name.split('.').pop();
        const fileName = `propuestas/${uuidv4()}.${fileExtension}`;
        const storageRef = ref(storage, fileName);

        toast({ title: 'Subiendo documento...', description: 'Por favor espere.' });
        await uploadBytes(storageRef, data.file);
        fileUrl = await getDownloadURL(storageRef);

    } catch (error: any) {
        toast({ variant: "destructive", title: "Error al subir", description: error.message });
        setIsSubmitting(false);
        return;
    }
    
    try {
      const propuestasCollection = collection(firestore, 'propuestas');
      const { file, ...rest } = data;
      
      await addDoc(propuestasCollection, {
        ...rest,
        fileUrl: fileUrl,
        userId: user!.uid,
        registrationDate: serverTimestamp(),
        status: 'En Tránsito', // Indicates that it was bought and is traveling
      });
      toast({ title: 'Compra Confirmada', description: 'Propuesta guardada y en tránsito.' });
      setOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error de DB', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onSubmit(data: PropuestaFormValues) {
    setIsSubmitting(true);
    if (!user || !user.uid || !firestore) return setIsSubmitting(false);

    const isSafe = await validatePurchase(data.provider, data.items);
    if (!isSafe) {
       setIsSubmitting(false);
       return; // Alert Dialog will open
    }

    await executeSave(data);
  }

  const handleForceSave = () => {
    confirmPurchase();
    executeSave(form.getValues());
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,application/pdf" />
        <Input type="file" ref={cameraInputRef} onChange={handleFileChange} className="hidden" accept="image/*" capture="environment" />
        <Button variant="outline" onClick={() => cameraInputRef.current?.click()} disabled={isExtracting} className="w-full flex gap-2">
          <Camera className="h-4 w-4" /> Sacar Foto
        </Button>
        <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isExtracting} className="w-full flex gap-2">
          <Upload className="h-4 w-4" /> Subir Captura/PDF
        </Button>
      </div>

      {isExtracting && (
         <div className="flex flex-col items-center justify-center p-8 space-y-4">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
             <p className="text-sm text-muted-foreground">Procesando propuesta...</p>
         </div>
      )}

      {!isExtracting && form.watch('file') && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="provider" render={({ field }) => (
                  <FormItem><FormLabel>Marca/Proveedor</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="validityDate" render={({ field }) => (
                  <FormItem><FormLabel>Vigencia / Fecha</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="estimatedDelivery" render={({ field }) => (
                  <FormItem><FormLabel>Entrega Aprox.</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="paymentTerms" render={({ field }) => (
                  <FormItem><FormLabel>Pago</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
            </div>

            <div className="space-y-2 mt-4">
                <div className="flex justify-between items-center">
                   <FormLabel>Artículos Comprados</FormLabel>
                   <Button type="button" variant="ghost" size="sm" onClick={() => append({description: '', quantity: 1})}>+ Agregar</Button>
                </div>
                {fields.map((field, index) => (
                    <Card key={field.id} className="p-0 overflow-hidden border-muted/50 shadow-sm">
                        <CardContent className="p-2 flex items-center gap-2">
                            <FormField control={form.control} name={`items.${index}.description`} render={({ field }) => (
                                <FormItem className="flex-1 space-y-0"><FormControl><Input className="h-8 text-xs border-0" placeholder="Artículo" {...field} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (
                                <FormItem className="w-20 space-y-0"><FormControl><Input className="h-8 text-xs text-center border-0 bg-muted/30" type="number" {...field} /></FormControl></FormItem>
                            )} />
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full bg-primary/90 mt-6">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Propuesta y Bloquear Doble Compra
            </Button>
          </form>
        </Form>
      )}

      <AlertDialog open={isWarningOpen} onOpenChange={setIsWarningOpen}>
        <AlertDialogContent className="border-red-500/20 bg-background/95 backdrop-blur-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" /> 
                Alerta de Doble Compra
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-foreground/80 space-y-2">
                <p>El sistema ha detectado que alguien ya cargó una propuesta reciente de <strong>{form.getValues('provider')}</strong> que incluye este artículo.</p>
                <div className="bg-red-500/10 p-3 rounded-md text-red-700 font-medium my-2">
                    {warningData?.description} ({warningData?.quantity} unidades confirmadas previamente)
                </div>
                <p>Evite comprar lo mismo dos veces por error. ¿Está seguro que desea cargar esta propuesta de todas formas?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleForceSave} className="bg-red-600 hover:bg-red-700">Autorizar Igual</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
