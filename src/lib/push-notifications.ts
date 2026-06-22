import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { initializeFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp, getFirestore } from 'firebase/firestore';

const VAPID_KEY = 'BJbY9s78miTi195wkqjHLVQIjUdADnvaDSzieFshtIDzotHfT4gpuaEZNX9VbYJX22dRd7BNchdWJxiXEOAVH3A';

export async function requestNotificationPermission(userId: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn('Firebase Messaging is not supported in this browser.');
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission not granted.');
      return false;
    }

    const { firebaseApp } = initializeFirebase();
    const messaging = getMessaging(firebaseApp);
    
    // Register the service worker manually to ensure it uses the right path
    let registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    if (!registration) {
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    }

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
      
      return true;
    } else {
      console.warn('No registration token available.');
      return false;
    }
  } catch (error) {
    console.error('An error occurred while retrieving token. ', error);
    return false;
  }
}
