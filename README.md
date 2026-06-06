# Demo · Chatbot IA para WhatsApp — Pizzería Giomar

Simulador estilo WhatsApp para grabar un video de demostración. Muestra dos cosas a la vez:

- **Izquierda (WhatsApp):** el cliente escribe pedidos en lenguaje natural.
- **Derecha (Sistema interno):** el pedido se interpreta y aparece **estructurado en tiempo real** + el JSON que se enviaría a tu sistema o a Google Sheets.

El motor de comprensión usa IA real para interpretar el pedido y devolver un JSON estructurado. Por defecto usa **Groq** (gratis, sin tarjeta); opcionalmente puede usar **Claude**.

---

## Cómo ejecutarlo (3 pasos)

```bash
# 1. Instalar dependencias
npm install

# 2. Obtener tu llave GRATIS de Groq y ponerla en .env
#    -> https://console.groq.com  ->  API Keys  ->  Create API Key  (empieza con gsk_)
#    Edita el archivo .env y reemplaza PEGA_TU_LLAVE_DE_GROQ_AQUI por tu llave.

# 3. Arrancar
npm start
```

Abre **http://localhost:3000** en el navegador.

> **Groq es gratis y no pide tarjeta de crédito** — ideal para el demo. Crea la cuenta, genera la llave y pégala en `.env`.
> ¿Prefieres Claude? Pon `ANTHROPIC_API_KEY` y `PROVIDER=anthropic` en `.env`.

---

## Cómo grabar el video para el cliente

Graba la pantalla (OBS, ShareX o la grabadora de Windows: `Win + Alt + R`). Debajo del chat hay un **selector de escenas** con dos secuencias listas — solo haz clic en los pasos numerados en orden (no necesitas escribir en cámara). Cada paso se marca en verde al usarlo. Todo con el menú REAL de Giomar, en córdobas.

**🎬 Escena 1 · Pedido a domicilio**
1. `Hola, buenas, ¿qué tienen?` → saluda y ofrece el menú
2. `una pizza familiar mitad pepperoni mitad hawaiana con orilla rellena y extra de queso, una hamburguesa clásica y una orden de papas` → **el momento clave:** el panel derecho se llena solo (tamaño, mitades, orilla, extra de queso, hamburguesa, papas, precios, total)
3. `agrégame una Coca-Cola de litro`
4. `es para domicilio, por la zona del centro` → muestra envío "según zona"
5. `sí, confírmalo porfa` → estado **✓ Confirmado**

**🎬 Escena 2 · Varios productos · para recoger** (muestra robustez)
1. `Buenas! me regalas 2 pizzas medianas: una pepperoni y otra mitad pollo mitad champiñones` → cantidades + dos pizzas, una mitad y mitad
2. `agrégame una orden de papas y 2 Coca-Cola de litro`
3. `mejor cámbiame una Coca por una Toña` → **corrige el pedido** (entiende un cambio sobre la marcha)
4. `es para recoger en el local` → entrega distinta (sin envío)
5. `listo, confírmalo` → estado **✓ Confirmado**

Al cambiar de escena el chat se reinicia automáticamente. Sugerencia: graba ambas escenas seguidas en un solo video de 60–90 s.

💡 Para el cliente: resalta que el panel derecho demuestra los dos requisitos del proyecto —
**NLP avanzado** (entiende lenguaje coloquial y extras) e **integración/sincronización por API** (el JSON listo para su sistema).

---

## Estructura del proyecto

```
server.js            Servidor Express + endpoint /api/chat
src/menu.js          Menú de Pizzería Giomar (editable: productos, sabores, extras, precios)
src/orderEngine.js   Motor de IA: prompt + salida JSON (soporta Groq y Claude)
public/              Interfaz estilo WhatsApp + panel del sistema interno
```

## Personalizar

- **Menú / precios:** edita `src/menu.js`. No hay que tocar nada más.
- **Tono o reglas del bot:** ajusta `SYSTEM_PROMPT` en `src/orderEngine.js`.
- **Conectar a WhatsApp real:** este demo simula la UI; la misma lógica de `orderEngine.js`
  se conecta luego a la **WhatsApp Cloud API** (webhook → `procesarPedido()` → responder).
