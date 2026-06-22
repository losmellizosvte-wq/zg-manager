'use client';

import * as React from 'react';
import { StatsCards } from "@/components/dashboard/stats-cards";
import { TasksOverview } from "@/components/dashboard/tasks-overview";
import { ChequesChart } from "@/components/dashboard/cheques-chart";
import { Cheque, Task, Invoice } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { addDays, startOfMonth, endOfMonth, isAfter, isBefore, isWithinInterval } from 'date-fns';
import { ExecutiveSummary } from '@/components/dashboard/executive-summary';

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard Gerencial</h1>
      
      <Skeleton className="h-[140px]" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-[126px]" />
        <Skeleton className="h-[126px]" />
        <Skeleton className="h-[126px]" />
        <Skeleton className="h-[126px]" />
      </div>
      
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        <Skeleton className="lg:col-span-4 h-[400px]" />
        <Skeleton className="lg:col-span-3 h-[400px]" />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const firestore = useFirestore();

  const tasksQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'tasks'));
  }, [firestore]);

  const chequesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'cheques'));
  }, [firestore]);

  const invoicesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'invoices'));
  }, [firestore]);


  const { data: allTasks, isLoading: areTasksLoading } = useCollection<Task>(tasksQuery, { listen: true });
  const { data: allCheques, isLoading: areChequesLoading } = useCollection<Cheque>(chequesQuery, { listen: true });
  const { data: allInvoices, isLoading: areInvoicesLoading } = useCollection<Invoice>(invoicesQuery, { listen: true });

  const pendingTasks = React.useMemo(() => (allTasks || []).filter(t => !t.isCompleted), [allTasks]);

  const dashboardData = React.useMemo(() => {
    if (!allCheques || !allInvoices) return null;
    
    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    const currentMonthEnd = endOfMonth(today);
    const nextMonth = addDays(currentMonthEnd, 1);
    const nextMonthStart = startOfMonth(nextMonth);
    const nextMonthEnd = endOfMonth(nextMonth);

    const chequesThisMonth = allCheques.filter(c => {
        const dueDate = new Date(c.dueDate.split('-').join('/'));
        return isAfter(dueDate, currentMonthStart) && isBefore(dueDate, currentMonthEnd);
    });

    const emitidosThisMonth = chequesThisMonth.filter(c => !c.type || c.type === 'emitido');
    const tercerosThisMonth = chequesThisMonth.filter(c => c.type === 'tercero');

    const totalEmitidosThisMonth = emitidosThisMonth.reduce((sum, c) => sum + parseFloat(c.amount), 0);
    const debitedThisMonth = emitidosThisMonth.filter(c => c.status === 'Debitado').reduce((sum, c) => sum + parseFloat(c.amount), 0);
    const remainingToCoverThisMonth = totalEmitidosThisMonth - debitedThisMonth;
    
    const tercerosACobrarThisMonth = tercerosThisMonth.filter(c => c.status !== 'Debitado').reduce((sum, c) => sum + parseFloat(c.amount), 0);

    const totalChequesNextMonth = allCheques.filter(c => {
        const dueDate = new Date(c.dueDate.split('-').join('/'));
        return (!c.type || c.type === 'emitido') && isAfter(dueDate, nextMonthStart) && isBefore(dueDate, nextMonthEnd);
    }).reduce((sum, c) => sum + parseFloat(c.amount), 0);
    
    const pendingInvoicesAmountThisMonth = allInvoices.filter(inv => {
      if (!inv.date) return false;
      const invoiceDate = inv.date.toDate ? inv.date.toDate() : new Date(inv.date.split('-').join('/'));
      return inv.internalStatus !== 'Pagada' && isWithinInterval(invoiceDate, { start: currentMonthStart, end: currentMonthEnd });
    }).reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0);

    return {
        remainingToCoverThisMonth,
        totalChequesNextMonth,
        totalEmitidosThisMonth,
        emitidosThisMonth,
    };
  }, [allCheques, allInvoices]);

  const isLoading = areTasksLoading || areChequesLoading || areInvoicesLoading || !dashboardData;

  if (isLoading) {
    return <DashboardSkeleton />;
  }
  
  const { 
    remainingToCoverThisMonth,
    totalChequesNextMonth,
    totalEmitidosThisMonth,
    emitidosThisMonth
  } = dashboardData!;
  
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard Gerencial</h1>

      <ExecutiveSummary 
        tasks={allTasks || []}
        cheques={allCheques || []}
        invoices={allInvoices || []}
      />
      
      <StatsCards 
        totalEmitidosThisMonth={totalEmitidosThisMonth}
        remainingToCoverThisMonth={remainingToCoverThisMonth}
        totalChequesNextMonth={totalChequesNextMonth}
      />
      
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
            <ChequesChart cheques={emitidosThisMonth} />
        </div>
        <div className="lg:col-span-3">
          <TasksOverview tasks={pendingTasks || []} />
        </div>
      </div>
    </div>
  );
}
