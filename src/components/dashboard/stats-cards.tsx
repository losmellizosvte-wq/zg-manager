import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, PiggyBank, ReceiptText } from "lucide-react";

type StatsCardsProps = {
  pendingInvoicesAmountThisMonth: number;
  remainingToCoverThisMonth: number;
  tercerosACobrarThisMonth: number;
  flujoNetoThisMonth: number;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export function StatsCards({
  pendingInvoicesAmountThisMonth,
  remainingToCoverThisMonth,
  tercerosACobrarThisMonth,
  flujoNetoThisMonth
}: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Facturas a Pagar</CardTitle>
          <ReceiptText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(pendingInvoicesAmountThisMonth)}</div>
          <p className="text-xs text-muted-foreground">Total de gastos del mes.</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cheques a Cubrir</CardTitle>
          <DollarSign className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(remainingToCoverThisMonth)}</div>
          <p className="text-xs text-muted-foreground">Monto de cheques propios a debitar.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cheques de Terceros</CardTitle>
          <PiggyBank className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(tercerosACobrarThisMonth)}</div>
          <p className="text-xs text-muted-foreground">Monto de terceros a cobrar.</p>
        </CardContent>
      </Card>

      <Card className={flujoNetoThisMonth < 0 ? "border-red-200 bg-red-50/30" : "border-green-200 bg-green-50/30"}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Flujo Neto Proyectado</CardTitle>
          <TrendingUp className={`h-4 w-4 ${flujoNetoThisMonth < 0 ? 'text-red-500' : 'text-green-500'}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${flujoNetoThisMonth < 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(flujoNetoThisMonth)}
          </div>
          <p className="text-xs text-muted-foreground">
            Diferencia entre cobrar terceros y cubrir propios.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
