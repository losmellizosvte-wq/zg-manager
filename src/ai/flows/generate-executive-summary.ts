'use server';
/**
 * @fileOverview An AI flow to generate an executive summary for a CEO.
 *
 * - generateExecutiveSummary - A function that handles the summary generation process.
 * - ExecutiveSummaryInput - The input type for the function.
 * - ExecutiveSummaryOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Cheque, Invoice, Task } from '@/lib/types';

// We use simplified schemas for the prompt to be more efficient
const SimplifiedInvoiceSchema = z.object({
  provider: z.string(),
  totalAmount: z.string(),
  date: z.string(),
  internalStatus: z.string(),
  category: z.string().optional(),
});

const SimplifiedChequeSchema = z.object({
  beneficiary: z.string(),
  amount: z.string(),
  dueDate: z.string(),
  status: z.string(),
});

const SimplifiedTaskSchema = z.object({
  title: z.string(),
  assignee: z.string(),
  dueDate: z.string(),
  isCompleted: z.boolean(),
});

const ExecutiveSummaryInputSchema = z.object({
  invoices: z.array(SimplifiedInvoiceSchema).describe('List of recent invoices.'),
  cheques: z.array(SimplifiedChequeSchema).describe('List of cheques issued.'),
  tasks: z.array(SimplifiedTaskSchema).describe('List of tasks for the team.'),
});
export type ExecutiveSummaryInput = z.infer<typeof ExecutiveSummaryInputSchema>;

const ExecutiveSummaryOutputSchema = z.object({
  summary: z.string().describe('The executive summary in Markdown format.'),
});
export type ExecutiveSummaryOutput = z.infer<typeof ExecutiveSummaryOutputSchema>;

export async function generateExecutiveSummary(input: ExecutiveSummaryInput): Promise<ExecutiveSummaryOutput> {
  return generateExecutiveSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateExecutiveSummaryPrompt',
  input: { schema: ExecutiveSummaryInputSchema },
  output: { schema: ExecutiveSummaryOutputSchema },
  config: { temperature: 0.2 },
  prompt: `You are an expert financial advisor and COO assistant for a small business CEO in Argentina. Your name is 'ZGAI'. Your language is Spanish.

  The CEO is busy and needs a quick, actionable executive summary based on the current state of the business. Analyze the following JSON data which contains pending tasks, upcoming cheque payments, and received invoices.

  Tasks:
  {{{json tasks}}}

  Cheques:
  {{{json cheques}}}

  Invoices:
  {{{json invoices}}}

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
  - **Busca patrones o anomalías en los datos actuales.** ¿Hay un proveedor que domina una categoría de alto gasto? ¿Hay muchas facturas pequeñas en una misma categoría que se podrían consolidar? Sé proactivo en tus sugerencias. Por ejemplo: "El proveedor [Nombre] representa el 60% de los gastos en 'Compra de Mercadería', podría ser un punto para optimizar costos." o "Se observan múltiples facturas de 'Librería y Oficina', se podría evaluar un único proveedor para obtener mejores precios."
  - If no invoices have categories assigned, state that clearly: "Asigne categorías a las facturas para poder analizar los costos."

  Keep the tone professional, concise, and helpful. You are the CEO's trusted digital ally. If there is no data for a section, state that clearly (e.g., "No hay alertas urgentes.").
  
  IMPORTANT: Your response MUST be a valid JSON object. It must contain a single key named "summary". The value for "summary" must be a string containing the complete executive summary formatted in Markdown.
  Example of a valid response:
  {
    "summary": "### 🧠 Resumen Ejecutivo de ZGAI\\n\\n**🚨 Alertas Urgentes:**\\n- No hay alertas urgentes."
  }
  Do not add any text, comments, or markdown formatting outside of the JSON structure.
  `,
});

const generateExecutiveSummaryFlow = ai.defineFlow(
  {
    name: 'generateExecutiveSummaryFlow',
    inputSchema: ExecutiveSummaryInputSchema,
    outputSchema: ExecutiveSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
