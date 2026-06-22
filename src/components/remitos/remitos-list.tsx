'use client';

import * as React from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Package, Calendar, Image as ImageIcon, CheckCircle, AlertOctagon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function RemitosList() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [remitos, setRemitos] = React.useState<any[]>([]);

    React.useEffect(() => {
        if (!firestore) return;
        const q = query(collection(firestore, 'stock_en_transito'), orderBy('registrationDate', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRemitos(data);
        });
        return () => unsubscribe();
    }, [firestore]);

    if (remitos.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                <Package className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No hay remitos de entrega registrados.</p>
                <p className="text-sm text-slate-400">Los remitos físicos que escanee el depósito aparecerán aquí.</p>
            </div>
        );
    }

    const updateStatus = async (id: string, newStatus: string) => {
        if (!firestore) return;
        try {
            await updateDoc(doc(firestore, 'stock_en_transito', id), { status: newStatus });
            toast({ title: "Estado Actualizado", description: `Remito marcado como ${newStatus}.` });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar." });
        }
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {remitos.map((remito) => (
                <Card key={remito.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="bg-slate-50/50 border-b pb-4">
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-lg font-bold text-slate-800">
                                {remito.providerName || remito.provider}
                            </CardTitle>
                            <Badge variant={remito.status === 'Verificado' ? 'default' : 'secondary'}>
                                {remito.status || 'Pendiente'}
                            </Badge>
                        </div>
                        <CardDescription className="flex items-center gap-1 text-xs mt-1">
                            <Calendar className="h-3 w-3" /> Fecha Recepción: {remito.date || 'N/A'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        <div>
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                <Package className="h-4 w-4" /> Bultos Físicos ({remito.items?.length || 0})
                            </div>
                            <ul className="space-y-1">
                                {remito.items?.slice(0, 3).map((item: any, i: number) => (
                                    <li key={i} className="text-xs flex justify-between bg-slate-50 p-2 rounded">
                                        <span className="truncate pr-2">{item.description}</span>
                                        <span className="font-bold text-slate-700">{item.quantity}u</span>
                                    </li>
                                ))}
                                {remito.items?.length > 3 && (
                                    <li className="text-xs text-center text-slate-500 pt-1">
                                        + {remito.items.length - 3} bultos más
                                    </li>
                                )}
                            </ul>
                        </div>
                        
                        {remito.fileUrl && (
                             <a href={remito.fileUrl} target="_blank" rel="noreferrer" 
                                className="flex items-center justify-center gap-2 text-xs text-blue-600 hover:underline pt-2 border-t">
                                 <ImageIcon className="h-3 w-3" /> Ver Foto del Remito
                             </a>
                        )}
                    </CardContent>
                    {remito.status === 'Pendiente' && (
                        <CardFooter className="bg-slate-50 border-t p-3 grid grid-cols-2 gap-2">
                            <Button size="sm" variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => updateStatus(remito.id, 'Inconsistencia')}>
                                <AlertOctagon className="w-4 h-4 mr-1" /> Faltante
                            </Button>
                            <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => updateStatus(remito.id, 'Verificado')}>
                                <CheckCircle className="w-4 h-4 mr-1" /> OK (Controlado)
                            </Button>
                        </CardFooter>
                    )}
                </Card>
            ))}
        </div>
    );
}
