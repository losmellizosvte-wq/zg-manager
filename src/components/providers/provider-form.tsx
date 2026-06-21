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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Trash2, FileText } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { Provider, CalculationRules, PriceListFile } from '@/lib/types';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const RulesSchema = z.object({
    applyDiscount: z.boolean().default(false),
    discount: z.string().default('0'),
    applyIva: z.boolean().default(true),
    iva: z.string().default('21'),
    applyIibb: z.boolean().default(true),
    iibb: z.string().default('3.5'),
    applyInternalTax: z.boolean().default(false),
    internalTax: z.string().default('0'),
    applyShipping: z.boolean().default(false),
    shipping: z.string().default('0'),
    cashProfit: z.string().min(1, 'Requerido'),
    listProfit: z.string().min(1, 'Requerido'),
    financingInterest: z.string().min(1, 'Requerido'),
});

const FormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido.'),
  salespersonName: z.string().optional(),
  salespersonPhone: z.string().optional(),
  salespersonEmail: z.string().email('Email inválido.').optional().or(z.literal('')),
  observation: z.string().optional(),
  priceListLink: z.string().url('URL inválida.').optional().or(z.literal('')),
  ruleset_lista: RulesSchema,
  ruleset_factura: RulesSchema,
});

type FormValues = z.infer<typeof FormSchema>;

const defaultCalculationRules: CalculationRules = {
    applyDiscount: false,
    discount: '0',
    applyIva: true,
    iva: '21',
    applyIibb: true,
    iibb: '3.5',
    applyInternalTax: false,
    internalTax: '0',
    applyShipping: false,
    shipping: '0',
    cashProfit: '40',
    listProfit: '30',
    financingInterest: '12',
};

const getInitialPriceLists = (provider: any | null): PriceListFile[] => {
    if (!provider) {
        return [];
    }
    // 1. Check for new format
    if (Array.isArray(provider.priceLists)) {
        return provider.priceLists;
    }
    // 2. Fallback for LEGACY format
    if (provider.priceListUrl) {
        // We create a valid PriceListFile object to display in the form.
        // When the user saves, the entire provider object will be saved with the new `priceLists` array format,
        // effectively migrating the data structure.
        return [{
            name: provider.priceListName || 'Lista de Precios',
            url: provider.priceListUrl,
            storagePath: provider.priceListStoragePath || 'legacy-file-no-path', // Placeholder indicates this can't be deleted individually
        }];
    }
    return [];
};


