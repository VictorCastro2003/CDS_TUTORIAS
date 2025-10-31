// src/utils/jwt.js
import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'secret';

export function sign(payload) {
  return jwt.sign(payload, secret, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

export function verify(token) {
  return jwt.verify(token, secret);
}

export default { sign, verify };