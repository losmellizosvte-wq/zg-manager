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
1. Nacional (Top Retails y MercadoLibre): EXCLUYE a todos los comercios menores. Para asegurarte, usa consultas de búsqueda con el operador "site:", por ejemplo: [producto] site:mercadolibre.com.ar OR site:fravega.com.ar OR site:cetrogar.com.ar OR site:oncity.com.ar OR site:naldo.com.ar OR site:musimundo.com OR site:pardo.com.ar. (Grandes cadenas únicamente).
2. Regional (NUESTRO MERCADO PRINCIPAL): Limítate a la zona sur de Córdoba: Viamonte (C.P. X2671, Provincia de Córdoba - ¡ATENCIÓN! NO confundir con General Viamonte de Buenos Aires), La Cesira, Pueblo Italiano, Canals, Alejo Ledesma, Benjamin Gould, Arias, Laboulaye. Busca en: Casa Jae (Canals), San Miguel Center, Casa Diez, Petenatti Hogar, Casa Suita, Bringeri Laboulaye.

REGLAS DE FILTRADO DE ANOMALÍAS (¡MUY IMPORTANTE!):
- Descarta automáticamente precios que sean absurdamente bajos (ej. 40% más baratos que el promedio). Suelen ser repuestos, productos usados, o páginas desactualizadas.
- OBLIGATORIO: Debes incluir el LINK REAL (URL) de donde sacaste el precio para que el usuario pueda verificarlo.

CRITERIOS FINANCIEROS Y REGLA DE DICTAMEN (¡ESTRICTO!):
- El "Costo Base" proporcionado por el usuario YA INCLUYE IVA.
- Usa los porcentajes de la tabla de costos operativos para sumarlos al Costo Base y obtener el Break-even.
- REGLA MATEMÁTICA PARA EL DICTAMEN:
  * Paso 1: Encuentra el precio más bajo Regional.
  * Paso 2: Encuentra el precio más bajo Nacional. SÚMALE un costo de Flete Realista desde Buenos Aires/Rosario hasta Viamonte, Córdoba (CP X2671). Calcula un mínimo de $25.000 ARS (por correos como Andreani o Correo Argentino) o un 10-15% del valor del producto para bultos grandes, EL QUE SEA MAYOR.
  * Paso 3: Toma el menor valor entre el Regional y el Nacional Ajustado con Flete. Este será tu "Precio a Vencer".
  * Si tu Precio Contado Sugerido (que garantiza el margen) es MENOR O IGUAL al "Precio a Vencer" -> "VIABLE".
  * Si tu Precio Contado Sugerido es hasta un 5% MAYOR que el "Precio a Vencer" -> "RIESGOSO".
  * Si tu Precio Contado Sugerido es más de un 5% MAYOR que el "Precio a Vencer" -> "NO VIABLE".

FORMATO DE SALIDA ESTRICTO EN JSON (sin markdown):
{
  "extractedData": {
    "productName": "Nombre/Modelo detectado",
    "specs": "Especificaciones clave"
  },
  "nationalBenchmark": [
    { "store": "Nombre tienda", "price": 100000, "notes": "Alguna nota", "url": "https://..." }
  ],
  "regionalBenchmark": [
    { "store": "Nombre tienda local", "price": 105000, "notes": "Nota local", "url": "https://..." }
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
