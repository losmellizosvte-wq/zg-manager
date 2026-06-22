import { NextResponse } from 'next/server';
import { getApps, initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    // Secure the endpoint with a simple shared secret token
    if (token !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!getApps().length) {
      initializeApp({
        credential: applicationDefault()
      });
    }

    const db = getFirestore();
    const tasksRef = db.collection('tasks');
    
    // Purge tasks completed more than 48 hours ago
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    
    const snapshot = await tasksRef
      .where('isCompleted', '==', true)
      .where('completedAt', '<', fortyEightHoursAgo)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    if (snapshot.size > 0) {
      await batch.commit();
    }

    return NextResponse.json({ 
      success: true, 
      purgedCount: snapshot.size,
      message: `Purged ${snapshot.size} tasks.`
    });
  } catch (error: any) {
    console.error('Error purging tasks:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
