const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'techinventario_db',
  multipleStatements: true
};

let pool;

async function initDB() {
  try {
    pool = mysql.createPool(dbConfig);
    console.log('✅ Conectado exitosamente a la base de datos MySQL (techinventario_db)');
  } catch (err) {
    console.error('❌ Error conectando a MySQL:', err.message);
  }
}

initDB();

// 1. GET /api/phones - Lista de inventario
app.get('/api/phones', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM telefonos ORDER BY id DESC');
    const phones = rows.map(r => ({
      id: `ph-${r.id}`,
      rawId: r.id,
      brand: r.marca,
      model: r.modelo,
      specs: {
        ram: r.ram,
        storage: r.almacenamiento,
        color: r.color,
        camera: r.camara,
        screen: r.pantalla
      },
      priceBs: parseFloat(r.precio_bs),
      stock: r.stock,
      minStock: r.stock_minimo,
      category: r.gama,
      releaseYear: r.ano_lanzamiento
    }));
    res.json(phones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. POST /api/phones - Agregar teléfono
app.post('/api/phones', async (req, res) => {
  try {
    const { brand, model, specs, priceBs, stock, minStock, category, releaseYear } = req.body;
    const code = `PH-0${Math.floor(10 + Math.random() * 90)}`;
    const [result] = await pool.query(
      `INSERT INTO telefonos (codigo_ph, marca, modelo, ram, almacenamiento, color, camara, pantalla, precio_bs, stock, stock_minimo, gama, ano_lanzamiento)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [code, brand, model, specs.ram, specs.storage, specs.color, specs.camera, specs.screen, priceBs, stock, minStock || 3, category, releaseYear || 2024]
    );
    res.json({ id: `ph-${result.insertId}`, success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. PUT /api/phones/:id
app.put('/api/phones/:id', async (req, res) => {
  try {
    const rawId = req.params.id.replace('ph-', '');
    const { brand, model, specs, priceBs, stock, minStock, category, releaseYear } = req.body;
    await pool.query(
      `UPDATE telefonos SET marca=?, modelo=?, ram=?, almacenamiento=?, color=?, camara=?, pantalla=?, precio_bs=?, stock=?, stock_minimo=?, gama=?, ano_lanzamiento=?
       WHERE id=?`,
      [brand, model, specs.ram, specs.storage, specs.color, specs.camera, specs.screen, priceBs, stock, minStock, category, releaseYear, rawId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. DELETE /api/phones/:id
app.delete('/api/phones/:id', async (req, res) => {
  try {
    const rawId = req.params.id.replace('ph-', '');
    await pool.query('DELETE FROM telefonos WHERE id=?', [rawId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. GET /api/users
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM usuarios ORDER BY id ASC');
    const users = rows.map(r => ({
      id: `usr-${r.id}`,
      rawId: r.id,
      name: r.nombre,
      email: r.email,
      role: r.rol,
      phone: r.telefono,
      ci: r.cedula,
      joinDate: r.fecha_ingreso,
      monthlyTargetBs: parseFloat(r.meta_mensual_bs)
    }));
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. POST /api/users
app.post('/api/users', async (req, res) => {
  try {
    const { name, email, role, phone, ci, monthlyTargetBs } = req.body;
    const code = `USR-00${Math.floor(10 + Math.random() * 90)}`;
    const joinDate = new Date().toISOString().split('T')[0];
    const [result] = await pool.query(
      `INSERT INTO usuarios (codigo_usr, nombre, email, cedula, telefono, rol, meta_mensual_bs, fecha_ingreso)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [code, name, email, ci, phone, role, monthlyTargetBs || 0, joinDate]
    );
    res.json({ id: `usr-${result.insertId}`, success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. GET /api/sales
app.get('/api/sales', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT v.*, u.nombre as nombre_vendedor, t.modelo as modelo_telefono, t.marca as marca_telefono
      FROM ventas v
      JOIN usuarios u ON v.usuario_vendedor_id = u.id
      JOIN telefonos t ON v.telefono_id = t.id
      ORDER BY v.fecha DESC
    `);
    const sales = rows.map(r => ({
      id: `sale-${r.id}`,
      code: r.codigo_venta,
      date: r.fecha,
      vendorId: `usr-${r.usuario_vendedor_id}`,
      vendorName: r.nombre_vendedor,
      phoneId: `ph-${r.telefono_id}`,
      phoneName: r.modelo_telefono,
      brand: r.marca_telefono,
      quantity: r.cantidad,
      unitPriceBs: parseFloat(r.precio_unitario_bs),
      totalBs: parseFloat(r.total_bs),
      totalUSD: parseFloat(r.total_usd),
      totalEUR: parseFloat(r.total_eur),
      exchangeRateUsed: parseFloat(r.tasa_cambio_usada),
      paymentMethod: r.metodo_pago,
      clientName: r.cliente_nombre,
      clientDoc: r.cliente_cedula,
      notes: r.notas
    }));
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. POST /api/sales - Registrar venta
app.post('/api/sales', async (req, res) => {
  try {
    const { vendorId, phoneId, quantity, paymentMethod, clientName, clientDoc, notes } = req.body;
    const rawVendorId = vendorId.replace('usr-', '');
    const rawPhoneId = phoneId.replace('ph-', '');

    const [[phone]] = await pool.query('SELECT * FROM telefonos WHERE id=?', [rawPhoneId]);
    if (!phone || phone.stock < quantity) {
      return res.status(400).json({ error: 'Stock insuficiente' });
    }

    const [[rates]] = await pool.query('SELECT * FROM tasas_cambio LIMIT 1');
    const rateUSD = parseFloat(rates.tasa_bcv_usd);
    const rateEUR = parseFloat(rates.tasa_bcv_eur);
    const totalBs = parseFloat(phone.precio_bs) * quantity;
    const totalUSD = Number((totalBs / rateUSD).toFixed(2));
    const totalEUR = Number((totalBs / rateEUR).toFixed(2));
    const code = `VEN-2026-${Math.floor(100 + Math.random() * 900)}`;

    await pool.query(
      `INSERT INTO ventas (codigo_venta, fecha, usuario_vendedor_id, telefono_id, cantidad, precio_unitario_bs, total_bs, total_usd, total_eur, tasa_cambio_usada, metodo_pago, cliente_nombre, cliente_cedula, notas)
       VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [code, rawVendorId, rawPhoneId, quantity, phone.precio_bs, totalBs, totalUSD, totalEUR, rateUSD, paymentMethod, clientName, clientDoc, notes || null]
    );

    // Update stock
    await pool.query('UPDATE telefonos SET stock = stock - ? WHERE id=?', [quantity, rawPhoneId]);

    // Recalculate payroll
    const [[payroll]] = await pool.query('SELECT * FROM pagos_nomina WHERE vendedor_id=?', [rawVendorId]);
    if (payroll) {
      const newTotalBs = parseFloat(payroll.total_ventas_bs) + totalBs;
      const newCommission = Number((newTotalBs * (parseFloat(payroll.porcentaje_comision) / 100)).toFixed(2));
      const newFinalBs = parseFloat(payroll.sueldo_base_bs) + newCommission;
      const newFinalUSD = Number((newFinalBs / rateUSD).toFixed(2));
      await pool.query(
        `UPDATE pagos_nomina SET total_ventas_unidades = total_ventas_unidades + ?, total_ventas_bs = ?, total_ventas_usd = ?, monto_comision_bs = ?, pago_final_bs = ?, pago_final_usd = ? WHERE id = ?`,
        [quantity, newTotalBs, Number((newTotalBs / rateUSD).toFixed(2)), newCommission, newFinalBs, newFinalUSD, payroll.id]
      );
    }

    res.json({ success: true, code });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. GET /api/payroll
app.get('/api/payroll', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, u.nombre as nombre_vendedor, u.cedula as cedula_vendedor
      FROM pagos_nomina p
      JOIN usuarios u ON p.vendedor_id = u.id
      ORDER BY p.id ASC
    `);
    const payrolls = rows.map(r => ({
      id: `pay-${r.id}`,
      rawId: r.id,
      vendorId: `usr-${r.vendedor_id}`,
      vendorName: r.nombre_vendedor,
      vendorDoc: r.cedula_vendedor,
      month: r.mes_periodo,
      totalSalesCount: r.total_ventas_unidades,
      totalSalesBs: parseFloat(r.total_ventas_bs),
      totalSalesUSD: parseFloat(r.total_ventas_usd),
      baseSalaryBs: parseFloat(r.sueldo_base_bs),
      commissionRate: parseFloat(r.porcentaje_comision) / 100,
      commissionAmountBs: parseFloat(r.monto_comision_bs),
      bonusBs: parseFloat(r.monto_bono_bs),
      finalPayoutBs: parseFloat(r.pago_final_bs),
      finalPayoutUSD: parseFloat(r.pago_final_usd),
      status: r.estado,
      paymentDate: r.fecha_pago,
      paymentRef: r.referencia_bancaria
    }));
    res.json(payrolls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. PUT /api/payroll/:id/approve
app.put('/api/payroll/:id/approve', async (req, res) => {
  try {
    const rawId = req.params.id.replace('pay-', '');
    const { paymentRef } = req.body;
    const date = new Date().toISOString().split('T')[0];
    await pool.query(
      `UPDATE pagos_nomina SET estado='Pagado', fecha_pago=?, referencia_bancaria=? WHERE id=?`,
      [date, paymentRef, rawId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. GET /api/rates
app.get('/api/rates', async (req, res) => {
  try {
    const [[r]] = await pool.query('SELECT * FROM tasas_cambio LIMIT 1');
    res.json({
      bcvUSD: parseFloat(r.tasa_bcv_usd),
      bcvEUR: parseFloat(r.tasa_bcv_eur),
      paraleloUSD: parseFloat(r.tasa_paralelo_usd),
      activeRateType: r.tasa_activa,
      lastUpdated: r.ultima_actualizacion
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 12. PUT /api/rates
app.put('/api/rates', async (req, res) => {
  try {
    const { bcvUSD, bcvEUR, paraleloUSD, activeRateType } = req.body;
    await pool.query(
      `UPDATE tasas_cambio SET tasa_bcv_usd=?, tasa_bcv_eur=?, tasa_paralelo_usd=?, tasa_activa=?, ultima_actualizacion=NOW() WHERE id=1`,
      [bcvUSD, bcvEUR, paraleloUSD, activeRateType || 'bcvUSD']
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 13. POST /api/reset - Re-import database.sql
app.post('/api/reset', async (req, res) => {
  try {
    const sqlPath = path.join(__dirname, 'database.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await pool.query(sql);
    res.json({ success: true, message: 'Base de datos MySQL restablecida.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor API Backend MySQL ejecutándose en http://localhost:${PORT}`);
});
