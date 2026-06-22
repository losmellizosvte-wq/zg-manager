import { ai } from '@/ai/genkit';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const input = await req.json();

    const promptText = `You are an expert financial advisor and COO assistant for a small business CEO in Argentina. Your name is 'ZGAI'. Your language is Spanish.

The CEO is busy and needs a quick, actionable executive summary based on the current state of the business. Analyze the following JSON data which contains pending tasks, upcoming cheque payments, and received invoices.

Tasks:
${JSON.stringify(input.tasks)}

Cheques:
${JSON.stringify(input.cheques)}

Invoices:
${JSON.stringify(input.invoices)}

Based on this data, provide a concise but insightful "Resumen Ejecutivo". Structure your response with the following sections using markdown for formatting:

### 🧠 Resumen Ejecutivo de ZGAI

**🚨 Alertas Urgentes:**
- List any overdue tasks, mentioning who is responsible.
- List any cheques that are due to be debited TODAY or in the next 3 days. Mention the beneficiary and amount.

**💰 Foco Financiero:**
- State the total amount of money committed in pending cheques for the next 30 days.
- Mention the top 3 largest pending invoices by amount, including the provider and total.

**🎯 Gestión de Equipo:**
- Provide a brief overview of the task distribution. Who has the most pending tasks?
- Highlight any high-priority items if mentioned in task titles.

**📊 Análisis de Costos (Basado en las categorías asignadas):**
- Proporciona un resumen porcentual de los gastos por categoría para las facturas listadas. Si una factura no tiene categoría, trátala como 'Varios'. Por ejemplo: "Este mes, los mayores gastos se concentran en 'Compra de Mercadería' (XX%) y 'Servicios' (YY%)".
- Busca patrones o anomalías en los datos actuales.
- Si no hay facturas con categoría, indícalo claramente.

Keep the tone professional, concise, and helpful. You are the CEO's trusted digital ally. If there is no data for a section, state that clearly (e.g., "No hay alertas urgentes.").
OUTPUT ONLY MARKDOWN. DO NOT WRAP IN JSON.`;

    const { stream } = await ai.generateStream({
      model: 'googleai/gemini-2.5-pro',
      prompt: promptText,
      config: { temperature: 0.2 },
    });

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.text) {
              controller.enqueue(new TextEncoder().encode(chunk.text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      }
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('Streaming error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
