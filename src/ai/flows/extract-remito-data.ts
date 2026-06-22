'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { fuzzyMatchProvider } from '@/ai/utils';

const ExtractRemitoDataInputSchema = z.object({
  remitoDataUri: z
    .string()
    .describe(
      "A photo or PDF of a remito (delivery note), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractRemitoDataInput = z.infer<typeof ExtractRemitoDataInputSchema>;

const ExtractRemitoDataOutputSchema = z.object({
  provider: z.string().describe('El nombre del proveedor que emite el remito.'),
  date: z.string().describe('La fecha del remito en formato YYYY-MM-DD.'),
  items: z.array(
    z.object({
      description: z.string().describe('Descripción del artículo o producto.'),
      quantity: z.number().describe('Cantidad del artículo recibido.')
    })
  ).describe('Lista de artículos detallados en el remito con sus respectivas cantidades.')
});
export type ExtractRemitoDataOutput = z.infer<typeof ExtractRemitoDataOutputSchema>;

export async function extractRemitoData(input: ExtractRemitoDataInput): Promise<ExtractRemitoDataOutput> {
  return extractRemitoDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractRemitoDataPrompt',
  input: {schema: ExtractRemitoDataInputSchema},
  output: {schema: ExtractRemitoDataOutputSchema},
  config: { temperature: 0.1 },
  prompt: `Eres un experto asistente logístico para una empresa en Argentina. Tu trabajo es extraer información clave de un "Remito" (documento de entrega de mercadería sin validez fiscal) de un proveedor.
  
  Extrae cuidadosamente los siguientes campos del remito:
  - provider: El nombre de la empresa proveedora que envía la mercadería.
  - date: La fecha del documento (formato YYYY-MM-DD).
  - items: Una lista de todos los artículos entregados. Por cada artículo, extrae su descripción y la cantidad numérica exacta.

  Remito: {{media url=remitoDataUri}}

  Asegúrate de que los datos sean precisos. Devuelve los datos como un objeto JSON y sigue estrictamente el esquema de salida.`,
});

const extractRemitoDataFlow = ai.defineFlow(
  {
    name: 'extractRemitoDataFlow',
    inputSchema: ExtractRemitoDataInputSchema,
    outputSchema: ExtractRemitoDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (output && output.provider) {
      output.provider = fuzzyMatchProvider(output.provider);
    }
    return output!;
  }
);
