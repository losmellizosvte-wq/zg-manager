import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const adminFirestore = admin.firestore();
export const adminMessaging = admin.messaging();
