'use client';

import * as React from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Truck, CreditCard, PackageOpen, FileText, ChevronRight, MessageSquareText, Trash2 } from 'lucide-react';
import { PropuestaTimeline, PropuestaStatus } from './propuesta-timeline';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

export function PropuestasList() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [propuestas, setPropuestas] = React.useState<any[]>([]);
    const [selectedPropuesta, setSelectedPropuesta] = React.useState<any>(null);
    const [noteText, setNoteText] = React.useState('');

    React.useEffect(() => {
        if (!firestore) return;
        const q = query(collection(firestore, 'propuestas'), orderBy('registrationDate', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPropuestas(data);
        });
        return () => unsubscribe();
    }, [firestore]);

    if (propuestas.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No hay compras en tránsito.</p>
                <p className="text-sm text-slate-400">Las propuestas cargadas aparecerán aquí.</p>
            </div>
        );
    }

    const PIPELINE: PropuestaStatus[] = ['Confirmada', 'Facturada', 'Pago Enviado', 'Picking', 'En Viaje', 'Recibida'];

    const handleAdvanceStatus = async (propuesta: any) => {
        if (!firestore || !user) return;
        
        let currentStatus = propuesta.status || 'Confirmada';
        // Handle legacy status from previous version
        if (currentStatus === 'En Tránsito') currentStatus = 'Confirmada';
        
        const currentIndex = PIPELINE.indexOf(currentStatus);
        if (currentIndex === -1 || currentIndex === PIPELINE.length - 1) return;
        
        const nextStatus = PIPELINE[currentIndex + 1];
        const newHistoryEntry = { status: nextStatus, date: new Date().toISOString(), user: user.email || 'Admin' };
        
        try {
            await updateDoc(doc(firestore, 'propuestas', propuesta.id), {
                status: nextStatus,
                statusHistory: arrayUnion(newHistoryEntry)
            });
            toast({ title: 'Estado Actualizado', description: `Avanzado a ${nextStatus}` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };

    const handleAddNote = async (propuestaId: string) => {
        if (!firestore || !user || !noteText.trim()) return;
        const newNote = { text: noteText, date: new Date().toISOString(), user: user.email || 'Admin' };
        try {
            await updateDoc(doc(firestore, 'propuestas', propuestaId), {
                notes: arrayUnion(newNote)
            });
            setNoteText('');
            toast({ title: 'Nota guardada', description: 'Historial actualizado.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };

    const handleDelete = async (id: string) => {
        if (!firestore) return;
        try {
            await deleteDoc(doc(firestore, 'propuestas', id));
            toast({ title: 'Eliminada', description: 'La propuesta fue borrada correctamente.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error al eliminar', description: error.message });
        }
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {propuestas.map((propuesta) => (
                <Card key={propuesta.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="bg-slate-50/50 border-b pb-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    {propuesta.provider}
                                    {propuesta.purchaseType === 'ACE' && (
                                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] px-1.5 py-0">ACE</Badge>
                                    )}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-1 text-xs mt-1">
                                    <Calendar className="h-3 w-3" /> Vig: {propuesta.validityDate || 'N/A'}
                                </CardDescription>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <button className="text-slate-300 hover:text-red-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>¿Eliminar esta propuesta?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta acción no se puede deshacer. Se borrará el historial y ya no estará en seguimiento.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(propuesta.id)} className="bg-red-600 hover:bg-red-700">Sí, eliminar</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                <Badge variant={propuesta.status === 'Recibida' ? 'default' : 'secondary'} 
                                    className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                                    {propuesta.status || 'Confirmada'}
                                </Badge>
                            </div>
                        </div>
                        <div className="mt-4 mb-2">
                            <PropuestaTimeline currentStatus={propuesta.status === 'En Tránsito' ? 'Confirmada' : (propuesta.status || 'Confirmada')} history={propuesta.statusHistory} />
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Truck className="h-4 w-4 text-blue-500" />
                                <span>{propuesta.estimatedDelivery || 'Sin fecha'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                                <CreditCard className="h-4 w-4 text-green-500" />
                                <span className="truncate">{propuesta.paymentTerms || 'No especificado'}</span>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                <PackageOpen className="h-4 w-4" /> Artículos ({propuesta.items?.length || 0})
                            </div>
                            <ul className="space-y-1">
                                {propuesta.items?.slice(0, 3).map((item: any, i: number) => (
                                    <li key={i} className="text-xs flex justify-between bg-slate-50 p-2 rounded">
                                        <span className="truncate pr-2">{item.description}</span>
                                        <span className="font-bold">{item.quantity}u</span>
                                    </li>
                                ))}
                                {propuesta.items?.length > 3 && (
                                    <li className="text-xs text-center text-slate-500 pt-1">
                                        + {propuesta.items.length - 3} artículos más
                                    </li>
                                )}
                            </ul>
                        </div>
                        
                        {propuesta.fileUrl && (
                             <a href={propuesta.fileUrl} target="_blank" rel="noreferrer" 
                                className="block text-center text-xs text-blue-600 hover:underline pt-2 border-t mt-4">
                                 Ver Documento Original
                             </a>
                        )}
                    </CardContent>
                    
                    <CardFooter className="bg-slate-50 border-t p-3 flex flex-col gap-2">
                        <div className="flex gap-2 w-full">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="w-full bg-white">
                                        <MessageSquareText className="w-4 h-4 mr-1 text-slate-500" />
                                        Notas ({propuesta.notes?.length || 0})
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Registro de Gestión: {propuesta.provider}</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                        {propuesta.notes?.map((n: any, i: number) => (
                                            <div key={i} className="bg-slate-50 p-3 rounded-lg border text-sm">
                                                <div className="flex justify-between text-xs text-slate-500 mb-1">
                                                    <span className="font-semibold text-slate-700">{n.user}</span>
                                                    <span>{format(new Date(n.date), "dd/MM HH:mm")}</span>
                                                </div>
                                                {n.text}
                                            </div>
                                        ))}
                                        {(!propuesta.notes || propuesta.notes.length === 0) && (
                                            <p className="text-sm text-slate-500 text-center py-4">No hay notas de gestión registradas.</p>
                                        )}
                                        <div className="pt-4 border-t">
                                            <Textarea 
                                                placeholder="Ej: Hablé con Juan, facturan el viernes..." 
                                                value={noteText}
                                                onChange={(e) => setNoteText(e.target.value)}
                                                className="mb-2 text-sm"
                                            />
                                            <Button size="sm" className="w-full" onClick={() => handleAddNote(propuesta.id)}>Guardar Nota</Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                            
                            {propuesta.status !== 'Recibida' && (
                                <Button 
                                    size="sm" 
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={() => handleAdvanceStatus(propuesta)}
                                >
                                    Avanzar <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            )}
                        </div>
                        {propuesta.status !== 'Recibida' && (
                            <div className="text-[10px] text-center text-slate-400 w-full">
                                Próximo estado: <strong className="text-slate-500">
                                    {PIPELINE[PIPELINE.indexOf(propuesta.status === 'En Tránsito' ? 'Confirmada' : (propuesta.status || 'Confirmada')) + 1]}
                                </strong>
                            </div>
                        )}
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
