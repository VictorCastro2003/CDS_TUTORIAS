// src/routes/users.js
import express from 'express';
import auth from '../middlewares/auth.js';
import User from '../models/user.js';

const router = express.Router();

// Obtener los datos del usuario autenticado
router.get('/me', auth, async (req, res, next) => {
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
});

// Listar todos los usuarios
router.get('/', auth, async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'rol']
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// Ruta para obtener tutores
router.get('/tutores', auth, async (req, res) => {
  try {
    const tutores = await User.findAll({
      where: { rol: 'tutor' },
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });
    
    res.json(tutores);
  } catch (error) {
    console.error('Error al obtener tutores:', error);
    res.status(500).json({ error: 'Error al cargar tutores' });
  }
});

export default router;