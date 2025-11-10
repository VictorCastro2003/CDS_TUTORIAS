import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Asistencia = sequelize.define('Asistencia', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  alumno_id: { type: DataTypes.BIGINT, allowNull: false },
  fecha: { type: DataTypes.DATEONLY, allowNull: false },
  presente: { type: DataTypes.BOOLEAN, defaultValue: true },
  justificada: { type: DataTypes.BOOLEAN, defaultValue: false },
  observaciones: { type: DataTypes.TEXT },
  registrada_por: { type: DataTypes.BIGINT, allowNull: false }
}, {
  tableName: 'asistencias',
  timestamps: false
});

export default Asistencia;