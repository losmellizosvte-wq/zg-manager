import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, PiggyBank, ReceiptText } from "lucide-react";

type StatsCardsProps = {
  totalEmitidosThisMonth: number;
  remainingToCoverThisMonth: number;
  totalChequesNextMonth: number;
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
  totalEmitidosThisMonth,
  remainingToCoverThisMonth,
  totalChequesNextMonth
}: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Mes Actual</CardTitle>
          <ReceiptText className="h-4 w-4 text-slate-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-800">{formatCurrency(totalEmitidosThisMonth)}</div>
          <p className="text-xs text-muted-foreground">Cheques emitidos mes en curso.</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo a Cubrir</CardTitle>
          <DollarSign className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(remainingToCoverThisMonth)}</div>
          <p className="text-xs text-muted-foreground">Monto de cheques a debitar este mes.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Proyección Próx. Mes</CardTitle>
          <DollarSign className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">{formatCurrency(totalChequesNextMonth)}</div>
          <p className="text-xs text-muted-foreground">Compromiso mes siguiente.</p>
        </CardContent>
      </Card>
    </div>
  );
}
