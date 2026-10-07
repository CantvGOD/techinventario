const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/home/cantvgod/antigravity/serene-planck/chrome/linux-155.0.8059.39/chrome-linux64/chrome';

async function generateMER() {
  console.log('📊 Generando Diagrama MER idéntico al estilo phpMyAdmin Designer...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  // Ancho y alto ajustados perfectamente sin espacios vacíos
  await page.setViewport({ width: 1280, height: 860, deviceScaleFactor: 2 });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: Arial, Tahoma, Helvetica, sans-serif;
    }
    body {
      background: #ffffff;
      padding: 20px;
      position: relative;
      width: 1280px;
      height: 860px;
      overflow: hidden;
    }
    
    /* phpMyAdmin Designer Table Box */
    .table-box {
      position: absolute;
      background: #ffffff;
      border: 1px solid #999999;
      box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.22);
      font-size: 11px;
      z-index: 10;
      border-radius: 1px;
    }

    .table-header {
      background: linear-gradient(to bottom, #dbeafc 0%, #bad5f5 100%);
      border-bottom: 1px solid #999999;
      padding: 3px 6px;
      display: flex;
      align-items: center;
      gap: 5px;
      height: 24px;
      user-select: none;
    }

    .icon-v {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 13px;
      height: 13px;
      background: #1d5fbf;
      color: #ffffff;
      font-size: 9px;
      font-weight: bold;
      border-radius: 2px;
      line-height: 1;
    }

    .icon-gear {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 13px;
      height: 13px;
      color: #1d5fbf;
      font-size: 12px;
      line-height: 1;
    }

    .db-name {
      color: #666666;
      font-size: 10.5px;
      margin-right: 2px;
    }

    .table-title {
      color: #000000;
      font-weight: bold;
      font-size: 11.5px;
    }

    .table-body {
      list-style: none;
    }

    .table-row {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 2.5px 7px;
      height: 20px;
      color: #222222;
      font-size: 11px;
      border-bottom: 1px solid #f0f0f0;
      white-space: nowrap;
    }

    .table-row:last-child {
      border-bottom: none;
    }

    .table-row.alt {
      background: #ededed;
    }

    .col-icon {
      width: 12px;
      text-align: center;
      font-size: 10px;
      display: inline-block;
      flex-shrink: 0;
    }
    
    .icon-key {
      color: #d4a017;
      font-weight: bold;
    }
    .icon-doc {
      color: #777777;
    }
    .icon-num {
      color: #0033aa;
      font-weight: bold;
      font-size: 11px;
    }
    .icon-date {
      color: #1a73e8;
      font-weight: bold;
    }

    .col-name {
      color: #111111;
    }
    .col-type {
      color: #444444;
    }

    /* SVG Canvas for Relationship Lines */
    #relations-svg {
      position: absolute;
      top: 0;
      left: 0;
      width: 1280px;
      height: 860px;
      z-index: 5;
      pointer-events: none;
    }

    /* Title Watermark Header */
    .title-banner {
      position: absolute;
      top: 14px;
      left: 20px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 6px 14px;
      border-radius: 4px;
      z-index: 2;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .title-banner h1 {
      font-size: 12.5px;
      color: #0f172a;
      font-weight: bold;
    }
    .title-banner p {
      font-size: 10px;
      color: #64748b;
    }
  </style>
</head>
<body>

  <!-- Watermark Header -->
  <div class="title-banner">
    <h1>DIAGRAMA MODELO ENTIDAD - RELACIÓN (MER) — phpMyAdmin Designer</h1>
    <p>Base de Datos: techinventario_db | IUJO — Sistema Web Telecom</p>
  </div>

  <!-- SVG for Connections -->
  <svg id="relations-svg">
    <defs>
      <!-- Markers for Foreign Key Endpoints -->
      <marker id="marker-pink" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
        <circle cx="4" cy="4" r="3" fill="#d9008f" stroke="#ffffff" stroke-width="1"/>
      </marker>
      <marker id="marker-orange" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
        <circle cx="4" cy="4" r="3" fill="#d97706" stroke="#ffffff" stroke-width="1"/>
      </marker>
      <marker id="marker-blue" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
        <circle cx="4" cy="4" r="3" fill="#2563eb" stroke="#ffffff" stroke-width="1"/>
      </marker>
      <marker id="marker-green" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
        <circle cx="4" cy="4" r="3" fill="#059669" stroke="#ffffff" stroke-width="1"/>
      </marker>
    </defs>
  </svg>

  <!-- TABLE 1: usuarios (Top Left) -->
  <div class="table-box" id="tbl-usuarios" style="top: 65px; left: 50px; width: 280px;">
    <div class="table-header">
      <span class="icon-v">v</span>
      <span class="icon-gear">⚙</span>
      <span class="db-name">techinventario</span>
      <span class="table-title">usuarios</span>
    </div>
    <ul class="table-body">
      <li class="table-row" id="row-usuarios-id"><span class="col-icon icon-key">🔑</span><span class="col-name">id</span> <span class="col-type">: int</span></li>
      <li class="table-row alt"><span class="col-icon icon-doc">📄</span><span class="col-name">codigo_usr</span> <span class="col-type">: varchar(20)</span></li>
      <li class="table-row"><span class="col-icon icon-doc">📄</span><span class="col-name">nombre</span> <span class="col-type">: varchar(100)</span></li>
      <li class="table-row alt"><span class="col-icon icon-doc">📄</span><span class="col-name">email</span> <span class="col-type">: varchar(100)</span></li>
      <li class="table-row"><span class="col-icon icon-doc">📄</span><span class="col-name">cedula</span> <span class="col-type">: varchar(20)</span></li>
      <li class="table-row alt"><span class="col-icon icon-doc">📄</span><span class="col-name">telefono</span> <span class="col-type">: varchar(30)</span></li>
      <li class="table-row"><span class="col-icon icon-doc">📄</span><span class="col-name">rol</span> <span class="col-type">: enum('super_user','admin','vendedor')</span></li>
      <li class="table-row alt"><span class="col-icon icon-num">#</span><span class="col-name">meta_mensual_bs</span> <span class="col-type">: decimal(12,2)</span></li>
      <li class="table-row"><span class="col-icon icon-date">📅</span><span class="col-name">fecha_ingreso</span> <span class="col-type">: date</span></li>
    </ul>
  </div>

  <!-- TABLE 2: pagos_nomina (Bottom Left) -->
  <div class="table-box" id="tbl-nomina" style="top: 480px; left: 50px; width: 280px;">
    <div class="table-header">
      <span class="icon-v">v</span>
      <span class="icon-gear">⚙</span>
      <span class="db-name">techinventario</span>
      <span class="table-title">pagos_nomina</span>
    </div>
    <ul class="table-body">
      <li class="table-row" id="row-nomina-id"><span class="col-icon icon-key">🔑</span><span class="col-name">id</span> <span class="col-type">: int</span></li>
      <li class="table-row alt" id="row-nomina-vendedor"><span class="col-icon icon-num">#</span><span class="col-name">vendedor_id</span> <span class="col-type">: int</span></li>
      <li class="table-row"><span class="col-icon icon-doc">📄</span><span class="col-name">mes_periodo</span> <span class="col-type">: varchar(10)</span></li>
      <li class="table-row alt"><span class="col-icon icon-num">#</span><span class="col-name">total_ventas_unidades</span> <span class="col-type">: int</span></li>
      <li class="table-row"><span class="col-icon icon-num">#</span><span class="col-name">total_ventas_bs</span> <span class="col-type">: decimal(12,2)</span></li>
      <li class="table-row alt"><span class="col-icon icon-num">#</span><span class="col-name">sueldo_base_bs</span> <span class="col-type">: decimal(12,2)</span></li>
      <li class="table-row"><span class="col-icon icon-num">#</span><span class="col-name">monto_comision_bs</span> <span class="col-type">: decimal(12,2)</span></li>
      <li class="table-row alt"><span class="col-icon icon-num">#</span><span class="col-name">pago_final_bs</span> <span class="col-type">: decimal(12,2)</span></li>
      <li class="table-row"><span class="col-icon icon-doc">📄</span><span class="col-name">estado</span> <span class="col-type">: enum('Pendiente','Pagado')</span></li>
      <li class="table-row alt"><span class="col-icon icon-date">📅</span><span class="col-name">fecha_pago</span> <span class="col-type">: date</span></li>
    </ul>
  </div>

  <!-- TABLE 3: ventas (Center) -->
  <div class="table-box" id="tbl-ventas" style="top: 130px; left: 450px; width: 310px;">
    <div class="table-header">
      <span class="icon-v">v</span>
      <span class="icon-gear">⚙</span>
      <span class="db-name">techinventario</span>
      <span class="table-title">ventas</span>
    </div>
    <ul class="table-body">
      <li class="table-row" id="row-ventas-id"><span class="col-icon icon-key">🔑</span><span class="col-name">id</span> <span class="col-type">: int</span></li>
      <li class="table-row alt"><span class="col-icon icon-doc">📄</span><span class="col-name">codigo_venta</span> <span class="col-type">: varchar(30)</span></li>
      <li class="table-row"><span class="col-icon icon-date">📅</span><span class="col-name">fecha</span> <span class="col-type">: datetime</span></li>
      <li class="table-row alt" id="row-ventas-vendedor"><span class="col-icon icon-num">#</span><span class="col-name">usuario_vendedor_id</span> <span class="col-type">: int</span></li>
      <li class="table-row" id="row-ventas-telefono"><span class="col-icon icon-num">#</span><span class="col-name">telefono_id</span> <span class="col-type">: int</span></li>
      <li class="table-row alt"><span class="col-icon icon-num">#</span><span class="col-name">cantidad</span> <span class="col-type">: int</span></li>
      <li class="table-row"><span class="col-icon icon-num">#</span><span class="col-name">precio_unitario_bs</span> <span class="col-type">: decimal(12,2)</span></li>
      <li class="table-row alt"><span class="col-icon icon-num">#</span><span class="col-name">base_imponible_bs</span> <span class="col-type">: decimal(12,2)</span></li>
      <li class="table-row"><span class="col-icon icon-num">#</span><span class="col-name">iva_bs</span> <span class="col-type">: decimal(12,2)</span></li>
      <li class="table-row alt"><span class="col-icon icon-num">#</span><span class="col-name">igtf_bs</span> <span class="col-type">: decimal(12,2)</span></li>
      <li class="table-row"><span class="col-icon icon-num">#</span><span class="col-name">total_bs</span> <span class="col-type">: decimal(12,2)</span></li>
      <li class="table-row alt"><span class="col-icon icon-num">#</span><span class="col-name">total_usd</span> <span class="col-type">: decimal(10,2)</span></li>
      <li class="table-row"><span class="col-icon icon-num">#</span><span class="col-name">tasa_cambio_usada</span> <span class="col-type">: decimal(10,2)</span></li>
      <li class="table-row alt"><span class="col-icon icon-doc">📄</span><span class="col-name">metodo_pago</span> <span class="col-type">: varchar(50)</span></li>
      <li class="table-row"><span class="col-icon icon-doc">📄</span><span class="col-name">referencia_pago</span> <span class="col-type">: varchar(50)</span></li>
      <li class="table-row alt"><span class="col-icon icon-doc">📄</span><span class="col-name">cliente_nombre</span> <span class="col-type">: varchar(100)</span></li>
      <li class="table-row"><span class="col-icon icon-doc">📄</span><span class="col-name">cliente_cedula</span> <span class="col-type">: varchar(20)</span></li>
    </ul>
  </div>

  <!-- TABLE 4: gastos_operativos (Bottom Center) -->
  <div class="table-box" id="tbl-gastos" style="top: 570px; left: 450px; width: 310px;">
    <div class="table-header">
      <span class="icon-v">v</span>
      <span class="icon-gear">⚙</span>
      <span class="db-name">techinventario</span>
      <span class="table-title">gastos_operativos</span>
    </div>
    <ul class="table-body">
      <li class="table-row"><span class="col-icon icon-key">🔑</span><span class="col-name">id</span> <span class="col-type">: int</span></li>
      <li class="table-row alt"><span class="col-icon icon-doc">📄</span><span class="col-name">codigo_gasto</span> <span class="col-type">: varchar(30)</span></li>
      <li class="table-row"><span class="col-icon icon-date">📅</span><span class="col-name">fecha</span> <span class="col-type">: date</span></li>
      <li class="table-row alt"><span class="col-icon icon-doc">📄</span><span class="col-name">categoria</span> <span class="col-type">: varchar(50)</span></li>
      <li class="table-row"><span class="col-icon icon-doc">📄</span><span class="col-name">descripcion</span> <span class="col-type">: varchar(255)</span></li>
      <li class="table-row alt"><span class="col-icon icon-num">#</span><span class="col-name">monto_bs</span> <span class="col-type">: decimal(12,2)</span></li>
      <li class="table-row"><span class="col-icon icon-num">#</span><span class="col-name">monto_usd</span> <span class="col-type">: decimal(10,2)</span></li>
      <li class="table-row alt"><span class="col-icon icon-doc">📄</span><span class="col-name">metodo_pago</span> <span class="col-type">: varchar(50)</span></li>
      <li class="table-row"><span class="col-icon icon-doc">📄</span><span class="col-name">usuario_registro</span> <span class="col-type">: varchar(100)</span></li>
    </ul>
  </div>

  <!-- TABLE 5: telefonos (Top Right) -->
  <div class="table-box" id="tbl-telefonos" style="top: 65px; left: 880px; width: 280px;">
    <div class="table-header">
      <span class="icon-v">v</span>
      <span class="icon-gear">⚙</span>
      <span class="db-name">techinventario</span>
      <span class="table-title">telefonos</span>
    </div>
    <ul class="table-body">
      <li class="table-row" id="row-telefonos-id"><span class="col-icon icon-key">🔑</span><span class="col-name">id</span> <span class="col-type">: int</span></li>
      <li class="table-row alt"><span class="col-icon icon-doc">📄</span><span class="col-name">codigo_ph</span> <span class="col-type">: varchar(20)</span></li>
      <li class="table-row"><span class="col-icon icon-doc">📄</span><span class="col-name">marca</span> <span class="col-type">: varchar(50)</span></li>
      <li class="table-row alt"><span class="col-icon icon-doc">📄</span><span class="col-name">modelo</span> <span class="col-type">: varchar(100)</span></li>
      <li class="table-row"><span class="col-icon icon-doc">📄</span><span class="col-name">ram</span> <span class="col-type">: varchar(20)</span></li>
      <li class="table-row alt"><span class="col-icon icon-doc">📄</span><span class="col-name">almacenamiento</span> <span class="col-type">: varchar(20)</span></li>
      <li class="table-row"><span class="col-icon icon-doc">📄</span><span class="col-name">color</span> <span class="col-type">: varchar(30)</span></li>
      <li class="table-row alt"><span class="col-icon icon-doc">📄</span><span class="col-name">camara</span> <span class="col-type">: varchar(50)</span></li>
      <li class="table-row"><span class="col-icon icon-doc">📄</span><span class="col-name">pantalla</span> <span class="col-type">: varchar(50)</span></li>
      <li class="table-row alt"><span class="col-icon icon-num">#</span><span class="col-name">precio_bs</span> <span class="col-type">: decimal(12,2)</span></li>
      <li class="table-row"><span class="col-icon icon-num">#</span><span class="col-name">costo_usd</span> <span class="col-type">: decimal(10,2)</span></li>
      <li class="table-row alt"><span class="col-icon icon-num">#</span><span class="col-name">ultimo_costo_usd</span> <span class="col-type">: decimal(10,2)</span></li>
      <li class="table-row"><span class="col-icon icon-num">#</span><span class="col-name">costo_promedio_usd</span> <span class="col-type">: decimal(10,2)</span></li>
      <li class="table-row alt"><span class="col-icon icon-doc">📄</span><span class="col-name">metodo_costeo</span> <span class="col-type">: enum(...)</span></li>
      <li class="table-row"><span class="col-icon icon-num">#</span><span class="col-name">margen_ganancia</span> <span class="col-type">: decimal(5,2)</span></li>
      <li class="table-row alt"><span class="col-icon icon-num">#</span><span class="col-name">stock</span> <span class="col-type">: int</span></li>
      <li class="table-row"><span class="col-icon icon-num">#</span><span class="col-name">stock_minimo</span> <span class="col-type">: int</span></li>
      <li class="table-row alt"><span class="col-icon icon-doc">📄</span><span class="col-name">gama</span> <span class="col-type">: enum(...)</span></li>
    </ul>
  </div>

  <!-- TABLE 6: compras_inventario (Bottom Right) -->
  <div class="table-box" id="tbl-compras" style="top: 500px; left: 880px; width: 280px;">
    <div class="table-header">
      <span class="icon-v">v</span>
      <span class="icon-gear">⚙</span>
      <span class="db-name">techinventario</span>
      <span class="table-title">compras_inventario</span>
    </div>
    <ul class="table-body">
      <li class="table-row" id="row-compras-id"><span class="col-icon icon-key">🔑</span><span class="col-name">id</span> <span class="col-type">: int</span></li>
      <li class="table-row alt"><span class="col-icon icon-doc">📄</span><span class="col-name">codigo_compra</span> <span class="col-type">: varchar(30)</span></li>
      <li class="table-row"><span class="col-icon icon-date">📅</span><span class="col-name">fecha</span> <span class="col-type">: datetime</span></li>
      <li class="table-row alt" id="row-compras-telefono"><span class="col-icon icon-num">#</span><span class="col-name">telefono_id</span> <span class="col-type">: int</span></li>
      <li class="table-row"><span class="col-icon icon-doc">📄</span><span class="col-name">proveedor</span> <span class="col-type">: varchar(100)</span></li>
      <li class="table-row alt"><span class="col-icon icon-doc">📄</span><span class="col-name">numero_factura</span> <span class="col-type">: varchar(50)</span></li>
      <li class="table-row"><span class="col-icon icon-num">#</span><span class="col-name">cantidad</span> <span class="col-type">: int</span></li>
      <li class="table-row alt"><span class="col-icon icon-num">#</span><span class="col-name">costo_unitario_usd</span> <span class="col-type">: decimal(10,2)</span></li>
      <li class="table-row"><span class="col-icon icon-num">#</span><span class="col-name">total_compra_usd</span> <span class="col-type">: decimal(12,2)</span></li>
      <li class="table-row alt"><span class="col-icon icon-doc">📄</span><span class="col-name">metodo_costeo</span> <span class="col-type">: enum(...)</span></li>
      <li class="table-row"><span class="col-icon icon-num">#</span><span class="col-name">costo_nuevo_usd</span> <span class="col-type">: decimal(10,2)</span></li>
      <li class="table-row alt"><span class="col-icon icon-num">#</span><span class="col-name">precio_venta_nuevo_bs</span> <span class="col-type">: decimal(12,2)</span></li>
    </ul>
  </div>

  <script>
    function drawOrthogonal(x1, y1, x2, y2, color, side1 = 'right', side2 = 'left', customBend = null) {
      const svg = document.getElementById('relations-svg');
      let d = '';

      if (side1 === 'right' && side2 === 'left') {
        const midX = customBend !== null ? customBend : x1 + (x2 - x1) / 2;
        d = \`M \${x1} \${y1} L \${midX} \${y1} L \${midX} \${y2} L \${x2} \${y2}\`;
      } else if (side1 === 'left' && side2 === 'right') {
        const midX = customBend !== null ? customBend : x2 + (x1 - x2) / 2;
        d = \`M \${x1} \${y1} L \${midX} \${y1} L \${midX} \${y2} L \${x2} \${y2}\`;
      } else if (side1 === 'left' && side2 === 'left') {
        const outX = customBend !== null ? customBend : Math.min(x1, x2) - 25;
        d = \`M \${x1} \${y1} L \${outX} \${y1} L \${outX} \${y2} L \${x2} \${y2}\`;
      } else if (side1 === 'right' && side2 === 'right') {
        const outX = customBend !== null ? customBend : Math.max(x1, x2) + 25;
        d = \`M \${x1} \${y1} L \${outX} \${y1} L \${outX} \${y2} L \${x2} \${y2}\`;
      }

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', '2');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'square');
      path.setAttribute('stroke-linejoin', 'round');

      let markerColor = 'pink';
      if (color.includes('d97706')) markerColor = 'orange';
      if (color.includes('2563eb')) markerColor = 'blue';
      if (color.includes('059669')) markerColor = 'green';

      path.setAttribute('marker-start', \`url(#marker-\${markerColor})\`);
      path.setAttribute('marker-end', \`url(#marker-\${markerColor})\`);
      svg.appendChild(path);
    }

    function getCoords(id, side = 'right') {
      const elem = document.getElementById(id);
      const box = elem.getBoundingClientRect();
      const y = box.top + box.height / 2;
      const x = side === 'right' ? box.right : box.left;
      return { x, y };
    }

    window.addEventListener('load', () => {
      // 1. Relación: usuarios.id -> ventas.usuario_vendedor_id (Magenta / Rosa)
      // Conecta la derecha de usuarios.id con la izquierda de ventas.usuario_vendedor_id
      const uId = getCoords('row-usuarios-id', 'right');
      const vUsr = getCoords('row-ventas-vendedor', 'left');
      drawOrthogonal(uId.x, uId.y, vUsr.x, vUsr.y, '#d9008f', 'right', 'left', 390);

      // 2. Relación: usuarios.id -> pagos_nomina.vendedor_id (Amarillo / Oro)
      // Como estan en la misma columna, la linea sale por la IZQUIERDA de usuarios hacia la IZQUIERDA de pagos_nomina
      // EXACTAMENTE como hace phpMyAdmin en el ejemplo para tiendas y vendedores!
      const uIdLeft = getCoords('row-usuarios-id', 'left');
      const pNomLeft = getCoords('row-nomina-vendedor', 'left');
      drawOrthogonal(uIdLeft.x, uIdLeft.y, pNomLeft.x, pNomLeft.y, '#d97706', 'left', 'left', 25);

      // 3. Relación: telefonos.id -> ventas.telefono_id (Azul Real)
      // Conecta la izquierda de telefonos.id con la derecha de ventas.telefono_id
      const telId = getCoords('row-telefonos-id', 'left');
      const vTel = getCoords('row-ventas-telefono', 'right');
      drawOrthogonal(telId.x, telId.y, vTel.x, vTel.y, '#2563eb', 'left', 'right', 820);

      // 4. Relación: telefonos.id -> compras_inventario.telefono_id (Verde Esmeralda)
      // Como compras esta abajo a la derecha, sale por la DERECHA hacia el margen exterior y entra por la DERECHA
      const telIdRight = getCoords('row-telefonos-id', 'right');
      const compTelRight = getCoords('row-compras-telefono', 'right');
      drawOrthogonal(telIdRight.x, telIdRight.y, compTelRight.x, compTelRight.y, '#059669', 'right', 'right', 1190);
    });
  </script>
</body>
</html>
  `;

  await page.setContent(html, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 600));

  const outputPath1 = '/home/cantvgod/antigravity/serene-planck/MER_TechInventario_IUJO.png';
  const outputPath2 = '/home/cantvgod/Descargas/MER_TechInventario_IUJO.png';
  const outputPath3 = '/home/cantvgod/antigravity/serene-planck/Capturas_TechInventario_IUJO/01_Pantallas_Sistema/23_Diagrama_MER_Base_Datos_phpMyAdmin.png';
  const outputPath4 = '/home/cantvgod/antigravity/serene-planck/Capturas_TechInventario_IUJO/03_Diagrama_MER_Base_Datos.png';

  await page.screenshot({ path: outputPath1, fullPage: true });
  fs.copyFileSync(outputPath1, outputPath2);
  fs.copyFileSync(outputPath1, outputPath3);
  fs.copyFileSync(outputPath1, outputPath4);

  console.log('✅ Nuevo Diagrama MER generado y guardado con éxito.');
  await browser.close();
}

generateMER().catch(console.error);
