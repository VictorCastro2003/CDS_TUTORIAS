// middlewares/verifyToken.js
import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'secret';

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1]; // formato: "Bearer token"

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // ← aquí se guarda el rol, id, etc.
    
    // 🔍 Log para depurar
    console.log("✅ Usuario autenticado:", decoded);

    next();
  } catch (err) {
    console.error("❌ Error al verificar token:", err.message);
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

export default verifyToken;