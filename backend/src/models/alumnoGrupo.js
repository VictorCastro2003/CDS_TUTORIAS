// models/AlumnoGrupo.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const AlumnoGrupo = sequelize.define("AlumnoGrupo", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  alumno_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },
  grupo_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  periodo_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: "alumnos_grupos",
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['alumno_id', 'periodo_id'] // Un alumno solo en un grupo por periodo
    }
  ]
});

export default AlumnoGrupo;