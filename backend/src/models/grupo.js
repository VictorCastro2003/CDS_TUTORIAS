// models/Grupo.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Grupo = sequelize.define("Grupo", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  semestre: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 12
    }
  },
  carrera: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  periodo_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'periodos',
      key: 'id'
    }
  },
  tutor_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  capacidad_maxima: {
    type: DataTypes.INTEGER,
    defaultValue: 35
  }
}, {
  tableName: "grupos",
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

export default Grupo;