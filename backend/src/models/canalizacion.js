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
    comment: 'Tipo de canalización: psicológica requiere reporte especial'
  },
  // CAMPOS GENERALES (para ambos tipos)
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
  estado: {
    type: DataTypes.ENUM('pendiente', 'en_revision', 'atendida', 'cerrada'),
    defaultValue: 'pendiente',
  },
  fecha_atencion: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // Campos de revisión (Vo.Bo. del coordinador)
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
  // Para alertas automáticas
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