import { NextResponse } from 'next/server';
import { adminFirestore, adminMessaging } from '@/lib/firebase-admin';
import { startOfDay, isBefore } from 'date-fns';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  // Simple hardcoded secret for the cron job (in a real app, use env vars)
  if (secret !== 'zgm-cron-secret-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Fetch pending tasks
    const tasksSnapshot = await adminFirestore.collection('tasks').where('isCompleted', '==', false).get();
    let pendingCount = 0;
    let overdueCount = 0;
    const today = startOfDay(new Date());

    tasksSnapshot.forEach(doc => {
      const data = doc.data();
      const dueDate = data.dueDate ? data.dueDate.toDate() : null;
      pendingCount++;
      if (dueDate && isBefore(dueDate, today)) {
        overdueCount++;
      }
    });

    if (pendingCount === 0) {
      return NextResponse.json({ success: true, message: 'No tasks to notify' });
    }

    const messageBody = `Tienes ${pendingCount} tareas pendientes` + (overdueCount > 0 ? ` (${overdueCount} atrasadas).` : '.');

    // 2. Fetch all FCM tokens
    const tokensSnapshot = await adminFirestore.collection('fcmTokens').get();
    const tokens: string[] = [];
    tokensSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.token) tokens.push(data.token);
    });

    if (tokens.length === 0) {
      return NextResponse.json({ success: true, message: 'No devices registered for push notifications' });
    }

    // 3. Send multicast message
    const message = {
      notification: {
        title: 'ZG Manager - Resumen Diario',
        body: messageBody,
      },
      tokens: tokens,
    };

    const response = await adminMessaging.sendEachForMulticast(message);
    
    return NextResponse.json({ 
      success: true, 
      notifiedDevices: response.successCount,
      failedDevices: response.failureCount 
    });

  } catch (error: any) {
    console.error('Error in cron task:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
