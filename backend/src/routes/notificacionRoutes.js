// src/routes/notificacionRoutes.js
import express from 'express';
import verifyToken from '../middlewares/verifyToken.js'; // ✅ AGREGAR
import {
    obtenerNotificaciones,
    marcarComoLeida,
    marcarTodasComoLeidas,
    contarNoLeidas,
    eliminarNotificacion
} from '../controllers/notificacionController.js';

const router = express.Router();

// ✅ TODAS las rutas con verifyToken
router.get('/usuario/:usuarioId', verifyToken, obtenerNotificaciones);
router.get('/usuario/:usuarioId/count', verifyToken, contarNoLeidas);
router.put('/:id/leer', verifyToken, marcarComoLeida);
router.put('/usuario/:usuarioId/leer-todas', verifyToken, marcarTodasComoLeidas);
router.delete('/:id', verifyToken, eliminarNotificacion);

export default router;