export function ProviderForm({ setOpen, existingProvider }: { setOpen: (open: boolean) => void, existingProvider: any | null }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [currentPriceLists, setCurrentPriceLists] = React.useState<PriceListFile[]>(getInitialPriceLists(existingProvider));
  const [newFiles, setNewFiles] = React.useState<Array<{ name: string; file: File }>>([]);
  const [listsToDelete, setListsToDelete] = React.useState<PriceListFile[]>([]);
  
  const [newListName, setNewListName] = React.useState('');
  const newFileInputRef = React.useRef<HTMLInputElement>(null);
  
  const defaultValues = React.useMemo(() => {
    if (existingProvider) {
      const legacyOrLista = existingProvider.ruleset_lista || existingProvider.calculationRules || defaultCalculationRules;
      const factura = existingProvider.ruleset_factura || defaultCalculationRules;
      
      const formatRules = (rules: any) => ({
            ...rules,
            discount: String(rules.discount),
            iva: String(rules.iva),
            iibb: String(rules.iibb),
            internalTax: String(rules.internalTax),
            shipping: String(rules.shipping),
            cashProfit: String(rules.cashProfit),
            listProfit: String(rules.listProfit),
            financingInterest: String(rules.financingInterest),
      });

      return {
        name: existingProvider.name || '',
        salespersonName: existingProvider.salespersonName || '',
        salespersonPhone: existingProvider.salespersonPhone || '',
        salespersonEmail: existingProvider.salespersonEmail || '',
        observation: existingProvider.observation || '',
        priceListLink: existingProvider.priceListLink || '',
        ruleset_lista: formatRules(legacyOrLista),
        ruleset_factura: formatRules(factura),
      }
    }
    return {
        name: '',
        salespersonName: '',
        salespersonPhone: '',
        salespersonEmail: '',
        observation: '',
        priceListLink: '',
        ruleset_lista: defaultCalculationRules,
        ruleset_factura: defaultCalculationRules,
    }
  }, [existingProvider]);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues,
  });

  const handleAddFile = () => {
    const file = newFileInputRef.current?.files?.[0];
    if (!file || !newListName) {
        toast({
            variant: 'destructive',
            title: 'Faltan datos',
            description: 'Por favor, ingrese un nombre para la lista y seleccione un archivo PDF.'
        });
        return;
    }
    setNewFiles(prev => [...prev, { name: newListName, file }]);
    setNewListName('');
    if (newFileInputRef.current) newFileInputRef.current.value = '';
    toast({ title: 'Lista preparada', description: `"${newListName}" se subirá al guardar.`});
  }

  const handleRemoveNewFile = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  }

  const handleMarkForDelete = (list: PriceListFile) => {
    setCurrentPriceLists(prev => prev.filter(l => l.storagePath !== list.storagePath));
    setListsToDelete(prev => [...prev, list]);
    toast({ title: 'Lista marcada para eliminar', description: `"${list.name}" se eliminará al guardar.`});
  }

  async function onSubmit(data: FormValues) {
    if (!firestore) return;
    setIsSubmitting(true);
    
    const storage = getStorage();

    // 1. Delete files marked for deletion
    try {
        for (const list of listsToDelete) {
            // Do not try to delete legacy files without a valid storage path
            if (list.storagePath && list.storagePath !== 'legacy-file-no-path') {
                const fileRef = ref(storage, list.storagePath);
                await deleteObject(fileRef);
            }
        }
    } catch (error) {
        console.warn("Could not delete one or more files, continuing...", error);
    }
    
    // 2. Upload new files
    const newUploadedLists: PriceListFile[] = [];
    try {
        for (const { name, file } of newFiles) {
            const fileExtension = file.name.split('.').pop();
            const storagePath = `pricelists/${uuidv4()}.${fileExtension}`;
            const storageRef = ref(storage, storagePath);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            newUploadedLists.push({ name, url, storagePath });
        }
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error al subir archivos", description: error.message });
        setIsSubmitting(false);
        return;
    }

    // 3. Update Firestore with combined list of price lists
    // Filter out legacy files that didn't have a path, as they are now part of new uploads or were meant to be replaced.
    const finalPriceLists = [...currentPriceLists.filter(l => l.storagePath !== 'legacy-file-no-path'), ...newUploadedLists];
    
    try {
      const { ...providerData } = data;
      const payload: Partial<Provider> & { name: string, ruleset_lista: CalculationRules, ruleset_factura: CalculationRules, priceLists: PriceListFile[] } = {
        ...providerData,
        priceLists: finalPriceLists,
      };
      
      // Remove legacy fields to clean up the document
      delete (payload as any).priceListName;
      delete (payload as any).priceListUrl;
      delete (payload as any).priceListStoragePath;


      if (existingProvider) {
        toast({ title: 'Actualizando proveedor...' });
        const providerRef = doc(firestore, 'providers', existingProvider.id);
        await updateDoc(providerRef, payload as any);
        toast({ title: 'Éxito', description: 'Proveedor actualizado.' });
      } else {
        toast({ title: 'Creando proveedor...' });
        await addDoc(collection(firestore, 'providers'), payload as any);
        toast({ title: 'Éxito', description: 'Proveedor creado.' });
      }
      setOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al guardar', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Información General</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem className="md:col-span-2"><FormLabel>Nombre del Proveedor</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="observation" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                        <FormLabel>Observación (opcional)</FormLabel>
                        <FormControl><Textarea {...field} placeholder="Ej: Lista de precios vigente es la #122, contactar antes de las 15hs..." /></FormControl>
                        <FormDescription>Una nota rápida o referencia sobre este proveedor.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}/>
            </div>
        </div>

        <Separator />

        <div className="space-y-4">
            <h3 className="text-lg font-medium">Contacto Comercial</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField control={form.control} name="salespersonName" render={({ field }) => (
                    <FormItem><FormLabel>Nombre (opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                 <FormField control={form.control} name="salespersonPhone" render={({ field }) => (
                    <FormItem><FormLabel>Teléfono (opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                 <FormField control={form.control} name="salespersonEmail" render={({ field }) => (
                    <FormItem className="md:col-span-2"><FormLabel>Email (opcional)</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
        </div>

        <Separator />
        
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Listas de Precios</h3>
             <FormField control={form.control} name="priceListLink" render={({ field }) => (
                <FormItem><FormLabel>Link a lista online (opcional)</FormLabel><FormControl><Input {...field} placeholder="https://ejemplo.com/lista-de-precios" /></FormControl><FormMessage /></FormItem>
            )}/>
            
            <div className="space-y-4">
                <Label>Listas de Precios (PDFs)</Label>
                <div className="space-y-2">
                    {currentPriceLists.length === 0 && newFiles.length === 0 && (
                        <div className="text-sm text-muted-foreground text-center p-4 border-dashed border-2 rounded-lg">No hay listas PDF cargadas.</div>
                    )}
                    {currentPriceLists.map((list) => (
                        <div key={list.storagePath} className="flex items-center gap-2 rounded-lg border p-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                                <p className="text-sm font-medium">{list.name}</p>
                                <a href={list.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">Ver archivo</a>
                            </div>
                            <Button type="button" variant="ghost" size="icon" className='h-8 w-8' onClick={() => handleMarkForDelete(list)} disabled={list.storagePath === 'legacy-file-no-path'}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                    {newFiles.map((list, index) => (
                        <div key={index} className="flex items-center gap-2 rounded-lg border border-dashed border-green-500 p-2">
                            <Upload className="h-4 w-4 text-green-500" />
                            <div className="flex-1">
                                <p className="text-sm font-medium">{list.name}</p>
                                <p className="text-xs text-muted-foreground">{list.file.name} (pendiente)</p>
                            </div>
                            <Button type="button" variant="ghost" size="icon" className='h-8 w-8' onClick={() => handleRemoveNewFile(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                </div>

                <div className="flex items-end gap-2 rounded-lg border p-3 bg-muted/50">
                    <div className="flex-1 grid gap-1.5">
                        <Label htmlFor="new-list-name">Nombre de la lista</Label>
                        <Input id="new-list-name" value={newListName} onChange={(e) => setNewListName(e.target.value)} placeholder="Ej: Lista Mayorista" />
                    </div>
                    <div className="flex-1 grid gap-1.5">
                         <Label htmlFor="new-list-file">Archivo PDF</Label>
                         <Input id="new-list-file" type="file" ref={newFileInputRef} accept="application/pdf" className="bg-background"/>
                    </div>
                    <Button type="button" variant="secondary" onClick={handleAddFile}>Añadir</Button>
                </div>
            </div>
        </div>

        <Separator />
        
         <div className="space-y-4">
            <h3 className="text-lg font-medium">Reglas de Cálculo de Precios</h3>
            <p className="text-sm text-muted-foreground">Define la fórmula para calcular precios a partir del costo de este proveedor.</p>

            <Tabs defaultValue="lista" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="lista">Lista de Precios</TabsTrigger>
                <TabsTrigger value="factura">Factura de Compra</TabsTrigger>
              </TabsList>
              
              {(['ruleset_lista', 'ruleset_factura'] as const).map((rulesetKey, index) => (
              <TabsContent value={index === 0 ? 'lista' : 'factura'} key={rulesetKey} className="p-4 border rounded-lg space-y-4 mt-2">
                  <div className="flex items-center justify-between">
                      <FormField control={form.control} name={`${rulesetKey}.applyDiscount`} render={({ field }) => (
                          <FormItem className="flex items-center gap-4 space-y-0">
                              <FormLabel className="cursor-pointer">Descuento de fábrica (%)</FormLabel>
                              <FormControl><Switch checked={field.value as boolean} onCheckedChange={field.onChange} /></FormControl>
                          </FormItem>
                      )}/>
                      <FormField control={form.control} name={`${rulesetKey}.discount`} render={({ field }) => (
                          <FormItem><FormControl><Input type="number" className="w-24" disabled={!form.watch(`${rulesetKey}.applyDiscount`)} {...field} /></FormControl></FormItem>
                      )}/>
                  </div>
                  <div className="flex items-center justify-between">
                      <FormField control={form.control} name={`${rulesetKey}.applyIva`} render={({ field }) => (
                           <FormItem className="flex items-center gap-4 space-y-0">
                              <FormLabel className="cursor-pointer">IVA (%)</FormLabel>
                              <FormControl><Switch checked={field.value as boolean} onCheckedChange={field.onChange} /></FormControl>
                          </FormItem>
                      )}/>
                       <FormField control={form.control} name={`${rulesetKey}.iva`} render={({ field }) => (
                          <FormItem>
                               <Select onValueChange={field.onChange} value={field.value as string} disabled={!form.watch(`${rulesetKey}.applyIva`)}>
                                  <FormControl><SelectTrigger className="w-28"><SelectValue /></SelectTrigger></FormControl>
                                  <SelectContent><SelectItem value="21">21%</SelectItem><SelectItem value="10.5">10.5%</SelectItem></SelectContent>
                              </Select>
                          </FormItem>
                      )}/>
                  </div>
                   <div className="flex items-center justify-between">
                      <FormField control={form.control} name={`${rulesetKey}.applyIibb`} render={({ field }) => (
                           <FormItem className="flex items-center gap-4 space-y-0">
                              <FormLabel className="cursor-pointer">Ingresos Brutos (%)</FormLabel>
                              <FormControl><Switch checked={field.value as boolean} onCheckedChange={field.onChange} /></FormControl>
                          </FormItem>
                      )}/>
                      <FormField control={form.control} name={`${rulesetKey}.iibb`} render={({ field }) => (
                          <FormItem><FormControl><Input type="number" className="w-24" disabled={!form.watch(`${rulesetKey}.applyIibb`)} {...field} /></FormControl></FormItem>
                      )}/>
                  </div>
                  <div className="flex items-center justify-between">
                      <FormField control={form.control} name={`${rulesetKey}.applyInternalTax`} render={({ field }) => (
                           <FormItem className="flex items-center gap-4 space-y-0">
                              <FormLabel className="cursor-pointer">Impuestos Internos (%)</FormLabel>
                              <FormControl><Switch checked={field.value as boolean} onCheckedChange={field.onChange} /></FormControl>
                          </FormItem>
                      )}/>
                      <FormField control={form.control} name={`${rulesetKey}.internalTax`} render={({ field }) => (
                          <FormItem><FormControl><Input type="number" className="w-24" disabled={!form.watch(`${rulesetKey}.applyInternalTax`)} {...field} /></FormControl></FormItem>
                      )}/>
                  </div>
                   <div className="flex items-center justify-between">
                      <FormField control={form.control} name={`${rulesetKey}.applyShipping`} render={({ field }) => (
                           <FormItem className="flex items-center gap-4 space-y-0">
                              <FormLabel className="cursor-pointer">Flete (%)</FormLabel>
                              <FormControl><Switch checked={field.value as boolean} onCheckedChange={field.onChange} /></FormControl>
                          </FormItem>
                      )}/>
                      <FormField control={form.control} name={`${rulesetKey}.shipping`} render={({ field }) => (
                          <FormItem><FormControl><Input type="number" className="w-24" disabled={!form.watch(`${rulesetKey}.applyShipping`)} {...field} /></FormControl></FormItem>
                      )}/>
                  </div>
                  <Separator />
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                       <FormField control={form.control} name={`${rulesetKey}.cashProfit`} render={({ field }) => (
                          <FormItem><FormLabel>Ganancia Contado (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                      )}/>
                       <FormField control={form.control} name={`${rulesetKey}.listProfit`} render={({ field }) => (
                          <FormItem><FormLabel>Recargo Lista (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                      )}/>
                       <FormField control={form.control} name={`${rulesetKey}.financingInterest`} render={({ field }) => (
                          <FormItem><FormLabel>Interés Finan. (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                      )}/>
                  </div>
              </TabsContent>
              ))}
            </Tabs>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {existingProvider ? 'Guardar Cambios' : 'Crear Proveedor'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
