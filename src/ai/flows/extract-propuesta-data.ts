'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { fuzzyMatchProvider } from '@/ai/utils';

const ExtractPropuestaInputSchema = z.object({
  dataUri: z.string().describe("Photo or PDF of a TALKIU/Red del Sol proposal."),
});
export type ExtractPropuestaInput = z.infer<typeof ExtractPropuestaInputSchema>;

const ExtractPropuestaOutputSchema = z.object({
  provider: z.string().describe('El nombre de la marca o empresa proveedora (ej. Codini).'),
  validityDate: z.string().describe('Vigencia de la propuesta o fecha de confirmación (ej. 19-06-2026 a 23-06-2026).'),
  estimatedDelivery: z.string().describe('Fecha de entrega aproximada (ej. 30/06). Si no hay, dejar vacío.').optional(),
  paymentTerms: z.string().describe('Condición de pago elegida o mencionada (ej. E-CHEQ-60 DIAS).').optional(),
  items: z.array(
    z.object({
      description: z.string().describe('Descripción detallada del producto (ej. AIAS4507BC Codini Lavarropas).'),
      quantity: z.number().describe('Unidades compradas (ej. 2).')
    })
  ).describe('Lista de artículos comprados en esta propuesta.')
});
export type ExtractPropuestaOutput = z.infer<typeof ExtractPropuestaOutputSchema>;

export async function extractPropuestaData(input: ExtractPropuestaInput): Promise<ExtractPropuestaOutput> {
  return extractPropuestaFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractPropuestaDataPrompt',
  input: {schema: ExtractPropuestaInputSchema},
  output: {schema: ExtractPropuestaOutputSchema},
  config: { temperature: 0.1 },
  prompt: `Eres un asistente inteligente para una empresa Retail en Argentina. Tu tarea es leer una captura de pantalla o PDF de una "Propuesta Confirmada" de compra, generalmente de portales como TALKIU o Red del Sol ACE.
  
  Extrae la siguiente información:
  - provider: La marca o proveedor (Ej: Codini, Liliana, Drean). Ignora si dice "Empresa socia: ZAWADZKI GROUP".
  - validityDate: Rango de vigencia o fecha de confirmación (Ej: "19-06-2026 a 23-06-2026").
  - estimatedDelivery: Entrega Aproximada (Ej: "30/06").
  - paymentTerms: Método de pago, Ej: "E-CHEQ-60 DIAS" o "Cheque 60 días".
  - items: Lista de productos comprados, sacando la "Descripción" y las "Unidades" exactas.

  Documento: {{media url=dataUri}}

  Devuelve los datos estrictamente como un objeto JSON según el esquema solicitado.`,
});

const extractPropuestaFlow = ai.defineFlow(
  {
    name: 'extractPropuestaFlow',
    inputSchema: ExtractPropuestaInputSchema,
    outputSchema: ExtractPropuestaOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (output && output.provider) {
      output.provider = fuzzyMatchProvider(output.provider);
    }
    return output!;
  }
);
