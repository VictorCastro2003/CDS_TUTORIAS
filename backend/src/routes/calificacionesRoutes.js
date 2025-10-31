import express from 'express';
import { getCalificacionesByAlumno } from '../controllers/calificacionesController.js';
import verifyToken from '../middlewares/verifyToken.js';
import verificarRoles from '../middlewares/autorizarRoles.js';

const router = express.Router();

// Obtener calificaciones de un alumno
router.get('/:id', verifyToken, verificarRoles("tutor", "coordinacion"), getCalificacionesByAlumno);

export default router;