import express from 'express';
import { getCalificacionesByAlumno } from '../controllers/calificacionesController.js';
import verifyToken from '../middlewares/verifyToken.js';
import verificarRoles from '../middlewares/autorizarRoles.js';

const router = express.Router();

// ✅ IMPORTANTE: Esta ruta se monta en /api/calificaciones
// Por lo tanto, esta ruta responderá a: /api/calificaciones/:id
router.get('/:id', verifyToken, verificarRoles("tutor", "coordinacion", "jefeDivision"), getCalificacionesByAlumno);

export default router;