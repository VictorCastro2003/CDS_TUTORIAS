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
import calificacionesRoutes from './calificacionesRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/alumnos', alumnosRoutes); 
router.use('/grupos', gruposRoutes);
router.use('/canalizaciones', canalizacionesRoutes);
router.use('/periodos', periodosRoutes);
router.use('/materias', materiasRoutes); 
router.use('/estadisticas', estadisticasRoutes); 
router.use('/alertas', alertasRoutes);
router.use('/calificaciones', calificacionesRoutes); 


router.get('/', (req, res) => res.json({ ok: true, message: 'API v1' }));

export default router;