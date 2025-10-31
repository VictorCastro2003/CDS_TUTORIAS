import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const AlumnoMateria = sequelize.define("AlumnoMateria", {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    unsigned: true
  },
  alumno_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    unsigned: true
  },
  materia_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    unsigned: true
  },
  semestre: {
    type: DataTypes.TINYINT,
    unsigned: true,
    allowNull: true
  },
  calificacion: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: "alumno_materia",
  timestamps: false
});

export default AlumnoMateria;