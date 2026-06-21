import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, PiggyBank, ReceiptText } from "lucide-react";

type StatsCardsProps = {
  totalChequesThisMonth: number;
  remainingToCoverThisMonth: number;
  totalChequesNextMonth: number;
  pendingInvoicesAmountThisMonth: number;
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
  totalChequesThisMonth,
  remainingToCoverThisMonth,
  totalChequesNextMonth,
  pendingInvoicesAmountThisMonth
}: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Facturas a Pagar (Mes)
          </CardTitle>
          <ReceiptText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(pendingInvoicesAmountThisMonth)}</div>
          <p className="text-xs text-muted-foreground">
            Total facturas pendientes del mes en curso.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Cheques Mes Actual
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalChequesThisMonth)}</div>
          <p className="text-xs text-muted-foreground">
            Suma de todos los cheques emitidos para este mes.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Saldo a Cubrir (Mes Actual)
          </CardTitle>
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(remainingToCoverThisMonth)}</div>
          <p className="text-xs text-muted-foreground">
            Monto de cheques pendiente de débito.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Proyección Mes Siguiente
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalChequesNextMonth)}</div>
          <p className="text-xs text-muted-foreground">
            Compromisos de pago para el próximo mes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
