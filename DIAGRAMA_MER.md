# 🏛️ Modelo Entidad - Relación (MER / DER) — TechInventario

**Sistema de Gestión Empresarial Telecom C.A.**  
**Base de Datos Relacional:** `techinventario_db` (MySQL / MariaDB)

Este documento contiene la especificación formal del **Modelo Entidad - Relación (MER)** y el **Diagrama Entidad - Relación (DER)** del sistema, diseñado conforme al estándar de **phpMyAdmin Designer**.

---

## 🖼️ Diagrama Visual (phpMyAdmin Designer)

El archivo de imagen en alta resolución se encuentra en:
* `MER_TechInventario.png` (en la raíz del proyecto y en tu carpeta de Descargas)
* `Capturas_TechInventario/03_Diagrama_MER_Base_Datos.png`

---

## 📊 Diagrama Entidad - Relación (Código Mermaid)

```mermaid
erDiagram
    usuarios ||--o{ ventas : "realiza (1:N)"
    usuarios ||--o{ pagos_nomina : "percibe (1:N)"
    telefonos ||--o{ ventas : "se vende en (1:N)"
    telefonos ||--o{ compras_inventario : "se repone en (1:N)"

    usuarios {
        int id PK
        varchar codigo_usr
        varchar nombre
        varchar email
        varchar cedula
        varchar telefono
        enum rol
        decimal meta_mensual_bs
        date fecha_ingreso
    }

    telefonos {
        int id PK
        varchar codigo_ph
        varchar marca
        varchar modelo
        varchar ram
        varchar almacenamiento
        varchar color
        varchar camara
        varchar pantalla
        decimal precio_bs
        decimal costo_usd
        decimal ultimo_costo_usd
        decimal costo_promedio_usd
        enum metodo_costeo
        decimal margen_ganancia
        int stock
        int stock_minimo
        enum gama
        int ano_lanzamiento
    }

    ventas {
        int id PK
        varchar codigo_venta
        datetime fecha
        int usuario_vendedor_id FK
        int telefono_id FK
        int cantidad
        decimal precio_unitario_bs
        decimal base_imponible_bs
        decimal iva_bs
        decimal igtf_bs
        decimal total_bs
        decimal total_usd
        decimal tasa_cambio_usada
        varchar metodo_pago
        varchar referencia_pago
        varchar cliente_nombre
        varchar cliente_cedula
    }

    compras_inventario {
        int id PK
        varchar codigo_compra
        datetime fecha
        int telefono_id FK
        varchar proveedor
        varchar numero_factura
        int cantidad
        decimal costo_unitario_usd
        decimal total_compra_usd
        enum metodo_costeo_aplicado
        decimal costo_nuevo_usd
        decimal precio_venta_nuevo_bs
    }

    pagos_nomina {
        int id PK
        int vendedor_id FK
        varchar mes_periodo
        int total_ventas_unidades
        decimal total_ventas_bs
        decimal sueldo_base_bs
        decimal monto_comision_bs
        decimal pago_final_bs
        enum estado
        date fecha_pago
    }

    gastos_operativos {
        int id PK
        varchar codigo_gasto
        date fecha
        varchar categoria
        varchar descripcion
        decimal monto_bs
        decimal monto_usd
        varchar metodo_pago
        varchar usuario_registro
    }
```

---

## 🔗 Relaciones y Cardinalidades del Negocio

1. **`usuarios` ──(1 : N)──▶ `ventas`**
   * **Clave Foránea:** `ventas.usuario_vendedor_id` referencia a `usuarios.id`.
   * **Descripción:** Un vendedor/administrador puede realizar múltiples ventas registradas en el sistema.

2. **`usuarios` ──(1 : N)──▶ `pagos_nomina`**
   * **Clave Foránea:** `pagos_nomina.vendedor_id` referencia a `usuarios.id`.
   * **Descripción:** Cada vendedor acumula comisiones mensuales y liquidaciones salariales en múltiples períodos.

3. **`telefonos` ──(1 : N)──▶ `ventas`**
   * **Clave Foránea:** `ventas.telefono_id` referencia a `telefonos.id`.
   * **Descripción:** Un equipo de inventario puede ser vendido en distintas facturas transaccionales.

4. **`telefonos` ──(1 : N)──▶ `compras_inventario`**
   * **Clave Foránea:** `compras_inventario.telefono_id` referencia a `telefonos.id`.
   * **Descripción:** Un teléfono puede recibir múltiples lotes de reposición de inventario con cálculo de costo promedio ponderado y último costo.
