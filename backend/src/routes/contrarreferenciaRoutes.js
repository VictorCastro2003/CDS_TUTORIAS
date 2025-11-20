// src/routes/contrarreferenciaRoutes.js
import express from 'express';
import {
    crearContrarreferencia,
    obtenerContrarreferencias,
    marcarComoEnviada,
    obtenerTodasContrarreferencias,
    generarDocumentoContrarreferencia
} from '../controllers/contrarreferenciaController.js';

const router = express.Router();

// ✅ Crear contrarreferencia
router.post('/', crearContrarreferencia);

// ✅ Obtener contrarreferencias de una canalización específica
router.get('/canalizacion/:canalizacionId', obtenerContrarreferencias);

// ✅ Obtener todas las contrarreferencias (con filtros opcionales)
router.get('/', obtenerTodasContrarreferencias);

// ✅ Marcar contrarreferencia como enviada
router.put('/:id/enviar', marcarComoEnviada);

// ✅ Generar documento Word de contrarreferencia
router.get('/:id/documento', generarDocumentoContrarreferencia);

export default router;