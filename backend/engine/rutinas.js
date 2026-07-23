'use strict';

const db = require('../db');

// ── Asignador automático de rutinas ──────────────────────────────────────────
// Misma lógica que asignar_rutina() en app_generador.py
function asignarRutina(dias, lugar, tiempo, nivel) {
  const t_corto = tiempo <= 35;
  const t_largo = tiempo >= 60;

  if (dias === 2) {
    return lugar === 'gym' ? '2D.FB.GYM' : '2D.FB.SINMAT';
  }

  if (dias === 3) {
    if (lugar === 'gym') {
      if (t_corto)       return '3D.TP,FB.GYM.C';
      if (nivel === 0)   return t_largo ? '3D.TP,FB.GYM'  : '3D.FB.GYM';
      if (nivel === 1)   return t_largo ? '3D.TP,FB.GYM+' : '3D.TP,FB.GYM';
      return t_largo ? '3D.PTE' : '3D.TP,FB.GYM+';
    }
    const mapCasa3 = {
      sinmat: nivel <= 1 ? '3D.FB.SINMAT'    : '3D.TP,FB.SINMAT',
      band:   nivel <= 1 ? '3D.FB.BAND'      : '3D.TP,FB.BAND',
      bym:    nivel <= 1 ? '3D.FB.ByM'       : '3D.TP,FB.B,M',
      bymb:   nivel <= 1 ? '3D.FB.ByM'       : '3D.TP,FB.B,M',
    };
    return mapCasa3[lugar] || '3D.FB.BAND';
  }

  if (dias === 4) {
    if (lugar === 'gym') {
      if (t_corto)     return '4D.TE.GYM30';
      if (nivel === 0) return '4D.TE';
      if (nivel === 1) return t_largo ? '4D.TP2' : '4D.TP';
      return t_largo ? '4ET,PiernayBrazo.GYM2' : '4ETP,TB';
    }
    const mapCasa4 = {
      sinmat: nivel <= 1 ? '4D.TE.SINMAT'    : '4D.TP.SINMAT',
      band:   nivel <= 1 ? '4D.TE.BAND'      : '4D.TP.CIRCUIT.BAND',
      bym:    nivel <= 1 ? '4D.TP.B,MyB'     : '4D.TP3.B,MyB',
      bymb:   nivel <= 1 ? '4D.TP.B,MyB'     : '4ETP,TB.CASA',
      trx:    '4D.TE.M,ByTRX',
    };
    return mapCasa4[lugar] || '4D.TP.B,MyB';
  }

  if (dias === 5) {
    return nivel <= 1 ? '5D.TPAH' : '5D-TPHB';
  }

  return null;
}

// ── Sugerir siguiente rutina según historial del cliente ──────────────────────
async function sugerirSiguienteRutina(clienteId) {
  // Obtener historial de bloques del cliente
  const { rows: bloques } = await db.query(
    `SELECT rutina_cod, numero_bloque, estado
     FROM bloques
     WHERE cliente_id = $1
     ORDER BY numero_bloque DESC`,
    [clienteId]
  );

  if (!bloques.length) return null;

  const ultimaRutina = bloques[0].rutina_cod;
  const numBloque    = bloques[0].numero_bloque + 1;
  const rutinasUsadas = bloques.map(b => b.rutina_cod);

  // Buscar siguiente en cascada de progresión
  const { rows: cascada } = await db.query(
    `SELECT rutina_siguiente, prioridad
     FROM cascada_rutinas
     WHERE rutina_origen = $1
     ORDER BY prioridad ASC
     LIMIT 5`,
    [ultimaRutina]
  );

  // Filtrar rutinas ya usadas recientemente (últimos 3 bloques)
  const recientes = rutinasUsadas.slice(0, 3);
  const candidatas = cascada.filter(c => !recientes.includes(c.rutina_siguiente));

  if (candidatas.length) {
    return {
      rutina_cod:    candidatas[0].rutina_siguiente,
      numero_bloque: numBloque,
      motivo:        'Progresión automática según cascada',
    };
  }

  // Si no hay cascada o todas están usadas, sugerir la de cascada sin filtrar
  if (cascada.length) {
    return {
      rutina_cod:    cascada[0].rutina_siguiente,
      numero_bloque: numBloque,
      motivo:        'Próxima en cascada de progresión',
    };
  }

  return null;
}

// ── Generar notificaciones de revisión para un bloque ─────────────────────────
async function programarNotificacionesRevision(clienteId, bloqueId, fechaInicio, semanas, semanasRevision) {
  const inicio = new Date(fechaInicio);
  const notifs = [];

  for (const semana of semanasRevision) {
    // Miércoles de esa semana
    const miercoles = new Date(inicio);
    miercoles.setDate(miercoles.getDate() + (semana - 1) * 7 + 2);
    miercoles.setHours(9, 0, 0, 0);

    // Sábado de esa semana
    const sabado = new Date(inicio);
    sabado.setDate(sabado.getDate() + (semana - 1) * 7 + 5);
    sabado.setHours(9, 0, 0, 0);

    notifs.push(
      { tipo: 'revision_recordatorio', titulo: 'Revisión este sábado', mensaje: `Recuerda subir tu peso, medidas y fotos antes del sábado. Semana ${semana}.`, enviar_en: miercoles },
      { tipo: 'revision_ultimo_aviso', titulo: 'Hoy es el día', mensaje: `Hoy toca revisión (Semana ${semana}). Sube tus datos y fotos en la app.`, enviar_en: sabado }
    );
  }

  for (const n of notifs) {
    await db.query(
      `INSERT INTO notificaciones (cliente_id, tipo, titulo, mensaje, enviar_en)
       VALUES ($1, $2, $3, $4, $5)`,
      [clienteId, n.tipo, n.titulo, n.mensaje, n.enviar_en]
    );
  }

  return notifs.length;
}

module.exports = {
  asignarRutina,
  sugerirSiguienteRutina,
  programarNotificacionesRevision,
};
