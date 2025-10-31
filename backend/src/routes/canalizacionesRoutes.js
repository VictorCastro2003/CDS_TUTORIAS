import express from 'express';
import * as canalizacionController from '../controllers/canalizacionController.js';

const router = express.Router();

router.post('/', canalizacionController.crearCanalizacion);
router.get('/', canalizacionController.obtenerCanalizaciones);
router.get('/report/pdf', canalizacionController.generarReportePDF);
router.get('/report/excel', canalizacionController.generarReporteExcel);

export default router;