/**
 * Script de migración: corrige semanas_revision en BD
 *
 * Problemas a corregir:
 * 1. Clientes tipo '1a1' o 'uno' que tengan [4,8,12] → cambiar a [3,7,11]
 * 2. Clientes tipo 'programa' que tengan [4,9] (valor incompleto) → cambiar a [4,8,12]
 *
 * Ejecutar: node backend/scripts/fix-semanas-revision.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('Conectando a BD...');

    // Ver el estado actual
    const { rows: antes } = await client.query(`
      SELECT id, nombre, email, tipo, semanas_revision
      FROM clientes
      WHERE semanas_revision IS NOT NULL
      ORDER BY nombre
    `);
    console.log('\n=== Estado ANTES ===');
    antes.forEach(r => console.log(`  ${r.nombre} (${r.email}) | tipo: ${r.tipo} | semanas_revision: [${r.semanas_revision}]`));

    // Fix 1: 1a1/uno con [4,8,12] → [3,7,11]
    const fix1 = await client.query(`
      UPDATE clientes
      SET semanas_revision = ARRAY[3,7,11]
      WHERE (tipo = '1a1' OR tipo = 'uno')
        AND semanas_revision = ARRAY[4,8,12]::int[]
      RETURNING id, nombre, email, tipo, semanas_revision
    `);
    console.log(`\nFix 1 (1a1 [4,8,12]→[3,7,11]): ${fix1.rowCount} filas actualizadas`);
    fix1.rows.forEach(r => console.log(`  ✅ ${r.nombre} → [${r.semanas_revision}]`));

    // Fix 2: programa con [4,9] → [4,8,12]
    const fix2 = await client.query(`
      UPDATE clientes
      SET semanas_revision = ARRAY[4,8,12]
      WHERE tipo = 'programa'
        AND semanas_revision = ARRAY[4,9]::int[]
      RETURNING id, nombre, email, tipo, semanas_revision
    `);
    console.log(`\nFix 2 (programa [4,9]→[4,8,12]): ${fix2.rowCount} filas actualizadas`);
    fix2.rows.forEach(r => console.log(`  ✅ ${r.nombre} → [${r.semanas_revision}]`));

    // Fix 3: clientes sin semanas_revision → asignar por tipo
    const fix3 = await client.query(`
      UPDATE clientes
      SET semanas_revision = CASE
        WHEN tipo = '1a1' OR tipo = 'uno' THEN ARRAY[3,7,11]
        ELSE ARRAY[4,8,12]
      END
      WHERE semanas_revision IS NULL
      RETURNING id, nombre, email, tipo, semanas_revision
    `);
    console.log(`\nFix 3 (NULL → según tipo): ${fix3.rowCount} filas actualizadas`);
    fix3.rows.forEach(r => console.log(`  ✅ ${r.nombre} (${r.tipo}) → [${r.semanas_revision}]`));

    // Ver estado final
    const { rows: despues } = await client.query(`
      SELECT id, nombre, email, tipo, semanas_revision
      FROM clientes
      ORDER BY nombre
    `);
    console.log('\n=== Estado DESPUÉS ===');
    despues.forEach(r => console.log(`  ${r.nombre} (${r.tipo}) | semanas_revision: [${r.semanas_revision}]`));

    console.log('\n✅ Migración completada');
  } catch (err) {
    console.error('❌ Error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(e => { console.error(e); process.exit(1); });
