-- Migration: Add 'etiqueta' column to signature and template field tables for Smart Tags support

-- 1. Add 'etiqueta' to tm_flujo_paso_firma
ALTER TABLE tm_flujo_paso_firma
ADD COLUMN etiqueta VARCHAR(100) NULL COMMENT 'Nombre del campo de formulario PDF para ubicar la firma dinámicamente' AFTER coord_y;

-- 2. Add 'etiqueta' to tm_campo_plantilla
ALTER TABLE tm_campo_plantilla
ADD COLUMN etiqueta VARCHAR(100) NULL COMMENT 'Nombre del campo de formulario PDF para ubicar el dato dinámicamente' AFTER coord_y;