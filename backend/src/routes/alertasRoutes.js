import express from 'express';
import {
  obtenerTodasAlertas,
  obtenerAlertasAlumno,
  crearAlerta,
  actualizarEstadoAlerta
} from '../controllers/alertaController.js';
import verifyToken from '../middlewares/verifyToken.js';

const router = express.Router();

// ✅ Obtener todas las alertas (con filtros opcionales)
router.get('/', verifyToken, obtenerTodasAlertas);

// ✅ Obtener alertas de un alumno específico
router.get('/alumno/:alumnoId', verifyToken, obtenerAlertasAlumno);

// ✅ Crear nueva alerta
router.post('/', verifyToken, crearAlerta);

// ✅ Actualizar estado de alerta
router.put('/:id/estado', verifyToken, actualizarEstadoAlerta);

export default router;