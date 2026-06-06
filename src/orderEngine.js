// Motor de interpretación de pedidos para Pizzería Giomar.
// Soporta dos proveedores de IA:
//   - "groq"      (gratis, sin tarjeta) -> usa GROQ_API_KEY
//   - "anthropic" (Claude)              -> usa ANTHROPIC_API_KEY
// Se elige automáticamente según la llave disponible (o forzando PROVIDER en .env).

import { NEGOCIO, MONEDA, menuComoTexto } from "./menu.js";

const PROVIDER = (
  process.env.PROVIDER ||
  (process.env.GROQ_API_KEY ? "groq" : "anthropic")
).toLowerCase();

// Modelo por defecto según proveedor (configurable con MODEL en .env).
const MODEL =
  process.env.MODEL ||
  (PROVIDER === "groq" ? "llama-3.3-70b-versatile" : "claude-opus-4-8");

// Reglas de conversación + menú (común a ambos proveedores).
const SYSTEM_PROMPT = `Eres el asistente virtual de ${NEGOCIO.nombre} que atiende pedidos por WhatsApp.

Tu trabajo es entender lo que el cliente escribe en español natural y coloquial (aunque tenga faltas de ortografía, abreviaturas o ponga todo en un solo mensaje) y armar el pedido.

${menuComoTexto()}

REGLAS DE CONVERSACIÓN:
- Tono cálido, cercano y breve, como un mesero real por WhatsApp. Máximo 1 emoji por mensaje (opcional).
- Capta la intención desde el PRIMER mensaje: si el cliente ya dicta un pedido completo, regístralo todo de una vez.
- Interpreta tamaños, sabores, "mitad y mitad" (dos sabores en una pizza), extras (orilla rellena, extra de queso), cantidades, correcciones ("cámbiame X por Y", "quita...") y observaciones ("sin cebolla").
- Usa SOLO productos del menú. Si piden algo que no existe, ofrece amablemente lo más parecido.
- Si falta info para completar un producto (ej. tamaño de la pizza), pregunta de forma corta y natural.
- Para pizza mitad y mitad, el precio es el del sabor MÁS CARO de ese tamaño.
- Flujo: saludar → armar el pedido → preguntar si es a domicilio o para recoger (y la dirección/zona si es domicilio) → mostrar resumen con total → confirmar. Al confirmar el cliente, estado "confirmado".
- El envío a domicilio depende de la zona; el bot pregunta la dirección y avisa que el costo exacto lo confirma el operador. NO inventes un monto de envío.
- Calcula el precioUnitario de cada línea = precio base del producto/tamaño + extras (por unidad). El sistema multiplica por la cantidad y suma el total: NO sumes tú el total.
- Moneda: ${MONEDA}.
- IMPORTANTE: el campo "reply" NUNCA debe ir vacío. Siempre escribe un mensaje claro y completo para el cliente (confirmación, resumen o pregunta).`;

// Descripción del formato JSON (para el modo JSON de Groq).
const JSON_INSTRUCTIONS = `
Responde ÚNICAMENTE con un objeto JSON válido (sin texto extra, sin markdown, sin \`\`\`), con esta forma EXACTA:
{
  "reply": "lo que le dices al cliente por WhatsApp",
  "order": {
    "items": [
      {"nombre":"Pizza Familiar","categoria":"pizza","tamano":"Familiar","mitades":["Pepperoni","Hawaiana"],"extras":["Orilla rellena","Extra de queso"],"cantidad":1,"precioUnitario":580,"notas":""}
    ],
    "estado":"construyendo",
    "tipoEntrega":""
  },
  "faltante":["dirección"]
}
- "order" es el pedido ACUMULADO de toda la conversación (no solo el último mensaje).
- categoria ∈ "pizza" | "hamburguesa" | "pollo" | "bebida" | "otro".
- estado ∈ "construyendo" | "confirmando" | "confirmado" | "cancelado".
- tipoEntrega ∈ "" | "domicilio" | "recoger".
- Usa cadena vacía "" en vez de null. mitades y extras son arrays (vacíos si no aplican).
- "faltante": datos cortos que aún faltan (ej. ["dirección"]). Vacío si no falta nada.`;

