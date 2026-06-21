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
import { MoreHorizontal, PlusCircle, Printer, CheckCircle, Trash2, Link as LinkIcon, ChevronsUpDown, Calendar as CalendarIcon, ChevronDown, ChevronRight, DollarSign, Hash, PiggyBank } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ChequeForm } from './cheque-form';
import type { Cheque, Invoice } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { addDays, format, isAfter, isBefore, isEqual, parseISO, differenceInDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { es } from 'date-fns/locale';
import { cn, getInvoicePaymentDetails } from '@/lib/utils';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { AssociateInvoicesForm } from './associate-invoices-form';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { groupBy } from 'lodash';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

type ChequeRowProps = {
    cheque: Cheque;
    allInvoices: Invoice[];
    onAssociate: (cheque: Cheque) => void;
    onDelete: (id: string) => void;
    onUpdateStatus: (id: string, status: Cheque['status']) => void;
};

const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(amount));
};


function ChequeRow({ cheque, allInvoices, onAssociate, onDelete, onUpdateStatus }: ChequeRowProps) {
    const [isExpanded, setIsExpanded] = React.useState(false);
    
    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString + 'T00:00:00').toLocaleDateString('es-AR');
        } catch (e) {
            return dateString;
        }
    }

    const getStatusBadge = (status: Cheque['status'], dueDateStr: string) => {
        const dueDate = parseISO(dueDateStr);
        const today = new Date();
        today.setHours(0,0,0,0);
        const daysUntilDue = differenceInDays(dueDate, today);

        switch (status) {
        case 'Pendiente':
            if (isEqual(dueDate, today)) {
            return <Badge className="bg-orange-500 text-white">Vence Hoy</Badge>;
            }
            if (isAfter(dueDate, today) && daysUntilDue <= 7) {
            return <Badge className="bg-yellow-500 text-black">Vence en {daysUntilDue} día(s)</Badge>;
            }
            return <Badge className="bg-blue-500 text-white">Pendiente</Badge>;
        case 'Vencido':
            return <Badge variant="destructive">Vencido</Badge>;
        case 'Debitado':
            return <Badge variant="secondary">Debitado</Badge>;
        default:
            return <Badge>{status}</Badge>;
        }
    };
    
    const getAssociatedInvoicesPreview = (invoiceIds: string[], allInvoices: Invoice[]) => {
        if (!invoiceIds || invoiceIds.length === 0) return 'N/A';
        const firstInvoiceId = invoiceIds[0];
        const invoice = allInvoices.find(inv => inv.id === firstInvoiceId);
        let preview = invoice ? `${invoice.documentNumber}` : `ID: ${firstInvoiceId}`;
        if (invoiceIds.length > 1) {
          preview += ` (+${invoiceIds.length - 1})`;
        }
        return preview;
      };

    return (
        <>
        <TableRow data-state={isExpanded ? "open" : "closed"}>
            <TableCell>
                <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="h-8 w-8 p-0">
                    <span className="sr-only">Abrir detalles</span>
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
            </TableCell>
            <TableCell className="font-medium">{cheque.beneficiary}</TableCell>
            <TableCell>{cheque.chequeNumber}</TableCell>
            <TableCell>
                {cheque.type === 'tercero' ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">Tercero</Badge>
                ) : (
                    <Badge variant="outline">Emitido</Badge>
                )}
            </TableCell>
            <TableCell>{formatDate(cheque.dueDate)}</TableCell>
            <TableCell>{getAssociatedInvoicesPreview(cheque.invoiceIds, allInvoices)}</TableCell>
            <TableCell className="text-right">{formatCurrency(cheque.amount)}</TableCell>
            <TableCell>{getStatusBadge(cheque.status, cheque.dueDate)}</TableCell>
            <TableCell className="@media print:hidden">
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Abrir menú</span>
                    <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                     <DropdownMenuItem onSelect={() => onAssociate(cheque)}>
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Asociar Facturas
                    </DropdownMenuItem>
                    {cheque.status !== 'Debitado' && (
                        <DropdownMenuItem onSelect={() => onUpdateStatus(cheque.id, 'Debitado')}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Marcar como debitado
                        </DropdownMenuItem>
                    )}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente el cheque.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(cheque.id)} className="bg-destructive hover:bg-destructive/90">
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
                <TableCell colSpan={8} className="p-4">
                    <h4 className="font-semibold mb-2">Observación:</h4>
                    <p className="text-sm text-muted-foreground">
                        {cheque.observation || 'No hay observación para este cheque.'}
                    </p>
                </TableCell>
            </TableRow>
        )}
        </>
    )
}

type ChequesTableProps = {
  cheques: Cheque[];
  allInvoices: Invoice[];
};


