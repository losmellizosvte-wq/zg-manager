'use client';

import { RemitoForm } from "@/components/remitos/remito-form";
import { PropuestaForm } from "@/components/remitos/propuesta-form";
import { PropuestasList } from "@/components/remitos/propuestas-list";
import { RemitosList } from "@/components/remitos/remitos-list";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PackagePlus, ShoppingCart } from "lucide-react";
import { useState } from "react";

export default function RemitosPage() {
    const [openRemito, setOpenRemito] = useState(false);
    const [openPropuesta, setOpenPropuesta] = useState(false);

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Logística y Compras</h1>
                    <p className="text-muted-foreground">Control de Propuestas TALKIU y Recepción de Stock</p>
                </div>
                
                <div className="flex gap-2">
                    <Dialog open={openPropuesta} onOpenChange={setOpenPropuesta}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2 rounded-full px-6 shadow-sm border-blue-200 hover:bg-blue-50 text-blue-700">
                                <ShoppingCart className="w-4 h-4" />
                                Cargar Propuesta
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md backdrop-blur-xl bg-background/90 border-slate-200/60 shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-xl text-blue-900">Confirmar Compra (Propuesta)</DialogTitle>
                                <DialogDescription>
                                    Sube la captura de TALKIU. La IA bloqueará que otro ejecutivo la compre dos veces.
                                </DialogDescription>
                            </DialogHeader>
                            <PropuestaForm setOpen={setOpenPropuesta} />
                        </DialogContent>
                    </Dialog>

                    <Dialog open={openRemito} onOpenChange={setOpenRemito}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full px-6 shadow-md">
                                <PackagePlus className="w-4 h-4" />
                                Escanear Remito
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md backdrop-blur-xl bg-background/90 border-slate-200/60 shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-xl">Ingreso Físico (Depósito)</DialogTitle>
                                <DialogDescription>
                                    El camión llegó. Escanea el remito para registrar la entrada.
                                </DialogDescription>
                            </DialogHeader>
                            <RemitoForm setOpen={setOpenRemito} />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Tabs defaultValue="propuestas" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-6">
                    <TabsTrigger value="propuestas" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Compras en Tránsito</TabsTrigger>
                    <TabsTrigger value="remitos" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">Recepciones</TabsTrigger>
                </TabsList>
                <TabsContent value="propuestas">
                    <PropuestasList />
                </TabsContent>
                <TabsContent value="remitos">
                    <RemitosList />
                </TabsContent>
            </Tabs>
        </div>
    );
}
