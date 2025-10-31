import express from 'express';
import {
  form,
  asignar,
  filtrarMaterias,
  actualizarCalificacion
} from '../controllers/alumnoMateriaController.js';
import verifyToken from '../middlewares/verifyToken.js';
import verificarRoles from '../middlewares/autorizarRoles.js';

const router = express.Router();

router.get('/:id/materias/form', form);
router.post('/:id/materias', verifyToken, verificarRoles("tutor", "coordinacion"), asignar);
router.get('/:id/materias/filtrar', filtrarMaterias);
router.put('/:id/materias/:materiaId/calificacion', verifyToken, verificarRoles("tutor", "coordinacion"), actualizarCalificacion);

export default router;