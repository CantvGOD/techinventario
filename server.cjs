const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const dbAdapter = require('./db_adapter.cjs');
const pool = dbAdapter;

const app = express();
app.use(cors());
app.use(express.json());

dbAdapter.initDatabase().then((res) => {
  console.log(`📡 Modo de base de datos activo: ${res.mode.toUpperCase()}`);
}).catch((err) => {
  console.error('Error inicializando base de datos:', err);
});

// Helper para registrar en auditoría MySQL
async function logToAudit(user, role, action, details) {
  try {
    if (pool) {
      await pool.query(
        'INSERT INTO auditoria (fecha, usuario, rol, accion, detalles) VALUES (NOW(), ?, ?, ?, ?)',
        [user || 'Sistema', role || 'super_user', action, details]
      );
    }
  } catch (err) {
    console.error('Error insertando en auditoría:', err.message);
  }
}

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
      costBs: parseFloat(r.costo_bs || 0),
      costUSD: parseFloat(r.costo_usd || 0),
      lastCostUSD: parseFloat(r.ultimo_costo_usd || 0),
      avgCostUSD: parseFloat(r.costo_promedio_usd || 0),
      costMethod: r.metodo_costeo || 'promedio_ponderado',
      profitMargin: parseFloat(r.margen_ganancia || 30),
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

