-- =====================================================
-- DATABASE SCHEMA & EXTENSIVE SAMPLE DATA FOR TECHINVENTARIO
-- MySQL / MariaDB Database for Telefonía & Tecnología (Contable Empresarial)
-- =====================================================

CREATE DATABASE IF NOT EXISTS `techinventario_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `techinventario_db`;

DROP TABLE IF EXISTS `auditoria`;
DROP TABLE IF EXISTS `estadisticas_mercado`;
DROP TABLE IF EXISTS `tasas_cambio`;
DROP TABLE IF EXISTS `pagos_nomina`;
DROP TABLE IF EXISTS `gastos_operativos`;
DROP TABLE IF EXISTS `compras_inventario`;
DROP TABLE IF EXISTS `ventas`;
DROP TABLE IF EXISTS `telefonos`;
DROP TABLE IF EXISTS `usuarios`;

-- 1. TABLE: usuarios
CREATE TABLE `usuarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `codigo_usr` VARCHAR(20) UNIQUE NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `cedula` VARCHAR(20) NOT NULL,
  `telefono` VARCHAR(30) NULL,
  `rol` ENUM('super_user', 'admin', 'vendedor') NOT NULL DEFAULT 'vendedor',
  `meta_mensual_bs` DECIMAL(12,2) DEFAULT 0.00,
  `fecha_ingreso` DATE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. TABLE: telefonos
CREATE TABLE `telefonos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `codigo_ph` VARCHAR(20) UNIQUE NOT NULL,
  `marca` VARCHAR(50) NOT NULL,
  `modelo` VARCHAR(100) NOT NULL,
  `ram` VARCHAR(20) NOT NULL,
  `almacenamiento` VARCHAR(20) NOT NULL,
  `color` VARCHAR(30) NOT NULL,
  `camara` VARCHAR(50) NOT NULL,
  `pantalla` VARCHAR(50) NOT NULL,
  `precio_bs` DECIMAL(12,2) NOT NULL,
  `costo_bs` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `costo_usd` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `ultimo_costo_usd` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `costo_promedio_usd` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `metodo_costeo` ENUM('ultimo_costo', 'promedio_ponderado', 'manual') NOT NULL DEFAULT 'promedio_ponderado',
  `margen_ganancia` DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  `stock` INT NOT NULL DEFAULT 0,
  `stock_minimo` INT NOT NULL DEFAULT 3,
  `gama` ENUM('Gama Alta', 'Gama Media', 'Gama Entrada') NOT NULL DEFAULT 'Gama Media',
  `ano_lanzamiento` INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. TABLE: ventas
CREATE TABLE `ventas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `codigo_venta` VARCHAR(30) UNIQUE NOT NULL,
  `fecha` DATETIME NOT NULL,
  `usuario_vendedor_id` INT NOT NULL,
  `telefono_id` INT NOT NULL,
  `cantidad` INT NOT NULL DEFAULT 1,
  `precio_unitario_bs` DECIMAL(12,2) NOT NULL,
  `base_imponible_bs` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `iva_bs` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `igtf_bs` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total_bs` DECIMAL(12,2) NOT NULL,
  `total_usd` DECIMAL(10,2) NOT NULL,
  `total_eur` DECIMAL(10,2) NOT NULL,
  `costo_total_bs` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `tasa_cambio_usada` DECIMAL(10,2) NOT NULL,
  `metodo_pago` VARCHAR(50) NOT NULL,
  `referencia_pago` VARCHAR(50) NULL,
  `cliente_nombre` VARCHAR(100) NOT NULL,
  `cliente_cedula` VARCHAR(20) NOT NULL,
  `notas` TEXT NULL,
  CONSTRAINT `fk_ventas_usuario` FOREIGN KEY (`usuario_vendedor_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ventas_telefono` FOREIGN KEY (`telefono_id`) REFERENCES `telefonos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. TABLE: compras_inventario
