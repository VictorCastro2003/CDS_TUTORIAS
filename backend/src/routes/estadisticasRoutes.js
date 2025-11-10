import express from 'express';
import { obtenerEstadisticas } from '../controllers/estadisticasController.js';
import verificarToken from '../middlewares/auth.js';

const router = express.Router();

router.get('/', verificarToken, obtenerEstadisticas);

export default router;