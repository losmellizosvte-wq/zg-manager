'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Trash2, Printer, FileBox, ChevronDown, ChevronRight, Link as LinkIcon, Edit } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { InvoiceForm } from './invoice-form';
import type { Cheque, Invoice, ExpenseCategory } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
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
import { Input } from '../ui/input';
import { useFirestore } from '@/firebase';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { groupBy } from 'lodash';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { EditInvoiceForm } from './edit-invoice-form';
import { getInvoicePaymentDetails } from '@/lib/utils';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { expenseCategories } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';


type InvoicesTableProps = {
  invoices: Invoice[];
  allCheques: Cheque[];
};

const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    }).format(Number(amount));
};

function InvoiceRow({ 
    invoice, 
    allCheques, 
    onUpdate, 
    onDelete, 
    onEdit,
    onUpdateCategory,
    monthlyTotal,
}: { 
    invoice: Invoice, 
    allCheques: Cheque[], 
    onUpdate: (id: string, status: Invoice['internalStatus']) => void, 
    onDelete: (id: string) => void, 
    onEdit: (invoice: Invoice) => void,
    onUpdateCategory: (id: string, category: ExpenseCategory) => void,
    monthlyTotal: number;
}) {
    const [isExpanded, setIsExpanded] = React.useState(false);

    const formatDate = (dateValue: any) => {
        try {
            if (!dateValue) return 'N/A';
            const date = dateValue.toDate ? dateValue.toDate() : new Date(String(dateValue).split('-').join('/'));
             if (isNaN(date.getTime())) throw new Error('Invalid date');
            return format(date, 'dd/MM/yyyy');
        } catch (e) {
            return String(dateValue);
        }
    }
    
    const { isPaid, totalPaid, associatedCheques } = getInvoicePaymentDetails(invoice, allCheques);
    const percentageOfTotal = monthlyTotal > 0 ? (parseFloat(invoice.totalAmount) / monthlyTotal) * 100 : 0;

    const PaymentStatusBadge = () => {
      if (isPaid) {
        return <Badge variant="secondary">Pagada</Badge>;
      }
      if (totalPaid > 0) {
        return (
            <Badge variant='default' className='bg-amber-500 text-white'>
              {`Parcial (${formatCurrency(totalPaid)})`}
            </Badge>
          );
      }
      return <Badge variant='outline'>Pendiente</Badge>;
    };

    return (
        <>
            <TableRow data-state={isExpanded ? "open" : "closed"}>
                <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsExpanded(!isExpanded)}>
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                </TableCell>
                <TableCell className="font-medium">{invoice.provider}</TableCell>
                <TableCell>{invoice.documentNumber}</TableCell>
                <TableCell>
                    <Select value={invoice.category || ''} onValueChange={(value) => onUpdateCategory(invoice.id, value as ExpenseCategory)}>
                        <SelectTrigger className="w-[180px] text-xs h-8">
                            <SelectValue placeholder="Sin categoría" />
                        </SelectTrigger>
                        <SelectContent>
                            {expenseCategories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(invoice.totalAmount)}</TableCell>
                <TableCell className="text-right font-medium text-muted-foreground">{percentageOfTotal.toFixed(1)}%</TableCell>
                <TableCell>
                    <PaymentStatusBadge />
                </TableCell>
                <TableCell>
                    <Badge variant='outline'>{invoice.internalStatus}</Badge>
                </TableCell>
                <TableCell className="@media print:hidden">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DropdownMenuItem onSelect={() => window.open(invoice.fileUrl, '_blank')}>
                                <LinkIcon className="mr-2 h-4 w-4" />
                                <span>Ver Adjunto</span>
                           </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => onEdit(invoice)}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Editar Factura</span>
                            </DropdownMenuItem>
                           <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                    <FileBox className="mr-2 h-4 w-4" />
                                    <span>Cambiar estado interno</span>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuSubContent>
                                    <DropdownMenuItem onSelect={() => onUpdate(invoice.id, 'Recibida')} disabled={invoice.internalStatus === 'Recibida'}>
                                        Marcar como Recibida
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => onUpdate(invoice.id, 'En Cianbox')} disabled={invoice.internalStatus === 'En Cianbox'}>
                                        Marcar en Cianbox
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => onUpdate(invoice.id, 'Pagada')} disabled={invoice.internalStatus === 'Pagada'}>
                                        Marcar como Pagada
                                    </DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Eliminar
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                        Esta acción no se puede deshacer. Se eliminará permanentemente la factura.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => onDelete(invoice.id)} className="bg-destructive hover:bg-destructive/90">
                                        Sí, eliminar
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
            </TableRow>
            {isExpanded && (
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableCell colSpan={9} className="p-0">
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-semibold mb-2">Descripción de la Factura</h4>
                                <p className="text-sm text-muted-foreground">{invoice.description}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">Cheques Asociados</h4>
                                {associatedCheques.length > 0 ? (
                                    <div className="space-y-2">
                                        {associatedCheques.map(cheque => (
                                            <div key={cheque.id} className="text-sm p-2 rounded-md border bg-background">
                                                <div className="flex justify-between items-center">
                                                    <p className='font-medium'>Cheque #{cheque.chequeNumber}</p>
                                                    <p className="font-bold">{formatCurrency(cheque.amount)}</p>
                                                </div>
                                                <p className="text-muted-foreground text-xs">Vence: {formatDate(cheque.dueDate)}</p>
                                                {cheque.observation && <p className="text-muted-foreground text-xs mt-1">Obs: {cheque.observation}</p>}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No hay cheques asociados a esta factura.</p>
                                )}
                            </div>
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </>
    );
}


export default function InvoicesTable({ invoices, allCheques }: InvoicesTableProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isFormOpen, setFormOpen] = React.useState(false);
  const [isEditFormOpen, setEditFormOpen] = React.useState(false);
  const [selectedInvoice, setSelectedInvoice] = React.useState<Invoice | null>(null);
  const [filter, setFilter] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('all');
  
  const handleDelete = async (id: string) => {
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la factura.' });
        return;
    }
    const docRef = doc(firestore, 'invoices', id);
    try {
        await deleteDoc(docRef);
        toast({ title: 'Éxito', description: 'Factura eliminada.' });
    } catch (error) {
        console.error("Error deleting invoice: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Error al eliminar la factura.' });
    }
  };

  const handleUpdateInternalStatus = async (id: string, status: Invoice['internalStatus']) => {
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el estado.' });
        return;
    }
    const docRef = doc(firestore, 'invoices', id);
    try {
        await updateDoc(docRef, { internalStatus: status });
        toast({ title: 'Éxito', description: 'Estado interno actualizado.' });
    } catch (error) {
        console.error("Error updating internal status: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Error al actualizar el estado interno.' });
    }
  }

  const handleUpdateCategory = async (id: string, category: ExpenseCategory) => {
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar la categoría.' });
        return;
    }
    const docRef = doc(firestore, 'invoices', id);
    try {
        await updateDoc(docRef, { category: category });
        toast({ title: 'Éxito', description: 'Categoría actualizada.' });
    } catch (error) {
        console.error("Error updating category: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Error al actualizar la categoría.' });
    }
  }


  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setEditFormOpen(true);
  }

  const handlePrint = () => {
    window.print();
  }
  
  const filteredInvoices = React.useMemo(() => {
    const textFiltered = invoices.filter(inv => 
        inv.provider.toLowerCase().includes(filter.toLowerCase()) ||
        inv.documentNumber.toLowerCase().includes(filter.toLowerCase())
    );

    if (activeTab === 'purchases') {
        return textFiltered.filter(inv => inv.category === 'Compra de Mercadería');
    }
    if (activeTab === 'expenses') {
        return textFiltered.filter(inv => inv.category && inv.category !== 'Compra de Mercadería');
    }
    return textFiltered;
  }, [invoices, filter, activeTab]);

  const groupedInvoices = React.useMemo(() => {
    const sorted = [...filteredInvoices].sort((a, b) => {
        try {
            const dateA = a.date?.toDate ? a.date.toDate() : new Date(String(a.date).split('-').join('/'));
            const dateB = b.date?.toDate ? b.date.toDate() : new Date(String(b.date).split('-').join('/'));
            if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
            return dateB.getTime() - dateA.getTime();
        } catch(e) { return 0; }
    });
    return groupBy(sorted, (invoice) => {
      try {
        const date = invoice.date?.toDate ? invoice.date.toDate() : new Date(String(invoice.date).split('-').join('/'));
         if (isNaN(date.getTime())) return "Fecha Inválida";
        return format(date, 'MMMM yyyy', { locale: es });
      } catch (e) {
          return "Fecha Inválida";
      }
    });
  }, [filteredInvoices]);

  const monthlyTotals = React.useMemo(() => {
    return Object.keys(groupedInvoices).reduce<Record<string, number>>((acc, month) => {
        acc[month] = groupedInvoices[month].reduce((sum, inv) => sum + parseFloat(inv.totalAmount || '0'), 0);
        return acc;
    }, {});
  }, [groupedInvoices]);

  const groupKeys = Object.keys(groupedInvoices).filter(key => key !== "Fecha Inválida");

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 justify-between">
        <Input 
            placeholder="Buscar por proveedor o nro. de documento..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm"
        />
        <div className='flex gap-2 self-end sm:self-auto'>
            <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
            </Button>
            <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
            <DialogTrigger asChild>
                <Button>
                <PlusCircle className="mr-2" />
                Nueva Factura
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl w-[90vw] max-h-[90svh] flex flex-col">
                <DialogHeader>
                <DialogTitle>Cargar Nueva Factura</DialogTitle>
                <DialogDescription>
                    Suba una foto o PDF de la factura para que la IA extraiga los datos.
                </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto -mr-6 pr-6">
                    <InvoiceForm setOpen={setFormOpen} />
                </div>
            </DialogContent>
            </Dialog>
        </div>
      </div>
      
      <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="purchases">Compra de Mercadería</TabsTrigger>
            <TabsTrigger value="expenses">Gastos Operativos</TabsTrigger>
        </TabsList>
      </Tabs>

       {groupKeys.length > 0 ? (
        <Accordion type="multiple" defaultValue={groupKeys.slice(0, 2)} className="w-full space-y-2">
            {groupKeys.map((month) => (
                <AccordionItem value={month} key={month} className="border rounded-lg">
                    <AccordionTrigger className="px-4 py-2 text-lg font-bold capitalize flex justify-between w-full">
                        <span>{month}</span>
                        <span className="text-base font-medium text-muted-foreground">{formatCurrency(monthlyTotals[month])}</span>
                    </AccordionTrigger>
                    <AccordionContent className="border-t">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Proveedor</TableHead>
                                <TableHead>Nro. Documento</TableHead>
                                <TableHead>Categoría</TableHead>
                                <TableHead className="text-right">Monto</TableHead>
                                <TableHead className="text-right">% Total Mes</TableHead>
                                <TableHead>Estado de Pago</TableHead>
                                <TableHead>Estado Interno</TableHead>
                                <TableHead className="w-[50px] @media print:hidden"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {groupedInvoices[month].map((invoice) => (
                                    <InvoiceRow 
                                        key={invoice.id} 
                                        invoice={invoice} 
                                        allCheques={allCheques} 
                                        onUpdate={handleUpdateInternalStatus}
                                        onDelete={handleDelete}
                                        onEdit={handleEdit}
                                        onUpdateCategory={handleUpdateCategory}
                                        monthlyTotal={monthlyTotals[month]}
                                    />
                                ))}
                            </TableBody>
                        </Table>
                    </AccordionContent>
                </AccordionItem>
             ))}
        </Accordion>
       ) : (
        <div className="border rounded-lg">
            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center">
                        No se encontraron facturas con los filtros aplicados.
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
       )}

        {selectedInvoice && (
            <Dialog open={isEditFormOpen} onOpenChange={setEditFormOpen}>
                <DialogContent className="sm:max-w-2xl w-[90vw] max-h-[90svh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Editar Factura</DialogTitle>
                        <DialogDescription>
                            Modifique los datos de la factura y guarde los cambios.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto -mr-6 pr-6">
                       <EditInvoiceForm setOpen={setEditFormOpen} invoice={selectedInvoice} />
                    </div>
                </DialogContent>
            </Dialog>
        )}
    </div>
  );
}
