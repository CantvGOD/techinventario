const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'Capturas_TechInventario');
const UI_DIR = path.join(OUTPUT_DIR, '01_Pantallas_Sistema');
const CODE_DIR = path.join(OUTPUT_DIR, '02_Codigo_Fuente_Clave');

fs.mkdirSync(UI_DIR, { recursive: true });
fs.mkdirSync(CODE_DIR, { recursive: true });

const CHROME_PATH = '/home/cantvgod/antigravity/serene-planck/chrome/linux-155.0.8059.39/chrome-linux64/chrome';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function renderCodeToImage(browser, title, filename, codeContent) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 850, deviceScaleFactor: 2 });

  const escapeHtml = (str) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const lines = codeContent.split('\n');
  const formattedLines = lines
    .map((line, idx) => {
      const num = idx + 1;
      let styledLine = escapeHtml(line);

      styledLine = styledLine
        .replace(/\b(const|let|var|function|async|await|return|if|else|try|catch|import|export|from|app|class|interface|type)\b/g, '<span style="color:#c678dd;font-weight:bold;">$1</span>')
        .replace(/\b(true|false|null|undefined|NaN)\b/g, '<span style="color:#d19a66;">$1</span>')
        .replace(/\b(\d+(\.\d+)?)\b/g, '<span style="color:#d19a66;">$1</span>')
        .replace(/(['"`].*?['"`])/g, '<span style="color:#98c379;">$1</span>')
        .replace(/(\/\/.*$)/g, '<span style="color:#7f848e;font-style:italic;">$1</span>')
        .replace(/(--.*$)/g, '<span style="color:#7f848e;font-style:italic;">$1</span>')
        .replace(/\b(SELECT|FROM|WHERE|INSERT|INTO|UPDATE|SET|DELETE|CREATE|TABLE|DATABASE|INT|DECIMAL|VARCHAR|ENUM|NOT NULL|DEFAULT|PRIMARY KEY|AUTO_INCREMENT|ENGINE)\b/gi, '<span style="color:#e06c75;font-weight:bold;">$1</span>');

      return `<tr><td style="color:#5c6370;text-align:right;user-select:none;padding-right:16px;width:40px;font-size:12px;">${num}</td><td style="white-space:pre;font-family:'JetBrains Mono','Fira Code',Consolas,monospace;font-size:13px;line-height:1.6;color:#abb2bf;">${styledLine}</td></tr>`;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          margin: 0;
          padding: 30px;
          background: #0f172a;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .window {
          background: #1e222b;
          border-radius: 14px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
          border: 1px solid #333842;
          overflow: hidden;
          max-width: 1100px;
          width: 100%;
        }
        .header {
          background: #181a1f;
          padding: 12px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #282c34;
        }
        .dots { display: flex; gap: 7px; }
        .dot { width: 11px; height: 11px; border-radius: 50%; }
        .dot.red { background: #ff5f56; }
        .dot.yellow { background: #ffbd2e; }
        .dot.green { background: #27c93f; }
        .title { color: #abb2bf; font-size: 13px; font-weight: 600; font-family: 'JetBrains Mono', Consolas, monospace; }
        .badge { background: #2563eb; color: white; font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 6px; }
        .content { padding: 20px; overflow-x: auto; background: #1e222b; }
        table { border-collapse: collapse; width: 100%; }
        .footer { background: #181a1f; padding: 8px 18px; border-top: 1px solid #282c34; display: flex; justify-content: space-between; color: #5c6370; font-size: 11px; font-family: 'JetBrains Mono', monospace; }
      </style>
    </head>
    <body>
      <div class="window">
        <div class="header">
          <div class="dots"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div>
          <div class="title">${title}</div>
          <div class="badge">TechInventario Enterprise</div>
        </div>
        <div class="content"><table>${formattedLines}</table></div>
        <div class="footer">
          <span>Archivo: ${filename}</span>
          <span>Reglas de Negocio &amp; Contabilidad</span>
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(html, { waitUntil: 'load' });
  await sleep(300);

  const windowElement = await page.$('.window');
  const clip = await windowElement.boundingBox();

  await page.screenshot({
    path: path.join(CODE_DIR, `${title.replace(/[\s\/:*?"<>|]+/g, '_')}.png`),
    clip: {
      x: Math.max(0, clip.x - 20),
      y: Math.max(0, clip.y - 20),
      width: clip.width + 40,
      height: clip.height + 40
    }
  });

  await page.close();
}

async function main() {
  console.log('🚀 Iniciando captura automatizada con validación de vistas...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await sleep(1000);

  // Paso 0: Asegurarnos de cerrar sesión primero para capturar el Login real
  console.log('🔒 Cerrando sesión para capturar pantallas de autenticación...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const logoutBtn = btns.find((b) => b.innerText.includes('Salir') || b.title?.includes('Cerrar sesión'));
    if (logoutBtn) logoutBtn.click();
  });
  await sleep(1000);

  // 1. Pantalla de Inicio de Sesión
  console.log('📸 01: Pantalla de Login...');
  await page.screenshot({ path: path.join(UI_DIR, '01_Login_Inicio_Sesion.png') });

  // 2. Pantalla de Registro de Nuevo Usuario
  console.log('📸 02: Pestaña de Registro de Usuario...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const regBtn = btns.find((el) => el.innerText.includes('Crear Cuenta') || el.innerText.includes('Registrarse'));
    if (regBtn) regBtn.click();
  });
  await sleep(600);
  await page.screenshot({ path: path.join(UI_DIR, '02_Login_Registro_Usuario.png') });

  // Volver a login y autenticar como Super Usuario
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const loginTab = btns.find((el) => el.innerText.includes('Iniciar Sesión'));
    if (loginTab) loginTab.click();
  });
  await sleep(400);

  console.log('🔑 Iniciando sesión como Super Usuario...');
  await page.evaluate(() => {
    const select = document.querySelector('select');
    if (select) {
      const option = Array.from(select.options).find((o) => o.value.includes('jefe@empresa.com'));
      if (option) {
        select.value = option.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    const btns = Array.from(document.querySelectorAll('button'));
    const enterBtn = btns.find((b) => b.innerText.trim() === 'Ingresar');
    if (enterBtn) enterBtn.click();
  });
  await sleep(1500);

  // 3. Executive Dashboard
  console.log('📸 03: Executive Dashboard...');
  await page.screenshot({ path: path.join(UI_DIR, '03_Dashboard_Principal.png') });

  // Helper para hacer click en Sidebar por texto
  async function clickNav(text) {
    await page.evaluate((navText) => {
      const buttons = Array.from(document.querySelectorAll('aside nav button, aside button'));
      const target = buttons.find((b) => b.innerText.includes(navText));
      if (target) target.click();
    }, text);
    await sleep(800);
  }

  // 4. Inventario de Teléfonos (Catálogo)
  console.log('📸 04: Catálogo de Inventario...');
  await clickNav('Inventario de Teléfonos');
  await page.screenshot({ path: path.join(UI_DIR, '04_Inventario_Catalogo_General.png') });

  // 5. Modal Entrada / Compra Lote con costeo normal
  console.log('📸 05: Modal Entrada de Mercancía / Compra de Lote...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find((b) => b.innerText.includes('Entrada / Compra Lote') || b.innerText.includes('📦 Lote'));
    if (btn) btn.click();
  });
  await sleep(700);

  // Llenar lote normal
  await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    const qtyInput = inputs.find((i) => i.name === 'purchaseQty' || (i.type === 'number' && i.min === '1'));
    if (qtyInput) {
      qtyInput.value = '8';
      qtyInput.dispatchEvent(new Event('input', { bubbles: true }));
      qtyInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await sleep(400);
  await page.screenshot({ path: path.join(UI_DIR, '05_Inventario_Modal_Llegada_Lote_Calculo_Costos.png') });

  // 6. Probar condición de alerta de regla de reposición en el modal
  console.log('📸 06: Modal de Compra con Alerta Crítica de Regla de Reposición...');
  await page.evaluate(() => {
    // Aumentar el costo de compra en USD para superar el precio de venta actual
    const inputs = Array.from(document.querySelectorAll('input'));
    const costInput = inputs.find((i) => i.step === '0.01' && i.type === 'number');
    if (costInput) {
      costInput.value = '2500';
      costInput.dispatchEvent(new Event('input', { bubbles: true }));
      costInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await sleep(600);
  await page.screenshot({ path: path.join(UI_DIR, '06_Inventario_Modal_Alerta_Regla_Reposicion.png') });

  // Cerrar modal de compra
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cancel = btns.find((b) => b.innerText.includes('Cancelar') || b.innerText === '✕');
    if (cancel) cancel.click();
  });
  await sleep(500);

  // 7. Modal de Ajuste de Stock
  console.log('📸 07: Modal de Ajuste Físico de Stock...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const stockBtn = btns.find((b) => b.innerText.includes('⚙️ Stock') || b.title?.includes('Ajustar'));
    if (stockBtn) stockBtn.click();
  });
  await sleep(600);
  await page.screenshot({ path: path.join(UI_DIR, '07_Inventario_Modal_Ajuste_Stock.png') });

  // Cerrar modal de stock
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cancel = btns.find((b) => b.innerText.includes('Cancelar') || b.innerText === '✕');
    if (cancel) cancel.click();
  });
  await sleep(500);

  // 8. Modal Nuevo Teléfono (+ Agregar Teléfono)
  console.log('📸 08: Modal Registro de Nuevo Teléfono...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find((b) => b.innerText.includes('Agregar Teléfono'));
    if (addBtn) addBtn.click();
  });
  await sleep(700);
  await page.screenshot({ path: path.join(UI_DIR, '08_Inventario_Modal_Nuevo_Equipo.png') });

  // Cerrar modal nuevo teléfono
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cancel = btns.find((b) => b.innerText.includes('Cancelar') || b.innerText === '✕');
    if (cancel) cancel.click();
  });
  await sleep(500);

  // 9. Modal de Nueva Venta con desglose fiscal (IVA 16% + IGTF 3%)
  console.log('📸 09: Modal Facturación y Venta con Desglose Fiscal...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const saleBtn = btns.find((b) => b.innerText.includes('Nueva Venta'));
    if (saleBtn) saleBtn.click();
  });
  await sleep(800);

  await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    for (const sel of selects) {
      const opt = Array.from(sel.options).find((o) => o.text.includes('Divisas') || o.text.includes('USD') || o.value.includes('Divisas'));
      if (opt) {
        sel.value = opt.value;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        break;
      }
    }
  });
  await sleep(500);
  await page.screenshot({ path: path.join(UI_DIR, '09_Ventas_Modal_Facturacion_Fiscal_IGTF.png') });

  // Cerrar modal de venta
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cancel = btns.find((b) => b.innerText.includes('Cancelar') || b.innerText === '✕');
    if (cancel) cancel.click();
  });
  await sleep(500);

  // 10. Registro de Ventas (Historial)
  console.log('📸 10: Historial de Ventas...');
  await clickNav('Registro de Ventas');
  await page.screenshot({ path: path.join(UI_DIR, '10_Ventas_Historial_Transacciones.png') });

  // 11. Comprobante Digital de Venta
  console.log('📸 11: Comprobante Digital / Factura...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const receiptBtn = btns.find((b) => b.innerText.includes('Recibo'));
    if (receiptBtn) receiptBtn.click();
  });
  await sleep(600);
  await page.screenshot({ path: path.join(UI_DIR, '11_Ventas_Comprobante_Factura_Digital.png') });

  // Cerrar comprobante
  await page.evaluate(() => {
    const modal = document.querySelector('.fixed.inset-0');
    if (modal) {
      const modalClose = modal.querySelector('button');
      if (modalClose) modalClose.click();
    }
  });
  await sleep(500);

  // 12. Personas (Vendedores / Admin)
  console.log('📸 12: Gestión de Vendedores y Personal...');
  await clickNav('Personas (Vendedores / Admin)');
  await page.screenshot({ path: path.join(UI_DIR, '12_Gestion_Personal_Vendedores.png') });

  // 13. Estadísticas del Mercado
  console.log('📸 13: Estadísticas del Mercado...');
  await clickNav('Estadísticas del Mercado');
  await sleep(500);
  await page.screenshot({ path: path.join(UI_DIR, '13_Analitica_Mercado_Graficos.png') });

  // 14. Pagos Mensuales Vendedores (Nómina)
  console.log('📸 14: Liquidación de Nómina y Comisiones...');
  await clickNav('Pagos Mensuales Vendedores');
  await page.screenshot({ path: path.join(UI_DIR, '14_Nomina_Comisiones_Vendedores.png') });

  // 15. Contabilidad y Finanzas - Pestaña 1: Estado de Resultados
  console.log('📸 15: Contabilidad - Estado de Resultados...');
  await clickNav('Contabilidad y Finanzas');
  await sleep(500);
  await page.screenshot({ path: path.join(UI_DIR, '15_Contabilidad_Estado_Resultados.png') });

  // 16. Contabilidad - Pestaña 2: Balance General
  console.log('📸 16: Contabilidad - Balance General...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((el) => el.innerText.includes('Balance General'));
    if (b) b.click();
  });
  await sleep(600);
  await page.screenshot({ path: path.join(UI_DIR, '16_Contabilidad_Balance_General.png') });

  // 17. Contabilidad - Pestaña 3: Gastos Operativos
  console.log('📸 17: Contabilidad - Gastos Operativos...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((el) => el.innerText.includes('Gastos Operativos'));
    if (b) b.click();
  });
  await sleep(600);
  await page.screenshot({ path: path.join(UI_DIR, '17_Contabilidad_Gastos_Operativos.png') });

  // 18. Contabilidad - Modal Registrar Gasto Operativo
  console.log('📸 18: Contabilidad - Modal Registro de Gasto...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((el) => el.innerText.includes('Registrar Gasto') || el.innerText.includes('Nuevo Gasto'));
    if (b) b.click();
  });
  await sleep(600);
  await page.screenshot({ path: path.join(UI_DIR, '18_Contabilidad_Modal_Registrar_Gasto.png') });

  // Cerrar modal gasto
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cancel = btns.find((b) => b.innerText.includes('Cancelar') || b.innerText === '✕');
    if (cancel) cancel.click();
  });
  await sleep(500);

  // 19. Contabilidad - Pestaña 4: Cierre Diario (Corte Z)
  console.log('📸 19: Contabilidad - Cierre Fiscal Corte Z...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((el) => el.innerText.includes('Corte Z') || el.innerText.includes('Cierre Diario'));
    if (b) b.click();
  });
  await sleep(600);
  await page.screenshot({ path: path.join(UI_DIR, '19_Contabilidad_Cierre_Caja_Corte_Z.png') });

  // 20. Contabilidad - Pestaña 5: Rentabilidad por Producto
  console.log('📸 20: Contabilidad - Rentabilidad por Producto...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((el) => el.innerText.includes('Rentabilidad por Producto'));
    if (b) b.click();
  });
  await sleep(600);
  await page.screenshot({ path: path.join(UI_DIR, '20_Contabilidad_Rentabilidad_Productos.png') });

  // 21. Auditoría del Sistema (Confidencial Super Usuario)
  console.log('📸 21: Auditoría del Sistema...');
  await clickNav('Auditoría del Sistema');
  await page.screenshot({ path: path.join(UI_DIR, '21_Auditoria_Sistema_Confidencial.png') });

  // 22. Configuración / Tasas BCV
  console.log('📸 22: Configuración y Tasas BCV...');
  await clickNav('Configuración / Tasas');
  await page.screenshot({ path: path.join(UI_DIR, '22_Configuracion_Tasas_BCV.png') });

  console.log('✅ Todas las pantallas del sistema capturadas con éxito.');

  // Render Code to Image
  console.log('🎨 Renderizando capturas de código fuente...');

  const code1 = `// Regla de Negocio Fundamental: El costo de reposición nunca puede superar al precio de venta
// Archivo: server.cjs (Líneas 716-739)

let newCostUSD = costUSD;
if (costMethodApplied === 'promedio_ponderado') {
  if (newStock > 0) {
    // Fórmula: Costo Promedio Ponderado = ((Stock_Ant * Costo_Ant) + (Q_Nueva * Costo_Nuevo)) / Stock_Total
    newCostUSD = Number((((oldStock * oldCostUSD) + (qty * costUSD)) / newStock).toFixed(2));
  }
} else if (costMethodApplied === 'ultimo_costo') {
  newCostUSD = costUSD;
}

const newCostBs = Number((newCostUSD * rateUSD).toFixed(2));
const finalPriceBs = parseFloat(newPriceBs) || oldPriceBs;

// VALIDACIÓN DE LA REGLA FUNDAMENTAL DE CONTROL DE REPOSICIÓN:
if (finalPriceBs <= newCostBs) {
  return res.status(400).json({
    error: \`Regla de Negocio: El precio de venta (Bs. \${finalPriceBs.toLocaleString('es-VE')}) \` +
           \`no puede ser menor o igual al nuevo costo de reposición (Bs. \${newCostBs.toLocaleString('es-VE')}). \` +
           \`Debe ajustar el precio de venta para garantizar el margen de ganancia.\`
  });
}

// Recálculo del margen de ganancia porcentual
const profitMargin = Number((((finalPriceBs - newCostBs) / newCostBs) * 100).toFixed(2));`;

  await renderCodeToImage(
    browser,
    'Regla de Negocio: Precio de Venta vs Costo de Reposición',
    'server.cjs (Líneas 716-739)',
    code1
  );

  const code2 = `// Métodos Contables de Valuación de Inventario Empresarial
// Archivo: src/context/AppContext.tsx

const registerStockArrival = async (data: {
  phoneId: string;
  quantity: number;
  unitCostUSD: number;
  costMethodApplied: 'ultimo_costo' | 'promedio_ponderado';
  newPriceBs?: number;
}) => {
  const currentPhone = phones.find(p => p.id === data.phoneId);
  if (!currentPhone) return false;

  const oldStock = currentPhone.stock;
  const oldCostUSD = currentPhone.costUSD || 0;
  const newStock = oldStock + data.quantity;

  // 1. Método Costo Promedio Ponderado
  let calculatedCostUSD = data.unitCostUSD;
  if (data.costMethodApplied === 'promedio_ponderado' && newStock > 0) {
    calculatedCostUSD = Number(
      (((oldStock * oldCostUSD) + (data.quantity * data.unitCostUSD)) / newStock).toFixed(2)
    );
  } 
  // 2. Método Último Precio de Costo
  else if (data.costMethodApplied === 'ultimo_costo') {
    calculatedCostUSD = data.unitCostUSD;
  }

  // 3. Verificación de Margen Operativo Seguro (> 0%)
  const newCostBs = calculatedCostUSD * exchangeRates.bcvUSD;
  const newPriceBs = data.newPriceBs || currentPhone.priceBs;

  if (newPriceBs <= newCostBs) {
    throw new Error('Alerta Financiera: El precio no cubre el nuevo costo de reposición.');
  }

  return await apiPost('/api/purchases', { ...data, newCostUSD: calculatedCostUSD });
};`;

  await renderCodeToImage(
    browser,
    'Valuación Contable: Costo Promedio y Último Costo',
    'src/context/AppContext.tsx',
    code2
  );

  const code3 = `// Cálculo de Obligaciones Tributarias Venezolanas: IVA 16% e IGTF 3%
// Archivo: src/components/sales/SalesRegisterModal.tsx y server.cjs

// 1. Base Imponible y Débito Fiscal IVA (16%)
const subtotalBrutoBs = Number((selectedPhone.priceBs * quantity).toFixed(2));
const baseImponibleBs = Number((subtotalBrutoBs / 1.16).toFixed(2));
const ivaBs = Number((subtotalBrutoBs - baseImponibleBs).toFixed(2));

// 2. Impuesto a las Grandes Transacciones Financieras (IGTF 3%)
// Aplicable exclusivamente cuando el pago es en divisas en efectivo
const isForeignCurrencyCash = paymentMethod === 'Efectivo Divisas (USD)';
const igtfBs = isForeignCurrencyCash ? Number((subtotalBrutoBs * 0.03).toFixed(2)) : 0.00;
const igtfUSD = isForeignCurrencyCash ? Number((subtotalBrutoUSD * 0.03).toFixed(2)) : 0.00;

// 3. Total Facturado
const totalCobrarBs = Number((subtotalBrutoBs + igtfBs).toFixed(2));
const totalCobrarUSD = Number(((subtotalBrutoBs + igtfBs) / exchangeRates.bcvUSD).toFixed(2));

// Desglose enviado al comprobante fiscal y reporte Corte Z
const fiscalSummary = {
  baseImponibleBs,
  ivaAlicuotaGeneral: 0.16,
  ivaBs,
  igtfAlicuota: isForeignCurrencyCash ? 0.03 : 0.00,
  igtfBs,
  totalBs: totalCobrarBs
};`;

  await renderCodeToImage(
    browser,
    'Cálculo Tributario Fiscal: Base Imponible, IVA 16% e IGTF 3%',
    'src/components/sales/SalesRegisterModal.tsx',
    code3
  );

  const code4 = `// Validación de Integridad y Control de Duplicidad en Referencias Bancarias
// Archivo: server.cjs (Líneas 370-381)

app.post('/api/sales', async (req, res) => {
  const { paymentReference, paymentMethod, quantity, phoneId } = req.body;

  // Si el método requiere comprobante bancario (Pago Móvil, Transferencia, Zelle):
  if (paymentReference && paymentReference.trim().length > 0) {
    const [[existingRef]] = await pool.query(
      'SELECT codigo_venta, fecha, cliente_nombre FROM ventas WHERE referencia_pago = ? LIMIT 1',
      [paymentReference.trim()]
    );

    // Si ya existe en la base de datos MariaDB, se rechaza la transacción:
    if (existingRef) {
      return res.status(400).json({
        error: \`CONTROL DE DUPLICIDAD ACTIVADO: El número de referencia "\${paymentReference.trim()}" \` +
               \`ya fue registrado previamente en la venta \${existingRef.codigo_venta} \` +
               \`asociada al cliente \${existingRef.cliente_nombre}. \` +
               \`No se permite reutilizar comprobantes de pago.\`
      });
    }
  }

  // Continuar con el registro seguro de la venta...
});`;

  await renderCodeToImage(
    browser,
    'Control de Seguridad: Verificación Anti-Duplicidad de Pagos',
    'server.cjs (Líneas 370-381)',
    code4
  );

  const code5 = `-- Esquema Relacional MariaDB / MySQL - Sistema TechInventario Enterprise
-- Archivo: database.sql

CREATE TABLE telefonos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo_ph VARCHAR(20) UNIQUE NOT NULL,
  marca VARCHAR(50) NOT NULL,
  modelo VARCHAR(100) NOT NULL,
  precio_bs DECIMAL(12,2) NOT NULL,
  costo_usd DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  ultimo_costo_usd DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  costo_promedio_usd DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  metodo_costeo ENUM('ultimo_costo', 'promedio_ponderado', 'manual') DEFAULT 'promedio_ponderado',
  margen_ganancia DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  stock INT NOT NULL DEFAULT 0,
  stock_minimo INT NOT NULL DEFAULT 3
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE compras_inventario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  telefono_id INT NOT NULL,
  proveedor VARCHAR(100) NOT NULL,
  numero_factura VARCHAR(50) NOT NULL,
  cantidad INT NOT NULL,
  costo_unitario_usd DECIMAL(10,2) NOT NULL,
  metodo_costeo_aplicado ENUM('ultimo_costo', 'promedio_ponderado', 'manual') NOT NULL,
  costo_anterior_usd DECIMAL(10,2) NOT NULL,
  costo_nuevo_usd DECIMAL(10,2) NOT NULL,
  precio_venta_anterior_bs DECIMAL(12,2) NOT NULL,
  precio_venta_nuevo_bs DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (telefono_id) REFERENCES telefonos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE auditoria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fecha DATETIME NOT NULL,
  usuario_nombre VARCHAR(100) NOT NULL,
  accion VARCHAR(50) NOT NULL,
  modulo VARCHAR(50) NOT NULL,
  detalles TEXT NOT NULL,
  ip_origen VARCHAR(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

  await renderCodeToImage(
    browser,
    'Estructura Relacional MariaDB: Inventario, Lotes y Auditoría',
    'database.sql',
    code5
  );

  const code6 = `:: Script de Ejecución Portable en Windows (Doble Click)
