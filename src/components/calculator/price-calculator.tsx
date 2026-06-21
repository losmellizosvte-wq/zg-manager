'use client';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import type { Provider } from '@/lib/types';
import { Building } from 'lucide-react';

const formatCurrency = (value: number) => {
    if (isNaN(value)) return formatCurrency(0);
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

export default function PriceCalculator({ providers }: { providers: Provider[] }) {
    const [selectedProviderId, setSelectedProviderId] = React.useState('manual');
    const [calcMode, setCalcMode] = React.useState<'lista' | 'factura'>('lista');
    const [cost, setCost] = React.useState('');
    const [discount, setDiscount] = React.useState('10');
    const [applyDiscount, setApplyDiscount] = React.useState(false);
    const [internalTax, setInternalTax] = React.useState('9');
    const [applyInternalTax, setApplyInternalTax] = React.useState(false);
    const [iibb, setIibb] = React.useState('3.5');
    const [applyIibb, setApplyIibb] = React.useState(true);
    const [iva, setIva] = React.useState('21');
    const [applyIva, setApplyIva] = React.useState(true);
    const [shipping, setShipping] = React.useState('6');
    const [applyShipping, setApplyShipping] = React.useState(false);
    const [cashProfit, setCashProfit] = React.useState('40');
    const [listProfit, setListProfit] = React.useState('30');
    const [financingInterest, setFinancingInterest] = React.useState('12');

    const isManualMode = selectedProviderId === 'manual';

    React.useEffect(() => {
        if (isManualMode) {
            return;
        }

        const provider = providers.find(p => p.id === selectedProviderId);
        if (provider) {
            const fallbackRules = provider.calculationRules; // fallback for v1.0 providers
            let rules: any;
            if (calcMode === 'lista') {
                rules = provider.ruleset_lista || fallbackRules;
            } else {
                rules = provider.ruleset_factura || fallbackRules;
            }
            
            if (rules) {
                setApplyDiscount(rules.applyDiscount ?? false);
                setDiscount(rules.discount ?? '0');
                setApplyIva(rules.applyIva ?? true);
                setIva(rules.iva ?? '21');
                setApplyIibb(rules.applyIibb ?? true);
                setIibb(rules.iibb ?? '3.5');
                setApplyInternalTax(rules.applyInternalTax ?? false);
                setInternalTax(rules.internalTax ?? '0');
                setApplyShipping(rules.applyShipping ?? false);
                setShipping(rules.shipping ?? '0');
                setCashProfit(rules.cashProfit ?? '40');
                setListProfit(rules.listProfit ?? '30');
                setFinancingInterest(rules.financingInterest ?? '12');
            }
        }
    }, [selectedProviderId, calcMode, providers, isManualMode]);


    const calculatedValues = React.useMemo(() => {
        let currentPrice = parseFloat(cost) || 0;

        if (currentPrice === 0) {
            return { costAfterDiscount: 0, finalCost: 0, cashPrice: 0, listPrice: 0, financingPrice: 0 };
        }

        if (applyDiscount) {
            currentPrice = currentPrice * (1 - (parseFloat(discount) || 0) / 100);
        }
        const costAfterDiscount = currentPrice;

        if (applyIva) currentPrice = currentPrice * (1 + parseFloat(iva) / 100);
        if (applyIibb) currentPrice = currentPrice * (1 + (parseFloat(iibb) || 0) / 100);
        if (applyInternalTax) currentPrice = currentPrice * (1 + (parseFloat(internalTax) || 0) / 100);
        if (applyShipping) currentPrice = currentPrice * (1 + (parseFloat(shipping) || 0) / 100);
        const finalCost = currentPrice;
        
        const cashPrice = finalCost * (1 + (parseFloat(cashProfit) || 0) / 100) + 1000;
        const listPrice = cashPrice * (1 + (parseFloat(listProfit) || 0) / 100);
        const financingPrice = listPrice * (1 + (parseFloat(financingInterest) || 0) / 100);

        return { costAfterDiscount, finalCost, cashPrice, listPrice, financingPrice };
    }, [
        cost, discount, applyDiscount, internalTax, applyInternalTax, iibb, 
        applyIibb, iva, applyIva, shipping, applyShipping, cashProfit, 
        listProfit, financingInterest
    ]);
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Variables de Cálculo</CardTitle>
                        <CardDescription>Ajuste los valores para formar el precio de venta.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <Tabs value={calcMode} onValueChange={(v) => setCalcMode(v as 'lista'|'factura')} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="lista">Precio de Lista</TabsTrigger>
                                    <TabsTrigger value="factura">Factura de Compra</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="provider-select">Cargar reglas de proveedor</Label>
                             <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
                                <SelectTrigger id="provider-select">
                                    <SelectValue placeholder="Seleccionar proveedor..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="manual">-- Cálculo Manual --</SelectItem>
                                    {providers.map(provider => (
                                        <SelectItem key={provider.id} value={provider.id}>{provider.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                             {!isManualMode && (
                                <p className="text-xs text-muted-foreground flex items-center gap-2 pt-1">
                                    <Building className="h-3 w-3" />
                                    Reglas cargadas. Para editar, vuelva a "Cálculo Manual" o edite el proveedor en su sección.
                                </p>
                             )}
                        </div>
                        
                        <Separator />

                        <div>
                            <Label htmlFor="cost" className="text-lg font-semibold">Precio de Costo</Label>
                            <Input id="cost" type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="0.00" className="text-lg p-4" />
                        </div>
                        
                        <Separator />

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <Label htmlFor="applyDiscount" className="flex-1 cursor-pointer">Descuento de fábrica</Label>
                                <div className="flex items-center gap-4">
                                    <Input type="number" value={discount} onChange={e => setDiscount(e.target.value)} className="w-24" disabled={!applyDiscount || !isManualMode} />
                                    <Switch id="applyDiscount" checked={applyDiscount} onCheckedChange={setApplyDiscount} disabled={!isManualMode} />
                                </div>
                            </div>
                            
                            <div className="p-3 rounded-lg border">
                                <h3 className="font-medium mb-3">Impuestos</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="applyIva" className="flex-1 cursor-pointer">IVA</Label>
                                        <div className="flex items-center gap-4">
                                             <Select value={iva} onValueChange={setIva} disabled={!applyIva || !isManualMode}>
                                                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="21">21%</SelectItem>
                                                    <SelectItem value="10.5">10.5%</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Switch id="applyIva" checked={applyIva} onCheckedChange={setApplyIva} disabled={!isManualMode} />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="applyIibb" className="flex-1 cursor-pointer">Ingresos Brutos (IIBB)</Label>
                                        <div className="flex items-center gap-4">
                                            <Input type="number" value={iibb} onChange={e => setIibb(e.target.value)} className="w-24" disabled={!applyIibb || !isManualMode} />
                                            <Switch id="applyIibb" checked={applyIibb} onCheckedChange={setApplyIibb} disabled={!isManualMode} />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="applyInternalTax" className="flex-1 cursor-pointer">Impuestos Internos</Label>
                                        <div className="flex items-center gap-4">
                                            <Input type="number" value={internalTax} onChange={e => setInternalTax(e.target.value)} className="w-24" disabled={!applyInternalTax || !isManualMode} />
                                            <Switch id="applyInternalTax" checked={applyInternalTax} onCheckedChange={setApplyInternalTax} disabled={!isManualMode} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <Label htmlFor="applyShipping" className="flex-1 cursor-pointer">Flete</Label>
                                <div className="flex items-center gap-4">
                                    <Input type="number" value={shipping} onChange={e => setShipping(e.target.value)} className="w-24" disabled={!applyShipping || !isManualMode} />
                                    <Switch id="applyShipping" checked={applyShipping} onCheckedChange={setApplyShipping} disabled={!isManualMode} />
                                </div>
                            </div>
                            
                            <div className="p-3 rounded-lg border">
                                <h3 className="font-medium mb-3">Márgenes de Ganancia</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="cashProfit" className="flex-1">Ganancia Contado (%)</Label>
                                        <Input id="cashProfit" type="number" value={cashProfit} onChange={e => setCashProfit(e.target.value)} className="w-24" disabled={!isManualMode} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="listProfit" className="flex-1">Recargo Precio Lista (%)</Label>
                                        <Input id="listProfit" type="number" value={listProfit} onChange={e => setListProfit(e.target.value)} className="w-24" disabled={!isManualMode} />
                                    </div>
                                </div>
                            </div>

                             <div className="p-3 rounded-lg border">
                                <h3 className="font-medium mb-3">Financiación</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="financingInterest" className="flex-1">Interés financiación (%)</Label>
                                        <Input id="financingInterest" type="number" value={financingInterest} onChange={e => setFinancingInterest(e.target.value)} className="w-24" disabled={!isManualMode} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            {/* Right Column: Results */}
            <div className="lg:col-span-2 space-y-6">
                <Card className="bg-primary/5 dark:bg-primary/10 border-primary/20">
                     <CardHeader>
                        <CardTitle className="text-primary">Precios de Venta</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <div className="flex justify-between items-baseline p-3 bg-background rounded-lg">
                            <span className="font-semibold text-lg">Contado</span>
                            <span className="font-bold text-2xl text-primary">{formatCurrency(calculatedValues.cashPrice)}</span>
                        </div>
                        <div className="flex justify-between items-baseline p-3 bg-background rounded-lg">
                            <span className="font-semibold text-lg">Precio de Lista</span>
                            <span className="font-bold text-2xl text-primary">{formatCurrency(calculatedValues.listPrice)}</span>
                        </div>
                         <div className="flex justify-between items-baseline p-3 bg-background rounded-lg">
                            <span className="font-semibold text-lg">Precio Financiado</span>
                            <span className="font-bold text-2xl text-primary">{formatCurrency(calculatedValues.financingPrice)}</span>
                        </div>
                    </CardContent>
                </Card>

                 <Card>
                     <CardHeader>
                        <CardTitle>Resumen de Costos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between items-center text-sm p-2 rounded-md">
                            <span className="text-muted-foreground">Costo Inicial</span>
                            <span className="font-semibold">{formatCurrency(parseFloat(cost) || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm p-2 rounded-md">
                            <span className="text-muted-foreground">Costo c/ Descuento</span>
                            <span className="font-semibold">{formatCurrency(calculatedValues.costAfterDiscount)}</span>
                        </div>
                        <Separator />
                       <div className="flex justify-between items-center text-md p-2 rounded-md">
                            <span className="font-semibold">Costo Final (c/ Imp. y Flete)</span>
                            <span className="font-bold">{formatCurrency(calculatedValues.finalCost)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
