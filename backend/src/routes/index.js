import express from 'express';
import authRoutes from './auth.js';
import usersRoutes from './users.js';
import alumnosRoutes from './alumnosRoutes.js';
import gruposRoutes from './gruposRoutes.js';
import canalizacionesRoutes from './canalizacionesRoutes.js';
import periodosRoutes from './periodosRoutes.js';
import materiasRoutes from './materiaRoutes.js';
import estadisticasRoutes from './estadisticasRoutes.js';
import alertasRoutes from './alertasRoutes.js';
// ❌ ELIMINAR ESTA LÍNEA - Ya no se necesita
// import calificacionesRoutes from './calificacionesRoutes.js';
import notificacionesRoutes from './notificacionRoutes.js';
import workflowRoutes from './workflowRoutes.js';
import contrarreferenciaRoutes from './contrarreferenciaRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/alumnos', alumnosRoutes); // ✅ Esta ruta ya incluye /alumnos/:id/calificaciones
router.use('/grupos', gruposRoutes);
router.use('/canalizaciones', canalizacionesRoutes);
router.use('/periodos', periodosRoutes);
router.use('/materias', materiasRoutes);
router.use('/estadisticas', estadisticasRoutes);
router.use('/alertas', alertasRoutes);
// ❌ ELIMINAR ESTA LÍNEA - Ya no se necesita
// router.use('/calificaciones', calificacionesRoutes);
router.use('/notificaciones', notificacionesRoutes);
router.use('/workflow', workflowRoutes);
router.use('/contrarreferencias', contrarreferenciaRoutes);

router.get('/', (req, res) => res.json({ ok: true, message: 'API v1' }));

export default router;