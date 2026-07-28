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
1. Nacional (Top Retails, MercadoLibre y Oficiales): NO USES operadores "site:" gigantes. Haz una sola búsqueda normal (Ej: "precio Freidora Smartlife 5L Argentina") y filtra los resultados. SOLO PUEDES incluir: Mercado Libre, Frávega, Cetrogar, OnCity, Naldo, Musimundo, Pardo o Tiendas Oficiales.
2. Regional (NUESTRO MERCADO PRINCIPAL): Busca en la zona sur de Córdoba (Casa Jae, San Miguel Center, Casa Diez, Petenatti Hogar, Casa Suita, Bringeri Laboulaye).

REGLAS DE RENDIMIENTO Y VELOCIDAD (¡CRÍTICO!):
- Tienes un límite de tiempo ESTRICTO de 20 segundos. NO realices más de 2 consultas a Google Search en total. Haz consultas amplias y procesa los resultados rápidamente. Si no encuentras algo de inmediato, asume que no hay stock y continúa. ¡Es mejor devolver datos incompletos que colgarte pensando!
- ACLARACIÓN OBLIGATORIA: Si incluyes un producto que no es exactamente el modelo buscado, es OBLIGATORIO que lo aclares en el campo "notes" (Ej: "Modelo similar: Marca X Modelo Y - Mismas frigorías").
- Descarta automáticamente precios que sean absurdamente bajos (ej. 40% más baratos que el promedio). Suelen ser repuestos, productos usados, o páginas desactualizadas.
- OBLIGATORIO: Debes incluir el LINK REAL (URL) de donde sacaste el precio para que el usuario pueda verificarlo.

CRITERIOS FINANCIEROS Y REGLA DE DICTAMEN (¡ESTRICTO!):
- El "Costo Base" proporcionado por el usuario YA INCLUYE IVA.
- Usa los porcentajes de la tabla de costos operativos para sumarlos al Costo Base y obtener el Break-even.
- REGLA MATEMÁTICA PARA EL DICTAMEN (Resistente a faltas de datos):
  * El Benchmark Nacional es OBLIGATORIO traerlo como REFERENCIA para saber a qué precio lo ven los clientes en internet. Pero para productos grandes (como bicicletas, heladeras), el cliente NO los comprará en Buenos Aires.
  * Paso 1: Encuentra el precio más bajo Regional. (Este es tu VERDADERO competidor a vencer).
  * Paso 2: Si NO encuentras precios Regionales, usa el precio más bajo Nacional y SÚMALE un costo de Flete Realista desde BsAs/Rosario (mínimo $25.000 ARS o 15% del valor). Si HAY precio Regional, ignora el Nacional para el cálculo de viabilidad.
  * Paso 3: Toma el precio determinado en Paso 1 (o Paso 2 si no hay regional). Este será tu "Precio a Vencer". Si no encontraste NINGÚN precio, asume que es VIABLE por ser exclusivo.
  * Si tu Precio Contado Sugerido es MENOR O IGUAL al "Precio a Vencer" -> "VIABLE".
  * Si tu Precio Contado Sugerido es hasta un 8% MAYOR que el "Precio a Vencer" -> "RIESGOSO" (pero con altas chances de éxito por la preferencia local).
  * Si tu Precio Contado Sugerido es más de un 8% MAYOR que el "Precio a Vencer" -> "NO VIABLE".

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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 28000); // 28 seconds timeout to beat 30s serverless limit

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ role: "user", parts: contents }],
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        tools: [{ googleSearch: {} }]
      })
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Gemini API Error:", errorData);
      throw new Error(`Gemini API Error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      console.error("Gemini no devolvió candidatos:", data);
      throw new Error(data.promptFeedback?.blockReason ? "La IA bloqueó la consulta por políticas de seguridad." : "La IA de Google no devolvió ningún resultado. Intenta simplificar el nombre del producto.");
    }

    let rawText = data.candidates[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error("La IA devolvió una respuesta vacía o falló la búsqueda en Google.");
    }
    
    // Check if grounding metadata is present (meaning Google Search was used)
    const searchUsed = !!data.candidates[0].groundingMetadata;

    // Clean markdown code blocks if the model wrapped the JSON
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const parsedData = JSON.parse(rawText);
      return {
        success: true,
        data: parsedData,
        searchUsed
      };
    } catch (parseError) {
      console.error("Error parseando JSON de Gemini:", rawText);
      throw new Error("La IA no pudo formatear los datos correctamente. Intenta de nuevo.");
    }

  } catch (error: any) {
    console.error("Pricing Analysis Error:", error);
    let errorMsg = error.message;
    if (error.name === 'AbortError' || errorMsg.includes('aborted')) {
      errorMsg = "La búsqueda en internet tomó demasiado tiempo y fue abortada. Intenta de nuevo con un término de búsqueda más corto.";
    }
    return {
      success: false,
      error: errorMsg
    };
  }
}
