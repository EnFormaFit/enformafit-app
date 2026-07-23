'use strict';

// ── Motor de nutrición EnFormaFit ─────────────────────────────────────────────
// Misma lógica que app_generador.py, portada a Node.js

function calcularEdad(fechaNacimiento) {
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

function calcularTMB(peso, altura, edad, sexo = 'H') {
  if (sexo === 'H') return (10 * peso) + (6.25 * altura) - (5 * edad) + 5;
  return (10 * peso) + (6.25 * altura) - (5 * edad) - 161;
}

function calcularDeficit(exceso) {
  if (exceso < 3)  return 400;
  if (exceso < 6)  return 500;
  if (exceso < 10) return 600;
  if (exceso < 15) return 750;
  if (exceso < 20) return 900;
  return 1000;
}

function calcularIMC(peso, altura) {
  return peso / Math.pow(altura / 100, 2);
}

function imcMacros(imc) {
  // Proteína y grasa por kg según IMC
  if (imc >= 35) return [1.8, 0.8];
  if (imc >= 30) return [2.0, 0.9];
  if (imc >= 25) return [2.2, 1.0];
  return [2.4, 1.1];
}

function generarPlanNutricion(cliente) {
  const {
    peso, altura, fecha_nacimiento, objetivo,
    actividad = 1.375, comidas = 3, factor = 1.0,
    kcal_ajuste = 0
  } = cliente;

  const edad = fecha_nacimiento
    ? calcularEdad(fecha_nacimiento)
    : (cliente.edad || 35);

  const tmb    = calcularTMB(peso, altura, edad);
  const tdee   = Math.round(tmb * actividad * factor);
  const imc    = calcularIMC(peso, altura);
  const [protG, grasaG] = imcMacros(imc);

  let kcal;
  if (objetivo === 'def') {
    const exceso = Math.max(0, peso - (22 * Math.pow(altura / 100, 2)));
    const deficit = calcularDeficit(exceso);
    kcal = tdee - deficit;
  } else if (objetivo === 'sup') {
    const superavit = imc < 22 ? 300 : imc < 25 ? 200 : 150;
    kcal = tdee + superavit;
  } else {
    kcal = tdee;
  }

  // Ajuste manual (±kcal a hidratos o grasas)
  kcal += (kcal_ajuste || 0);
  kcal = Math.round(kcal / 50) * 50;

  const proteina = Math.round(protG * peso);
  const grasa    = Math.round(grasaG * peso);
  const kcalPG   = (proteina * 4) + (grasa * 9);
  const carbos   = Math.max(0, Math.round((kcal - kcalPG) / 4));

  // Distribución por comidas
  const distribucion = generarDistribucion(comidas, kcal, proteina, carbos, grasa);

  return {
    kcal_total: kcal,
    proteina_g: proteina,
    carbos_g: carbos,
    grasas_g: grasa,
    imc: Math.round(imc * 10) / 10,
    tdee,
    distribucion,
  };
}

function generarDistribucion(numComidas, kcal, proteina, carbos, grasa) {
  const reparto = {
    2: [0.45, 0.55],
    3: [0.30, 0.40, 0.30],
    4: [0.25, 0.35, 0.25, 0.15],
    5: [0.20, 0.30, 0.25, 0.15, 0.10],
  };

  const porcs = reparto[numComidas] || reparto[3];
  const nombres = ['Desayuno', 'Comida', 'Merienda', 'Cena', 'Pre-entreno'];

  return porcs.map((p, i) => ({
    nombre: nombres[i] || `Comida ${i + 1}`,
    kcal:      Math.round(kcal * p),
    proteina:  Math.round(proteina * p),
    carbos:    Math.round(carbos * p),
    grasas:    Math.round(grasa * p),
  }));
}

// Ajuste rápido de kcal a hidratos, grasas o mixto
function ajustarKcal(planActual, ajuste, tipo = 'carbos') {
  const nuevo = { ...planActual };
  if (tipo === 'carbos') {
    nuevo.carbos_g  += Math.round(ajuste / 4);
  } else if (tipo === 'grasas') {
    nuevo.grasas_g  += Math.round(ajuste / 9);
  } else {
    // mixto: mitad a carbos, mitad a grasas
    nuevo.carbos_g  += Math.round((ajuste / 2) / 4);
    nuevo.grasas_g  += Math.round((ajuste / 2) / 9);
  }
  nuevo.kcal_total += ajuste;
  return nuevo;
}

module.exports = { generarPlanNutricion, ajustarKcal, calcularIMC, calcularEdad };
