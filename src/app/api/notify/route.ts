import { NextResponse } from 'next/server';
import { getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, message } = body;

    if (!getApps().length) {
      initializeApp({ credential: applicationDefault() });
    }

    const db = getFirestore();
    const messaging = getMessaging();

    // 1. Fetch all registered FCM tokens
    const tokensSnapshot = await db.collection('fcm_tokens').get();
    const tokens = tokensSnapshot.docs.map(doc => doc.data().token).filter(t => !!t);

    // 2. Save alert to Firestore so it shows in the UI Bell
    await db.collection('alerts').add({
      title,
      body: message,
      isRead: false,
      createdAt: new Date()
    });

    // 3. Send Push Notification to all active devices
    if (tokens.length > 0) {
      await messaging.sendEachForMulticast({
        tokens,
        notification: {
          title,
          body: message
        }
      });
    }

    return NextResponse.json({ success: true, sentTo: tokens.length });
  } catch (error: any) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
