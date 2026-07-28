'use client';

import { useEffect, useState } from 'react';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { useFirebase, useUser } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';

export function useFCM() {
  const { app, firestore } = useFirebase();
  const { user } = useUser();
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    if (!app || !firestore || !user) return;

    const setupFCM = async () => {
      try {
        const supported = await isSupported();
        if (!supported) {
          console.log('FCM not supported by this browser.');
          return;
        }

        const messaging = getMessaging(app);
        
        // Request permission
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const currentToken = await getToken(messaging, {
            vapidKey: 'BJbY9s78miTi195wkqjHLVQIjUdADnvaDSzieFshtIDzotHfT4gpuaEZNX9VbYJX22dRd7BNchdWJxiXEOAVH3A'
          });

          if (currentToken) {
            setFcmToken(currentToken);
            // Save token to firestore to use it for push notifications
            await setDoc(doc(firestore, 'fcm_tokens', user.uid), {
              token: currentToken,
              updatedAt: new Date()
            }, { merge: true });
          }
        }

        // Handle foreground messages
        onMessage(messaging, (payload) => {
          console.log('Foreground Message received. ', payload);
          // We could trigger a toast here if we wanted
        });
      } catch (error) {
        console.error('Error setting up FCM:', error);
      }
    };

    setupFCM();
  }, [app, firestore, user]);

  return { fcmToken };
}
