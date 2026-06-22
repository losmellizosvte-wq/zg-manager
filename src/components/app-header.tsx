'use client';

import { SidebarTrigger } from "@/components/ui/sidebar";
import { FullLogo } from "@/components/logo";
import { Bell } from "lucide-react";
import { useFCM } from "@/hooks/use-fcm";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { useFirebase } from "@/firebase";
import { GlobalCalculatorSheet } from "@/components/calculator/global-calculator-sheet";

export function AppHeader() {
  useFCM(); // Initialize FCM and request permissions
  const { firestore } = useFirebase();
  const [alerts, setAlerts] = useState<{ id: string, title: string, body: string, isRead: boolean }[]>([]);
  
  useEffect(() => {
    if (!firestore) return;
    const q = query(collection(firestore, 'alerts'), orderBy('createdAt', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newAlerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setAlerts(newAlerts);
    });
    return () => unsubscribe();
  }, [firestore]);

  const unreadCount = alerts.filter(a => !a.isRead).length;

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-8">
      <SidebarTrigger className="md:hidden" />
      <div className="hidden md:block">
        <FullLogo />
      </div>
      <div className="flex w-full items-center justify-end gap-2">
        <GlobalCalculatorSheet />
        <Popover>
          <PopoverTrigger className="relative p-2 rounded-full hover:bg-slate-100 transition-colors">
            <Bell className="h-5 w-5 text-slate-700" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 mr-4 mt-2 border-slate-200/60 shadow-xl backdrop-blur-xl bg-white/95" align="end">
            <div className="p-4 border-b">
              <h4 className="font-semibold text-sm">Alertas del Sistema</h4>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No hay alertas recientes.</div>
              ) : (
                alerts.map(alert => (
                  <div key={alert.id} className={`p-4 border-b last:border-0 hover:bg-slate-50 transition-colors ${!alert.isRead ? 'bg-blue-50/30' : ''}`}>
                    <p className="font-medium text-sm text-slate-900">{alert.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{alert.body}</p>
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

      </div>
    </header>
  );
}
