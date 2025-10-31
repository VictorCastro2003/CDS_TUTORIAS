// src/models/Canalizacion.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Canalizacion = sequelize.define('Canalizacion', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  alumno_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  tutor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  area_destino: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  motivo: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'atendida', 'en seguimiento'),
    defaultValue: 'pendiente',
  },
  fecha_atencion: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'canalizaciones',
  timestamps: false,
});

export default Canalizacion;