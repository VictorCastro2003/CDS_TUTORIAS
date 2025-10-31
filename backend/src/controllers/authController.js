import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";

// Registro
export const register = async (req, res) => {
  try {
    const { name, password, rol } = req.body;

    if (!name || !password) {
      return res.status(400).json({ message: "Name and password are required" });
    }

    // Validar que el rol sea uno de los permitidos
    const rolesPermitidos = ['coordinacion', 'jefeDivision', 'tutor', 'docente', 'direccion'];
    if (rol && !rolesPermitidos.includes(rol)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Verifica si ya existe un usuario con ese name
    const existing = await User.findOne({ where: { name } });
    if (existing) return res.status(400).json({ message: "Username already in use" });

    // Crea el usuario (si no se proporciona rol, se usa el default 'tutor')
    const user = await User.create({ 
      name, 
      password, 
      rol: rol || 'tutor' 
    });

    res.status(201).json({ 
      message: "User registered", 
      user: { 
        id: user.id, 
        name: user.name,
        rol: user.rol 
      } 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({ message: "Name and password are required" });
    }

    const user = await User.findOne({ where: { name } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { 
        id: user.id, 
        name: user.name,
        rol: user.rol 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.json({ 
      user: { 
        id: user.id, 
        name: user.name,
        rol: user.rol 
      }, 
      token 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Obtener usuario autenticado
export const me = async (req, res) => {
  try {
    const user = req.user;
    res.json({ 
      id: user.id, 
      name: user.name,
      rol: user.rol 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Exportación por defecto
export default {
  register,
  login,
  me
};