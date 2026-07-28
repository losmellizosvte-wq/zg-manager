import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { initializeFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp, getFirestore } from 'firebase/firestore';

const VAPID_KEY = 'BJbY9s78miTi195wkqjHLVQIjUdADnvaDSzieFshtIDzotHfT4gpuaEZNX9VbYJX22dRd7BNchdWJxiXEOAVH3A';

export async function requestNotificationPermission(userId: string): Promise<{success: boolean, error?: string}> {
  if (typeof window === 'undefined') return {success: false, error: 'SSR'};

  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn('Firebase Messaging is not supported in this browser.');
      return {success: false, error: 'Not supported'};
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission not granted.');
      return {success: false, error: 'Permission denied'};
    }

    const { firebaseApp } = initializeFirebase();
    const messaging = getMessaging(firebaseApp);
    
    // next-pwa handles the service worker registration
    const registration = await navigator.serviceWorker.ready;

    const currentToken = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (currentToken) {
      // Save the token to Firestore
      const db = getFirestore(firebaseApp);
      await setDoc(doc(db, 'fcmTokens', userId), {
        token: currentToken,
        updatedAt: serverTimestamp(),
        userId: userId
      }, { merge: true });
      
      return {success: true};
    } else {
      console.warn('No registration token available.');
      return {success: false, error: 'No token available from Firebase'};
    }
  } catch (error: any) {
    console.error('An error occurred while retrieving token. ', error);
    return {success: false, error: error.message || String(error)};
  }
}
