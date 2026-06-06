// Servidor del demo: sirve la interfaz estilo WhatsApp y expone el endpoint del chatbot.
import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { procesarPedido } from "./src/orderEngine.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Se requiere 'messages' (array)." });
    }
    const resultado = await procesarPedido(messages);
    res.json(resultado);
  } catch (err) {
    console.error("Error en /api/chat:", err?.message || err);
    const sinKey = !process.env.GROQ_API_KEY && !process.env.ANTHROPIC_API_KEY;
    res.status(500).json({
      error: sinKey
        ? "Falta configurar una llave en el archivo .env (GROQ_API_KEY o ANTHROPIC_API_KEY)"
        : "Ocurrió un error procesando el mensaje.",
      detalle: err?.message || String(err),
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n  🍕 Demo de Pizzería Giomar corriendo en:  http://localhost:${PORT}\n`);
  if (!process.env.GROQ_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    console.log("  ⚠️  Falta la llave de IA. Edita el archivo .env y agrega tu GROQ_API_KEY.\n");
  }
});
