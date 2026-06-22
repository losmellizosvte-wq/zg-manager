'use client';

import * as React from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { addDays } from 'date-fns';
import { executives, Task } from "@/lib/types";
import { TasksBoard } from "@/components/tasks/tasks-board";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function TareasPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const tasksQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'tasks'));
  }, [firestore]);

  const { data: tasks, isLoading: areTasksLoading } = useCollection<Task>(tasksQuery, {
    listen: true,
  });
  
  const handleAddTask = async (data: Omit<Task, 'id' | 'isCompleted' | 'completedAt' | 'creatorId' | 'creationDate'>): Promise<boolean> => {
      if (!user || !firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Debe estar autenticado para realizar esta acción.' });
        return false;
      }
      
      const tasksCollection = collection(firestore, 'tasks');
      const taskPayload = {
          ...data,
          creatorId: user.uid,
          creationDate: serverTimestamp(),
          isCompleted: false,
          completedAt: null,
      };

      addDoc(tasksCollection, taskPayload)
        .catch((serverError) => {
          const permissionError = new FirestorePermissionError({
            path: tasksCollection.path,
            operation: 'create',
            requestResourceData: taskPayload,
          });
          errorEmitter.emit('permission-error', permissionError);
        });
      
      toast({ title: 'Éxito', description: 'Tarea agregada.' });
      return true; // Optimistic success
  }
  
  const handleToggleTask = (id: string) => {
    if (!user || !firestore || !tasks) {
        toast({ variant: 'destructive', title: 'Error', description: 'Los datos no están listos o no está autenticado.' });
        return;
    }

    const taskToUpdate = tasks.find(t => t.id === id);
    if (!taskToUpdate) {
        return; // Task not found in local state, silently fail.
    }

    const taskRef = doc(firestore, 'tasks', id);
    const updatePayload = {
        isCompleted: !taskToUpdate.isCompleted,
        completedAt: !taskToUpdate.isCompleted ? serverTimestamp() : null
    };

    updateDoc(taskRef, updatePayload)
      .catch(serverError => {
          const permissionError = new FirestorePermissionError({
              path: taskRef.path,
              operation: 'update',
              requestResourceData: updatePayload,
          });
          errorEmitter.emit('permission-error', permissionError);
      });
      
    // Duplicate recurring task if it's being marked as completed
    if (!taskToUpdate.isCompleted && taskToUpdate.recurrence === 'weekly') {
        const tasksCollection = collection(firestore, 'tasks');
        const nextDueDate = taskToUpdate.dueDate?.toDate ? addDays(taskToUpdate.dueDate.toDate(), 7) : addDays(new Date(taskToUpdate.dueDate), 7);
        const newTaskPayload = {
            title: taskToUpdate.title,
            assignee: taskToUpdate.assignee,
            dueDate: nextDueDate,
            recurrence: 'weekly',
            creatorId: user.uid,
            creationDate: serverTimestamp(),
            isCompleted: false,
            completedAt: null,
        };
        addDoc(tasksCollection, newTaskPayload).catch(console.error);
    }
  }


  if (areTasksLoading) {
    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex-shrink-0">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-4 w-3/4 mt-2" />
            </div>
            <div className="flex-1 flex flex-col md:flex-row gap-6 md:overflow-x-auto overflow-y-auto pb-4">
                <div className="flex flex-col gap-4 w-full md:w-[320px] flex-shrink-0">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
                 <div className="flex flex-col gap-4 w-full md:w-[320px] flex-shrink-0">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-24 w-full" />
                </div>
                 <div className="flex flex-col gap-4 w-full md:w-[320px] flex-shrink-0">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 pb-4">
        <h1 className="text-3xl font-bold tracking-tight">Panel de Tareas</h1>
        <p className="text-muted-foreground">
          Organice, asigne y de seguimiento al trabajo del equipo gerencial.
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <TasksBoard 
          initialTasks={tasks || []} 
          executives={executives} 
          onAddTask={handleAddTask}
          onToggleTask={handleToggleTask}
          />
      </div>
    </div>
  );
}
