// src/routes/index.js
import express from 'express';
import authRoutes from './auth.js';
import usersRoutes from './users.js';
import alumnosRoutes from './alumnosRoutes.js';
import gruposRoutes from './gruposRoutes.js';
import canalizacionesRoutes from './canalizacionesRoutes.js';

const router = express.Router();

// Rutas existentes
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/alumnos', alumnosRoutes);
router.use('/grupos', gruposRoutes);
router.use('/canalizaciones', canalizacionesRoutes);

// Ruta base de prueba
router.get('/', (req, res) => res.json({ ok: true, message: 'API v1' }));

export default router;