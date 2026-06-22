import { NextResponse } from 'next/server';
import { getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

export async function GET(request: Request) {
  try {
    if (!getApps().length) {
      initializeApp({ credential: applicationDefault() });
    }

    const db = getFirestore();
    const messaging = getMessaging();

    const propuestasSnapshot = await db.collection('propuestas').get();
    
    // Fetch tokens to send notifications
    const tokensSnapshot = await db.collection('fcm_tokens').get();
    const tokens = tokensSnapshot.docs.map(doc => doc.data().token).filter(t => !!t);

    let alertsSent = 0;
    const now = new Date();

    for (const doc of propuestasSnapshot.docs) {
      const data = doc.data();
      const status = data.status || 'Confirmada';
      
      // Ignore if it's already done
      if (status === 'Recibida') continue;

      // Find when it entered the current status
      let statusDate = data.registrationDate?.toDate() || new Date();
      if (data.statusHistory && data.statusHistory.length > 0) {
        // Find the latest entry for the current status
        const historyEntry = data.statusHistory.find((h: any) => h.status === status);
        if (historyEntry && historyEntry.date) {
            statusDate = new Date(historyEntry.date);
        }
      }

      const diffTime = Math.abs(now.getTime() - statusDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));

      let alertMessage = null;

      if (status === 'Confirmada') {
        const isACE = data.purchaseType === 'ACE';
        const limitDays = isACE ? 7 : 3; // 7 days ACE, 72h Directa
        if (diffDays >= limitDays) {
            alertMessage = `⚠️ Demora: La propuesta ${data.provider} lleva ${diffDays} días Confirmada sin Facturar.`;
        }
      } 
      else if (status === 'Facturada') {
        if (diffHours >= 48) {
            alertMessage = `⚠️ Demora: La factura de ${data.provider} está hace ${diffHours} horas sin picking/despacho.`;
        }
      }
      else if (status === 'Pago Enviado' || status === 'Picking') {
        if (diffHours >= 48) {
            alertMessage = `⚠️ Demora Logística: ${data.provider} en ${status} hace más de 48 hs. Faltaría el transporte.`;
        }
      }

      if (alertMessage && tokens.length > 0) {
        // Optional: Save alert to history so it doesn't spam every hour if cron runs frequently.
        // We'll just dispatch it for now. Assuming this CRON runs ONCE a day.
        
        await db.collection('alerts').add({
            title: "Auditoría Logística",
            body: alertMessage,
            isRead: false,
            createdAt: new Date(),
            propuestaId: doc.id
        });

        await messaging.sendEachForMulticast({
            tokens,
            notification: {
              title: "Auditoría Logística",
              body: alertMessage
            }
        });
        alertsSent++;
      }
    }

    return NextResponse.json({ success: true, alertsSent, totalEvaluated: propuestasSnapshot.size });
  } catch (error: any) {
    console.error('Error en Auditoría Logística:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
