/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.20-13.0.2-MariaDB, for Linux (x86_64)
--
-- Host: localhost    Database: techinventario_db
-- ------------------------------------------------------
-- Server version	13.0.2-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `auditoria`
--

DROP TABLE IF EXISTS `auditoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `auditoria` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fecha` datetime NOT NULL,
  `usuario` varchar(100) NOT NULL,
  `rol` varchar(50) NOT NULL,
  `accion` varchar(100) NOT NULL,
  `detalles` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auditoria`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `auditoria` WRITE;
/*!40000 ALTER TABLE `auditoria` DISABLE KEYS */;
INSERT INTO `auditoria` VALUES
(1,'2026-10-07 16:52:14','Carlos Mendoza','super_user','Inicio de Sistema','Base de datos MySQL inicializada con módulos contables, costeo de inventario y egresos.'),
(2,'2026-10-07 16:52:14','Laura Rodríguez','admin','Carga de Inventario y Costos','Catálogo cargado con 14 modelos, costos unitarios y métodos de valoración.'),
(3,'2026-10-07 16:52:14','Carlos Mendoza','super_user','Registro de Gastos Operativos','Registrados 5 egresos iniciales de operatividad (alquiler, luz, agua, internet).'),
(4,'2026-10-07 17:15:42','Administrador','admin','Recepción de Mercancía y Costeo','Entrada de mercancía / Compra (CMP-2026-728): 5x \"Motorola Edge 50 Pro\" a $420 USD c/u (Total: $2100 USD / Bs. 1.794.366). Proveedor: Motorola Direct Caracas (Fact: FACT-MOT-7701). Método: promedio_ponderado. Costo resultante: $412.17 USD (Bs. 352.182,78) | Precio de venta: Bs. 469.953. Stock: 18 ➔ 23 unids.'),
(5,'2026-10-07 17:15:53','Administrador','admin','Registro de Gasto Operativo','Registro de gasto operativo (EXP-2026-594): Luz / Electricidad - \"Recibo Corpoelec local comercial\". Monto: Bs. 29.906,1 ($35.00 USD). Pagado vía Pago Móvil (Ref: REF-781923).'),
(6,'2026-10-07 17:15:59','Carlos Mendoza','super_user','Venta y Salida de Stock','Venta confirmada y salida de stock: Se vendieron 1 unidades de \"Motorola Edge 50 Pro\" (Cód: PH-004) al cliente Test Client (C.I./RIF: V-12345678) por Bs. 469.953 ($550 USD) vía Pago Móvil | Ref: PM-901824. Stock previo: 23 unids ➔ Stock resultante disponible: 22 unids. Transacción: VEN-2026-275.'),
(7,'2026-10-07 17:25:21','Carlos Mendoza','super_user','Cierre de Sesión','El usuario Carlos Mendoza ha cerrado su sesión en el sistema'),
(8,'2026-10-07 17:25:23','Carlos Mendoza','super_user','Inicio de Sesión Exitoso','El usuario Carlos Mendoza (jefe@empresa.com) ha iniciado sesión con rol de super_user');
/*!40000 ALTER TABLE `auditoria` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `compras_inventario`
--

DROP TABLE IF EXISTS `compras_inventario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `compras_inventario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo_compra` varchar(30) NOT NULL,
  `fecha` datetime NOT NULL,
  `telefono_id` int(11) NOT NULL,
  `proveedor` varchar(100) NOT NULL,
  `numero_factura` varchar(50) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `costo_unitario_usd` decimal(10,2) NOT NULL,
  `costo_unitario_bs` decimal(12,2) NOT NULL,
  `total_compra_usd` decimal(12,2) NOT NULL,
  `total_compra_bs` decimal(14,2) NOT NULL,
  `tasa_cambio_usada` decimal(10,2) NOT NULL,
  `metodo_costeo_aplicado` enum('ultimo_costo','promedio_ponderado','manual') NOT NULL DEFAULT 'promedio_ponderado',
  `costo_anterior_usd` decimal(10,2) NOT NULL,
  `costo_nuevo_usd` decimal(10,2) NOT NULL,
  `precio_venta_anterior_bs` decimal(12,2) NOT NULL,
  `precio_venta_nuevo_bs` decimal(12,2) NOT NULL,
  `notas` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo_compra` (`codigo_compra`),
  KEY `fk_compras_telefono` (`telefono_id`),
  CONSTRAINT `fk_compras_telefono` FOREIGN KEY (`telefono_id`) REFERENCES `telefonos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `compras_inventario`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `compras_inventario` WRITE;
