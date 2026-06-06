// Menú REAL de Pizzería Giomar (extraído del archivo productos.xls del cliente).
// Precios en córdobas (C$). Editar productos/precios aquí NO requiere tocar el motor de IA.

export const MONEDA = "C$";

export const NEGOCIO = {
  nombre: "Pizzería Giomar",
  // El costo de envío depende de la zona (C$30 a C$260 según la dirección).
  // El motorista/operador confirma el monto exacto; el bot pregunta la zona.
  envioDesde: 30,
};

export const MENU = {
  // Pizzas: se piden enteras o MITAD Y MITAD (dos sabores en una).
  pizzas: {
    tamanos: [
      {
        nombre: "Mini",
        porciones: "personal",
        precios: {
          Jamón: 190,
          Pepperoni: 190,
          Pollo: 190,
          Jalapeña: 190,
          "3 Quesos": 190,
          Champiñones: 181,
          Hawaiana: 200,
          Beicon: 200,
          Mixta: 200,
        },
      },
      {
        nombre: "Pequeña",
        porciones: "6 porciones",
        precios: {
          Salami: 235,
          Jamón: 265,
          Jalapeña: 270,
          Pepperoni: 275,
          Pollo: 275,
          Mixta: 280,
          Suprema: 280,
          Ranch: 280,
          Champiñones: 290,
          Beicon: 290,
          Vegetariana: 290,
          "3 Quesos": 290,
          Hawaiana: 295,
          "4 Estaciones": 300,
        },
      },
      {
        nombre: "Mediana",
        porciones: "8 porciones",
        precios: {
          Salami: 341,
          Jamón: 383,
          Pepperoni: 393,
          Pollo: 393,
          Suprema: 398,
          Jalapeña: 398,
          Ranch: 398,
          Hawaiana: 405,
          "3 Quesos": 410,
          Beicon: 410,
          Champiñones: 410,
          Mixta: 410,
          Vegetariana: 410,
          "4 Estaciones": 418,
        },
      },
      {
        nombre: "Familiar",
        porciones: "12 porciones",
        precios: {
          Salami: 426,
          Jamón: 486,
          Pepperoni: 494,
          Pollo: 494,
          Suprema: 499,
          Jalapeña: 499,
          Ranch: 499,
          Hawaiana: 504,
          "3 Quesos": 506,
          Beicon: 506,
          Champiñones: 506,
          Mixta: 506,
          Vegetariana: 506,
          "4 Estaciones": 534,
        },
      },
    ],
    // Complementos que se suman al precio de la pizza (por tamaño).
    orillaRellena: { Pequeña: 20, Mediana: 25, Familiar: 26 },
    extraQueso: { Pequeña: 25, Mediana: 30, Familiar: 50 },
    notaMitad:
      "Puedes pedir la pizza mitad y mitad (dos sabores). Se cobra el precio del sabor más caro de ese tamaño.",
    descripciones: {
      Hawaiana: "queso mozzarella, piña y jamón",
      "3 Quesos": "mozzarella, parmesano y cheddar",
      Beicon: "tocino ahumado y cerdo",
      Champiñones: "queso mozzarella y champiñones",
      Mixta: "jamón, pepperoni y pollo",
      Suprema: "salchichón y carne molida",
      Ranch: "chorizo de cerdo y queso mozzarella",
      Jalapeña: "jamón y jalapeño",
      Vegetariana: "zanahoria, tomate, maíz, pitipuá, cebolla y chiltoma",
      "4 Estaciones": "pepperoni, jamón, aceitunas y champiñones",
    },
  },

  hamburguesas: [
    { nombre: "Hamburguesa Sencilla", precio: 180 },
    { nombre: "Hamburguesa Clásica", precio: 200 },
    { nombre: "Hamburguesa con Papas", precio: 210 },
    { nombre: "Hamburguesa Hawaiana", precio: 220 },
    { nombre: "Egg Burger", precio: 220 },
    { nombre: "Cheddar Burger", precio: 230 },
    { nombre: "Burger Chicken", precio: 257 },
    { nombre: "Special Burger", precio: 257 },
    { nombre: "Combo Hamburguesa", precio: 225 },
    { nombre: "Orden de Papas", precio: 160 },
    { nombre: "Papas Pequeñas", precio: 110 },
  ],

  pollo: [
    { nombre: "Pollo Familiar", precio: 490 },
    { nombre: "Combito de Pollo Junior", precio: 225 },
    { nombre: "Piernita con Papas", precio: 155 },
    { nombre: "Extra de Pierna", precio: 40 },
  ],

  bebidas: [
    { nombre: "Gaseosa de vidrio 12 oz", precio: 35 },
    { nombre: "Gaseosa 1 litro (Pepsi / Coca-Cola)", precio: 45 },
    { nombre: "Gaseosa 2 litros (Pepsi / Coca-Cola)", precio: 60 },
    { nombre: "Gaseosa 3 litros", precio: 80 },
    { nombre: "Agua", precio: 35 },
    { nombre: "Jugo (caja)", precio: 30 },
    { nombre: "Refresco natural", precio: 80 },
    { nombre: "Té de limón", precio: 60 },
    { nombre: "Cerveza Toña", precio: 65 },
    { nombre: "Cerveza Victoria Clásica", precio: 60 },
    { nombre: "Cerveza Smirnoff", precio: 95 },
  ],
};

// Genera el menú en texto plano para inyectar en el prompt del sistema.
export function menuComoTexto() {
  const m = MONEDA;
  const L = [];
  L.push(`=== ${NEGOCIO.nombre} — MENÚ (precios en ${m}) ===`);
  L.push("");

  L.push("PIZZAS — se piden enteras o MITAD Y MITAD (dos sabores en una):");
  for (const t of MENU.pizzas.tamanos) {
    const sabores = Object.entries(t.precios)
      .map(([sab, p]) => `${sab} ${m}${p}`)
      .join(", ");
    L.push(`  • ${t.nombre} (${t.porciones}): ${sabores}`);
  }
  L.push(
    `  Orilla rellena: ${Object.entries(MENU.pizzas.orillaRellena)
      .map(([t, p]) => `${t} +${m}${p}`)
      .join(", ")}`,
  );
  L.push(
    `  Extra de queso: ${Object.entries(MENU.pizzas.extraQueso)
      .map(([t, p]) => `${t} +${m}${p}`)
      .join(", ")}`,
  );
  L.push(`  ${MENU.pizzas.notaMitad}`);
  L.push("");

  L.push("HAMBURGUESAS Y PAPAS:");
  for (const h of MENU.hamburguesas) L.push(`  • ${h.nombre}: ${m}${h.precio}`);
  L.push("");

  L.push("POLLO:");
  for (const p of MENU.pollo) L.push(`  • ${p.nombre}: ${m}${p.precio}`);
  L.push("");

  L.push("BEBIDAS:");
  for (const b of MENU.bebidas) L.push(`  • ${b.nombre}: ${m}${b.precio}`);
  L.push("");

  L.push(
    `Envío a domicilio: depende de la zona (desde ${m}${NEGOCIO.envioDesde}). Pregunta la dirección/zona; el costo exacto lo confirma el operador.`,
  );

  return L.join("\n");
}
