// models/Periodo.js
import { DataTypes, Op } from "sequelize";
import sequelize from "../config/database.js";

const Periodo = sequelize.define("Periodo", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  fecha_inicio: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  fecha_fin: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: "periodos",
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// 🔒 Hook para asegurar que solo haya un periodo activo
Periodo.beforeSave(async (periodo) => {
  if (periodo.activo) {
    // Desactivar todos los demás periodos excepto el actual
    await Periodo.update(
      { activo: false },
      { 
        where: { 
          activo: true, 
          id: { [Op.ne]: periodo.id } 
        } 
      }
    );
  }
});

export default Periodo;