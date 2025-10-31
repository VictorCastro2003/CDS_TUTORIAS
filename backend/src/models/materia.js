import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";


const Materia = sequelize.define("Materia", {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    unsigned: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  carrera: {
    type: DataTypes.STRING,
    allowNull: false
  },
  semestre: {
    type: DataTypes.TINYINT,
    unsigned: true,
    allowNull: false
  }
}, {
  tableName: "materias",
  timestamps: false // Porque tienes created_at y updated_at
});


export default Materia;