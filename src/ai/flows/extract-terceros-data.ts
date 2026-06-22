'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractTercerosDataInputSchema = z.object({
  chequeDataUri: z
    .string()
    .describe(
      "A photo or PDF of a third-party cheque (e-cheq or physical), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractTercerosDataInput = z.infer<typeof ExtractTercerosDataInputSchema>;

const ExtractTercerosDataOutputSchema = z.object({
  bank: z.string().describe('El nombre del Banco emisor del cheque (ej. Banco Galicia, Banco Macro).'),
  cuit: z.string().describe('El número de CUIT del emisor del cheque, en formato 00-00000000-0 si es posible.'),
  amount: z.string().describe('El monto del cheque. Debe ser numérico, sin el símbolo de la moneda y usando un punto como separador decimal.'),
  dueDate: z.string().describe('La fecha de pago o cobro del cheque en formato YYYY-MM-DD.'),
});
export type ExtractTercerosDataOutput = z.infer<typeof ExtractTercerosDataOutputSchema>;

export async function extractTercerosData(input: ExtractTercerosDataInput): Promise<ExtractTercerosDataOutput> {
  return extractTercerosDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractTercerosDataPrompt',
  input: {schema: ExtractTercerosDataInputSchema},
  output: {schema: ExtractTercerosDataOutputSchema},
  config: { temperature: 0.1 },
  prompt: `Eres un asistente contable analizando un cheque físico o E-Cheq recibido de un tercero (cliente). Tu trabajo es extraer la información crítica para la cartera de valores.
  
  Extrae cuidadosamente los siguientes campos:
  - bank: El nombre del Banco.
  - cuit: El CUIT del firmante / emisor original.
  - amount: El importe total del cheque (ej. "150000.50").
  - dueDate: La fecha de vencimiento/cobro (formato YYYY-MM-DD).

  Cheque: {{media url=chequeDataUri}}

  Devuelve los datos precisos como un objeto JSON siguiendo el esquema.`,
});

const extractTercerosDataFlow = ai.defineFlow(
  {
    name: 'extractTercerosDataFlow',
    inputSchema: ExtractTercerosDataInputSchema,
    outputSchema: ExtractTercerosDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
