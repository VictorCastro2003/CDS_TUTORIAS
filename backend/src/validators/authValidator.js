// src/validators/authValidator.js
import { body, validationResult } from 'express-validator';

export const register = [
  body('name').notEmpty().withMessage('El nombre es requerido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

export const login = [
  body('name').notEmpty().withMessage('El nombre es requerido'),
  body('password').notEmpty().withMessage('La contraseña es requerida'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];