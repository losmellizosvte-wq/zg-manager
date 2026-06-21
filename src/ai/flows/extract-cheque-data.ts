'use server';
/**
 * @fileOverview Extracts cheque data from an image or PDF using AI.
 *
 * - extractChequeData - A function that handles the cheque data extraction process.
 * - ExtractChequeDataInput - The input type for the extractChequeData function.
 * - ExtractChequeDataOutput - The return type for the extractChequeData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { fuzzyMatchProvider } from '@/ai/utils';

const ExtractChequeDataInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a cheque, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractChequeDataInput = z.infer<typeof ExtractChequeDataInputSchema>;

const ExtractChequeDataOutputSchema = z.object({
  beneficiary: z.string().describe('The name of the cheque beneficiary.'),
  amount: z.string().describe('The amount of the cheque as a number, using a dot as a decimal separator.'),
  dueDate: z.string().describe('The due date of the cheque in YYYY-MM-DD format.'),
  chequeNumber: z.string().describe('The cheque number.'),
});
export type ExtractChequeDataOutput = z.infer<typeof ExtractChequeDataOutputSchema>;

export async function extractChequeData(input: ExtractChequeDataInput): Promise<ExtractChequeDataOutput> {
  return extractChequeDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractChequeDataPrompt',
  input: {schema: ExtractChequeDataInputSchema},
  output: {schema: ExtractChequeDataOutputSchema},
  config: { temperature: 0.1 },
  prompt: `Eres un experto asistente financiero especializado en extraer datos de cheques de Argentina, tanto electrónicos como manuscritos. Tu idioma principal es español.

  Extrae cuidadosamente los siguientes campos de la imagen del cheque:
  - Beneficiary: El nombre de la persona o entidad a quien se le paga. Busca la línea después de "páguese a". Si está vacía, devuelve 'N/A'.
  - Amount: El monto del cheque. Prioriza el número que está en el recuadro superior derecho, usualmente precedido por el símbolo '$'. Asegúrate de extraerlo como un número, usando un punto como separador decimal (ej: 1500.50) y sin separadores de miles.
  - Due Date: La fecha de pago o vencimiento del cheque. Es el campo más importante.
    - ¡ATENCIÓN! En cheques manuscritos, puede haber dos fechas. La fecha de PAGO es la SEGUNDA, la que se encuentra más abajo y a menudo está precedida por "El... de... de...". La primera fecha es la de emisión. DEBES extraer la fecha de pago. Formatea la fecha como YYYY-MM-DD. Si solo hay una fecha, usa esa.
  - Cheque Number: El número único que identifica el cheque. Suele estar en una esquina, a menudo en negrita y precedido por "N°".

  Imagen del Cheque: {{media url=photoDataUri}}

  Asegúrate de que la información extraída sea precisa y completa. Si un campo no se puede encontrar de ninguna manera, devuelve 'N/A'.
  Sigue estrictamente el formato del esquema de salida.`,
});

const extractChequeDataFlow = ai.defineFlow(
  {
    name: 'extractChequeDataFlow',
    inputSchema: ExtractChequeDataInputSchema,
    outputSchema: ExtractChequeDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (output && output.beneficiary) {
      output.beneficiary = fuzzyMatchProvider(output.beneficiary);
    }
    return output!;
  }
);
