// src/routes/notificacionRoutes.js
import express from 'express';
import {
    obtenerNotificaciones,
    marcarComoLeida,
    marcarTodasComoLeidas,
    contarNoLeidas,
    eliminarNotificacion
} from '../controllers/notificacionController.js';

const router = express.Router();

// Obtener notificaciones de un usuario
router.get('/usuario/:usuarioId', obtenerNotificaciones);

// Contar notificaciones no leídas
router.get('/usuario/:usuarioId/count', contarNoLeidas);

// Marcar notificación como leída
router.put('/:id/leer', marcarComoLeida);

// Marcar todas como leídas
router.put('/usuario/:usuarioId/leer-todas', marcarTodasComoLeidas);

// Eliminar notificación
router.delete('/:id', eliminarNotificacion);

export default router;
