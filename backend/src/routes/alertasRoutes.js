import express from 'express';
import * as alertaController from '../controllers/alertaController.js';
import verificarToken from '../middlewares/auth.js';

const router = express.Router();

router.get('/alumno/:alumnoId', verificarToken, alertaController.obtenerAlertasAlumno);
router.post('/', verificarToken, alertaController.crearAlerta);
router.put('/:id/estado', verificarToken, alertaController.actualizarEstadoAlerta);

export default router;