export default function ChequesTable({ cheques, allInvoices }: ChequesTableProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isFormOpen, setFormOpen] = React.useState(false);
  const [isAssociateFormOpen, setAssociateFormOpen] = React.useState(false);
  const [selectedCheque, setSelectedCheque] = React.useState<Cheque | null>(null);
  const [filter, setFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<Cheque['status'] | 'Todos'>('Todos');
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();


  const handleDelete = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'cheques', id));
      toast({
        title: 'Éxito',
        description: 'Cheque eliminado.',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el cheque.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStatus = async (id: string, status: Cheque['status']) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'cheques', id), { status });
      toast({
          title: 'Éxito',
          description: 'Estado del cheque actualizado.',
        });
    } catch (error) {
        console.error(error);
        toast({
            title: 'Error',
            description: 'No se pudo actualizar el estado.',
            variant: 'destructive',
        });
    }
  };

  const filteredCheques = React.useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);

    const updatedCheques = cheques.map(c => {
        try {
            const dueDate = parseISO(c.dueDate);
            if (c.status === 'Pendiente' && isBefore(dueDate, today)) {
                return {...c, status: 'Vencido' as Cheque['status']};
            }
        } catch(e) { /* Ignore invalid date formats for this update */ }
        return c;
    });

    return updatedCheques.filter(c => {
        let dueDate;
        try {
            dueDate = parseISO(c.dueDate);
        } catch(e) {
            return false; // Exclude cheques with invalid date format
        }

        const matchesText = c.beneficiary.toLowerCase().includes(filter.toLowerCase()) ||
            c.chequeNumber.includes(filter);
        const matchesStatus = statusFilter === 'Todos' || c.status === statusFilter;
        let matchesDate = true;
        if (dateRange?.from) {
            matchesDate = !isBefore(dueDate, dateRange.from);
        }
        if (dateRange?.to) {
            matchesDate = matchesDate && !isAfter(dueDate, dateRange.to);
        }
        
        return matchesText && matchesStatus && matchesDate;
    });
  }, [cheques, filter, statusFilter, dateRange]);

  const { totalCount, pendingAmount, totalAmount, pendingCount } = React.useMemo(() => {
    const pendingCheques = filteredCheques.filter(c => c.status !== 'Debitado');
    return {
      totalCount: filteredCheques.length,
      pendingCount: pendingCheques.length,
      totalAmount: filteredCheques.reduce((sum, cheque) => sum + parseFloat(cheque.amount || '0'), 0),
      pendingAmount: pendingCheques.reduce((sum, cheque) => sum + parseFloat(cheque.amount || '0'), 0),
    };
  }, [filteredCheques]);
  
  const handlePrint = () => {
      window.print();
  }
  
  const openAssociateDialog = (cheque: Cheque) => {
    setSelectedCheque(cheque);
    setAssociateFormOpen(true);
  }
  
  const groupedCheques = React.useMemo(() => {
    const sorted = [...filteredCheques].sort((a, b) => {
      try {
        const dateA = parseISO(a.dueDate);
        const dateB = parseISO(b.dueDate);
        return dateB.getTime() - dateA.getTime();
      } catch (e) {
        return 0;
      }
    });
    return groupBy(sorted, (cheque) => {
      try {
        const date = parseISO(cheque.dueDate);
        return format(date, 'MMMM yyyy', { locale: es });
      } catch (e) {
        return "Fecha Inválida";
      }
    });
  }, [filteredCheques]);

  const groupKeys = Object.keys(groupedCheques);

  const availableForAssociation = React.useMemo(() => {
    return allInvoices.filter(invoice => {
        const { isPaid } = getInvoicePaymentDetails(invoice, cheques);
        return !isPaid;
    });
  }, [allInvoices, cheques]);


  return (
    <div className="space-y-4">
       <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
            <div className="flex-1 flex flex-col sm:flex-row gap-2">
                 <Input 
                    placeholder="Buscar por beneficiario o nro..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="max-w-xs"
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className='w-full sm:w-auto'>Estado: {statusFilter}</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onSelect={() => setStatusFilter('Todos')}>Todos</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setStatusFilter('Pendiente')}>Pendiente</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setStatusFilter('Vencido')}>Vencido</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setStatusFilter('Debitado')}>Debitado</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                            "w-full sm:w-[260px] justify-start text-left font-normal",
                            !dateRange && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (
                                dateRange.to ? (
                                    <>
                                    {format(dateRange.from, "LLL dd, y", { locale: es })} -{" "}
                                    {format(dateRange.to, "LLL dd, y", { locale: es })}
                                    </>
                                ) : (
                                    format(dateRange.from, "LLL dd, y", { locale: es })
                                )
                            ) : (
                                <span>Rango de Fechas</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="flex flex-col space-y-2 p-2 w-auto" align="start">
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" size="sm" onClick={() => setDateRange({ from: startOfWeek(new Date(), { locale: es}), to: endOfWeek(new Date(), { locale: es})})}>Esta Semana</Button>
                            <Button variant="outline" size="sm" onClick={() => setDateRange({ from: startOfMonth(new Date()), to: endOfMonth(new Date())})}>Este Mes</Button>
                            <Button variant="outline" size="sm" onClick={() => setDateRange({ from: new Date(), to: addDays(new Date(), 7)})}>Próximos 7 días</Button>
                            <Button variant="outline" size="sm" onClick={() => setDateRange({ from: new Date(), to: addDays(new Date(), 30)})}>Próximos 30 días</Button>
                        </div>
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={1}
                            locale={es}
                        />
                        <Button variant="ghost" size="sm" onClick={() => setDateRange(undefined)}>Limpiar</Button>
                    </PopoverContent>
                </Popover>
            </div>
            <div className='flex gap-2 self-end sm:self-auto'>
                <Button variant="outline" onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir
                </Button>
                <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2" />
                            Nuevo E-Cheq
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl w-[90vw] max-h-[90svh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>Cargar Nuevo E-Cheq</DialogTitle>
                            <DialogDescription>
                                Suba una foto o PDF del cheque para que la IA extraiga los datos, o cárguelos manualmente.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto -mr-6 pr-6">
                            <ChequeForm setOpen={setFormOpen} pendingInvoices={availableForAssociation} allCheques={cheques} />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
      </div>
      
      {filteredCheques.length > 0 && (
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    Resumen del Filtro
                </CardTitle>
            </CardHeader>
            <CardContent className='grid md:grid-cols-3 gap-8'>
                <div className='flex items-center'>
                    <Hash className="h-5 w-5 text-muted-foreground mr-2"/>
                    <div>
                        <div className="text-2xl font-bold">{totalCount}</div>
                        <p className="text-xs text-muted-foreground">Cheques en el listado</p>
                    </div>
                </div>
                 <div className='flex items-center'>
                    <DollarSign className="h-5 w-5 text-muted-foreground mr-2"/>
                    <div>
                        <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
                        <p className="text-xs text-muted-foreground">Monto total filtrado</p>
                    </div>
                </div>
                <div className='flex items-center'>
                    <PiggyBank className="h-5 w-5 text-muted-foreground mr-2"/>
                    <div>
                        <div className="text-2xl font-bold">{formatCurrency(pendingAmount)}</div>
                        <p className="text-xs text-muted-foreground">Monto pendiente ({pendingCount} cheques)</p>
                    </div>
                </div>
            </CardContent>
        </Card>
      )}

       {groupKeys.length > 0 ? (
        <Accordion type="multiple" defaultValue={groupKeys.slice(0, 2)} className="w-full space-y-2">
            {groupKeys.map((month) => {
                 const monthlyTotal = groupedCheques[month].reduce((sum, cheque) => sum + parseFloat(cheque.amount || '0'), 0);
                 return (
                    <AccordionItem value={month} key={month} className="border rounded-lg">
                        <AccordionTrigger className="px-4 py-2 text-lg font-bold capitalize flex justify-between w-full">
                            <span>{month}</span>
                            <span className="text-base font-medium text-muted-foreground">{formatCurrency(monthlyTotal)}</span>
                        </AccordionTrigger>
                        <AccordionContent className="border-t">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead className="w-[50px]"></TableHead>
                                    <TableHead>Beneficiario</TableHead>
                                    <TableHead>Nro. Cheque</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Vencimiento</TableHead>
                                    <TableHead>Facturas Asoc.</TableHead>
                                    <TableHead className="text-right">Monto</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="w-[50px] @media print:hidden"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {groupedCheques[month].map((cheque) => (
                                        <ChequeRow 
                                            key={cheque.id}
                                            cheque={cheque}
                                            allInvoices={allInvoices}
                                            onAssociate={openAssociateDialog}
                                            onDelete={handleDelete}
                                            onUpdateStatus={handleUpdateStatus}
                                        />
                                    ))}
                                </TableBody>
                            </Table>
                        </AccordionContent>
                    </AccordionItem>
             )})}
        </Accordion>
       ) : (
        <div className="border rounded-lg">
            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                        No se encontraron cheques.
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
       )}

       {selectedCheque && (
        <Dialog open={isAssociateFormOpen} onOpenChange={setAssociateFormOpen}>
          <DialogContent className="sm:max-w-lg w-[90vw]">
            <DialogHeader>
              <DialogTitle>Asociar Facturas al Cheque #{selectedCheque.chequeNumber}</DialogTitle>
              <DialogDescription>
                Seleccione una o más facturas pendientes para el beneficiario: <span className='font-semibold'>{selectedCheque.beneficiary}</span>.
              </DialogDescription>
            </DialogHeader>
            <AssociateInvoicesForm
              cheque={selectedCheque}
              allInvoices={allInvoices}
              allCheques={cheques}
              setOpen={setAssociateFormOpen}
            />
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
