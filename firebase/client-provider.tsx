'use client';

import React, { useMemo, useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { User, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { AppHeader } from '@/components/app-header';
import { Skeleton } from '@/components/ui/skeleton';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

function LoadingSkeleton() {
    return (
      <SidebarProvider>
        <Sidebar variant="inset" collapsible="icon">
          <AppSidebar />
        </Sidebar>
        <SidebarInset>
          <div className="flex flex-col h-full">
              <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 md:px-8">
                <Skeleton className="h-8 w-24" />
              </header>
              <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col gap-8">
                  <h1 className="text-3xl font-bold tracking-tight"><Skeleton className="h-10 w-1/2" /></h1>
                  
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
              </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [userError, setUserError] = useState<Error | null>(null);

  const { firebaseApp, firestore, auth } = useMemo(() => {
    return initializeFirebase();
  }, []);

  useEffect(() => {
    if (!auth) {
      setIsUserLoading(false);
      setUserError(new Error("Auth service not available."));
      return;
    }
    
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          setIsUserLoading(false);
          setUserError(null);
        } else {
          // No user, attempt anonymous sign-in
          signInAnonymously(auth).catch((error) => {
            console.error("FirebaseClientProvider: Anonymous sign-in failed", error);
            setUserError(error);
            setIsUserLoading(false);
          });
        }
      },
      (error) => {
        console.error("FirebaseClientProvider: Auth state error", error);
        setUserError(error);
        setIsUserLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth]);

  if (isUserLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      auth={auth}
      firestore={firestore}
      user={user}
      isUserLoading={isUserLoading}
      userError={userError}
    >
      {children}
    </FirebaseProvider>
  );
}