// 2. POST /api/phones - Agregar teléfono al inventario
app.post('/api/phones', async (req, res) => {
  try {
    const { brand, model, specs, priceBs, costBs, costUSD, costMethod, profitMargin, stock, minStock, category, releaseYear, currentUser } = req.body;
    const code = `PH-0${Math.floor(10 + Math.random() * 90)}`;
    const [result] = await pool.query(
      `INSERT INTO telefonos (codigo_ph, marca, modelo, ram, almacenamiento, color, camara, pantalla, precio_bs, costo_bs, costo_usd, ultimo_costo_usd, costo_promedio_usd, metodo_costeo, margen_ganancia, stock, stock_minimo, gama, ano_lanzamiento)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code, brand, model, specs.ram, specs.storage, specs.color, specs.camera, specs.screen,
        priceBs, costBs || 0, costUSD || 0, costUSD || 0, costUSD || 0, costMethod || 'promedio_ponderado',
        profitMargin || 30, stock, minStock || 3, category, releaseYear || 2024
      ]
    );

    const user = currentUser?.name || 'Administrador';
    const role = currentUser?.role || 'admin';
    const details = `Nuevo equipo incorporado al inventario: "${brand} ${model}" (Cód: ${code}). Stock inicial: ${stock} unidades (Stock mínimo: ${minStock || 3}). Precio: Bs. ${Number(priceBs).toLocaleString('es-VE')}. Costo: $${costUSD || 0} USD (Bs. ${Number(costBs || 0).toLocaleString('es-VE')}). Margen: ${profitMargin || 30}%.`;

    await logToAudit(user, role, 'Ingreso de Teléfono a Inventario', details);

    res.json({ id: `ph-${result.insertId}`, success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. PUT /api/phones/:id - Modificar teléfono o stock con desglose de diferencias
app.put('/api/phones/:id', async (req, res) => {
  try {
    const rawId = req.params.id.replace('ph-', '');
    const { brand, model, specs, priceBs, costBs, costUSD, costMethod, profitMargin, stock, minStock, category, releaseYear, currentUser, movementReason } = req.body;

    const [[oldPhone]] = await pool.query('SELECT * FROM telefonos WHERE id=?', [rawId]);
    if (!oldPhone) {
      return res.status(404).json({ error: 'Teléfono no encontrado' });
    }

    const changes = [];
    let stockDiff = 0;

    // Verificar cambios en Stock
    if (stock !== undefined && Number(oldPhone.stock) !== Number(stock)) {
      stockDiff = Number(stock) - Number(oldPhone.stock);
      const changeText = stockDiff > 0
        ? `Stock: ${oldPhone.stock} unids ➔ ${stock} unids (+${stockDiff} unids agregadas al inventario)`
        : `Stock: ${oldPhone.stock} unids ➔ ${stock} unids (${stockDiff} unids retiradas del inventario)`;
      changes.push(changeText);
    }

    // Verificar cambios en Precio
    if (priceBs !== undefined && parseFloat(oldPhone.precio_bs) !== Number(priceBs)) {
      changes.push(`Precio: Bs. ${parseFloat(oldPhone.precio_bs).toLocaleString('es-VE')} ➔ Bs. ${Number(priceBs).toLocaleString('es-VE')}`);
    }

    // Verificar cambios en Costo
    if (costUSD !== undefined && parseFloat(oldPhone.costo_usd) !== Number(costUSD)) {
      changes.push(`Costo: $${parseFloat(oldPhone.costo_usd)} ➔ $${Number(costUSD)} USD`);
    }

    // Verificar cambios en Stock Mínimo
    if (minStock !== undefined && Number(oldPhone.stock_minimo) !== Number(minStock)) {
      changes.push(`Stock Mínimo de alerta: ${oldPhone.stock_minimo} ➔ ${minStock}`);
    }

    // Verificar cambios en especificaciones
    if (specs) {
      if (specs.ram && oldPhone.ram !== specs.ram) changes.push(`RAM: ${oldPhone.ram} ➔ ${specs.ram}`);
      if (specs.storage && oldPhone.almacenamiento !== specs.storage) changes.push(`Almacenamiento: ${oldPhone.almacenamiento} ➔ ${specs.storage}`);
      if (specs.color && oldPhone.color !== specs.color) changes.push(`Color: ${oldPhone.color} ➔ ${specs.color}`);
      if (specs.camera && oldPhone.camara !== specs.camera) changes.push(`Cámara: ${oldPhone.camara} ➔ ${specs.camera}`);
      if (specs.screen && oldPhone.pantalla !== specs.screen) changes.push(`Pantalla: ${oldPhone.pantalla} ➔ ${specs.screen}`);
    }

    // Verificar cambios en Gama / Marca / Modelo / Año
    if (category && oldPhone.gama !== category) changes.push(`Gama: ${oldPhone.gama} ➔ ${category}`);
    if (brand && oldPhone.marca !== brand) changes.push(`Marca: "${oldPhone.marca}" ➔ "${brand}"`);
    if (model && oldPhone.modelo !== model) changes.push(`Modelo: "${oldPhone.modelo}" ➔ "${model}"`);
    if (releaseYear && Number(oldPhone.ano_lanzamiento) !== Number(releaseYear)) changes.push(`Año: ${oldPhone.ano_lanzamiento} ➔ ${releaseYear}`);

    // Determinar la acción exacta para auditoría
    let action = 'Modificación de Teléfono en Inventario';
    if (changes.length === 1 && stockDiff !== 0) {
      action = stockDiff < 0 ? 'Salida de Stock de Inventario' : 'Ingreso de Stock a Inventario';
    } else if (stockDiff < 0) {
      action = 'Modificación y Retiro de Stock en Inventario';
    } else if (stockDiff > 0) {
      action = 'Modificación e Ingreso de Stock en Inventario';
    }

    const reasonStr = movementReason ? ` [Motivo/Justificación: ${movementReason}]` : '';
    const details = `Modificación de equipo "${brand || oldPhone.marca} ${model || oldPhone.modelo}" (Cód: ${oldPhone.codigo_ph || rawId}): ${changes.length > 0 ? changes.join(' | ') : 'Guardado sin cambios en campos principales'}.${reasonStr}`;

    await pool.query(
      `UPDATE telefonos SET marca=?, modelo=?, ram=?, almacenamiento=?, color=?, camara=?, pantalla=?, precio_bs=?, costo_bs=?, costo_usd=?, metodo_costeo=?, margen_ganancia=?, stock=?, stock_minimo=?, gama=?, ano_lanzamiento=?
       WHERE id=?`,
      [
        brand || oldPhone.marca,
        model || oldPhone.modelo,
        specs?.ram || oldPhone.ram,
        specs?.storage || oldPhone.almacenamiento,
        specs?.color || oldPhone.color,
        specs?.camera || oldPhone.camara,
        specs?.screen || oldPhone.pantalla,
        priceBs !== undefined ? priceBs : oldPhone.precio_bs,
        costBs !== undefined ? costBs : oldPhone.costo_bs,
        costUSD !== undefined ? costUSD : oldPhone.costo_usd,
        costMethod || oldPhone.metodo_costeo,
        profitMargin !== undefined ? profitMargin : oldPhone.margen_ganancia,
        stock !== undefined ? stock : oldPhone.stock,
        minStock !== undefined ? minStock : oldPhone.stock_minimo,
        category || oldPhone.gama,
        releaseYear !== undefined ? releaseYear : oldPhone.ano_lanzamiento,
        rawId
      ]
    );

    const user = currentUser?.name || 'Administrador';
    const role = currentUser?.role || 'admin';
    await logToAudit(user, role, action, details);

    res.json({ success: true, changesCount: changes.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3.1 POST /api/phones/:id/stock-movement - Movimiento directo de unidades (Salida / Ingreso de inventario)
app.post('/api/phones/:id/stock-movement', async (req, res) => {
  try {
    const rawId = req.params.id.replace('ph-', '');
    const { type, quantity, reason, currentUser } = req.body;
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'La cantidad debe ser un número entero mayor a 0.' });
    }

    const [[phone]] = await pool.query('SELECT * FROM telefonos WHERE id=?', [rawId]);
    if (!phone) {
      return res.status(404).json({ error: 'Teléfono no encontrado' });
    }

    let newStock = phone.stock;
    let action = '';
    let details = '';

    if (type === 'out') {
      if (phone.stock < qty) {
        return res.status(400).json({ error: `Stock insuficiente. Solo quedan ${phone.stock} unidades disponibles en existencia.` });
      }
      newStock = phone.stock - qty;
      action = 'Salida de Stock de Inventario';
      details = `Retiro de unidades de inventario: Se descargaron ${qty} unidades de "${phone.marca} ${phone.modelo}" (Cód: ${phone.codigo_ph || rawId}). Motivo: ${reason || 'Ajuste de inventario físico'}. Stock anterior: ${phone.stock} unids ➔ Stock resultante disponible: ${newStock} unids (-${qty} unids descontadas).`;
    } else {
      newStock = phone.stock + qty;
      action = 'Ingreso de Stock a Inventario';
      details = `Ingreso de unidades a inventario: Se sumaron ${qty} unidades a "${phone.marca} ${phone.modelo}" (Cód: ${phone.codigo_ph || rawId}). Justificación: ${reason || 'Recepción de mercancía / Reposición'}. Stock anterior: ${phone.stock} unids ➔ Stock resultante disponible: ${newStock} unids (+${qty} unids incorporadas).`;
    }

    await pool.query('UPDATE telefonos SET stock=? WHERE id=?', [newStock, rawId]);

    const user = currentUser?.name || 'Administrador';
    const role = currentUser?.role || 'admin';
    await logToAudit(user, role, action, details);

    res.json({ success: true, newStock, action, details });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. DELETE /api/phones/:id - Eliminar teléfono y desincorporar stock completamente
app.delete('/api/phones/:id', async (req, res) => {
  try {
    const rawId = req.params.id.replace('ph-', '');
    const [[phone]] = await pool.query('SELECT * FROM telefonos WHERE id=?', [rawId]);
    if (!phone) {
      return res.status(404).json({ error: 'Teléfono no encontrado' });
    }

    await pool.query('DELETE FROM telefonos WHERE id=?', [rawId]);

    const user = req.body?.currentUser?.name || req.query?.user || 'Super Usuario';
    const role = req.body?.currentUser?.role || req.query?.role || 'super_user';
    const reason = req.body?.reason || req.query?.reason || 'Baja definitiva de catálogo por administración';

    const details = `Retiro definitivo de inventario: Se dio de baja y eliminó permanentemente "${phone.marca} ${phone.modelo}" (Cód: ${phone.codigo_ph || rawId}). Unidades dadas de baja: ${phone.stock} unids. Precio unitario al momento de eliminación: Bs. ${parseFloat(phone.precio_bs).toLocaleString('es-VE')}. Ficha técnica eliminada: ${phone.ram} RAM, ${phone.almacenamiento}, Color: ${phone.color}, Cámara: ${phone.camara}, Pantalla: ${phone.pantalla}, Gama: ${phone.gama}, Año: ${phone.ano_lanzamiento}. Motivo: ${reason}.`;

    await logToAudit(user, role, 'Eliminación de Teléfono de Inventario', details);

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
    const { name, email, role, phone, ci, monthlyTargetBs, currentUser } = req.body;
    const code = `USR-00${Math.floor(10 + Math.random() * 90)}`;
    const joinDate = new Date().toISOString().split('T')[0];
    const [result] = await pool.query(
      `INSERT INTO usuarios (codigo_usr, nombre, email, cedula, telefono, rol, meta_mensual_bs, fecha_ingreso)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [code, name, email, ci, phone, role, monthlyTargetBs || 0, joinDate]
    );

    await logToAudit(
      currentUser?.name || name,
      currentUser?.role || role,
      'Registro de Persona / Usuario',
      `Se registró a ${name} (${ci}) con rol ${role}`
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
      SELECT v.*, u.nombre as nombre_vendedor, t.modelo as modelo_telefono, t.marca as marca_telefono, t.costo_bs as costo_unitario_bs
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
      taxBaseBs: parseFloat(r.base_imponible_bs || (r.total_bs / 1.16)),
      ivaBs: parseFloat(r.iva_bs || (r.total_bs - (r.total_bs / 1.16))),
      igtfBs: parseFloat(r.igtf_bs || 0),
      costBs: parseFloat(r.costo_total_bs || ((r.costo_unitario_bs || 0) * r.cantidad)),
      totalBs: parseFloat(r.total_bs),
      totalUSD: parseFloat(r.total_usd),
      totalEUR: parseFloat(r.total_eur),
      exchangeRateUsed: parseFloat(r.tasa_cambio_usada),
      paymentMethod: r.metodo_pago,
      paymentReference: r.referencia_pago || undefined,
      clientName: r.cliente_nombre,
      clientDoc: r.cliente_cedula,
      notes: r.notes || r.notas
    }));
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. POST /api/sales - Registrar venta y salida de stock de inventario
app.post('/api/sales', async (req, res) => {
  try {
    const { vendorId, phoneId, quantity, paymentMethod, paymentReference, clientName, clientDoc, notes } = req.body;
    const rawVendorId = vendorId.replace('usr-', '');
    const rawPhoneId = phoneId.replace('ph-', '');

    // Validación de control de duplicidad en números de referencia de pago
    if (paymentReference && paymentReference.trim().length > 0) {
      const [[existingRef]] = await pool.query(
        'SELECT codigo_venta FROM ventas WHERE referencia_pago = ? LIMIT 1',
        [paymentReference.trim()]
      );
      if (existingRef) {
        return res.status(400).json({
          error: `El número de referencia "${paymentReference.trim()}" ya fue registrado en la venta ${existingRef.codigo_venta}. Control de duplicidad activado.`
        });
      }
    }

    const [[phone]] = await pool.query('SELECT * FROM telefonos WHERE id=?', [rawPhoneId]);
    if (!phone || phone.stock < quantity) {
      return res.status(400).json({ error: `Stock insuficiente. Disponible: ${phone ? phone.stock : 0}` });
    }

    const [[rates]] = await pool.query('SELECT * FROM tasas_cambio LIMIT 1');
    const rateUSD = parseFloat(rates.tasa_bcv_usd);
    const rateEUR = parseFloat(rates.tasa_bcv_eur);
    
    // Cálculo del importe y desglose tributario
    const subtotalBrutoBs = parseFloat(phone.precio_bs) * quantity;
    const baseImponibleBs = Number((subtotalBrutoBs / 1.16).toFixed(2));
    const ivaBs = Number((subtotalBrutoBs - baseImponibleBs).toFixed(2));
    
    // IGTF condicional del 3% únicamente a pagos en divisas en efectivo
    const isEfectivoDivisas = paymentMethod === 'Efectivo Divisas (USD)' || paymentMethod === 'Efectivo USD/Bs';
    const igtfBs = isEfectivoDivisas ? Number((subtotalBrutoBs * 0.03).toFixed(2)) : 0.00;
    
    const totalBs = subtotalBrutoBs + igtfBs;
    const totalUSD = Number((totalBs / rateUSD).toFixed(2));
    const totalEUR = Number((totalBs / rateEUR).toFixed(2));
    const costTotalBs = Number(((parseFloat(phone.costo_bs) || 0) * quantity).toFixed(2));
    const code = `VEN-2026-${Math.floor(100 + Math.random() * 900)}`;

    await pool.query(
      `INSERT INTO ventas (codigo_venta, fecha, usuario_vendedor_id, telefono_id, cantidad, precio_unitario_bs, base_imponible_bs, iva_bs, igtf_bs, total_bs, total_usd, total_eur, costo_total_bs, tasa_cambio_usada, metodo_pago, referencia_pago, cliente_nombre, cliente_cedula, notas)
       VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code, rawVendorId, rawPhoneId, quantity, phone.precio_bs, baseImponibleBs, ivaBs, igtfBs,
        totalBs, totalUSD, totalEUR, costTotalBs, rateUSD, paymentMethod, paymentReference ? paymentReference.trim() : null,
        clientName, clientDoc, notes || null
      ]
    );

    // Descontar unidades de stock en base de datos
    await pool.query('UPDATE telefonos SET stock = stock - ? WHERE id=?', [quantity, rawPhoneId]);

    // Recalcular comisiones de nómina para el vendedor
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

    const [[vendorUser]] = await pool.query('SELECT nombre, rol FROM usuarios WHERE id=?', [rawVendorId]);
    const previousStock = phone.stock;
    const resultingStock = phone.stock - quantity;
    const refText = paymentReference ? ` | Ref: ${paymentReference.trim()}` : '';
    const igtfText = igtfBs > 0 ? ` (Incluye IGTF 3%: Bs. ${igtfBs.toLocaleString('es-VE')})` : '';
    const details = `Venta confirmada y salida de stock: Se vendieron ${quantity} unidades de "${phone.marca} ${phone.modelo}" (Cód: ${phone.codigo_ph || rawPhoneId}) al cliente ${clientName} (C.I./RIF: ${clientDoc}) por Bs. ${totalBs.toLocaleString('es-VE')} ($${totalUSD} USD) vía ${paymentMethod}${refText}${igtfText}. Stock previo: ${previousStock} unids ➔ Stock resultante disponible: ${resultingStock} unids. Transacción: ${code}.`;

    await logToAudit(
      vendorUser ? vendorUser.nombre : 'Vendedor',
      vendorUser ? vendorUser.rol : 'vendedor',
      'Venta y Salida de Stock',
      details
    );

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
    const { paymentRef, currentUser } = req.body;
    const date = new Date().toISOString().split('T')[0];

    const [[payroll]] = await pool.query(`
      SELECT p.*, u.nombre as vendedor_nombre, u.cedula as vendedor_cedula 
      FROM pagos_nomina p 
      JOIN usuarios u ON p.vendedor_id = u.id 
      WHERE p.id=?`,
      [rawId]
    );

    await pool.query(
      `UPDATE pagos_nomina SET estado='Pagado', fecha_pago=?, referencia_bancaria=? WHERE id=?`,
      [date, paymentRef, rawId]
    );

    const vendorName = payroll ? payroll.vendedor_nombre : `Vendedor ID ${rawId}`;
    const vendorDoc = payroll ? payroll.vendedor_cedula : '';
    const amountBs = payroll ? parseFloat(payroll.pago_final_bs).toLocaleString('es-VE') : '0';
    const amountUSD = payroll ? payroll.pago_final_usd : '0';
    const month = payroll ? payroll.mes_periodo : '';

    await logToAudit(
      currentUser?.name || 'Super Usuario',
      'super_user',
      'Aprobación y Liquidación de Nómina',
      `Liquidación autorizada para el vendedor ${vendorName} (${vendorDoc}) del período ${month}. Monto pagado: Bs. ${amountBs} ($${amountUSD} USD). Ref. bancaria: ${paymentRef}.`
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

// 12. PUT /api/rates - Actualización de tasas de cambio oficiales
app.put('/api/rates', async (req, res) => {
  try {
    const { bcvUSD, bcvEUR, paraleloUSD, activeRateType, currentUser, syncCatalogPrices } = req.body;
    const [[oldRates]] = await pool.query('SELECT * FROM tasas_cambio LIMIT 1');

    await pool.query(
      `UPDATE tasas_cambio SET tasa_bcv_usd=?, tasa_bcv_eur=?, tasa_paralelo_usd=?, tasa_activa=?, ultima_actualizacion=NOW() WHERE id=1`,
      [bcvUSD, bcvEUR, paraleloUSD, activeRateType || 'bcvUSD']
    );

    const oldUSD = oldRates ? parseFloat(oldRates.tasa_bcv_usd) : bcvUSD;
    const oldEUR = oldRates ? parseFloat(oldRates.tasa_bcv_eur) : bcvEUR;
    const oldPar = oldRates ? parseFloat(oldRates.tasa_paralelo_usd) : paraleloUSD;

    // Si se solicita o si las tasas cambiaron de la escala antigua (< 100) a la nueva escala (> 100)
    if (syncCatalogPrices || (oldUSD < 100 && bcvUSD > 100)) {
      const scaleFactor = bcvUSD / oldUSD;
      await pool.query('UPDATE telefonos SET precio_bs = ROUND(precio_bs * ?, 2)', [scaleFactor]);
    }

    const details = `Actualización de tasas de cambio: BCV USD: Bs. ${oldUSD} ➔ Bs. ${bcvUSD} | BCV EUR: Bs. ${oldEUR} ➔ Bs. ${bcvEUR} | Paralelo: Bs. ${oldPar} ➔ Bs. ${paraleloUSD}. Indicador activo: ${activeRateType || 'bcvUSD'}.`;

    await logToAudit(
      currentUser?.name || 'Super Usuario',
      'super_user',
      'Actualización de Tasas de Cambio',
      details
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 12.1 POST /api/rates/sync - Sincronizar en vivo con la API oficial del BCV y Mercado
app.post('/api/rates/sync', async (req, res) => {
  try {
    let bcvUSD = 854.46;
    let paraleloUSD = 954.16;
    let bcvEUR = 974.06;

    try {
      const [usdRes, eurRes] = await Promise.all([
        fetch('https://ve.dolarapi.com/v1/dolares', { headers: { 'Accept': 'application/json' } }),
        fetch('https://ve.dolarapi.com/v1/euros', { headers: { 'Accept': 'application/json' } })
      ]);

      if (usdRes.ok) {
        const usdData = await usdRes.json();
        const oficialUSD = usdData.find(d => d.fuente === 'oficial');
        const parUSD = usdData.find(d => d.fuente === 'paralelo');
        if (oficialUSD && oficialUSD.promedio) bcvUSD = Number(parseFloat(oficialUSD.promedio).toFixed(2));
        if (parUSD && parUSD.promedio) paraleloUSD = Number(parseFloat(parUSD.promedio).toFixed(2));
      }

      if (eurRes.ok) {
        const eurData = await eurRes.json();
        const oficialEUR = eurData.find(d => d.fuente === 'oficial');
        if (oficialEUR && oficialEUR.promedio) bcvEUR = Number(parseFloat(oficialEUR.promedio).toFixed(2));
      }
    } catch (apiErr) {
      console.warn('Advertencia consultando API externa de divisas:', apiErr.message);
    }

    const [[oldRates]] = await pool.query('SELECT * FROM tasas_cambio LIMIT 1');
    const oldUSD = oldRates ? parseFloat(oldRates.tasa_bcv_usd) : 36.50;

    await pool.query(
      `UPDATE tasas_cambio SET tasa_bcv_usd=?, tasa_bcv_eur=?, tasa_paralelo_usd=?, ultima_actualizacion=NOW() WHERE id=1`,
      [bcvUSD, bcvEUR, paraleloUSD]
    );

    // Si los precios en telefonos siguen en la escala antigua (< 100.000 Bs), escalarlos a la nueva tasa
    const [[maxPriceRow]] = await pool.query('SELECT MAX(precio_bs) as max_price FROM telefonos');
    if (maxPriceRow && parseFloat(maxPriceRow.max_price) < 100000 && oldUSD < 100) {
      const scaleFactor = bcvUSD / oldUSD;
      await pool.query('UPDATE telefonos SET precio_bs = ROUND(precio_bs * ?, 2)', [scaleFactor]);
    }

    const user = req.body?.currentUser?.name || 'Super Usuario';
    const role = req.body?.currentUser?.role || 'super_user';
    const details = `Sincronización en vivo con indicador BCV y Mercado: Tasa BCV USD actualizada de Bs. ${oldUSD} ➔ Bs. ${bcvUSD} | Paralelo USD: Bs. ${paraleloUSD} | BCV EUR: Bs. ${bcvEUR}. Precios del catálogo calculados según la tasa oficial vigente.`;

    await logToAudit(user, role, 'Sincronización de Tasa Oficial BCV', details);

    res.json({
      success: true,
      bcvUSD,
      bcvEUR,
      paraleloUSD,
      lastUpdated: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 12.2 GET /api/purchases - Historial de compras y entradas de inventario
app.get('/api/purchases', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, t.marca as marca_telefono, t.modelo as modelo_telefono
      FROM compras_inventario c
      JOIN telefonos t ON c.telefono_id = t.id
      ORDER BY c.fecha DESC
    `);
    const purchases = rows.map(r => ({
      id: `pur-${r.id}`,
      code: r.codigo_compra,
      date: r.fecha,
      phoneId: `ph-${r.telefono_id}`,
      phoneName: r.modelo_telefono,
      brand: r.marca_telefono,
      supplier: r.proveedor,
      invoiceNumber: r.numero_factura,
      quantity: r.cantidad,
      unitCostUSD: parseFloat(r.costo_unitario_usd),
      unitCostBs: parseFloat(r.costo_unitario_bs),
      totalCostUSD: parseFloat(r.total_compra_usd),
      totalCostBs: parseFloat(r.total_compra_bs),
      exchangeRateUsed: parseFloat(r.tasa_cambio_usada),
      costMethodApplied: r.metodo_costeo_aplicado,
      oldCostUSD: parseFloat(r.costo_anterior_usd),
      newCostUSD: parseFloat(r.costo_nuevo_usd),
      oldPriceBs: parseFloat(r.precio_venta_anterior_bs),
      newPriceBs: parseFloat(r.precio_venta_nuevo_bs),
      notes: r.notas
    }));
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 12.3 POST /api/purchases - Registrar nueva entrada/compra con método de costeo y reevaluación de precio
app.post('/api/purchases', async (req, res) => {
  try {
    const {
      phoneId,
      supplier,
      invoiceNumber,
      quantity,
      unitCostUSD,
      unitCostBs,
      costMethodApplied,
      newPriceBs,
      notes,
      currentUser
    } = req.body;

    const rawPhoneId = phoneId.replace('ph-', '');
    const [[phone]] = await pool.query('SELECT * FROM telefonos WHERE id=?', [rawPhoneId]);
    if (!phone) {
      return res.status(404).json({ error: 'Teléfono no encontrado en catálogo' });
    }

    const [[rates]] = await pool.query('SELECT * FROM tasas_cambio LIMIT 1');
    const rateUSD = parseFloat(rates.tasa_bcv_usd);

    const qty = parseInt(quantity, 10);
    const costUSD = parseFloat(unitCostUSD);
    const costBs = parseFloat(unitCostBs) || (costUSD * rateUSD);
    const totalCostUSD = Number((costUSD * qty).toFixed(2));
    const totalCostBs = Number((costBs * qty).toFixed(2));

    const oldStock = phone.stock;
    const oldCostUSD = parseFloat(phone.costo_usd) || 0;
    const oldPriceBs = parseFloat(phone.precio_bs);
    const newStock = oldStock + qty;

    // Cálculo del nuevo costo unitario según el método contable seleccionado
    let newCostUSD = costUSD;
    if (costMethodApplied === 'promedio_ponderado') {
      if (newStock > 0) {
        newCostUSD = Number((((oldStock * oldCostUSD) + (qty * costUSD)) / newStock).toFixed(2));
      }
    } else if (costMethodApplied === 'ultimo_costo') {
      newCostUSD = costUSD;
    } else if (costMethodApplied === 'manual') {
      newCostUSD = parseFloat(req.body.customCostUSD) || costUSD;
    }

    const newCostBs = Number((newCostUSD * rateUSD).toFixed(2));
    const finalPriceBs = parseFloat(newPriceBs) || oldPriceBs;

    // Regla de Negocio Fundamental: El costo de reposición nunca puede superar al precio de venta
    if (finalPriceBs <= newCostBs) {
      return res.status(400).json({
        error: `Regla de Negocio: El precio de venta (Bs. ${finalPriceBs.toLocaleString('es-VE')}) no puede ser menor o igual al nuevo costo de reposición (Bs. ${newCostBs.toLocaleString('es-VE')}). Debe ajustar el precio de venta para garantizar el margen de ganancia.`
      });
    }

    // Cálculo del nuevo margen de ganancia
    const profitMargin = Number((((finalPriceBs - newCostBs) / newCostBs) * 100).toFixed(2));

    // Actualizar teléfono en inventario
    await pool.query(
      `UPDATE telefonos
       SET stock=?, costo_usd=?, costo_bs=?, ultimo_costo_usd=?, costo_promedio_usd=?, metodo_costeo=?, precio_bs=?, margen_ganancia=?
       WHERE id=?`,
      [
        newStock,
        newCostUSD,
        newCostBs,
        costUSD,
        newCostUSD,
        costMethodApplied || 'promedio_ponderado',
        finalPriceBs,
        profitMargin,
        rawPhoneId
      ]
    );

    // Insertar registro en compras_inventario
    const code = `CMP-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    await pool.query(
      `INSERT INTO compras_inventario
       (codigo_compra, fecha, telefono_id, proveedor, numero_factura, cantidad, costo_unitario_usd, costo_unitario_bs, total_compra_usd, total_compra_bs, tasa_cambio_usada, metodo_costeo_aplicado, costo_anterior_usd, costo_nuevo_usd, precio_venta_anterior_bs, precio_venta_nuevo_bs, notas)
       VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code,
        rawPhoneId,
        supplier,
        invoiceNumber,
        qty,
        costUSD,
        costBs,
        totalCostUSD,
        totalCostBs,
        rateUSD,
        costMethodApplied || 'promedio_ponderado',
        oldCostUSD,
        newCostUSD,
        oldPriceBs,
        finalPriceBs,
        notes || null
      ]
    );

    const user = currentUser?.name || 'Administrador';
    const role = currentUser?.role || 'admin';
    const priceChangeText = finalPriceBs !== oldPriceBs
      ? ` | Precio de venta ajustado: Bs. ${oldPriceBs.toLocaleString('es-VE')} ➔ Bs. ${finalPriceBs.toLocaleString('es-VE')} (Margen: ${profitMargin}%)`
      : ` | Precio de venta: Bs. ${finalPriceBs.toLocaleString('es-VE')}`;
    const details = `Entrada de mercancía / Compra (${code}): ${qty}x "${phone.marca} ${phone.modelo}" a $${costUSD} USD c/u (Total: $${totalCostUSD} USD / Bs. ${totalCostBs.toLocaleString('es-VE')}). Proveedor: ${supplier} (Fact: ${invoiceNumber}). Método: ${costMethodApplied}. Costo resultante: $${newCostUSD} USD (Bs. ${newCostBs.toLocaleString('es-VE')})${priceChangeText}. Stock: ${oldStock} ➔ ${newStock} unids.`;

    await logToAudit(user, role, 'Recepción de Mercancía y Costeo', details);

    res.json({ success: true, code, newStock, newCostUSD, newCostBs, finalPriceBs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 12.4 GET /api/expenses - Lista de gastos operativos
app.get('/api/expenses', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM gastos_operativos ORDER BY fecha DESC, id DESC');
    const expenses = rows.map(r => ({
      id: `exp-${r.id}`,
      code: r.codigo_gasto,
      date: r.fecha,
      category: r.categoria,
      description: r.descripcion,
      amountBs: parseFloat(r.monto_bs),
      amountUSD: parseFloat(r.monto_usd),
      exchangeRateUsed: parseFloat(r.tasa_cambio_usada),
      paymentMethod: r.metodo_pago,
      referenceNumber: r.referencia_comprobante || undefined,
      registeredBy: r.usuario_registro
    }));
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 12.5 POST /api/expenses - Registrar gasto operativo
app.post('/api/expenses', async (req, res) => {
  try {
    const { category, description, amountBs, amountUSD, paymentMethod, referenceNumber, currentUser } = req.body;
    const [[rates]] = await pool.query('SELECT * FROM tasas_cambio LIMIT 1');
    const rateUSD = parseFloat(rates.tasa_bcv_usd);

    const bs = parseFloat(amountBs) || (parseFloat(amountUSD) * rateUSD);
    const usd = parseFloat(amountUSD) || (bs / rateUSD);
    const code = `EXP-2026-${Math.floor(100 + Math.random() * 900)}`;
    const date = req.body.date || new Date().toISOString().split('T')[0];
    const user = currentUser?.name || 'Administrador';
    const role = currentUser?.role || 'admin';

    await pool.query(
      `INSERT INTO gastos_operativos (codigo_gasto, fecha, categoria, descripcion, monto_bs, monto_usd, tasa_cambio_usada, metodo_pago, referencia_comprobante, usuario_registro)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [code, date, category, description, bs, usd, rateUSD, paymentMethod, referenceNumber || null, user]
    );

    const details = `Registro de gasto operativo (${code}): ${category} - "${description}". Monto: Bs. ${bs.toLocaleString('es-VE')} ($${usd.toFixed(2)} USD). Pagado vía ${paymentMethod}${referenceNumber ? ' (Ref: ' + referenceNumber + ')' : ''}.`;
    await logToAudit(user, role, 'Registro de Gasto Operativo', details);

    res.json({ success: true, code });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 12.6 DELETE /api/expenses/:id - Eliminar gasto operativo
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const rawId = req.params.id.replace('exp-', '');
    const [[expense]] = await pool.query('SELECT * FROM gastos_operativos WHERE id=?', [rawId]);
    if (!expense) return res.status(404).json({ error: 'Gasto no encontrado' });

    await pool.query('DELETE FROM gastos_operativos WHERE id=?', [rawId]);

    const user = req.body?.currentUser?.name || 'Super Usuario';
    const role = req.body?.currentUser?.role || 'super_user';
    const details = `Anulación de gasto operativo (${expense.codigo_gasto}): ${expense.categoria} - "${expense.descripcion}" por Bs. ${parseFloat(expense.monto_bs).toLocaleString('es-VE')}.`;
    await logToAudit(user, role, 'Eliminación de Gasto Operativo', details);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 13. GET /api/audit - Obtener logs de auditoría con clasificación precisa
app.get('/api/audit', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM auditoria ORDER BY fecha DESC, id DESC LIMIT 300');
    const logs = rows.map(r => {
      const actionLower = (r.accion || '').toLowerCase();
      const detailsLower = (r.detalles || '').toLowerCase();
      let category = 'system';
      let severity = 'info';

      if (
        actionLower.includes('sesión') ||
        actionLower.includes('sesion') ||
        actionLower.includes('cuenta') ||
        actionLower.includes('usuario') ||
        detailsLower.includes('inició sesión') ||
        detailsLower.includes('cerró su sesión')
      ) {
        category = 'auth';
        severity = actionLower.includes('fallid') ? 'warning' : 'info';
      } else if (
        actionLower.includes('teléfono') ||
        actionLower.includes('telefono') ||
        actionLower.includes('inventario') ||
        actionLower.includes('stock') ||
        actionLower.includes('salida') ||
        actionLower.includes('ingreso') ||
        actionLower.includes('retiro')
      ) {
        category = 'inventory';
        if (
          actionLower.includes('elimin') ||
          actionLower.includes('salida') ||
          actionLower.includes('retiro') ||
          actionLower.includes('disminuc') ||
          detailsLower.includes('eliminó') ||
          detailsLower.includes('retiradas') ||
          detailsLower.includes('descontadas')
        ) {
          severity = 'warning';
        } else if (
          actionLower.includes('ingreso') ||
          actionLower.includes('nuevo') ||
          actionLower.includes('aumento') ||
          actionLower.includes('creación') ||
          actionLower.includes('incorpor') ||
          detailsLower.includes('incorporado') ||
          detailsLower.includes('sumaron')
        ) {
          severity = 'success';
        } else {
          severity = 'info';
        }
      } else if (actionLower.startsWith('venta') || /\bventas?\b/i.test(actionLower)) {
        category = 'sale';
        severity = actionLower.includes('fallid') ? 'warning' : 'success';
      } else if (
        actionLower.includes('liquidación') ||
        actionLower.includes('liquidacion') ||
        actionLower.includes('pago') ||
        actionLower.includes('nómina') ||
        actionLower.includes('nomina')
      ) {
        category = 'payroll';
        severity = 'success';
      } else if (actionLower.includes('tasa') || actionLower.includes('cambio') || actionLower.includes('bcv')) {
        category = 'rates';
        severity = 'info';
      } else if (actionLower.includes('export') || detailsLower.includes('.csv')) {
        category = 'system';
        severity = 'info';
      }

      return {
        id: `log-${r.id}`,
        timestamp: r.fecha,
        user: r.usuario,
        role: r.rol,
        action: r.accion,
        details: r.detalles,
        category,
        severity
      };
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 14. POST /api/audit - Insertar log de auditoría
app.post('/api/audit', async (req, res) => {
  try {
    const { user, role, action, details } = req.body;
    await logToAudit(user, role, action, details);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 14.5 GET /api/approvals - Listar solicitudes de toma de decisiones gerenciales
app.get('/api/approvals', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM solicitudes_aprobacion ORDER BY fecha_solicitud DESC, id DESC');
    const approvals = rows.map(r => ({
      id: `appr-${r.id}`,
      rawId: r.id,
      code: r.codigo,
      type: r.tipo,
      requesterName: r.solicitante_nombre,
      requesterRole: r.solicitante_rol,
      phoneId: r.equipo_id,
      phoneName: r.equipo_nombre,
      description: r.descripcion,
      payload: typeof r.datos_solicitud === 'string' ? JSON.parse(r.datos_solicitud) : r.datos_solicitud,
      status: r.estado,
      reviewedBy: r.revisado_por,
      date: r.fecha_solicitud,
      resolutionDate: r.fecha_resolucion,
      rejectionReason: r.motivo_rechazo
    }));
    res.json(approvals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 14.6 POST /api/approvals - Crear nueva solicitud de aprobación gerencial
app.post('/api/approvals', async (req, res) => {
  try {
    const { type, requesterName, requesterRole, phoneId, phoneName, description, payload } = req.body;
    const code = `SOL-${Date.now().toString().slice(-5)}-${Math.floor(10 + Math.random() * 90)}`;
    const [result] = await pool.query(
      `INSERT INTO solicitudes_aprobacion
       (codigo, tipo, solicitante_nombre, solicitante_rol, equipo_id, equipo_nombre, descripcion, datos_solicitud, estado, fecha_solicitud)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', NOW())`,
      [code, type, requesterName || 'Personal', requesterRole || 'vendedor', phoneId || null, phoneName || 'General', description, JSON.stringify(payload || {})]
    );

    await logToAudit(
      requesterName || 'Personal',
      requesterRole || 'vendedor',
      'Solicitud de Aprobación Gerencial Creada',
      `Solicitud #${code} (${type}) enviada a Gerencia: ${description}`
    );

    res.json({ success: true, id: `appr-${result.insertId}`, code });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 14.7 POST /api/approvals/:id/resolve - Resolver solicitud gerencial (Aprobar o Rechazar)
app.post('/api/approvals/:id/resolve', async (req, res) => {
  try {
    const rawId = String(req.params.id).replace(/^appr-/, '');
    const { action, reviewerName, reviewerRole, reason } = req.body; // action: 'approve' | 'reject'

    const [[appr]] = await pool.query('SELECT * FROM solicitudes_aprobacion WHERE id=?', [rawId]);
    if (!appr) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    if (appr.estado !== 'pendiente') {
      return res.status(400).json({ error: 'Esta solicitud ya fue resuelta previamente.' });
    }

    const payload = typeof appr.datos_solicitud === 'string' ? JSON.parse(appr.datos_solicitud) : appr.datos_solicitud;
    const reviewer = reviewerName || 'Administrador Gerencial';
    const role = reviewerRole || 'admin';

    if (action === 'approve') {
      // Ejecutar la acción aprobada
      if (appr.tipo === 'CAMBIO_PRECIO' && payload.phoneId && payload.newPriceBs) {
        const rawPhoneId = String(payload.phoneId).replace(/^ph-/, '');
        await pool.query('UPDATE telefonos SET precio_bs=? WHERE id=?', [payload.newPriceBs, rawPhoneId]);
      } else if (appr.tipo === 'SALIDA_STOCK' && payload.phoneId && payload.quantity) {
        const rawPhoneId = String(payload.phoneId).replace(/^ph-/, '');
        await pool.query('UPDATE telefonos SET stock = GREATEST(0, stock - ?) WHERE id=?', [parseInt(payload.quantity, 10), rawPhoneId]);
      } else if (appr.tipo === 'ELIMINAR_EQUIPO' && payload.phoneId) {
        const rawPhoneId = String(payload.phoneId).replace(/^ph-/, '');
        await pool.query('DELETE FROM telefonos WHERE id=?', [rawPhoneId]);
      }

      await pool.query(
        'UPDATE solicitudes_aprobacion SET estado="aprobada", revisado_por=?, fecha_resolucion=NOW() WHERE id=?',
        [reviewer, rawId]
      );

      await logToAudit(
        reviewer,
        role,
        'Aprobación Gerencial Concedida',
        `Gerencia APROBÓ la solicitud #${appr.codigo} (${appr.tipo}) enviada por ${appr.solicitante_nombre}. Efecto: ${appr.descripcion}`
      );

      res.json({ success: true, status: 'aprobada' });
    } else {
      // Rechazar solicitud
      await pool.query(
        'UPDATE solicitudes_aprobacion SET estado="rechazada", revisado_por=?, fecha_resolucion=NOW(), motivo_rechazo=? WHERE id=?',
        [reviewer, reason || 'Rechazado por política gerencial', rawId]
      );

      await logToAudit(
        reviewer,
        role,
        'Solicitud Gerencial Rechazada',
        `Gerencia RECHAZÓ la solicitud #${appr.codigo} (${appr.tipo}) enviada por ${appr.solicitante_nombre}. Motivo: ${reason || 'Rechazado por criterio gerencial'}`
      );

      res.json({ success: true, status: 'rechazada' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 15. POST /api/reset - Re-import database.sql / reload backup
app.post('/api/reset', async (req, res) => {
  try {
    const result = await dbAdapter.resetDatabase();

    await logToAudit(
      'Super Usuario',
      'super_user',
      'Restablecimiento de Sistema',
      'Se ejecutó restauración completa de base de datos desde database.sql'
    );

    res.json({ success: true, message: 'Base de datos restablecida exitosamente.', mode: result.mode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Servir frontend compilado estático si existe (para producción o modo standalone)
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Backend + Frontend ejecutándose en http://localhost:${PORT}`);
});
