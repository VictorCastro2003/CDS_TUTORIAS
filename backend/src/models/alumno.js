import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Alumno = sequelize.define("Alumno", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
    field: 'id' // 👈 Asegurar que el campo se mapee correctamente
  },
  Num_Control: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  Nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Primer_Ap: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Segundo_Ap: {
    type: DataTypes.STRING
  },
  Fecha_Nac: {
    type: DataTypes.DATEONLY
  },
  Semestre: {
    type: DataTypes.INTEGER
  },
  Carrera: {
    type: DataTypes.STRING
  }
}, {
  tableName: "alumnos",
  timestamps: false,
  // 👇 IMPORTANTE: Asegurar que el ID siempre se incluya en las consultas
  defaultScope: {
    attributes: {
      include: ['id']
    }
  }
});

// 👇 Método para asegurar que toJSON incluya el ID
Alumno.prototype.toJSON = function() {
  const values = { ...this.get() };
  return values;
};

export default Alumno;