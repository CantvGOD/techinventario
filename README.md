# 📱 TechInventario — Sistema Web de Gestión de Inventario y Ventas (Telecom)

> **Proyecto Académico — Instituto Universitario de Jesús Obrero (IUJO)**  
> Sistema integral de facturación, valuación de inventario con costo de reposición, estados financieros y control tributario venezolano.

---

## 🚀 Inicio Rápido (100% Funcional en Windows y Linux)

### En Windows (1 Solo Clic):
1. Descarga o clona el repositorio.
2. Haz doble clic en:
   ```cmd
   ejecutar.bat
   ```
3. El script se encarga de todo automáticamente:
   - Descarga e instala Node.js de forma desatendida si la PC no lo tiene.
   - Instala librerías y dependencias necesarias (`npm install`).
   - Configura la base de datos (con MySQL si está instalado, o con el motor embebido autónomo sin requerir instalaciones previas).
   - Inicia los servicios e interactúa automáticamente abriendo tu navegador en `http://localhost:5173/`.

### En Linux:
```bash
chmod +x start.sh
./start.sh
```

---

## 🔑 Credenciales de Acceso al Sistema

| Rol | Correo Electrónico | Contraseña | Permisos y Alcance |
| :--- | :--- | :--- | :--- |
| **Super Usuario (Jefe)** | `jefe@empresa.com` | `123` | **Acceso Total**: Panel ejecutivo, inventario, compras de lotes, ventas, contabilidad completa, auditoría confidencial y tasas BCV. |
| **Administrador** | `admin@empresa.com` | `123` | Gestión de inventario, registro de compras, control de vendedores, nómina y estados financieros. |
| **Vendedor (P. Natural)** | `carlos@empresa.com` | `123` | Catálogo de productos y módulo de facturación / ventas. |

---

## 🏛️ Características y Reglas de Negocio Implementadas

### 1. Costeo de Inventario y Regla Fundamental de Reposición
* **Fórmula de Costo Promedio Ponderado**:
  $$C_{\text{prom}} = \frac{(S_{\text{ant}} \times C_{\text{ant}}) + (Q_{\text{nuevo}} \times C_{\text{nuevo}})}{S_{\text{ant}} + Q_{\text{nuevo}}}$$
* **Método de Último Costo**: Fija el costo de reposición al precio de la factura más reciente.
* **Regla Fundamental (Enforzada)**:
  $$\text{Precio de Venta} > \text{Costo de Reposición}$$
  *El sistema bloquea compras o ventas si el costo de reposición iguala o supera el precio de venta, obligando a reevaluar el precio para salvaguardar el margen de ganancia.*

### 2. Normativa Tributaria Venezolana
* **IVA (16%)**: Desglose automático de Base Imponible y Débito Fiscal en todas las ventas.
* **IGTF (3%)**: Recargo del 3% aplicado estrictamente a pagos realizados en efectivo en moneda extranjera (`Efectivo Divisas (USD)`).
* **Control Anti-Fraude**: Validación de unicidad de referencias bancarias (Pago Móvil / Transferencias / Zelle) para impedir comprobantes duplicados.

### 3. Módulo de Contabilidad y Finanzas (IUJO)
* **Estado de Resultados**: Ventas netas, Costo de Ventas (CMV), Utilidad Bruta, Gastos Operativos y Utilidad Neta.
* **Balance General**: Verificación de ecuación contable en tiempo real ($\text{Activo} = \text{Pasivo} + \text{Patrimonio}$).
* **Gastos Operativos**: Registro clasificado de egresos (alquiler, nómina, electricidad, telecomunicaciones).
* **Cierre Diario de Caja (Corte Z Fiscal)**: Arqueo por medio de pago e impuestos recaudados.
* **Rentabilidad por Producto**: Análisis de margen unitario y acumulado por modelo.

### 4. Soporte Dual de Base de Datos (Zero-Config)
* **Motor Primario**: MySQL / MariaDB (utiliza `database.sql` en localhost:3306).
* **Motor Autónomo de Respaldo**: En equipos sin MySQL instalado, el servidor conmuta de manera transparente a almacenamiento local en `data/techinventario_database.json`, garantizando funcionamiento sin configuraciones adicionales.

---

## 📸 Evidencia y Capturas del Sistema

En la carpeta `Capturas_TechInventario_IUJO/` se incluyen 22 capturas de todas las interfaces del sistema y 6 capturas de código fuente en alta resolución con su archivo explicativo `LEEME_INDICE_CAPTURAS.txt`.