// ---- Esquema para structured outputs de Anthropic ----
const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    reply: { type: "string" },
    order: {
      type: "object",
      additionalProperties: false,
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              nombre: { type: "string" },
              categoria: {
                type: "string",
                enum: ["pizza", "hamburguesa", "pollo", "bebida", "otro"],
              },
              tamano: { type: "string" },
              mitades: { type: "array", items: { type: "string" } },
              extras: { type: "array", items: { type: "string" } },
              cantidad: { type: "integer" },
              precioUnitario: { type: "number" },
              notas: { type: "string" },
            },
            required: [
              "nombre",
              "categoria",
              "tamano",
              "mitades",
              "extras",
              "cantidad",
              "precioUnitario",
              "notas",
            ],
          },
        },
        estado: {
          type: "string",
          enum: ["construyendo", "confirmando", "confirmado", "cancelado"],
        },
        tipoEntrega: { type: "string", enum: ["", "domicilio", "recoger"] },
      },
      required: ["items", "estado", "tipoEntrega"],
    },
    faltante: { type: "array", items: { type: "string" } },
  },
  required: ["reply", "order", "faltante"],
};

// Carga perezosa de los clientes (solo se instancia el que se use).
let _groq, _anthropic;
async function getGroq() {
  if (!_groq) {
    const { default: Groq } = await import("groq-sdk");
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groq;
}
async function getAnthropic() {
  if (!_anthropic) {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    _anthropic = new Anthropic();
  }
  return _anthropic;
}

// Llama al proveedor y devuelve el JSON crudo { reply, order, faltante }.
async function llamarIA(messages) {
  if (PROVIDER === "groq") {
    const groq = await getGroq();
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT + "\n" + JSON_INSTRUCTIONS },
        ...messages,
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1500,
    });
    return JSON.parse(completion.choices[0].message.content);
  }

  // Anthropic (Claude) con structured outputs.
  const anthropic = await getAnthropic();
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: [
      { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    ],
    thinking: { type: "disabled" },
    output_config: { format: { type: "json_schema", schema: OUTPUT_SCHEMA } },
    messages,
  });
  const textBlock = response.content.find((b) => b.type === "text");
  return JSON.parse(textBlock.text);
}

/**
 * Procesa el historial de conversación y devuelve { reply, order } con totales calculados.
 * @param {Array<{role: 'user'|'assistant', content: string}>} messages
 */
export async function procesarPedido(messages) {
  const data = await llamarIA(messages);

  // El servidor calcula los totales para que la aritmética siempre sea consistente.
  let total = 0;
  const items = (data.order?.items || []).map((it) => {
    const cantidad = Number(it.cantidad) || 1;
    const precioUnitario = Number(it.precioUnitario) || 0;
    const subtotal = +(precioUnitario * cantidad).toFixed(2);
    total += subtotal;
    return { ...it, cantidad, precioUnitario, subtotal };
  });
  total = +total.toFixed(2);

  const faltante = data.faltante || [];
  const estado = data.order?.estado;

  // Normaliza saltos de línea sobre-escapados (algunos modelos devuelven "\n" literal).
  let reply = (data.reply || "")
    .replace(/\\r\\n|\\n|\\r/g, "\n")
    .replace(/\\t/g, " ")
    .trim();
  if (!reply) {
    if (estado === "confirmado") {
      reply =
        "¡Listo! Tu pedido quedó confirmado 🍕 ¡Gracias por elegir Pizzería Giomar!";
    } else if (faltante.length) {
      reply = `Para continuar, ¿me confirmas ${faltante.join(" y ")}?`;
    } else if (items.length) {
      reply = `Tu pedido va por ${MONEDA}${total}. ¿Deseas algo más o lo confirmamos?`;
    } else {
      reply = "¿Qué se te antoja pedir hoy? 🍕";
    }
  }

  return {
    reply,
    faltante,
    order: {
      ...data.order,
      items,
      envio: 0, // el envío lo confirma el operador según la zona
      total,
    },
    moneda: MONEDA,
    proveedor: PROVIDER,
  };
}
