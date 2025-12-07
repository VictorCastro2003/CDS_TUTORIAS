// src/routes/auth.js
import express from 'express';
import authController from '../controllers/authController.js';
import { register, login } from '../validators/authValidator.js';
import verifyToken from '../middlewares/verifyToken.js'; // ← Asegúrate de importar

const router = express.Router();

router.post('/register', register, authController.register);
router.post('/login', login, authController.login);
router.post('/refresh', authController.refresh);        // ← Agregar esta línea
router.post('/logout', authController.logout);          // ← Agregar esta línea
router.post('/change-password', verifyToken, authController.changePassword); // ← Agregar esta línea

export default router;