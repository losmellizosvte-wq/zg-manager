'use client';
import * as React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { requestNotificationPermission } from '@/lib/push-notifications';
import { useToast } from '@/hooks/use-toast';

export function NotificationPrompt() {
    const { user } = useUser();
    const { toast } = useToast();
    const [status, setStatus] = React.useState<NotificationPermission | 'unsupported'>('default');
    const [isLoading, setIsLoading] = React.useState(false);
    const [dismissed, setDismissed] = React.useState(false);

    React.useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setStatus(Notification.permission);
        } else {
            setStatus('unsupported');
        }
    }, []);

    const handleEnable = async () => {
        if (!user) return;
        setIsLoading(true);
        const result = await requestNotificationPermission(user.uid);
      if (result.success) {
        toast({
          title: "¡Excelente!",
          description: "Las notificaciones se activaron correctamente. Estarás al tanto de los próximos Echeqs.",
        });
        setDismissed(true);
      } else {
        toast({
          title: "Error",
          description: `No se pudieron activar las notificaciones. Detalle: ${result.error}`,
          variant: "destructive",
        });
      }  setIsLoading(false);
    };

    if (status === 'granted' || status === 'unsupported' || !user || dismissed) {
        return null; // Do not show if already granted, unsupported or not logged in
    }

    return (
        <Button 
            variant="outline" 
            size="sm" 
            className="flex gap-2 text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:border-amber-800"
            onClick={handleEnable}
            disabled={isLoading}
        >
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Activar Alertas</span>
        </Button>
    );
}
