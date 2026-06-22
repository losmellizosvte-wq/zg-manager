import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

if (!getApps().length) {
  try {
    initializeApp();
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const adminFirestore = getFirestore();
export const adminMessaging = getMessaging();
