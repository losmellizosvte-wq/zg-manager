'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Task } from "@/lib/types";
import { isBefore, parseISO } from "date-fns";

function getTaskDate(task: Task): Date {
    if (task.dueDate instanceof Date) {
        return task.dueDate;
    }
    // Firestore Timestamps have a toDate method
    if (task.dueDate && typeof (task.dueDate as any).toDate === 'function') {
        return (task.dueDate as any).toDate();
    }
    // Fallback for string dates
    return parseISO(task.dueDate as unknown as string);
}

export function TasksOverview({ tasks }: { tasks: Task[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Tareas Pendientes del Equipo</CardTitle>
        <CardDescription>
          Tareas asignadas que aún no se han completado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tasks.length > 0 ? (
          <div className="space-y-4">
            {tasks.map((task) => {
              const taskDate = getTaskDate(task);
              const isOverdue = isBefore(taskDate, today);
              return (
              <div key={task.id} className="flex items-center p-2 rounded-md hover:bg-muted/50 transition-colors">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/20 text-primary font-semibold">{task.assignee.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">{task.title}</p>
                  <p className="text-sm text-muted-foreground">{task.assignee}</p>
                </div>
                {isOverdue && <div className="ml-auto text-xs font-semibold text-destructive px-2 py-1 bg-destructive/10 rounded-md">Atrasada</div>}
              </div>
            )})}
          </div>
        ) : (
          <div className="flex items-center justify-center h-40">
            <p className="text-sm text-muted-foreground text-center">No hay tareas pendientes.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
