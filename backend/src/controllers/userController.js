// src/controllers/userController.js
import User from '../models/user.js';

// Obtener los datos del usuario autenticado
export const me = async (req, res, next) => {
  try {
    const user = req.user;
    res.json({
      id: user.id,
      name: user.name,
      rol: user.rol
    });
  } catch (err) {
    next(err);
  }
};

// Listar todos los usuarios
export const index = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'rol']
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
};

export default {
  me,
  index
};