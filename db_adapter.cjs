const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data', 'techinventario_database.json');
const SQL_FILE = path.join(__dirname, 'database.sql');

let mysqlPool = null;
let isUsingFallback = false;
let memoryDb = null;

function saveFallbackDb() {
  if (memoryDb) {
    try {
      fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
      fs.writeFileSync(DB_FILE, JSON.stringify(memoryDb, null, 2), 'utf8');
    } catch (e) {
      console.error('Error guardando base de datos local:', e.message);
    }
  }
}

function loadFallbackDb() {
  if (fs.existsSync(DB_FILE)) {
    try {
      memoryDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      console.log('📂 Base de datos local cargada desde data/techinventario_database.json');
      return;
    } catch (e) {
      console.error('Error parseando archivo de base de datos:', e.message);
    }
  }

  // Si no existe, inicializar con estructura básica
  memoryDb = {
    telefonos: [],
    usuarios: [],
    ventas: [],
    compras_inventario: [],
    gastos_operativos: [],
    pagos_nomina: [],
    tasas_cambio: [
      {
        id: 1,
        tasa_bcv_usd: 36.50,
        tasa_bcv_eur: 39.80,
        tasa_paralelo_usd: 40.20,
        fecha_actualizacion: new Date().toISOString()
      }
    ],
    estadisticas_mercado: [],
    auditoria: []
  };
  saveFallbackDb();
}

