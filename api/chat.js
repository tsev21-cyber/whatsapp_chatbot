// Función serverless para Vercel: maneja POST /api/chat
// (En local seguimos usando server.js/Express; en Vercel se usa este archivo.)
import { procesarPedido } from "../src/orderEngine.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }
  try {
    // Vercel parsea el body JSON automáticamente; si llegara como string, lo cubrimos.
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const { messages } = body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Se requiere 'messages' (array)." });
    }
    const resultado = await procesarPedido(messages);
    return res.status(200).json(resultado);
  } catch (err) {
    console.error("Error en /api/chat:", err?.message || err);
    const sinKey = !process.env.GROQ_API_KEY && !process.env.ANTHROPIC_API_KEY;
    return res.status(500).json({
      error: sinKey
        ? "Falta configurar la llave en Vercel (Settings → Environment Variables): GROQ_API_KEY o ANTHROPIC_API_KEY"
        : "Ocurrió un error procesando el mensaje.",
      detalle: err?.message || String(err),
    });
  }
}
