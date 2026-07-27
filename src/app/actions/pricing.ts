'use server';

export async function analyzePricing(payload: {
  productText?: string;
  imageBase64?: string; // e.g. "iVBORw0KGgoAAAANSUhEUgAA..."
  imageMimeType?: string; // e.g. "image/jpeg"
  baseCost: number;
  costsConfig: any;
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('No GEMINI_API_KEY configured');
  }

  const systemInstruction = `
Eres el motor de Inteligencia Artificial especializado en Pricing, Análisis Comercial y Benchmark de Mercado para el retail de la empresa ZAWADZKI GROUP (Argentina).

TU MISIÓN:
Analizar la propuesta comercial (imagen o texto).
Buscar en vivo en Internet usando tu herramienta Google Search para encontrar precios de la competencia en Argentina, diviendo la búsqueda en 2 niveles:
1. Nacional (Top Retails y MercadoLibre): Limítate EXCLUSIVAMENTE a las grandes cadenas conocidas (Mercado Libre, Frávega, Cetrogar, Megatone, Naldo, On City, Coppel). IGNORA por completo pequeños e-commerces de Buenos Aires o de otras provincias (ej. Lomas de Zamora, Rosario, etc). El objetivo aquí es ver el precio de referencia psicológico del consumidor.
2. Regional (NUESTRO MERCADO PRINCIPAL): CRÍTICO: limítate estrictamente a las localidades de Viamonte, La Cesira, Pueblo Italiano, Canals, Alejo Ledesma, Benjamin Gould y Arias en la provincia de Córdoba. IGNORA resultados de otras provincias o zonas alejadas. Busca explícitamente en:
   - "Casa Jae" (Canals, Instagram: Jaehogar)
   - "San Miguel Center" (https://sanmiguelcenter.com.ar/)
   - "Casa Diez" (Alejo Ledesma)
   - "Petenatti Hogar" (Arias, Córdoba, https://www.petenattihogar.com.ar/)
   - "Casa Suita" (Instagram: CasaSuita)
   - "Bringeri hogar" (Solo sucursal Laboulaye: https://www.bringeri.com.ar/)
   - Otras mutuales o negocios ubicados exclusivamente en estas localidades.

CRITERIOS FINANCIEROS Y REGLA DE DICTAMEN (¡ESTRICTO!):
- El "Costo Base" proporcionado por el usuario YA INCLUYE IVA.
- Usa los porcentajes de la tabla de costos operativos para sumarlos al Costo Base y obtener el Break-even.
- Sugiere un "Precio Contado" que garantice el Margen Neto Deseado por el usuario.
- REGLA MATEMÁTICA PARA EL DICTAMEN (La competencia real de LOS MELLIZOS se centra en la Región con envío gratis. Lo Nacional tiene costo de flete):
  * Paso 1: Encuentra el precio más bajo Regional.
  * Paso 2: Encuentra el precio más bajo Nacional y SÚMALE un 8% (Costo estimado de flete hasta la región).
  * Paso 3: Toma el menor valor entre el Regional y el Nacional Ajustado con Flete. Este será tu "Precio a Vencer".
  * Si tu Precio Contado Sugerido es MENOR O IGUAL al "Precio a Vencer" -> "VIABLE" (Somos muy competitivos).
  * Si tu Precio Contado Sugerido es hasta un 5% MAYOR que el "Precio a Vencer" -> "RIESGOSO" (Estamos un poco caros, pero se puede ganar por confianza local).
  * Si tu Precio Contado Sugerido es más de un 5% MAYOR que el "Precio a Vencer" -> "NO VIABLE" (Estamos totalmente fuera de mercado).

IDENTIFICACIÓN DEL PRODUCTO:
- Debes buscar el modelo EXACTO. Si encuentras un modelo similar pero no exacto, indícalo CLARAMENTE en el campo "notes" de la tienda (Ej: "Modelo similar: XXX").
- Genera hasta 5 o 6 resultados por cada benchmark si están disponibles, para que la pantalla del usuario se vea bien completa de datos.

FORMATO DE SALIDA ESTRICTO EN JSON (sin markdown):
{
  "extractedData": {
    "productName": "Nombre/Modelo detectado",
    "specs": "Especificaciones clave"
  },
  "nationalBenchmark": [
    { "store": "Nombre tienda", "price": 100000, "notes": "Alguna nota" }
  ],
  "regionalBenchmark": [
    { "store": "Nombre tienda local", "price": 105000, "notes": "Nota local" }
  ],
  "financials": {
    "baseCost": 0,
    "totalCostPercentage": 18.5,
    "breakevenAmount": 0,
    "suggestedCashPrice": 0,
    "suggestedFinancedPrice": 0,
    "projectedMarginAmount": 0
  },
  "verdict": {
    "status": "VIABLE" | "RIESGOSO" | "NO VIABLE",
    "reasoning": "Explicación estratégica...",
    "strengths": ["fortaleza 1"],
    "risks": ["riesgo 1"]
  }
}
`;

  const contents: any[] = [];

  // Agregar la imagen si existe
  if (payload.imageBase64 && payload.imageMimeType) {
    contents.push({
      inlineData: {
        mimeType: payload.imageMimeType,
        data: payload.imageBase64,
      }
    });
  }

  // Agregar los datos estructurados
  const promptData = {
    producto: payload.productText || "Identificar en la imagen",
    costo_base_iva_incluido: payload.baseCost,
    configuracion_costos_porcentajes: payload.costsConfig,
    instrucciones: "Usa Google Search para buscar el producto en Argentina y en las localidades regionales mencionadas. Genera el JSON."
  };

  contents.push({
    text: JSON.stringify(promptData)
  });

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: contents }],
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        tools: [{ googleSearch: {} }],
        generationConfig: {
          temperature: 0.1
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API Error:", errorData);
      throw new Error(`Gemini API Error: ${response.statusText}`);
    }

    const data = await response.json();
    let rawText = data.candidates[0].content.parts[0].text;
    
    // Check if grounding metadata is present (meaning Google Search was used)
    const searchUsed = !!data.candidates[0].groundingMetadata;

    // Clean markdown code blocks if the model wrapped the JSON
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    return {
      success: true,
      data: JSON.parse(rawText),
      searchUsed
    };

  } catch (error: any) {
    console.error("Pricing Analysis Error:", error);
    return {
      success: false,
      error: error.message
    };
  }
}
