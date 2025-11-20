-- Migración para agregar campos de workflow a canalizaciones y crear tabla de notificaciones
-- Fecha: 2025-11-19

-- ============================================
-- AGREGAR CAMPOS DE WORKFLOW A CANALIZACIONES
-- ============================================

ALTER TABLE canalizaciones 
ADD COLUMN IF NOT EXISTS workflow_estado ENUM(
  'creada',
  'enviada_jefe_division',
  'enviada_coordinacion',
  'asignada_docente',
  'en_atencion',
  'contrarreferencia_generada',
  'finalizada'
) DEFAULT 'creada' COMMENT 'Estado actual en el flujo de trabajo';

-- Campos para canalización académica
ALTER TABLE canalizaciones 
ADD COLUMN IF NOT EXISTS jefe_division_id BIGINT NULL COMMENT 'ID del jefe de división que recibe la canalización académica',
ADD COLUMN IF NOT EXISTS fecha_envio_jefe DATETIME NULL COMMENT 'Fecha en que se envió a jefe de división',
ADD COLUMN IF NOT EXISTS docente_asesor_id BIGINT NULL COMMENT 'ID del docente asignado para asesoría académica',
ADD COLUMN IF NOT EXISTS fecha_asignacion_docente DATETIME NULL COMMENT 'Fecha en que se asignó al docente';

-- Campos para canalización psicológica
ALTER TABLE canalizaciones 
ADD COLUMN IF NOT EXISTS coordinacion_id BIGINT NULL COMMENT 'ID del encargado de tutorías/coordinación',
ADD COLUMN IF NOT EXISTS fecha_envio_coordinacion DATETIME NULL COMMENT 'Fecha en que se envió a coordinación',
ADD COLUMN IF NOT EXISTS psicologo_id BIGINT NULL COMMENT 'ID del psicólogo que atiende',
ADD COLUMN IF NOT EXISTS fecha_inicio_atencion DATETIME NULL COMMENT 'Fecha de inicio de atención psicológica';

-- Campos de contrarreferencia
ALTER TABLE canalizaciones 
ADD COLUMN IF NOT EXISTS contrarreferencia TEXT NULL COMMENT 'Contenido de la contrarreferencia generada por el asesor/psicólogo',
ADD COLUMN IF NOT EXISTS fecha_contrarreferencia DATETIME NULL COMMENT 'Fecha en que se generó la contrarreferencia',
ADD COLUMN IF NOT EXISTS generada_por BIGINT NULL COMMENT 'ID de quien generó la contrarreferencia';

-- ============================================
-- CREAR TABLA DE NOTIFICACIONES
-- ============================================

CREATE TABLE IF NOT EXISTS notificaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id BIGINT NOT NULL COMMENT 'ID del usuario que recibe la notificación',
  canalizacion_id INT NULL COMMENT 'ID de la canalización relacionada',
  tipo ENUM(
    'nueva_canalizacion',
    'canalizacion_asignada',
    'contrarreferencia_recibida',
    'canalizacion_finalizada',
    'recordatorio'
  ) NOT NULL COMMENT 'Tipo de notificación',
  titulo VARCHAR(255) NOT NULL COMMENT 'Título de la notificación',
  mensaje TEXT NOT NULL COMMENT 'Mensaje de la notificación',
  leida BOOLEAN DEFAULT FALSE COMMENT 'Si la notificación ha sido leída',
  fecha_lectura DATETIME NULL COMMENT 'Fecha en que se leyó la notificación',
  prioridad ENUM('baja', 'media', 'alta') DEFAULT 'media' COMMENT 'Prioridad de la notificación',
  url VARCHAR(500) NULL COMMENT 'URL a la que redirige la notificación',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_usuario_id (usuario_id),
  INDEX idx_canalizacion_id (canalizacion_id),
  INDEX idx_leida (leida),
  INDEX idx_created_at (created_at),
  
  FOREIGN KEY (canalizacion_id) REFERENCES canalizaciones(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ACTUALIZAR CANALIZACIONES EXISTENTES
-- ============================================

-- Establecer workflow_estado para canalizaciones existentes basado en su estado actual
UPDATE canalizaciones 
SET workflow_estado = CASE 
  WHEN estado = 'cerrada' THEN 'finalizada'
  WHEN estado = 'atendida' THEN 'contrarreferencia_generada'
  WHEN estado = 'en_revision' THEN 'enviada_jefe_division'
  ELSE 'creada'
END
WHERE workflow_estado IS NULL;

-- ============================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ============================================

-- Este script agrega soporte completo para el workflow de canalizaciones
-- Flujo Académico: Tutor -> Jefe División -> Docente Asesor -> Contrarreferencia -> Finalizado
-- Flujo Psicológico: Tutor -> Coordinación -> Atención -> Contrarreferencia -> Finalizado