CREATE TABLE `compras_inventario` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `codigo_compra` VARCHAR(30) UNIQUE NOT NULL,
  `fecha` DATETIME NOT NULL,
  `telefono_id` INT NOT NULL,
  `proveedor` VARCHAR(100) NOT NULL,
  `numero_factura` VARCHAR(50) NOT NULL,
  `cantidad` INT NOT NULL,
  `costo_unitario_usd` DECIMAL(10,2) NOT NULL,
  `costo_unitario_bs` DECIMAL(12,2) NOT NULL,
  `total_compra_usd` DECIMAL(12,2) NOT NULL,
  `total_compra_bs` DECIMAL(14,2) NOT NULL,
  `tasa_cambio_usada` DECIMAL(10,2) NOT NULL,
  `metodo_costeo_aplicado` ENUM('ultimo_costo', 'promedio_ponderado', 'manual') NOT NULL DEFAULT 'promedio_ponderado',
  `costo_anterior_usd` DECIMAL(10,2) NOT NULL,
  `costo_nuevo_usd` DECIMAL(10,2) NOT NULL,
  `precio_venta_anterior_bs` DECIMAL(12,2) NOT NULL,
  `precio_venta_nuevo_bs` DECIMAL(12,2) NOT NULL,
  `notas` TEXT NULL,
  CONSTRAINT `fk_compras_telefono` FOREIGN KEY (`telefono_id`) REFERENCES `telefonos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. TABLE: gastos_operativos (Egresos)
CREATE TABLE `gastos_operativos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `codigo_gasto` VARCHAR(30) UNIQUE NOT NULL,
  `fecha` DATE NOT NULL,
  `categoria` VARCHAR(50) NOT NULL,
  `descripcion` VARCHAR(255) NOT NULL,
  `monto_bs` DECIMAL(12,2) NOT NULL,
  `monto_usd` DECIMAL(10,2) NOT NULL,
  `tasa_cambio_usada` DECIMAL(10,2) NOT NULL,
  `metodo_pago` VARCHAR(50) NOT NULL,
  `referencia_comprobante` VARCHAR(100) NULL,
  `usuario_registro` VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. TABLE: pagos_nomina
CREATE TABLE `pagos_nomina` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `vendedor_id` INT NOT NULL,
  `mes_periodo` VARCHAR(10) NOT NULL,
  `total_ventas_unidades` INT NOT NULL DEFAULT 0,
  `total_ventas_bs` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total_ventas_usd` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `sueldo_base_bs` DECIMAL(12,2) NOT NULL DEFAULT 7300.00,
  `porcentaje_comision` DECIMAL(5,2) DEFAULT 10.00,
  `monto_comision_bs` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `monto_bono_bs` DECIMAL(12,2) DEFAULT 0.00,
  `pago_final_bs` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `pago_final_usd` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `estado` ENUM('Pendiente', 'Pagado', 'En Revisión') DEFAULT 'Pendiente',
  `fecha_pago` DATE NULL,
  `referencia_bancaria` VARCHAR(50) NULL,
  CONSTRAINT `fk_nomina_vendedor` FOREIGN KEY (`vendedor_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. TABLE: tasas_cambio