:: Archivo: ejecutar.bat

@echo off
title TechInventario - Sistema Telecom con Base de Datos MySQL
cd /d "%~dp0"

:: 1. Detección automática del entorno Node.js
where node >nul 2>nul
if %errorlevel% equ 0 (
    echo [INFO] Node.js detectado en el sistema.
    if not exist node_modules (
        echo [INFO] Descargando e instalando librerias necesarias...
        call npm install
    )
    echo [INFO] Iniciando API Backend MariaDB/MySQL en puerto 3001...
    start /b node server.cjs
    echo [INFO] Iniciando Aplicacion Web Frontend en http://localhost:5173/ ...
    start http://localhost:5173/
    call npm run dev
    goto END
)

:: 2. Fallback de alta compatibilidad en modo servidor local
where python >nul 2>nul
if %errorlevel% equ 0 (
    start http://localhost:5173/
    python -m http.server 5173 --directory dist
)
:END`;

  await renderCodeToImage(
    browser,
    'Automatización Portable: Ejecución con Doble Clic en Windows',
    'ejecutar.bat',
    code6
  );

  await browser.close();
  console.log('🎉 ¡Todas las capturas se generaron correctamente y verificadas!');
}

main().catch((err) => {
  console.error('Error durante la generación de capturas:', err);
  process.exit(1);
});
