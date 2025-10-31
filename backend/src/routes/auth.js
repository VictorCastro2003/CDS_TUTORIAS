// src/routes/auth.js
import express from 'express';
import authController from '../controllers/authController.js';
import { register, login } from '../validators/authValidator.js';

const router = express.Router();

router.post('/register', register, authController.register);
router.post('/login', login, authController.login);

export default router;