import express from 'express';
import { Materia } from '../models/index.js';
import verifyToken from '../middlewares/verifyToken.js';
import verificarRoles from '../middlewares/autorizarRoles.js';

const router = express.Router();

// Obtener todas las materias (con filtro opcional por carrera)
router.get('/', verifyToken, verificarRoles("tutor", "coordinacion", "jefeDivision"), async (req, res) => {
  try {
    const { carrera } = req.query;
    
    const whereClause = carrera ? { carrera } : {};
    
    const materias = await Materia.findAll({
      where: whereClause,
      order: [['semestre', 'ASC'], ['nombre', 'ASC']]
    });
    
    res.json(materias);
  } catch (error) {
    console.error('Error al obtener materias:', error);
    res.status(500).json({ error: 'Error al obtener materias' });
  }
});

export default router;