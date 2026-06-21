'use client';

import * as React from 'react';
import { Calendar } from '@/components/ui/calendar';
import type { Cheque } from '@/lib/types';
import { addDays, eachWeekOfInterval, endOfMonth, format, isSameDay, startOfMonth, parseISO, getWeek, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar, Cell } from 'recharts';
import { cn } from '@/lib/utils';


const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(amount));
};

function WeeklyPaymentsChart({ cheques }: { cheques: Cheque[] }) {
  const today = new Date();
  const start = startOfMonth(today);
  const end = endOfMonth(today);

  const weeklyData = eachWeekOfInterval({ start, end }, { locale: es }).map((weekStart, index) => {
    const weekEnd = addDays(weekStart, 6);
    const weekCheques = cheques.filter(c => {
      const dueDate = parseISO(c.dueDate);
      return isWithinInterval(dueDate, { start: weekStart, end: weekEnd });
    });
    const net = weekCheques.reduce((sum, c) => {
        const amt = parseFloat(c.amount) || 0;
        return c.type === 'tercero' ? sum + amt : sum - amt;
    }, 0);
    return {
      name: `Sem ${index + 1}`,
      total: net,
    };
  });
  
   const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid grid-cols-1 gap-1">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              {label}
            </span>
            <span className="font-bold text-foreground">
              {formatCurrency(payload[0].value)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Pagos por Semana (Mes Actual)</CardTitle>
        <CardDescription>Total de cheques a vencer cada semana.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false}/>
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${Number(value) / 1000}k`} />
            <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<CustomTooltip />} />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
              {weeklyData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.total < 0 ? 'hsl(var(--destructive))' : '#10b981'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}


export function PaymentCalendar({ cheques }: { cheques: Cheque[] }) {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const threeDaysFromNow = addDays(today, 3);

  const chequesDueToday = cheques.filter(c => isSameDay(parseISO(c.dueDate), today));
  const chequesDueIn3Days = cheques.filter(c => {
    const dueDate = parseISO(c.dueDate);
    return isSameDay(dueDate, addDays(today, 1)) || isSameDay(dueDate, addDays(today, 2)) || isSameDay(dueDate, addDays(today, 3));
  });

  const dueDates = cheques.map(c => parseISO(c.dueDate));
  
  const selectedDayCheques = date ? cheques.filter(c => isSameDay(parseISO(c.dueDate), date)) : [];
  const calculateNetFlow = (chequesList: Cheque[]) => {
      return chequesList.reduce((acc, c) => {
          const amount = parseFloat(c.amount) || 0;
          return c.type === 'tercero' ? acc + amount : acc - amount;
      }, 0);
  };
  
  const netToday = calculateNetFlow(chequesDueToday);
  const net3Days = calculateNetFlow(chequesDueIn3Days);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="flex flex-col gap-8">
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 h-fit'>
              <Card>
                  <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">Vencen Hoy</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className={cn("text-2xl font-bold", netToday < 0 ? "text-destructive" : "text-emerald-500")}>
                          {netToday < 0 ? '-' : ''}{formatCurrency(Math.abs(netToday))}
                      </div>
                      <p className="text-xs text-muted-foreground">{chequesDueToday.length} cheques</p>
                  </CardContent>
              </Card>
              <Card>
                  <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">Próximos 3 Días</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className={cn("text-2xl font-bold", net3Days < 0 ? "text-destructive" : "text-emerald-500")}>
                          {net3Days < 0 ? '-' : ''}{formatCurrency(Math.abs(net3Days))}
                      </div>
                      <p className="text-xs text-muted-foreground">{chequesDueIn3Days.length} cheques</p>
                  </CardContent>
              </Card>
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-8">
          <Card className="flex justify-center">
              <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="p-3"
                  classNames={{
                    caption: "flex justify-center pt-1 relative items-center mb-4",
                    head_row: "flex justify-around",
                    row: "flex w-full mt-2 justify-around",
                    day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md",
                  }}
                  locale={es}
                  modifiers={{ due: dueDates }}
                  modifiersClassNames={{ 
                      due: 'bg-primary/20',
                      selected: 'bg-primary text-primary-foreground',
                  }}
              />
          </Card>
          <Card>
              <CardHeader>
              <CardTitle>Vencimientos para {date ? format(date, 'PPP', { locale: es }) : '...'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
              {selectedDayCheques.length > 0 ? (
                  selectedDayCheques.map(cheque => (
                  <div key={cheque.id} className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/50">
                      <div>
                      <p className="font-semibold">{cheque.beneficiary}</p>
                      <p className="text-muted-foreground">Cheque #{cheque.chequeNumber}</p>
                      </div>
                      <div className={cn("font-bold text-right", cheque.type === 'tercero' ? "text-emerald-500" : "text-destructive")}>
                          {cheque.type === 'tercero' ? '+' : '-'}{formatCurrency(cheque.amount)}
                      </div>
                  </div>
                  ))
              ) : (
                  <p className="text-muted-foreground text-center py-8">No hay vencimientos para este día.</p>
              )}
              </CardContent>
        </Card>
        </div>
      </div>
      <WeeklyPaymentsChart cheques={cheques} />
    </div>
  );
}