async function initDatabase() {
  // 1. Intentar conectar a MySQL / MariaDB (puerto 3306)
  try {
    const rootConfig = {
      host: 'localhost',
      user: 'root',
      password: '',
      multipleStatements: true,
      connectTimeout: 2000
    };

    const tempConn = await mysql.createConnection(rootConfig);
    // Asegurar que la base de datos existe
    await tempConn.query('CREATE DATABASE IF NOT EXISTS `techinventario_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
    await tempConn.end();

    mysqlPool = mysql.createPool({
      ...rootConfig,
      database: 'techinventario_db'
    });

    // Probar conexión y verificar si hay tablas
    const [tables] = await mysqlPool.query("SHOW TABLES LIKE 'telefonos'");
    if (tables.length === 0 && fs.existsSync(SQL_FILE)) {
      console.log('🔄 Tablas no encontradas en MySQL. Inicializando desde database.sql...');
      const sql = fs.readFileSync(SQL_FILE, 'utf8');
      await mysqlPool.query(sql);
      console.log('✅ Base de datos MySQL inicializada con datos de prueba.');
    }

    console.log('✅ Conectado exitosamente a MySQL/MariaDB (techinventario_db)');
    isUsingFallback = false;
    return { mode: 'mysql' };
  } catch (err) {
    console.warn(`⚠️ MySQL no detectado en localhost:3306 (${err.code || err.message}).`);
    console.log('✨ Activando Motor Autónomo Embebido (Zero-Config) con almacenamiento local.');
    loadFallbackDb();
    isUsingFallback = true;
    return { mode: 'fallback' };
  }
}

// Ejecutor de consultas para el motor local en fallback
function executeFallbackQuery(sql, params = []) {
  if (!memoryDb) loadFallbackDb();

  const trimmed = sql.trim().replace(/\s+/g, ' ');
  const upper = trimmed.toUpperCase();

  // 1. SELECT telefonos
  if (upper.startsWith('SELECT * FROM TELEFONOS WHERE ID=?') || upper.startsWith('SELECT * FROM TELEFONOS WHERE ID = ?')) {
    const rawId = parseInt(params[0], 10);
    const row = memoryDb.telefonos.find(t => t.id === rawId);
    return [[row || null], []];
  }
  if (upper.startsWith('SELECT * FROM TELEFONOS')) {
    const sorted = [...memoryDb.telefonos].sort((a, b) => b.id - a.id);
    return [sorted, []];
  }
  if (upper.startsWith('SELECT MAX(PRECIO_BS)')) {
    const max = memoryDb.telefonos.reduce((m, t) => Math.max(m, parseFloat(t.precio_bs) || 0), 0);
    return [[{ max_price: max }], []];
  }

  // 2. INSERT INTO telefonos
  if (upper.startsWith('INSERT INTO TELEFONOS')) {
    const newId = memoryDb.telefonos.reduce((max, t) => Math.max(max, t.id || 0), 0) + 1;
    const phone = {
      id: newId,
      codigo_ph: params[0],
      marca: params[1],
      modelo: params[2],
      ram: params[3],
      almacenamiento: params[4],
      color: params[5],
      camara: params[6],
      pantalla: params[7],
      precio_bs: params[8],
      costo_bs: params[9],
      costo_usd: params[10],
      ultimo_costo_usd: params[11],
      costo_promedio_usd: params[12],
      metodo_costeo: params[13],
      margen_ganancia: params[14],
      stock: params[15],
      stock_minimo: params[16],
      gama: params[17],
      ano_lanzamiento: params[18]
    };
    memoryDb.telefonos.push(phone);
    saveFallbackDb();
    return [{ insertId: newId }, []];
  }

  // 3. UPDATE telefonos
  if (upper.startsWith('UPDATE TELEFONOS SET STOCK=? WHERE ID=?') || upper.startsWith('UPDATE TELEFONOS SET STOCK = ? WHERE ID = ?')) {
    const rawId = parseInt(params[1], 10);
    const phone = memoryDb.telefonos.find(t => t.id === rawId);
    if (phone) phone.stock = parseInt(params[0], 10);
    saveFallbackDb();
    return [{ affectedRows: phone ? 1 : 0 }, []];
  }
  if (upper.startsWith('UPDATE TELEFONOS SET STOCK = STOCK - ? WHERE ID=?') || upper.startsWith('UPDATE TELEFONOS SET STOCK = STOCK - ? WHERE ID = ?')) {
    const rawId = parseInt(params[1], 10);
    const phone = memoryDb.telefonos.find(t => t.id === rawId);
    if (phone) phone.stock = Math.max(0, (phone.stock || 0) - parseInt(params[0], 10));
    saveFallbackDb();
    return [{ affectedRows: phone ? 1 : 0 }, []];
  }
  if (upper.includes('UPDATE TELEFONOS SET PRECIO_BS = ROUND(PRECIO_BS * ?, 2)')) {
    const scale = parseFloat(params[0]);
    memoryDb.telefonos.forEach(t => {
      t.precio_bs = Number((parseFloat(t.precio_bs) * scale).toFixed(2));
    });
    saveFallbackDb();
    return [{ affectedRows: memoryDb.telefonos.length }, []];
  }
  if (upper.startsWith('UPDATE TELEFONOS SET')) {
    // General phone update
    const rawId = parseInt(params[params.length - 1], 10);
    const phone = memoryDb.telefonos.find(t => t.id === rawId);
    if (phone) {
      if (params.length >= 19) {
        phone.marca = params[0];
        phone.modelo = params[1];
        phone.ram = params[2];
        phone.almacenamiento = params[3];
        phone.color = params[4];
        phone.camara = params[5];
        phone.pantalla = params[6];
        phone.precio_bs = params[7];
        phone.costo_bs = params[8];
        phone.costo_usd = params[9];
        phone.ultimo_costo_usd = params[10];
        phone.costo_promedio_usd = params[11];
        phone.metodo_costeo = params[12];
        phone.margen_ganancia = params[13];
        phone.stock = params[14];
        phone.stock_minimo = params[15];
        phone.gama = params[16];
        phone.ano_lanzamiento = params[17];
      }
      saveFallbackDb();
      return [{ affectedRows: 1 }, []];
    }
  }

  // 4. DELETE FROM telefonos
  if (upper.startsWith('DELETE FROM TELEFONOS WHERE ID=?') || upper.startsWith('DELETE FROM TELEFONOS WHERE ID = ?')) {
    const rawId = parseInt(params[0], 10);
    memoryDb.telefonos = memoryDb.telefonos.filter(t => t.id !== rawId);
    saveFallbackDb();
    return [{ affectedRows: 1 }, []];
  }

  // 5. USUARIOS
  if (upper.startsWith('SELECT NOMBRE, ROL FROM USUARIOS WHERE ID=?') || upper.startsWith('SELECT NOMBRE, ROL FROM USUARIOS WHERE ID = ?')) {
    const rawId = parseInt(params[0], 10);
    const u = memoryDb.usuarios.find(x => x.id === rawId);
    return [[u || null], []];
  }
  if (upper.startsWith('SELECT * FROM USUARIOS')) {
    return [memoryDb.usuarios, []];
  }
  if (upper.startsWith('INSERT INTO USUARIOS')) {
    const newId = memoryDb.usuarios.reduce((max, u) => Math.max(max, u.id || 0), 0) + 1;
    const user = {
      id: newId,
      codigo_usr: params[0],
      nombre: params[1],
      email: params[2],
      cedula: params[3],
      telefono: params[4],
      rol: params[5],
      meta_mensual_bs: params[6],
      fecha_ingreso: params[7]
    };
    memoryDb.usuarios.push(user);
    saveFallbackDb();
    return [{ insertId: newId }, []];
  }

  // 6. VENTAS
  if (upper.includes('SELECT CODIGO_VENTA FROM VENTAS WHERE REFERENCIA_PAGO = ?')) {
    const ref = String(params[0] || '').trim();
    const existing = memoryDb.ventas.find(v => v.referencia_pago && String(v.referencia_pago).trim() === ref);
    return [[existing || null], []];
  }
  if (upper.includes('FROM VENTAS V JOIN USUARIOS U') || upper.startsWith('SELECT * FROM VENTAS')) {
    const rows = memoryDb.ventas.map(v => {
      const u = memoryDb.usuarios.find(user => user.id === v.vendedor_id);
      const p = memoryDb.telefonos.find(phone => phone.id === v.telefono_id);
      return {
        ...v,
        vendedor_nombre: u ? u.nombre : 'Vendedor',
        marca: p ? p.marca : 'Marca',
        telefono_modelo: p ? p.modelo : 'Modelo'
      };
    }).sort((a, b) => b.id - a.id);
    return [rows, []];
  }
  if (upper.startsWith('INSERT INTO VENTAS')) {
    const newId = memoryDb.ventas.reduce((max, v) => Math.max(max, v.id || 0), 0) + 1;
    const sale = {
      id: newId,
      codigo_venta: params[0],
      fecha: new Date().toISOString().slice(0, 19).replace('T', ' '),
      vendedor_id: params[1],
      telefono_id: params[2],
      cantidad: params[3],
      precio_unitario_bs: params[4],
      subtotal_bs: params[5],
      base_imponible_bs: params[6],
      iva_bs: params[7],
      igtf_bs: params[8],
      total_bs: params[9],
      total_usd: params[10],
      tasa_cambio_usada: params[11],
      metodo_pago: params[12],
      referencia_pago: params[13],
      cliente_nombre: params[14],
      cliente_cedula: params[15],
      notas: params[16]
    };
    memoryDb.ventas.push(sale);
    saveFallbackDb();
    return [{ insertId: newId }, []];
  }

  // 7. COMPRAS INVENTARIO
  if (upper.includes('FROM COMPRAS_INVENTARIO C JOIN TELEFONOS P') || upper.startsWith('SELECT * FROM COMPRAS_INVENTARIO')) {
    const rows = memoryDb.compras_inventario.map(c => {
      const p = memoryDb.telefonos.find(phone => phone.id === c.telefono_id);
      return {
        ...c,
        marca: p ? p.marca : 'Marca',
        telefono_modelo: p ? p.modelo : 'Modelo'
      };
    }).sort((a, b) => b.id - a.id);
    return [rows, []];
  }
  if (upper.startsWith('INSERT INTO COMPRAS_INVENTARIO')) {
    const newId = memoryDb.compras_inventario.reduce((max, c) => Math.max(max, c.id || 0), 0) + 1;
    const purchase = {
      id: newId,
      fecha: new Date().toISOString().slice(0, 19).replace('T', ' '),
      telefono_id: params[0],
      proveedor: params[1],
      numero_factura: params[2],
      cantidad: params[3],
      costo_unitario_usd: params[4],
      costo_unitario_bs: params[5],
      total_compra_usd: params[6],
      total_compra_bs: params[7],
      tasa_cambio_usada: params[8],
      metodo_costeo_aplicado: params[9],
      costo_anterior_usd: params[10],
      costo_nuevo_usd: params[11],
      precio_venta_anterior_bs: params[12],
      precio_venta_nuevo_bs: params[13],
      notas: params[14]
    };
    memoryDb.compras_inventario.push(purchase);
    saveFallbackDb();
    return [{ insertId: newId }, []];
  }

  // 8. GASTOS OPERATIVOS
  if (upper.startsWith('SELECT * FROM GASTOS_OPERATIVOS WHERE ID=?') || upper.startsWith('SELECT * FROM GASTOS_OPERATIVOS WHERE ID = ?')) {
    const rawId = parseInt(params[0], 10);
    const g = memoryDb.gastos_operativos.find(x => x.id === rawId);
    return [[g || null], []];
  }
  if (upper.startsWith('SELECT * FROM GASTOS_OPERATIVOS')) {
    const rows = [...memoryDb.gastos_operativos].sort((a, b) => b.id - a.id);
    return [rows, []];
  }
  if (upper.startsWith('INSERT INTO GASTOS_OPERATIVOS')) {
    const newId = memoryDb.gastos_operativos.reduce((max, g) => Math.max(max, g.id || 0), 0) + 1;
    const expense = {
      id: newId,
      categoria: params[0],
      descripcion: params[1],
      monto_bs: params[2],
      monto_usd: params[3],
      metodo_pago: params[4],
      numero_referencia: params[5],
      fecha: params[6],
      registrado_por: params[7]
    };
    memoryDb.gastos_operativos.push(expense);
    saveFallbackDb();
    return [{ insertId: newId }, []];
  }
  if (upper.startsWith('DELETE FROM GASTOS_OPERATIVOS WHERE ID=?') || upper.startsWith('DELETE FROM GASTOS_OPERATIVOS WHERE ID = ?')) {
    const rawId = parseInt(params[0], 10);
    memoryDb.gastos_operativos = memoryDb.gastos_operativos.filter(g => g.id !== rawId);
    saveFallbackDb();
    return [{ affectedRows: 1 }, []];
  }

  // 9. PAGOS NOMINA
  if (upper.includes('FROM PAGOS_NOMINA P JOIN USUARIOS U') || upper.startsWith('SELECT * FROM PAGOS_NOMINA')) {
    if (upper.includes('WHERE VENDEDOR_ID=?') || upper.includes('WHERE VENDEDOR_ID = ?')) {
      const vId = parseInt(params[0], 10);
      const rows = memoryDb.pagos_nomina.filter(p => p.vendedor_id === vId);
      return [[rows[0] || null], []];
    }
    const rows = memoryDb.pagos_nomina.map(p => {
      const u = memoryDb.usuarios.find(user => user.id === p.vendedor_id);
      return {
        ...p,
        vendedor_nombre: u ? u.nombre : 'Vendedor',
        vendedor_cedula: u ? u.cedula : 'V-00000000'
      };
    }).sort((a, b) => b.id - a.id);
    return [rows, []];
  }
  if (upper.includes('UPDATE PAGOS_NOMINA SET ESTADO=?, FECHA_PAGO=NOW(), REFERENCIA_PAGO=? WHERE ID=?')) {
    const rawId = parseInt(params[2], 10);
    const p = memoryDb.pagos_nomina.find(x => x.id === rawId);
    if (p) {
      p.estado = params[0];
      p.referencia_pago = params[1];
      p.fecha_pago = new Date().toISOString().slice(0, 19).replace('T', ' ');
    }
    saveFallbackDb();
    return [{ affectedRows: p ? 1 : 0 }, []];
  }
  if (upper.includes('UPDATE PAGOS_NOMINA SET TOTAL_VENTAS_BS = TOTAL_VENTAS_BS + ?')) {
    const rawId = parseInt(params[2], 10);
    const p = memoryDb.pagos_nomina.find(x => x.id === rawId);
    if (p) {
      p.total_ventas_bs = (parseFloat(p.total_ventas_bs) || 0) + parseFloat(params[0]);
      p.comision_bs = (parseFloat(p.comision_bs) || 0) + parseFloat(params[1]);
    }
    saveFallbackDb();
    return [{ affectedRows: p ? 1 : 0 }, []];
  }

  // 10. TASAS CAMBIO
  if (upper.startsWith('SELECT * FROM TASAS_CAMBIO LIMIT 1')) {
    return [[memoryDb.tasas_cambio[0] || null], []];
  }
  if (upper.startsWith('UPDATE TASAS_CAMBIO SET')) {
    if (!memoryDb.tasas_cambio[0]) {
      memoryDb.tasas_cambio[0] = { id: 1 };
    }
    memoryDb.tasas_cambio[0].tasa_bcv_usd = parseFloat(params[0]);
    memoryDb.tasas_cambio[0].tasa_bcv_eur = parseFloat(params[1]);
    memoryDb.tasas_cambio[0].tasa_paralelo_usd = parseFloat(params[2]);
    memoryDb.tasas_cambio[0].fecha_actualizacion = new Date().toISOString().slice(0, 19).replace('T', ' ');
    saveFallbackDb();
    return [{ affectedRows: 1 }, []];
  }

  // 11. AUDITORIA
  if (upper.startsWith('SELECT * FROM AUDITORIA')) {
    const rows = [...memoryDb.auditoria].sort((a, b) => b.id - a.id).slice(0, 300);
    return [rows, []];
  }
  if (upper.startsWith('INSERT INTO AUDITORIA')) {
    const newId = memoryDb.auditoria.reduce((max, a) => Math.max(max, a.id || 0), 0) + 1;
    const audit = {
      id: newId,
      fecha: new Date().toISOString().slice(0, 19).replace('T', ' '),
      usuario: params[0],
      rol: params[1],
      accion: params[2],
      detalles: params[3]
    };
    memoryDb.auditoria.push(audit);
    saveFallbackDb();
    return [{ insertId: newId }, []];
  }

  console.warn('⚠️ Consulta local no mapeada explícitamente:', trimmed);
  return [[], []];
}

async function query(sql, params = []) {
  if (!isUsingFallback && mysqlPool) {
    try {
      return await mysqlPool.query(sql, params);
    } catch (err) {
      // Si falla la conexión durante la ejecución, cambiar a fallback
      if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.warn('⚠️ Conexión MySQL perdida. Cambiando automáticamente a motor local...');
        isUsingFallback = true;
        loadFallbackDb();
        return executeFallbackQuery(sql, params);
      }
      throw err;
    }
  } else {
    return executeFallbackQuery(sql, params);
  }
}

async function resetDatabase() {
  if (!isUsingFallback && mysqlPool) {
    if (fs.existsSync(SQL_FILE)) {
      const sql = fs.readFileSync(SQL_FILE, 'utf8');
      await mysqlPool.query(sql);
      return { success: true, mode: 'mysql' };
    }
  }

  // Reset local
  if (fs.existsSync(SQL_FILE)) {
    // Si tenemos backup json en data, recargarlo
    const backupJson = path.join(__dirname, 'data', 'techinventario_database.json');
    if (fs.existsSync(backupJson)) {
      loadFallbackDb();
      return { success: true, mode: 'fallback' };
    }
  }
  return { success: true, mode: 'fallback' };
}

module.exports = {
  initDatabase,
  query,
  resetDatabase,
  isFallbackMode: () => isUsingFallback
};
