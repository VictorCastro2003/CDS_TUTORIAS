// src/models/canalizacion.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Canalizacion = sequelize.define('Canalizacion', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  alumno_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  tutor_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  // TIPO DE CANALIZACIÓN
  tipo_canalizacion: {
    type: DataTypes.ENUM('psicologica', 'academica', 'medica', 'otra'),
    allowNull: false,
    defaultValue: 'academica',
    comment: 'Tipo de canalización'
  },

  // ⭐ NUEVOS CAMPOS
  tipo_atencion: {
    type: DataTypes.ENUM('personal', 'tutor', 'docente'),
    allowNull: false,
    defaultValue: 'personal',
    comment: 'Cómo llegó el alumno al servicio'
  },
  nota_derivacion: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descripción de cómo llegó el alumno'
  },

  // CAMPOS GENERALES
  area_destino: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Área a la que se canaliza'
  },
  motivo: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Motivo general de la canalización'
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Observaciones generales'
  },
  // CAMPOS ESPECÍFICOS PARA REPORTE PSICOLÓGICO
  problematica_identificada: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Problemática identificada (para reporte psicológico)'
  },
  servicio_solicitado: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Servicio solicitado (para reporte psicológico)'
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },

  // WORKFLOW - Estado general
  estado: {
    type: DataTypes.ENUM('pendiente', 'en_revision', 'atendida', 'cerrada'),
    defaultValue: 'pendiente',
  },

  // WORKFLOW - Estados específicos del flujo
  workflow_estado: {
    type: DataTypes.ENUM(
      'creada',                    // Tutor crea la canalización
      'enviada_jefe_division',     // Enviada a jefe de división (académica)
      'enviada_coordinacion',      // Enviada a coordinación (psicológica)
      'asignada_docente',          // Asignada a docente asesor (académica)
      'en_atencion',               // En atención por docente/psicólogo
      'contrarreferencia_generada', // Contrarreferencia generada
      'finalizada'                 // Proceso completado
    ),
    defaultValue: 'creada',
    comment: 'Estado actual en el flujo de trabajo'
  },

  // CAMPOS PARA CANALIZACIÓN ACADÉMICA
  jefe_division_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'ID del jefe de división que recibe la canalización académica'
  },
  fecha_envio_jefe: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha en que se envió a jefe de división'
  },
  docente_asesor_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'ID del docente asignado para asesoría académica'
  },
  fecha_asignacion_docente: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha en que se asignó al docente'
  },

  // CAMPOS PARA CANALIZACIÓN PSICOLÓGICA
  coordinacion_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'ID del encargado de tutorías/coordinación'
  },
  fecha_envio_coordinacion: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha en que se envió a coordinación'
  },
  psicologo_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'ID del psicólogo que atiende'
  },
  fecha_inicio_atencion: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de inicio de atención psicológica'
  },

  // CONTRARREFERENCIA
  contrarreferencia: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Contenido de la contrarreferencia generada por el asesor/psicólogo'
  },
  fecha_contrarreferencia: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha en que se generó la contrarreferencia'
  },
  generada_por: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'ID de quien generó la contrarreferencia'
  },

  // CAMPOS EXISTENTES (mantenidos para compatibilidad)
  fecha_atencion: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  revisada_por: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'ID del coordinador que revisó'
  },
  fecha_revision: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  notas_revision: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notas del coordinador'
  },
  origen_alerta: {
    type: DataTypes.ENUM('manual', 'faltas', 'reprobadas', 'docente'),
    defaultValue: 'manual',
    comment: 'Origen de la canalización'
  },
  dias_falta: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Número de días de falta consecutivos'
  },
  materias_reprobadas: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Cantidad de materias reprobadas'
  }
}, {
  tableName: 'canalizaciones',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Canalizacion;