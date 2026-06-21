'use client';
import * as React from 'react';
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Task } from "@/lib/types";
import { cn } from '@/lib/utils';
import { format, isBefore, parseISO, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from 'lucide-react';
import { Badge } from '../ui/badge';

function DueDateBadge({ dueDate, isCompleted }: { dueDate: any; isCompleted: boolean }) {
  if (isCompleted) {
    return null;
  }
  const taskDate = dueDate.toDate ? dueDate.toDate() : parseISO(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isBefore(taskDate, today)) {
    return <Badge variant="destructive">Atrasada</Badge>;
  }
  if (isToday(taskDate)) {
    return <Badge className="bg-amber-500 hover:bg-amber-500/80 text-white">Vence Hoy</Badge>;
  }
  return null;
}

export function TaskItem({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) {
  const [isPending, startTransition] = React.useTransition();

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    startTransition(() => {
      onToggle(task.id);
    });
  };

  const taskDate = task.dueDate?.toDate ? task.dueDate.toDate() : new Date(task.dueDate);

  return (
    <Card
      className={cn(
        "group cursor-pointer hover:shadow-md transition-shadow",
        isPending && "opacity-50",
        task.isCompleted && "bg-muted/40"
      )}
      onClick={handleToggle}
    >
      <div className="p-3 space-y-2">
        <p className={cn("font-semibold leading-snug", task.isCompleted && "line-through text-muted-foreground")}>
          {task.title}
        </p>
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{format(taskDate, "d MMM", { locale: es })}</span>
                <DueDateBadge dueDate={task.dueDate} isCompleted={task.isCompleted} />
            </div>
            <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs bg-primary/20 text-primary font-semibold">
                {task.assignee.charAt(0)}
                </AvatarFallback>
            </Avatar>
        </div>
      </div>
    </Card>
  );
}
