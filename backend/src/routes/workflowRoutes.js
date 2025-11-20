// src/routes/workflowRoutes.js
import express from 'express';
import {
    enviarAJefeDivision,
    asignarDocenteAsesor,
    generarContrarreferenciaAcademica,
    enviarACoordinacion,
    iniciarAtencionPsicologica,
    generarContrareferenciaPsicologica,
    finalizarCanalizacion,
    obtenerHistorialWorkflow
} from '../controllers/workflowController.js';

const router = express.Router();

// ============================================
// RUTAS CANALIZACIÓN ACADÉMICA
// ============================================

// Enviar a Jefe de División
router.post('/:id/enviar-jefe-division', enviarAJefeDivision);

// Asignar Docente Asesor
router.post('/:id/asignar-docente', asignarDocenteAsesor);

// Generar Contrarreferencia Académica
router.post('/:id/contrarreferencia-academica', generarContrarreferenciaAcademica);

// ============================================
// RUTAS CANALIZACIÓN PSICOLÓGICA
// ============================================

// Enviar a Coordinación
router.post('/:id/enviar-coordinacion', enviarACoordinacion);

// Iniciar Atención Psicológica
router.post('/:id/iniciar-atencion', iniciarAtencionPsicologica);

// Generar Contrarreferencia Psicológica
router.post('/:id/contrarreferencia-psicologica', generarContrareferenciaPsicologica);

// ============================================
// RUTAS GENERALES
// ============================================

// Finalizar Canalización
router.post('/:id/finalizar', finalizarCanalizacion);

// Obtener Historial de Workflow
router.get('/:id/historial', obtenerHistorialWorkflow);

export default router;
