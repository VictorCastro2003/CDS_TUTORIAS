// models/user.js
import bcrypt from 'bcryptjs';
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  id: { 
    type: DataTypes.INTEGER.UNSIGNED, 
    primaryKey: true, 
    autoIncrement: true 
  },
  name: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  password: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  rol: { 
    type: DataTypes.ENUM("coordinacion", "jefeDivision", "tutor", "docente", "direccion"), 
    allowNull: false, 
    defaultValue: 'tutor' 
  }
}, {
  tableName: 'users',
  timestamps: false,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Método de instancia para validar password
User.prototype.validatePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

export default User;
