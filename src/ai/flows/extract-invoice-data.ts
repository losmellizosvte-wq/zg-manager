'use server';

/**
 * @fileOverview This flow extracts invoice data from an image or PDF using AI.
 *
 * - extractInvoiceData - A function that handles the invoice data extraction process.
 * - ExtractInvoiceDataInput - The input type for the extractInvoiceDataInput function.
 * - ExtractInvoiceDataOutput - The return type for the extractInvoiceDataOutput function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { fuzzyMatchProvider } from '@/ai/utils';

const ExtractInvoiceDataInputSchema = z.object({
  invoiceDataUri: z
    .string()
    .describe(
      "A photo or PDF of an invoice, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractInvoiceDataInput = z.infer<typeof ExtractInvoiceDataInputSchema>;

const ExtractInvoiceDataOutputSchema = z.object({
  provider: z.string().describe('El nombre del proveedor de la factura.'),
  date: z.string().describe('La fecha del comprobante en formato YYYY-MM-DD.'),
  documentNumber: z.string().describe('El número de documento de la factura (Ej: 0001-00012345).'),
  totalAmount: z.string().describe('El monto total final a pagar del comprobante. Debe ser un número, sin el símbolo de moneda y usando un punto como separador decimal.'),
  description: z.string().describe('Una descripción detallada y específica en español sobre los bienes o servicios facturados, basada en el contenido de la factura.'),
  category: z.string().describe("La categoría del gasto. Debe ser uno de los valores predefinidos: 'Compra de Mercadería', 'Alquiler', 'Servicios', 'Librería y Oficina', 'Logística', 'Impuestos', 'Sueldos', 'Marketing', 'Gastos Bancarios', 'Varios'."),
});
export type ExtractInvoiceDataOutput = z.infer<typeof ExtractInvoiceDataOutputSchema>;

export async function extractInvoiceData(input: ExtractInvoiceDataInput): Promise<ExtractInvoiceDataOutput> {
  return extractInvoiceDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractInvoiceDataPrompt',
  input: {schema: ExtractInvoiceDataInputSchema},
  output: {schema: ExtractInvoiceDataOutputSchema},
  config: { temperature: 0.1 },
  prompt: `Eres un experto asistente contable para una empresa en Argentina que vende electrodomésticos y artículos del hogar. Tu trabajo es extraer información clave de una factura y clasificarla. El idioma principal es español.

  Extrae cuidadosamente los siguientes campos de la factura:
  - provider: El nombre de la empresa que emitió la factura.
  - date: La fecha de emisión del comprobante (formato YYYY-MM-DD).
  - documentNumber: El identificador único de la factura (número de comprobante).
  - totalAmount: El importe TOTAL final a pagar. Busca el valor final. Devuélvelo como un string numérico, sin símbolo de moneda y usando un punto como separador decimal (ej: "1500.50").
  - description: Un resumen detallado y específico en español de los bienes o servicios provistos. Lista los ítems principales si es posible.
  - category: Analiza el proveedor y la descripción para clasificar el gasto en UNA de las siguientes categorías: 'Compra de Mercadería', 'Alquiler', 'Servicios', 'Librería y Oficina', 'Logística', 'Impuestos', 'Sueldos', 'Marketing', 'Gastos Bancarios', 'Varios'.
    - 'Compra de Mercadería' es para todo lo que la empresa compra para REVENDER (electrodomésticos, muebles, etc.).
    - 'Servicios' es para luz, internet, honorarios de contador, etc.
    - 'Logística' es para fletes y combustible.
    - Si no puedes determinar la categoría con certeza, usa 'Varios'.

  Factura: {{media url=invoiceDataUri}}

  Asegúrate de que los datos sean precisos y completos. Si un campo no está presente, usa 'N/A'.
  Devuelve los datos como un objeto JSON.
  Sigue estrictamente las descripciones del esquema de salida para el formato.`,
});

const extractInvoiceDataFlow = ai.defineFlow(
  {
    name: 'extractInvoiceDataFlow',
    inputSchema: ExtractInvoiceDataInputSchema,
    outputSchema: ExtractInvoiceDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (output && output.provider) {
      output.provider = fuzzyMatchProvider(output.provider);
    }
    return output!;
  }
);
