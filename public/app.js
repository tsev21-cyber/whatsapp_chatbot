// Lógica del demo: maneja la conversación de WhatsApp y actualiza el panel del sistema.

const chat = document.getElementById("chat");
const input = document.getElementById("msg");
const sendBtn = document.getElementById("send");
const resetBtn = document.getElementById("reset");
const waStatus = document.getElementById("wa-status");

// Historial de conversación que se envía al backend (formato de la API).
let messages = [];

function ahora() {
  const d = new Date();
  return d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
}

function addBubble(text, who) {
  const b = document.createElement("div");
  b.className = `bubble ${who}`;
  b.innerHTML = `${escapeHtml(text)}<span class="time">${ahora()}</span>`;
  chat.appendChild(b);
  chat.scrollTop = chat.scrollHeight;
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function showTyping() {
  waStatus.textContent = "escribiendo…";
  const t = document.createElement("div");
  t.className = "typing";
  t.id = "typing";
  t.innerHTML = "<span></span><span></span><span></span>";
  chat.appendChild(t);
  chat.scrollTop = chat.scrollHeight;
}
function hideTyping() {
  waStatus.textContent = "en línea";
  document.getElementById("typing")?.remove();
}

async function enviar(texto) {
  texto = (texto ?? input.value).trim();
  if (!texto) return;

  addBubble(texto, "out");
  messages.push({ role: "user", content: texto });
  input.value = "";
  sendBtn.disabled = true;
  showTyping();

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    const data = await res.json();
    hideTyping();

    if (!res.ok) {
      addBubble("⚠️ " + (data.error || "Error en el servidor"), "in");
      return;
    }

    // Pequeño retardo natural antes de mostrar la respuesta.
    addBubble(data.reply, "in");
    messages.push({ role: "assistant", content: data.reply });
    actualizarSistema(data);
  } catch (e) {
    hideTyping();
    addBubble("⚠️ No se pudo conectar con el servidor.", "in");
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
}

function actualizarSistema(data) {
  const { order, faltante, moneda } = data;
  const m = moneda || "$";

  // Estado
  const estadoEl = document.getElementById("estado");
  const estado = order.estado || "construyendo";
  const etiquetas = {
    construyendo: "Construyendo",
    confirmando: "Por confirmar",
    confirmado: "✓ Confirmado",
    cancelado: "Cancelado",
  };
  estadoEl.textContent = etiquetas[estado] || estado;
  estadoEl.className = "badge " + estado;

  // Tipo de entrega
  document.getElementById("tipoEntrega").textContent =
    order.tipoEntrega === "domicilio"
      ? "🛵 A domicilio"
      : order.tipoEntrega === "recoger"
        ? "🏪 Para recoger"
        : "—";

  // Items
  const itemsEl = document.getElementById("items");
  if (!order.items || order.items.length === 0) {
    itemsEl.innerHTML = `<div class="sys-empty">Aún no hay productos en el pedido.</div>`;
  } else {
    itemsEl.innerHTML = order.items
      .map((it) => {
        const detalles = [];
        if (it.tamano) detalles.push(it.tamano);
        if (it.mitades && it.mitades.length)
          detalles.push("½ " + it.mitades.join(" / ½ "));
        if (it.extras && it.extras.length)
          detalles.push("+ " + it.extras.join(", "));
        if (it.notas) detalles.push("📝 " + it.notas);
        return `
          <div class="item">
            <div class="item-top">
              <span><span class="item-qty">${it.cantidad}×</span> ${escapeHtml(it.nombre)}</span>
              <span class="item-price">${m}${(it.subtotal ?? 0).toFixed(2)}</span>
            </div>
            ${detalles.length ? `<div class="item-detail">${escapeHtml(detalles.join(" · "))}</div>` : ""}
          </div>`;
      })
      .join("");
  }

  // Envío y total
  document.getElementById("envio").textContent = order.envioPorZona
    ? `según zona (desde ${m}${order.envioDesde})`
    : "—";
  document.getElementById("total").textContent =
    order.total > 0 ? `${m}${order.total.toFixed(2)}` : "—";

  // Faltante
  document.getElementById("faltante").textContent =
    faltante && faltante.length ? faltante.join(", ") : "";

  // JSON crudo (lo que se enviaría a tu sistema / Google Sheets)
  document.getElementById("json").textContent = JSON.stringify(order, null, 2);
}

function reset() {
  messages = [];
  chat.innerHTML = '<div class="wa-day">HOY</div>';
  document.getElementById("items").innerHTML =
    '<div class="sys-empty">Aún no hay productos en el pedido.</div>';
  document.getElementById("estado").textContent = "Esperando…";
  document.getElementById("estado").className = "badge";
  document.getElementById("tipoEntrega").textContent = "—";
  document.getElementById("envio").textContent = "—";
  document.getElementById("total").textContent = "—";
  document.getElementById("faltante").textContent = "";
  document.getElementById("json").textContent =
    "// El JSON estructurado del pedido aparecerá aquí\n// (esto es lo que se envía a tu sistema / Google Sheets)";
  input.focus();
}

// ---------- Escenas para grabar el video ----------
// Cada escena es una secuencia de mensajes que se envían en orden con un clic.
const SCENES = {
  1: [
    "Hola, buenas, ¿qué tienen?",
    "una pizza familiar mitad pepperoni mitad hawaiana con orilla rellena y extra de queso, una hamburguesa clásica y una orden de papas",
    "agrégame una Coca-Cola de litro",
    "es para domicilio, por la zona del centro",
    "sí, confírmalo porfa",
  ],
  2: [
    "Buenas! me regalas 2 pizzas medianas: una pepperoni y otra mitad pollo mitad champiñones",
    "agrégame una orden de papas y 2 Coca-Cola de litro",
    "mejor cámbiame una Coca por una Toña",
    "es para recoger en el local",
    "listo, confírmalo",
  ],
};

const suggestions = document.getElementById("suggestions");

function renderScene(n) {
  const pasos = SCENES[n] || [];
  suggestions.innerHTML = pasos
    .map(
      (txt, i) =>
        `<button class="chip" data-step="${i + 1}"><span class="step">${i + 1}</span>${escapeHtml(txt)}</button>`,
    )
    .join("");
  suggestions.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const txt = chip.getAttribute("data-step")
        ? SCENES[n][Number(chip.dataset.step) - 1]
        : chip.textContent.trim();
      enviar(txt);
      chip.classList.add("done"); // marca el paso como usado
    });
  });
}

document.querySelectorAll(".scene-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".scene-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    reset(); // limpia el chat para empezar la escena desde cero
    renderScene(btn.dataset.scene);
  });
});

// Eventos
sendBtn.addEventListener("click", () => enviar());
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") enviar();
});
resetBtn.addEventListener("click", () => {
  reset();
  // vuelve a renderizar la escena activa (resetea las marcas de pasos)
  const activa = document.querySelector(".scene-btn.active")?.dataset.scene || "1";
  renderScene(activa);
});

renderScene(1);
input.focus();
