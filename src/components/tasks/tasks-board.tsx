'use client';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, User } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Task, type Executive } from '@/lib/types';
import { TaskItem } from './task-item';
import { isBefore, parseISO, subDays } from 'date-fns';
import { NewTaskDialog } from './tasks-list';

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

function getTaskCompletionDate(task: Task): Date {
    if (!task.completedAt) return new Date(0); // For sorting, put tasks without date first
    if (task.completedAt instanceof Date) {
        return task.completedAt;
    }
    if (task.completedAt && typeof (task.completedAt as any).toDate === 'function') {
        return (task.completedAt as any).toDate();
    }
    return new Date(task.completedAt as unknown as string);
}

interface TasksBoardProps {
    initialTasks: Task[];
    executives: readonly Executive[];
    onAddTask: (data: Omit<Task, 'id' | 'isCompleted' | 'completedAt' | 'creatorId' | 'creationDate'>) => Promise<boolean>;
    onToggleTask: (id: string) => void;
}


function TaskColumn({ title, tasks, onToggleTask }: { title: string; tasks: Task[]; onToggleTask: (id: string) => void }) {
  return (
    <div className="w-[320px] flex-shrink-0 flex flex-col gap-4">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-lg font-semibold text-foreground/80">{title}</h2>
        <span className="px-2 py-0.5 text-sm font-semibold rounded-md bg-primary/10 text-primary">
          {tasks.length}
        </span>
      </div>
      <div className="flex-1 space-y-3 rounded-lg bg-muted/40 p-2 overflow-y-auto">
        {tasks.length > 0 ? (
          tasks.map(task => <TaskItem key={task.id} task={task} onToggle={onToggleTask} />)
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              No hay tareas aquí.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


export function TasksBoard({ initialTasks, executives, onAddTask, onToggleTask }: TasksBoardProps) {
  const [filterAssignee, setFilterAssignee] = React.useState<Executive | 'Todos'>('Todos');
  
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const filteredTasks = initialTasks.filter(t => 
    filterAssignee === 'Todos' || t.assignee === filterAssignee
  );

  const pendingTasks = filteredTasks.filter(t => !t.isCompleted && !isBefore(getTaskDate(t), today));
  const overdueTasks = filteredTasks.filter(t => !t.isCompleted && isBefore(getTaskDate(t), today));
  
  const allCompletedTasks = filteredTasks.filter(t => {
      if (!t.isCompleted) return false;
      const compDate = getTaskCompletionDate(t);
      return !isBefore(compDate, subDays(today, 2));
  });
  const sortedCompletedTasks = allCompletedTasks.sort((a, b) => {
    const dateA = getTaskCompletionDate(a);
    const dateB = getTaskCompletionDate(b);
    return dateB.getTime() - dateA.getTime();
  });
  const completedTasks = sortedCompletedTasks.slice(0, 6);

  return (
    <div className="flex flex-col h-full">
        {/* Header with Filters */}
        <div className="flex-shrink-0 flex items-center justify-between gap-4 pb-4">
            <div className='flex items-center gap-2'>
                <User className="h-4 w-4 text-muted-foreground" />
                <Select value={filterAssignee} onValueChange={(value) => setFilterAssignee(value as any)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filtrar por responsable" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Todos">Todos</SelectItem>
                        {executives.map(name => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <NewTaskDialog onSave={onAddTask}>
                <Button>
                    <PlusCircle className="mr-2" />
                    Nueva Tarea
                </Button>
            </NewTaskDialog>
        </div>

        {/* Board - this is the main container for the columns */}
        <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
            <TaskColumn title="Pendientes" tasks={pendingTasks} onToggleTask={onToggleTask} />
            <TaskColumn title="Atrasadas" tasks={overdueTasks} onToggleTask={onToggleTask} />
            <TaskColumn title="Completadas Recientes" tasks={completedTasks} onToggleTask={onToggleTask} />
        </div>
    </div>
  );
}