CREATE TABLE `tasas_cambio` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tasa_bcv_usd` DECIMAL(10,2) NOT NULL DEFAULT 854.46,
  `tasa_bcv_eur` DECIMAL(10,2) NOT NULL DEFAULT 974.06,
  `tasa_paralelo_usd` DECIMAL(10,2) NOT NULL DEFAULT 954.16,
  `tasa_activa` ENUM('bcvUSD', 'bcvEUR', 'paraleloUSD') DEFAULT 'bcvUSD',
  `ultima_actualizacion` DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. TABLE: estadisticas_mercado
CREATE TABLE `estadisticas_mercado` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `marca` VARCHAR(50) NOT NULL,
  `modelo` VARCHAR(100) NOT NULL,
  `porcentaje_mercado` DECIMAL(5,2) NOT NULL,
  `volumen_ventas_estimado` INT NOT NULL,
  `precio_promedio_usd` DECIMAL(10,2) NOT NULL,
  `tendencia` ENUM('up', 'down', 'stable') DEFAULT 'stable',
  `en_catalogo_tienda` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. TABLE: auditoria
CREATE TABLE `auditoria` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `fecha` DATETIME NOT NULL,
  `usuario` VARCHAR(100) NOT NULL,
  `rol` VARCHAR(50) NOT NULL,
  `accion` VARCHAR(100) NOT NULL,
  `detalles` TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- INSERCIÓN DE USUARIOS Y PERSONAL
INSERT INTO `usuarios` (`id`, `codigo_usr`, `nombre`, `email`, `cedula`, `telefono`, `rol`, `meta_mensual_bs`, `fecha_ingreso`) VALUES
(1, 'USR-001', 'Carlos Mendoza', 'jefe@empresa.com', 'V-14.582.901', '0414-1234567', 'super_user', 0.00, '2023-01-15'),
(2, 'USR-002', 'Laura Rodríguez', 'admin@empresa.com', 'V-18.341.209', '0412-9876543', 'admin', 0.00, '2023-03-10'),
(3, 'USR-003', 'María González', 'maria.gonzalez@empresa.com', 'V-22.109.876', '0424-5551234', 'vendedor', 250000.00, '2024-02-01'),
(4, 'USR-004', 'Juan Pérez', 'juan.perez@empresa.com', 'V-24.901.234', '0416-3338899', 'vendedor', 200000.00, '2024-05-15'),
(5, 'USR-005', 'Pedro Rodríguez', 'pedro.rodriguez@empresa.com', 'V-25.432.109', '0414-7774411', 'vendedor', 180000.00, '2024-06-01'),
(6, 'USR-006', 'Ana López', 'ana.lopez@empresa.com', 'V-26.118.990', '0412-2226655', 'vendedor', 180000.00, '2025-01-10'),
(7, 'USR-007', 'Roberto Benítez', 'roberto.benitez@empresa.com', 'V-27.441.009', '0424-8889911', 'vendedor', 190000.00, '2025-03-01'),
(8, 'USR-008', 'Sofia Castillo', 'sofia.castillo@empresa.com', 'V-28.001.342', '0414-5552233', 'vendedor', 175000.00, '2025-04-12');

-- INSERCIÓN DE INVENTARIO DE TELÉFONOS (CON COSTOS REALISTAS)
INSERT INTO `telefonos` (`id`, `codigo_ph`, `marca`, `modelo`, `ram`, `almacenamiento`, `color`, `camara`, `pantalla`, `precio_bs`, `costo_bs`, `costo_usd`, `ultimo_costo_usd`, `costo_promedio_usd`, `metodo_costeo`, `margen_ganancia`, `stock`, `stock_minimo`, `gama`, `ano_lanzamiento`) VALUES
(1, 'PH-001', 'Samsung', 'Galaxy S24 Ultra 5G', '12 GB', '512 GB', 'Titanium Gray', '200 MP + 50 MP', '6.8 AMOLED 120Hz', 1110798.00, 854460.00, 1000.00, 1000.00, 1000.00, 'promedio_ponderado', 30.00, 14, 4, 'Gama Alta', 2024),
(2, 'PH-002', 'Apple', 'iPhone 15 Pro Max', '8 GB', '256 GB', 'Natural Titanium', '48 MP Tele 5x', '6.7 OLED 120Hz', 1025352.00, 786103.20, 920.00, 920.00, 920.00, 'promedio_ponderado', 30.43, 8, 3, 'Gama Alta', 2023),
(3, 'PH-003', 'Xiaomi', '13T Pro Leica', '12 GB', '512 GB', 'Alpine Blue', '50 MP Leica', '6.67 AMOLED 144Hz', 555399.00, 410140.80, 480.00, 480.00, 480.00, 'promedio_ponderado', 35.42, 22, 5, 'Gama Alta', 2023),
(4, 'PH-004', 'Motorola', 'Edge 50 Pro', '12 GB', '256 GB', 'Black Vegan Leather', '50 MP OIS', '6.7 pOLED 144Hz', 469953.00, 350328.60, 410.00, 410.00, 410.00, 'promedio_ponderado', 34.15, 18, 5, 'Gama Media', 2024),
(5, 'PH-005', 'Xiaomi', 'Poco F6 Pro', '12 GB', '256 GB', 'Moonlight White', '50 MP Light Hunter', '6.67 WQHD+ 120Hz', 410140.80, 299061.00, 350.00, 350.00, 350.00, 'promedio_ponderado', 37.14, 28, 6, 'Gama Media', 2024),
(6, 'PH-006', 'Samsung', 'Galaxy A55 5G', '8 GB', '256 GB', 'Awesome Iceblue', '50 MP OIS', '6.6 Super AMOLED', 333239.40, 247793.40, 290.00, 290.00, 290.00, 'promedio_ponderado', 34.48, 35, 8, 'Gama Media', 2024),
(7, 'PH-007', 'Xiaomi', 'Redmi Note 13 Pro+ 5G', '8 GB', '256 GB', 'Aurora Purple', '200 MP OIS', '6.67 AMOLED 120Hz', 307605.60, 222159.60, 260.00, 260.00, 260.00, 'promedio_ponderado', 38.46, 40, 10, 'Gama Media', 2024),
(8, 'PH-008', 'Realme', '12 Pro+ 5G', '12 GB', '256 GB', 'Submarine Blue', '64 MP Periscope', '6.7 Curved 120Hz', 358873.20, 264882.60, 310.00, 310.00, 310.00, 'promedio_ponderado', 35.48, 12, 4, 'Gama Media', 2024),
(9, 'PH-009', 'Apple', 'iPhone 14 Pro', '6 GB', '256 GB', 'Deep Purple', '48 MP', '6.1 OLED 120Hz', 854460.00, 649389.60, 760.00, 760.00, 760.00, 'promedio_ponderado', 31.58, 6, 2, 'Gama Alta', 2022),
(10, 'PH-010', 'Samsung', 'Galaxy S23 FE', '8 GB', '128 GB', 'Menta', '50 MP OIS', '6.4 Dynamic AMOLED', 427230.00, 316150.20, 370.00, 370.00, 370.00, 'promedio_ponderado', 35.14, 15, 4, 'Gama Media', 2023),
(11, 'PH-011', 'Honor', 'Magic 6 Lite', '8 GB', '256 GB', 'Emerald Green', '108 MP Ultra', '6.78 AMOLED', 273427.20, 196525.80, 230.00, 230.00, 230.00, 'promedio_ponderado', 39.13, 25, 5, 'Gama Entrada', 2024),
(12, 'PH-012', 'Infinix', 'Zero 30 5G', '12 GB', '256 GB', 'Rome Green', '108 MP + 50 MP Selfie', '6.78 AMOLED 144Hz', 239248.80, 170892.00, 200.00, 200.00, 200.00, 'promedio_ponderado', 40.00, 30, 6, 'Gama Entrada', 2023),
(13, 'PH-013', 'Tecno', 'Camon 30 Pro 5G', '12 GB', '512 GB', 'Basalt Black', '50 MP Sony IMX890', '6.78 AMOLED 144Hz', 290516.40, 213615.00, 250.00, 250.00, 250.00, 'promedio_ponderado', 36.00, 20, 5, 'Gama Media', 2024),
(14, 'PH-014', 'Google', 'Pixel 8 Pro', '12 GB', '128 GB', 'Bay Blue', '50 MP Tensor G3', '6.7 OLED 120Hz', 769014.00, 581032.80, 680.00, 680.00, 680.00, 'promedio_ponderado', 32.35, 7, 2, 'Gama Alta', 2023);

-- INSERCIÓN DE VENTAS REALIZADAS (CON REFERENCIAS, IMPUESTOS Y COSTO)
INSERT INTO `ventas` (`id`, `codigo_venta`, `fecha`, `usuario_vendedor_id`, `telefono_id`, `cantidad`, `precio_unitario_bs`, `base_imponible_bs`, `iva_bs`, `igtf_bs`, `total_bs`, `total_usd`, `total_eur`, `costo_total_bs`, `tasa_cambio_usada`, `metodo_pago`, `referencia_pago`, `cliente_nombre`, `cliente_cedula`, `notas`) VALUES
(1, 'VEN-2026-001', '2026-09-01 10:15:00', 3, 1, 2, 1110798.00, 1915168.96, 306427.04, 0.00, 2221596.00, 2600.00, 2280.75, 1708920.00, 854.46, 'Zelle', 'ZLL-9018241', 'Alejandro Morales', 'V-19.458.112', 'Cliente corporativo'),
(2, 'VEN-2026-002', '2026-09-02 11:30:00', 4, 2, 1, 1025352.00, 857323.96, 137171.84, 30760.56, 1025352.00, 1200.00, 1052.65, 786103.20, 854.46, 'Efectivo Divisas (USD)', 'REC-EF-002', 'Patricia Torres', 'V-21.092.334', 'Pago exacto en efectivo con IGTF'),
(3, 'VEN-2026-003', '2026-09-03 14:45:00', 3, 3, 3, 555399.00, 1436376.72, 229820.28, 0.00, 1666197.00, 1950.00, 1710.56, 1230422.40, 854.46, 'Pago Móvil', 'PM-8812903', 'Tecnologías Barquisimeto C.A.', 'J-401928374', 'Garantía extendida'),
(4, 'VEN-2026-004', '2026-09-04 16:20:00', 5, 7, 4, 307605.60, 1060708.96, 169713.44, 0.00, 1230422.40, 1440.00, 1263.19, 888638.40, 854.46, 'Transferencia', 'TRF-5541098', 'Gabriel Rivas', 'V-23.778.001', NULL),
(5, 'VEN-2026-005', '2026-09-05 09:50:00', 6, 6, 2, 333239.40, 574550.68, 91928.12, 0.00, 666478.80, 780.00, 684.22, 495586.80, 854.46, 'Pago Móvil', 'PM-4491023', 'Sofia Castillo', 'V-25.102.993', NULL);

-- INSERCIÓN DE COMPRAS DE INVENTARIO (HISTORIAL DE ENTRADA Y COSTOS)
INSERT INTO `compras_inventario` (`id`, `codigo_compra`, `fecha`, `telefono_id`, `proveedor`, `numero_factura`, `cantidad`, `costo_unitario_usd`, `costo_unitario_bs`, `total_compra_usd`, `total_compra_bs`, `tasa_cambio_usada`, `metodo_costeo_aplicado`, `costo_anterior_usd`, `costo_nuevo_usd`, `precio_venta_anterior_bs`, `precio_venta_nuevo_bs`, `notas`) VALUES
(1, 'CMP-2026-0801', '2026-08-20 09:30:00', 1, 'Distribuidora Samsung Latinoamérica', 'FACT-SM-9021', 10, 1000.00, 854460.00, 10000.00, 8544600.00, 854.46, 'promedio_ponderado', 950.00, 1000.00, 1050000.00, 1110798.00, 'Lote importado inicial S24 Ultra'),
(2, 'CMP-2026-0802', '2026-08-25 11:00:00', 2, 'Apple Wholesale Miami Corp', 'FACT-AP-4401', 8, 920.00, 786103.20, 7360.00, 6288825.60, 854.46, 'promedio_ponderado', 900.00, 920.00, 990000.00, 1025352.00, 'Lote Titanium iPhone 15 Pro Max'),
(3, 'CMP-2026-0901', '2026-09-02 14:15:00', 3, 'Xiaomi Import Venezuela C.A.', 'FACT-XM-1120', 20, 480.00, 410140.80, 9600.00, 8202816.00, 854.46, 'promedio_ponderado', 450.00, 480.00, 520000.00, 555399.00, 'Reabastecimiento serie Leica');

-- INSERCIÓN DE GASTOS OPERATIVOS (EGRESOS EMPRESARIALES)
INSERT INTO `gastos_operativos` (`id`, `codigo_gasto`, `fecha`, `categoria`, `descripcion`, `monto_bs`, `monto_usd`, `tasa_cambio_usada`, `metodo_pago`, `referencia_comprobante`, `usuario_registro`) VALUES
(1, 'EXP-2026-001', '2026-09-01', 'Alquiler', 'Canon de arrendamiento local comercial piso 1', 341784.00, 400.00, 854.46, 'Transferencia', 'TRF-ALQ-0901', 'Carlos Mendoza'),
(2, 'EXP-2026-002', '2026-09-03', 'Luz / Electricidad', 'Factura mensual electricidad Corpoelec', 4272.30, 5.00, 854.46, 'Pago Móvil', 'PM-CORP-4412', 'Laura Rodríguez'),
(3, 'EXP-2026-003', '2026-09-04', 'Internet y Comunicaciones', 'Enlace dedicado fibra óptica empresarial NetUno', 34178.40, 40.00, 854.46, 'Transferencia', 'TRF-NET-8891', 'Carlos Mendoza'),
(4, 'EXP-2026-004', '2026-09-05', 'Agua', 'Servicio de agua potable y cisterna comercial', 8544.60, 10.00, 854.46, 'Pago Móvil', 'PM-AGUA-1234', 'Laura Rodríguez'),
(5, 'EXP-2026-005', '2026-09-08', 'Suministros de Oficina', 'Bolsas protectoras, facturación y papelería', 21361.50, 25.00, 854.46, 'Efectivo Divisas (USD)', 'REC-PAP-991', 'Laura Rodríguez');

-- INSERCIÓN DE PAGOS DE NÓMINA
INSERT INTO `pagos_nomina` (`id`, `vendedor_id`, `mes_periodo`, `total_ventas_unidades`, `total_ventas_bs`, `total_ventas_usd`, `sueldo_base_bs`, `porcentaje_comision`, `monto_comision_bs`, `monto_bono_bs`, `pago_final_bs`, `pago_final_usd`, `estado`, `fecha_pago`, `referencia_bancaria`) VALUES
(1, 3, '2026-09', 5, 3887793.00, 4550.00, 7300.00, 10.00, 388779.30, 1825.00, 397904.30, 465.68, 'Pendiente', NULL, NULL),
(2, 4, '2026-09', 1, 1025352.00, 1200.00, 7300.00, 10.00, 102535.20, 0.00, 109835.20, 128.54, 'Pendiente', NULL, NULL),
(3, 5, '2026-09', 4, 1230422.40, 1440.00, 7300.00, 10.00, 123042.24, 0.00, 130342.24, 152.54, 'Pagado', '2026-09-08', 'REF-BCV-992019'),
(4, 6, '2026-09', 2, 666478.80, 780.00, 7300.00, 10.00, 66647.88, 0.00, 73947.88, 86.54, 'Pagado', '2026-09-08', 'REF-BCV-992020');

-- INSERCIÓN DE TASAS DE CAMBIO
INSERT INTO `tasas_cambio` (`id`, `tasa_bcv_usd`, `tasa_bcv_eur`, `tasa_paralelo_usd`, `tasa_activa`, `ultima_actualizacion`) VALUES
(1, 854.46, 974.06, 954.16, 'bcvUSD', NOW());

-- INSERCIÓN DE ESTADÍSTICAS DE MERCADO
INSERT INTO `estadisticas_mercado` (`id`, `marca`, `modelo`, `porcentaje_mercado`, `volumen_ventas_estimado`, `precio_promedio_usd`, `tendencia`, `en_catalogo_tienda`) VALUES
(1, 'Samsung', 'Galaxy S24 Ultra', 24.50, 1450, 1300.00, 'up', 1),
(2, 'Apple', 'iPhone 15 Pro Max', 22.10, 1310, 1200.00, 'up', 1),
(3, 'Xiaomi', 'Redmi Note 13 Series', 20.40, 1200, 360.00, 'stable', 1),
(4, 'Motorola', 'Edge 50 / G Series', 16.20, 960, 450.00, 'up', 1),
(5, 'Google', 'Pixel 8 Pro', 10.30, 610, 999.00, 'down', 1),
(6, 'Infinix / Tecno', 'Gamer & Budget Series', 6.50, 380, 180.00, 'stable', 1);

-- INSERCIÓN DE LOGS DE AUDITORÍA
INSERT INTO `auditoria` (`id`, `fecha`, `usuario`, `rol`, `accion`, `detalles`) VALUES
(1, NOW(), 'Carlos Mendoza', 'super_user', 'Inicio de Sistema', 'Base de datos MySQL inicializada con módulos contables, costeo de inventario y egresos.'),
(2, NOW(), 'Laura Rodríguez', 'admin', 'Carga de Inventario y Costos', 'Catálogo cargado con 14 modelos, costos unitarios y métodos de valoración.'),
(3, NOW(), 'Carlos Mendoza', 'super_user', 'Registro de Gastos Operativos', 'Registrados 5 egresos iniciales de operatividad (alquiler, luz, agua, internet).');

