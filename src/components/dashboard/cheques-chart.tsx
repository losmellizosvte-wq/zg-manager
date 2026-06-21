'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Cheque } from '@/lib/types';

interface ChequesChartProps {
  cheques: Cheque[];
}

export function ChequesChart({ cheques }: ChequesChartProps) {
  const debitedAmount = cheques
    .filter((c) => c.status === 'Debitado')
    .reduce((sum, c) => sum + parseFloat(c.amount), 0);

  const pendingAmount = cheques
    .filter((c) => c.status === 'Pendiente' || c.status === 'Vencido')
    .reduce((sum, c) => sum + parseFloat(c.amount), 0);

  const chartData = [
    { name: 'Debitado', total: debitedAmount, fill: 'hsl(var(--chart-2))' },
    { name: 'Pendiente', total: pendingAmount, fill: 'hsl(var(--chart-1))' },
  ];

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Resumen de Cheques del Mes</CardTitle>
        <CardDescription>Monto total de cheques debitados vs. pendientes en el mes en curso.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              axisLine={false}
              stroke="hsl(var(--muted-foreground))"
              fontSize={14}
              width={80}
            />
            <Tooltip
                cursor={{fill: 'hsl(var(--muted))'}}
                content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                        return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid grid-cols-1">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                {payload[0].payload.name}
                                </span>
                                <span className="font-bold text-foreground">
                                {formatCurrency(payload[0].value as number)}
                                </span>
                            </div>
                        </div>
                        )
                    }
                    return null
                }}
            />
            <Bar dataKey="total" barSize={40} radius={[4, 4, 4, 4]}>
               {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