/*!40000 ALTER TABLE `compras_inventario` DISABLE KEYS */;
INSERT INTO `compras_inventario` VALUES
(1,'CMP-2026-0801','2026-08-20 09:30:00',1,'Distribuidora Samsung Latinoamérica','FACT-SM-9021',10,1000.00,854460.00,10000.00,8544600.00,854.46,'promedio_ponderado',950.00,1000.00,1050000.00,1110798.00,'Lote importado inicial S24 Ultra'),
(2,'CMP-2026-0802','2026-08-25 11:00:00',2,'Apple Wholesale Miami Corp','FACT-AP-4401',8,920.00,786103.20,7360.00,6288825.60,854.46,'promedio_ponderado',900.00,920.00,990000.00,1025352.00,'Lote Titanium iPhone 15 Pro Max'),
(3,'CMP-2026-0901','2026-09-02 14:15:00',3,'Xiaomi Import Venezuela C.A.','FACT-XM-1120',20,480.00,410140.80,9600.00,8202816.00,854.46,'promedio_ponderado',450.00,480.00,520000.00,555399.00,'Reabastecimiento serie Leica'),
(4,'CMP-2026-728','2026-10-07 17:15:42',4,'Motorola Direct Caracas','FACT-MOT-7701',5,420.00,358873.20,2100.00,1794366.00,854.46,'promedio_ponderado',410.00,412.17,469953.00,469953.00,'Prueba de lote de reposición');
/*!40000 ALTER TABLE `compras_inventario` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `estadisticas_mercado`
--

DROP TABLE IF EXISTS `estadisticas_mercado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `estadisticas_mercado` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `marca` varchar(50) NOT NULL,
  `modelo` varchar(100) NOT NULL,
  `porcentaje_mercado` decimal(5,2) NOT NULL,
  `volumen_ventas_estimado` int(11) NOT NULL,
  `precio_promedio_usd` decimal(10,2) NOT NULL,
  `tendencia` enum('up','down','stable') DEFAULT 'stable',
  `en_catalogo_tienda` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estadisticas_mercado`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `estadisticas_mercado` WRITE;
/*!40000 ALTER TABLE `estadisticas_mercado` DISABLE KEYS */;
INSERT INTO `estadisticas_mercado` VALUES
(1,'Samsung','Galaxy S24 Ultra',24.50,1450,1300.00,'up',1),
(2,'Apple','iPhone 15 Pro Max',22.10,1310,1200.00,'up',1),
(3,'Xiaomi','Redmi Note 13 Series',20.40,1200,360.00,'stable',1),
(4,'Motorola','Edge 50 / G Series',16.20,960,450.00,'up',1),
(5,'Google','Pixel 8 Pro',10.30,610,999.00,'down',1),
(6,'Infinix / Tecno','Gamer & Budget Series',6.50,380,180.00,'stable',1);
/*!40000 ALTER TABLE `estadisticas_mercado` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `gastos_operativos`
--

DROP TABLE IF EXISTS `gastos_operativos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `gastos_operativos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo_gasto` varchar(30) NOT NULL,
  `fecha` date NOT NULL,
  `categoria` varchar(50) NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `monto_bs` decimal(12,2) NOT NULL,
  `monto_usd` decimal(10,2) NOT NULL,
  `tasa_cambio_usada` decimal(10,2) NOT NULL,
  `metodo_pago` varchar(50) NOT NULL,
  `referencia_comprobante` varchar(100) DEFAULT NULL,
  `usuario_registro` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo_gasto` (`codigo_gasto`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gastos_operativos`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `gastos_operativos` WRITE;
/*!40000 ALTER TABLE `gastos_operativos` DISABLE KEYS */;
INSERT INTO `gastos_operativos` VALUES
(1,'EXP-2026-001','2026-09-01','Alquiler','Canon de arrendamiento local comercial piso 1',341784.00,400.00,854.46,'Transferencia','TRF-ALQ-0901','Carlos Mendoza'),
(2,'EXP-2026-002','2026-09-03','Luz / Electricidad','Factura mensual electricidad Corpoelec',4272.30,5.00,854.46,'Pago Móvil','PM-CORP-4412','Laura Rodríguez'),
(3,'EXP-2026-003','2026-09-04','Internet y Comunicaciones','Enlace dedicado fibra óptica empresarial NetUno',34178.40,40.00,854.46,'Transferencia','TRF-NET-8891','Carlos Mendoza'),
(4,'EXP-2026-004','2026-09-05','Agua','Servicio de agua potable y cisterna comercial',8544.60,10.00,854.46,'Pago Móvil','PM-AGUA-1234','Laura Rodríguez'),
(5,'EXP-2026-005','2026-09-08','Suministros de Oficina','Bolsas protectoras, facturación y papelería',21361.50,25.00,854.46,'Efectivo Divisas (USD)','REC-PAP-991','Laura Rodríguez'),
(6,'EXP-2026-594','2026-10-07','Luz / Electricidad','Recibo Corpoelec local comercial',29906.10,35.00,854.46,'Pago Móvil','REF-781923','Administrador');
/*!40000 ALTER TABLE `gastos_operativos` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `pagos_nomina`
--

DROP TABLE IF EXISTS `pagos_nomina`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `pagos_nomina` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vendedor_id` int(11) NOT NULL,
  `mes_periodo` varchar(10) NOT NULL,
  `total_ventas_unidades` int(11) NOT NULL DEFAULT 0,
  `total_ventas_bs` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_ventas_usd` decimal(10,2) NOT NULL DEFAULT 0.00,
  `sueldo_base_bs` decimal(12,2) NOT NULL DEFAULT 7300.00,
  `porcentaje_comision` decimal(5,2) DEFAULT 10.00,
  `monto_comision_bs` decimal(12,2) NOT NULL DEFAULT 0.00,
  `monto_bono_bs` decimal(12,2) DEFAULT 0.00,
  `pago_final_bs` decimal(12,2) NOT NULL DEFAULT 0.00,
  `pago_final_usd` decimal(10,2) NOT NULL DEFAULT 0.00,
  `estado` enum('Pendiente','Pagado','En Revisión') DEFAULT 'Pendiente',
  `fecha_pago` date DEFAULT NULL,
  `referencia_bancaria` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_nomina_vendedor` (`vendedor_id`),
  CONSTRAINT `fk_nomina_vendedor` FOREIGN KEY (`vendedor_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pagos_nomina`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `pagos_nomina` WRITE;
/*!40000 ALTER TABLE `pagos_nomina` DISABLE KEYS */;
INSERT INTO `pagos_nomina` VALUES
(1,3,'2026-09',5,3887793.00,4550.00,7300.00,10.00,388779.30,1825.00,397904.30,465.68,'Pendiente',NULL,NULL),
(2,4,'2026-09',1,1025352.00,1200.00,7300.00,10.00,102535.20,0.00,109835.20,128.54,'Pendiente',NULL,NULL),
(3,5,'2026-09',4,1230422.40,1440.00,7300.00,10.00,123042.24,0.00,130342.24,152.54,'Pagado','2026-09-08','REF-BCV-992019'),
(4,6,'2026-09',2,666478.80,780.00,7300.00,10.00,66647.88,0.00,73947.88,86.54,'Pagado','2026-09-08','REF-BCV-992020');
/*!40000 ALTER TABLE `pagos_nomina` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `solicitudes_aprobacion`
--

DROP TABLE IF EXISTS `solicitudes_aprobacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitudes_aprobacion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(30) NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `solicitante_nombre` varchar(100) NOT NULL,
  `solicitante_rol` varchar(50) NOT NULL,
  `equipo_id` varchar(50) DEFAULT NULL,
  `equipo_nombre` varchar(150) NOT NULL,
  `descripcion` text NOT NULL,
  `datos_solicitud` longtext NOT NULL,
  `estado` enum('pendiente','aprobada','rechazada') DEFAULT 'pendiente',
  `revisado_por` varchar(100) DEFAULT NULL,
  `fecha_solicitud` datetime NOT NULL,
  `fecha_resolucion` datetime DEFAULT NULL,
  `motivo_rechazo` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitudes_aprobacion`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `solicitudes_aprobacion` WRITE;
/*!40000 ALTER TABLE `solicitudes_aprobacion` DISABLE KEYS */;
INSERT INTO `solicitudes_aprobacion` VALUES
(1,'SOL-2026-101','CAMBIO_PRECIO','Carlos Mendoza','vendedor','1','Samsung Galaxy S24 Ultra 5G','Solicitud de descuento comercial por volumen: Ajustar precio unitario de venta de Bs. 1.110.798 a Bs. 1.050.000.','{\"phoneId\":\"ph-1\",\"newPriceBs\":1050000}','pendiente',NULL,'2026-10-29 11:32:20',NULL,NULL),
(2,'SOL-2026-102','SALIDA_STOCK','Laura Rodríguez','vendedor','4','Motorola Edge 50 Pro','Baja de 1 unidad de inventario por avería y rotura de cristal en exhibición.','{\"phoneId\":\"ph-4\",\"quantity\":1,\"reason\":\"Daño en exhibición\"}','pendiente',NULL,'2026-10-29 11:32:20',NULL,NULL);
/*!40000 ALTER TABLE `solicitudes_aprobacion` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `tasas_cambio`
--

DROP TABLE IF EXISTS `tasas_cambio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasas_cambio` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tasa_bcv_usd` decimal(10,2) NOT NULL DEFAULT 854.46,
  `tasa_bcv_eur` decimal(10,2) NOT NULL DEFAULT 974.06,
  `tasa_paralelo_usd` decimal(10,2) NOT NULL DEFAULT 954.16,
  `tasa_activa` enum('bcvUSD','bcvEUR','paraleloUSD') DEFAULT 'bcvUSD',
  `ultima_actualizacion` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tasas_cambio`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `tasas_cambio` WRITE;
/*!40000 ALTER TABLE `tasas_cambio` DISABLE KEYS */;
INSERT INTO `tasas_cambio` VALUES
(1,854.46,974.06,954.16,'bcvUSD','2026-10-07 16:52:14');
/*!40000 ALTER TABLE `tasas_cambio` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `telefonos`
--

DROP TABLE IF EXISTS `telefonos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `telefonos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo_ph` varchar(20) NOT NULL,
  `marca` varchar(50) NOT NULL,
  `modelo` varchar(100) NOT NULL,
  `ram` varchar(20) NOT NULL,
  `almacenamiento` varchar(20) NOT NULL,
  `color` varchar(30) NOT NULL,
  `camara` varchar(50) NOT NULL,
  `pantalla` varchar(50) NOT NULL,
  `precio_bs` decimal(12,2) NOT NULL,
  `costo_bs` decimal(12,2) NOT NULL DEFAULT 0.00,
  `costo_usd` decimal(10,2) NOT NULL DEFAULT 0.00,
  `ultimo_costo_usd` decimal(10,2) NOT NULL DEFAULT 0.00,
  `costo_promedio_usd` decimal(10,2) NOT NULL DEFAULT 0.00,
  `metodo_costeo` enum('ultimo_costo','promedio_ponderado','manual') NOT NULL DEFAULT 'promedio_ponderado',
  `margen_ganancia` decimal(5,2) NOT NULL DEFAULT 30.00,
  `stock` int(11) NOT NULL DEFAULT 0,
  `stock_minimo` int(11) NOT NULL DEFAULT 3,
  `gama` enum('Gama Alta','Gama Media','Gama Entrada') NOT NULL DEFAULT 'Gama Media',
  `ano_lanzamiento` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo_ph` (`codigo_ph`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `telefonos`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `telefonos` WRITE;
/*!40000 ALTER TABLE `telefonos` DISABLE KEYS */;
INSERT INTO `telefonos` VALUES
(1,'PH-001','Samsung','Galaxy S24 Ultra 5G','12 GB','512 GB','Titanium Gray','200 MP + 50 MP','6.8 AMOLED 120Hz',1110798.00,854460.00,1000.00,1000.00,1000.00,'promedio_ponderado',30.00,14,4,'Gama Alta',2024),
(2,'PH-002','Apple','iPhone 15 Pro Max','8 GB','256 GB','Natural Titanium','48 MP Tele 5x','6.7 OLED 120Hz',1025352.00,786103.20,920.00,920.00,920.00,'promedio_ponderado',30.43,8,3,'Gama Alta',2023),
(3,'PH-003','Xiaomi','13T Pro Leica','12 GB','512 GB','Alpine Blue','50 MP Leica','6.67 AMOLED 144Hz',555399.00,410140.80,480.00,480.00,480.00,'promedio_ponderado',35.42,22,5,'Gama Alta',2023),
(4,'PH-004','Motorola','Edge 50 Pro','12 GB','256 GB','Black Vegan Leather','50 MP OIS','6.7 pOLED 144Hz',469953.00,352182.78,412.17,420.00,412.17,'promedio_ponderado',33.44,22,5,'Gama Media',2024),
(5,'PH-005','Xiaomi','Poco F6 Pro','12 GB','256 GB','Moonlight White','50 MP Light Hunter','6.67 WQHD+ 120Hz',410140.80,299061.00,350.00,350.00,350.00,'promedio_ponderado',37.14,28,6,'Gama Media',2024),
(6,'PH-006','Samsung','Galaxy A55 5G','8 GB','256 GB','Awesome Iceblue','50 MP OIS','6.6 Super AMOLED',333239.40,247793.40,290.00,290.00,290.00,'promedio_ponderado',34.48,35,8,'Gama Media',2024),
(7,'PH-007','Xiaomi','Redmi Note 13 Pro+ 5G','8 GB','256 GB','Aurora Purple','200 MP OIS','6.67 AMOLED 120Hz',307605.60,222159.60,260.00,260.00,260.00,'promedio_ponderado',38.46,40,10,'Gama Media',2024),
(8,'PH-008','Realme','12 Pro+ 5G','12 GB','256 GB','Submarine Blue','64 MP Periscope','6.7 Curved 120Hz',358873.20,264882.60,310.00,310.00,310.00,'promedio_ponderado',35.48,12,4,'Gama Media',2024),
(9,'PH-009','Apple','iPhone 14 Pro','6 GB','256 GB','Deep Purple','48 MP','6.1 OLED 120Hz',854460.00,649389.60,760.00,760.00,760.00,'promedio_ponderado',31.58,6,2,'Gama Alta',2022),
(10,'PH-010','Samsung','Galaxy S23 FE','8 GB','128 GB','Menta','50 MP OIS','6.4 Dynamic AMOLED',427230.00,316150.20,370.00,370.00,370.00,'promedio_ponderado',35.14,15,4,'Gama Media',2023),
(11,'PH-011','Honor','Magic 6 Lite','8 GB','256 GB','Emerald Green','108 MP Ultra','6.78 AMOLED',273427.20,196525.80,230.00,230.00,230.00,'promedio_ponderado',39.13,25,5,'Gama Entrada',2024),
(12,'PH-012','Infinix','Zero 30 5G','12 GB','256 GB','Rome Green','108 MP + 50 MP Selfie','6.78 AMOLED 144Hz',239248.80,170892.00,200.00,200.00,200.00,'promedio_ponderado',40.00,30,6,'Gama Entrada',2023),
(13,'PH-013','Tecno','Camon 30 Pro 5G','12 GB','512 GB','Basalt Black','50 MP Sony IMX890','6.78 AMOLED 144Hz',290516.40,213615.00,250.00,250.00,250.00,'promedio_ponderado',36.00,20,5,'Gama Media',2024),
(14,'PH-014','Google','Pixel 8 Pro','12 GB','128 GB','Bay Blue','50 MP Tensor G3','6.7 OLED 120Hz',769014.00,581032.80,680.00,680.00,680.00,'promedio_ponderado',32.35,7,2,'Gama Alta',2023);
/*!40000 ALTER TABLE `telefonos` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo_usr` varchar(20) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `cedula` varchar(20) NOT NULL,
  `telefono` varchar(30) DEFAULT NULL,
  `rol` enum('super_user','admin','vendedor') NOT NULL DEFAULT 'vendedor',
  `meta_mensual_bs` decimal(12,2) DEFAULT 0.00,
  `fecha_ingreso` date NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo_usr` (`codigo_usr`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES
(1,'USR-001','Carlos Mendoza','jefe@empresa.com','V-14.582.901','0414-1234567','super_user',0.00,'2023-01-15'),
(2,'USR-002','Laura Rodríguez','admin@empresa.com','V-18.341.209','0412-9876543','admin',0.00,'2023-03-10'),
(3,'USR-003','María González','maria.gonzalez@empresa.com','V-22.109.876','0424-5551234','vendedor',250000.00,'2024-02-01'),
(4,'USR-004','Juan Pérez','juan.perez@empresa.com','V-24.901.234','0416-3338899','vendedor',200000.00,'2024-05-15'),
(5,'USR-005','Pedro Rodríguez','pedro.rodriguez@empresa.com','V-25.432.109','0414-7774411','vendedor',180000.00,'2024-06-01'),
(6,'USR-006','Ana López','ana.lopez@empresa.com','V-26.118.990','0412-2226655','vendedor',180000.00,'2025-01-10'),
(7,'USR-007','Roberto Benítez','roberto.benitez@empresa.com','V-27.441.009','0424-8889911','vendedor',190000.00,'2025-03-01'),
(8,'USR-008','Sofia Castillo','sofia.castillo@empresa.com','V-28.001.342','0414-5552233','vendedor',175000.00,'2025-04-12');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `ventas`
--

DROP TABLE IF EXISTS `ventas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ventas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo_venta` varchar(30) NOT NULL,
  `fecha` datetime NOT NULL,
  `usuario_vendedor_id` int(11) NOT NULL,
  `telefono_id` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL DEFAULT 1,
  `precio_unitario_bs` decimal(12,2) NOT NULL,
  `base_imponible_bs` decimal(12,2) NOT NULL DEFAULT 0.00,
  `iva_bs` decimal(12,2) NOT NULL DEFAULT 0.00,
  `igtf_bs` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_bs` decimal(12,2) NOT NULL,
  `total_usd` decimal(10,2) NOT NULL,
  `total_eur` decimal(10,2) NOT NULL,
  `costo_total_bs` decimal(12,2) NOT NULL DEFAULT 0.00,
  `tasa_cambio_usada` decimal(10,2) NOT NULL,
  `metodo_pago` varchar(50) NOT NULL,
  `referencia_pago` varchar(50) DEFAULT NULL,
  `cliente_nombre` varchar(100) NOT NULL,
  `cliente_cedula` varchar(20) NOT NULL,
  `notas` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo_venta` (`codigo_venta`),
  KEY `fk_ventas_usuario` (`usuario_vendedor_id`),
  KEY `fk_ventas_telefono` (`telefono_id`),
  CONSTRAINT `fk_ventas_telefono` FOREIGN KEY (`telefono_id`) REFERENCES `telefonos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ventas_usuario` FOREIGN KEY (`usuario_vendedor_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ventas`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `ventas` WRITE;
/*!40000 ALTER TABLE `ventas` DISABLE KEYS */;
INSERT INTO `ventas` VALUES
(1,'VEN-2026-001','2026-09-01 10:15:00',3,1,2,1110798.00,1915168.96,306427.04,0.00,2221596.00,2600.00,2280.75,1708920.00,854.46,'Zelle','ZLL-9018241','Alejandro Morales','V-19.458.112','Cliente corporativo'),
(2,'VEN-2026-002','2026-09-02 11:30:00',4,2,1,1025352.00,857323.96,137171.84,30760.56,1025352.00,1200.00,1052.65,786103.20,854.46,'Efectivo Divisas (USD)','REC-EF-002','Patricia Torres','V-21.092.334','Pago exacto en efectivo con IGTF'),
(3,'VEN-2026-003','2026-09-03 14:45:00',3,3,3,555399.00,1436376.72,229820.28,0.00,1666197.00,1950.00,1710.56,1230422.40,854.46,'Pago Móvil','PM-8812903','Tecnologías Barquisimeto C.A.','J-401928374','Garantía extendida'),
(4,'VEN-2026-004','2026-09-04 16:20:00',5,7,4,307605.60,1060708.96,169713.44,0.00,1230422.40,1440.00,1263.19,888638.40,854.46,'Transferencia','TRF-5541098','Gabriel Rivas','V-23.778.001',NULL),
(5,'VEN-2026-005','2026-09-05 09:50:00',6,6,2,333239.40,574550.68,91928.12,0.00,666478.80,780.00,684.22,495586.80,854.46,'Pago Móvil','PM-4491023','Sofia Castillo','V-25.102.993',NULL),
(6,'VEN-2026-275','2026-10-07 17:15:59',1,4,1,469953.00,405131.90,64821.10,0.00,469953.00,550.00,482.47,352182.78,854.46,'Pago Móvil','PM-901824','Test Client','V-12345678',NULL);
/*!40000 ALTER TABLE `ventas` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-10-29 11:32:41
