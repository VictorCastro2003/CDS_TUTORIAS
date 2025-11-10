import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Alerta = sequelize.define('Alerta', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  alumno_id: { type: DataTypes.BIGINT, allowNull: false },
  tipo_alerta: { 
    type: DataTypes.ENUM('faltas_consecutivas', 'materias_reprobadas', 'riesgo_vital', 'otro'),
    allowNull: false 
  },
  descripcion: { type: DataTypes.TEXT },
  generada_por: { type: DataTypes.BIGINT, allowNull: false },
  fecha_alerta: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  estado: { 
    type: DataTypes.ENUM('activa', 'atendida', 'cerrada'),
    defaultValue: 'activa'
  },
  dias_faltas: { type: DataTypes.INTEGER, defaultValue: 0 },
  materias_reprobadas: { type: DataTypes.INTEGER, defaultValue: 0 }
}, {
  tableName: 'alertas',
  timestamps: false
});

export default Alerta;