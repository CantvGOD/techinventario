# Guía de Verificación: Validaciones de Entrada y Auditoría del Sistema

Se han implementado **verificaciones estrictas en todos los campos interactuables** del sistema y un **registro de auditoría completo y confidencial**, accesible **única y exclusivamente por el Super Usuario (Jefe)**.

---

## 🔍 1. Verificaciones y Validaciones en TODOS los Campos Interactuables

Se implementó un motor centralizado de validación (`src/utils/validators.ts`) con comprobaciones en tiempo real y mensajes claros de error para evitar datos erróneos:

### A. Inicio de Sesión y Registro (`LoginView.tsx`):
- **Nombre Completo:** Solo permite letras, acentos y espacios (mínimo 3 caracteres, máximo 60). Bloquea números o caracteres especiales.
- **Cédula / Documento:** Formato venezolano estricto (debe iniciar con `V-`, `E-`, `J-` o `G-` seguido de números, ej: `V-19.458.112`). Formatea automáticamente al escribir.
- **Teléfono:** Valida prefijos venezolanos válidos (`0414`, `0424`, `0412`, `0416`, `0426`) y longitud exacta de 11 dígitos. Formatea con guión automáticamente.
- **Correo Electrónico:** Verificación de estructura RFC de correo (`usuario@dominio.com`).
- **Contraseña:** Mínimo de 3 caracteres requeridos.

### B. Registro de Ventas (`SalesRegisterModal.tsx`):
- **Cantidad de Equipos:** Valida que sea un número entero mayor a 0 y **comprueba en tiempo real que no supere el stock disponible** del modelo en almacén.
- **Cédula del Cliente:** Formato obligatorio venezolano (`V-`, `E-`, `J-`, `G-`).
- **Nombre del Cliente:** Solo letras y espacios (mínimo 3 caracteres).
- **Notas Adicionales:** Límite máximo de 250 caracteres.
- **Vendedor y Teléfono:** Selección obligatoria con verificación previa.

### C. Inventario de Teléfonos (`InventoryManager.tsx`):
- **Modelo:** Obligatorio (mínimo 2 caracteres).
- **RAM y Almacenamiento:** No pueden quedar vacíos (ej: `8 GB`, `256 GB`).
- **Color:** Solo letras y espacios.
- **Precio en Bolívares:** Debe ser un número positivo mayor a 0 Bs.
- **Stock Inicial:** Entero no negativo (mínimo 0 unidades).
- **Stock Mínimo:** Entero positivo (mínimo 1 unidad).
- **Año de Lanzamiento:** Año válido entre 2010 y 2027.

### D. Registro de Personal (`VendorManager.tsx`):
- **Nombre:** Verificación de solo letras y espacios.
- **Cédula y Teléfono:** Verificaciones con formato venezolano estricto.
- **Correo Electrónico:** Verificación de formato.
- **Meta Mensual de Ventas:** Debe ser mayor a 0 Bs para vendedores.

### E. Liquidación de Nómina y Pagos (`PayrollManager.tsx`):
- **Referencia de Pago:** Verificación alfanumérica estricta (mínimo 4 caracteres, ej: `REF-992019`).

### F. Parámetros y Tasas de Cambio (`SystemSettings.tsx`):
- **Tasas BCV y Paralelo:** Valores numéricos positivos mayores a 0 con validación inmediata.

---

## 🛡️ 2. Sistema Completo de Auditoría y Trazabilidad

Queda registrado **absolutamente todo lo que se realiza en el sistema**:

1. **Inicios de Sesión:** Usuario, rol, fecha, hora y resultado.
2. **Cierres de Sesión:** Usuario y hora de salida.
3. **Registro de Cuentas:** Usuario creador, datos del nuevo usuario y rol asignado.
4. **Ventas Procesadas:** Código de venta, modelo, cantidad, cliente, cédula, monto en Bs, USD y vendedor responsable.
5. **Inventario:** Creación de nuevos teléfonos, edición de precios/stock y eliminación de productos.
6. **Liquidaciones de Vendedores:** Aprobación de pagos, montos liquidados y número de referencia bancaria.
7. **Tasas de Cambio:** Modificaciones de cotizaciones oficiales o sincronizaciones con BCV.
8. **Mantenimiento:** Restablecimiento de datos a valores de fábrica.

### 🔒 Acceso Exclusivo para el Super Usuario:
- La pestaña **🛡️ Auditoría del Sistema** en la barra lateral solo se muestra cuando el rol activo es **Super Usuario (Jefe)**.
- Si un usuario con rol de *Vendedor* o *Administrador* intenta acceder directamente a la auditoría, el sistema bloquea la vista con una advertencia de **Acceso Restringido**.
- Incluye herramientas de filtrado por categoría, usuario y texto, además de exportación completa a archivo `.csv`.

---

## 💱 3. Sincronización en Vivo de la Tasa del Dólar (BCV y Mercado)

Se corrigió y modernizó por completo el sistema de actualización cambiaria:
- **API en tiempo real:** Al presionar **🔄 Actualizar Tasa** (en la cabecera, en el Panel Ejecutivo o en Configuración), el sistema consulta los indicadores cambiarios oficiales en vivo vía `ve.dolarapi.com` / BCV.
- **Valores Reales:** La cotización ya no está congelada en Bs. 36.50; ahora refleja el valor de mercado actual (**~Bs. 854.46 / USD BCV**, **~Bs. 954.16 / USD Paralelo**, **~Bs. 974.06 / EUR**).
- **Actualización en Cascada:**
  1. Actualiza la tabla `tasas_cambio` en la base de datos MySQL.
  2. Escala automáticamente los precios en Bolívares del catálogo de inventario para mantener la equivalencia real en dólares de cada equipo (ej. Samsung S24 Ultra a $1,300 USD = Bs. 1.110.798).
  3. Queda registrado en el historial de **Auditoría** (accesible por el Super Usuario).
  4. Los indicadores de la barra superior, tarjetas de cambio y formularios se refrescan instantáneamente.

---

## 🚀 Cómo Probar el Sistema:
1. Abre tu navegador en `http://localhost:5173/`
2. Presiona el botón **🔄 Actualizar Tasa** en la barra superior o en **Configuración**:
   - Verás cómo la tasa sube de inmediato al valor de mercado actual (~Bs. 854.46 / USD) con notificación toast de éxito.
3. Inicia sesión como **Super Usuario (Carlos Mendoza)** para revisar la pestaña **Auditoría del Sistema**:
   - Comprueba que la actualización de la tasa quedó registrada con fecha, hora y detalles exactos.
4. Realiza cualquier acción (una venta, registrar un usuario o cambiar un precio) y verás cómo se genera el registro detallado en la auditoría al instante.
5. Cambia de rol a **Vendedor** o **Administrador** para comprobar que la pestaña de auditoría desaparece y no puede ser consultada por otros roles.
