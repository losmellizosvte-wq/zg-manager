'use client';

import { RemitoForm } from "@/components/remitos/remito-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PackagePlus } from "lucide-react";
import { useState } from "react";

export default function RemitosPage() {
    const [open, setOpen] = useState(false);

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Mercadería</h1>
                    <p className="text-muted-foreground">Control de Picking y Stock en Tránsito</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full px-6 shadow-md">
                            <PackagePlus className="w-4 h-4" />
                            Escanear Remito
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md backdrop-blur-xl bg-background/90 border-slate-200/60 shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl">Ingreso de Mercadería</DialogTitle>
                            <DialogDescription>
                                Toma una foto o sube un PDF del remito. La IA extraerá los datos automáticamente.
                            </DialogDescription>
                        </DialogHeader>
                        <RemitoForm setOpen={setOpen} />
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-slate-200/60 shadow-sm bg-gradient-to-br from-white to-slate-50/50">
                <CardHeader>
                    <CardTitle className="text-lg">Stock en Tránsito Activo</CardTitle>
                    <CardDescription>Mercadería recibida pendiente de facturación legal.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-slate-500">
                        Implementaremos la tabla de visualización en los próximos pasos.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
