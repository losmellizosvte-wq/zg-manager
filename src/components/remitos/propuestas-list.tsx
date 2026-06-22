'use client';

import * as React from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Truck, CreditCard, PackageOpen, FileText } from 'lucide-react';

export function PropuestasList() {
    const firestore = useFirestore();
    const [propuestas, setPropuestas] = React.useState<any[]>([]);

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

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {propuestas.map((propuesta) => (
                <Card key={propuesta.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="bg-slate-50/50 border-b pb-4">
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-lg font-bold text-slate-800">
                                {propuesta.provider}
                            </CardTitle>
                            <Badge variant={propuesta.status === 'Ingresado' ? 'default' : 'secondary'} 
                                   className={propuesta.status === 'En Tránsito' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' : ''}>
                                {propuesta.status}
                            </Badge>
                        </div>
                        <CardDescription className="flex items-center gap-1 text-xs mt-1">
                            <Calendar className="h-3 w-3" /> Vigencia: {propuesta.validityDate || 'N/A'}
                        </CardDescription>
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
                                className="block text-center text-xs text-blue-600 hover:underline pt-2 border-t">
                                 Ver Documento Original
                             </a>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
