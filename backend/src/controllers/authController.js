import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";

// ==========================================
// FUNCIÓN AUXILIAR: Generar par de tokens
// ==========================================
const generateTokens = (user, rememberMe = false) => {
  console.log('🎟️ Generando tokens con rememberMe:', rememberMe);

  // Access Token: siempre corto (15 minutos)
  const accessToken = jwt.sign(
    {
      id: user.id,
      name: user.name,
      rol: user.rol
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  // Refresh Token: varía según "recordar sesión"
  const refreshExpiresIn = rememberMe ? '30d' : '7d';
  console.log(`🔄 Refresh token expirará en: ${refreshExpiresIn}`);

  const refreshToken = jwt.sign(
    {
      id: user.id,
      type: 'refresh',
      version: user.passwordChangedAt 
        ? new Date(user.passwordChangedAt).getTime() 
        : Date.now()
    },
    process.env.REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: refreshExpiresIn }
  );

  return { accessToken, refreshToken };
};

// ==========================================
// REGISTRO (sin cambios)
// ==========================================
export const register = async (req, res) => {
  try {
    const { name, password, rol } = req.body;

    if (!name || !password) {
      return res.status(400).json({ message: "Name and password are required" });
    }

    const rolesPermitidos = ['coordinacion', 'jefeDivision', 'tutor', 'docente', 'direccion'];
    if (rol && !rolesPermitidos.includes(rol)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const existing = await User.findOne({ where: { name } });
    if (existing) return res.status(400).json({ message: "Username already in use" });

    const user = await User.create({
      name,
      password,
      rol: rol || 'tutor'
    });

    res.status(201).json({
      message: "User registered",
      user: {
        id: user.id,
        name: user.name,
        rol: user.rol
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==========================================
// LOGIN - Con debugging
// ==========================================
export const login = async (req, res) => {
  try {
    const { name, password, rememberMe } = req.body;

    // 🔍 DEBUG
    console.log('='.repeat(50));
    console.log('🔐 LOGIN REQUEST');
    console.log('📋 Body recibido:', { name, password: '***', rememberMe });
    console.log('📋 RememberMe type:', typeof rememberMe);
    console.log('📋 RememberMe value:', rememberMe);
    console.log('='.repeat(50));

    if (!name || !password) {
      return res.status(400).json({ message: "Name and password are required" });
    }

    const user = await User.findOne({ where: { name } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    // Generar ambos tokens
    const { accessToken, refreshToken } = generateTokens(user, rememberMe);

    const expiresIn = rememberMe ? '30 días' : '7 días';

    console.log('✅ Login exitoso para:', name);
    console.log('📤 Enviando respuesta con expiresIn:', expiresIn);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        rol: user.rol
      },
      token: accessToken,        // Para compatibilidad
      accessToken,               // Nuevo
      refreshToken,              // Nuevo
      expiresIn                  // Info para el cliente
    });
  } catch (err) {
    console.error('❌ Error en login:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==========================================
// REFRESH - Renovar access token
// ==========================================
export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    console.log('🔄 REFRESH REQUEST');

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token requerido' });
    }

    // Verificar refresh token
    const decoded = jwt.verify(
      refreshToken, 
      process.env.REFRESH_SECRET || process.env.JWT_SECRET
    );

    console.log('📋 Refresh token decodificado:', decoded);

    if (decoded.type !== 'refresh') {
      return res.status(403).json({ message: 'Token inválido' });
    }

    // Validar que el usuario existe y la versión coincide
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'rol', 'name', 'passwordChangedAt']
    });

    if (!user) {
      return res.status(403).json({ message: 'Usuario no existe' });
    }

    // Verificar si cambió la contraseña
    const userVersion = user.passwordChangedAt 
      ? new Date(user.passwordChangedAt).getTime() 
      : 0;
    
    if (decoded.version < userVersion) {
      return res.status(403).json({ 
        message: 'Token inválido: contraseña fue cambiada. Inicia sesión nuevamente.' 
      });
    }

    // Generar SOLO nuevo access token
    const newAccessToken = jwt.sign(
      {
        id: user.id,
        name: user.name,
        rol: user.rol
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    console.log('✅ Token renovado exitosamente');

    res.json({ 
      accessToken: newAccessToken,
      token: newAccessToken // Para compatibilidad
    });
  } catch (error) {
    console.error('❌ Error en refresh:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ 
        message: 'Refresh token expirado. Inicia sesión nuevamente.' 
      });
    }
    return res.status(403).json({ 
      message: 'Refresh token inválido',
      error: error.message 
    });
  }
};

// ==========================================
// LOGOUT
// ==========================================
export const logout = async (req, res) => {
  console.log('🚪 LOGOUT REQUEST');
  // En versión stateless, logout es principalmente en cliente
  res.json({ 
    message: 'Sesión cerrada correctamente' 
  });
};

// ==========================================
// ME (sin cambios)
// ==========================================
export const me = async (req, res) => {
  try {
    const user = req.user;
    res.json({
      id: user.id,
      name: user.name,
      rol: user.rol
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==========================================
// CAMBIAR CONTRASEÑA
// ==========================================
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    console.log('🔑 CHANGE PASSWORD REQUEST para user:', userId);

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Contraseña antigua y nueva son requeridas' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'La nueva contraseña debe tener al menos 6 caracteres' 
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await user.update({
      password: hashedPassword,
      passwordChangedAt: new Date()
    });

    console.log('✅ Contraseña actualizada, tokens invalidados');

    res.json({ 
      message: 'Contraseña actualizada correctamente. Inicia sesión nuevamente.' 
    });
  } catch (err) {
    console.error('❌ Error en changePassword:', err);
    res.status(500).json({ message: err.message });
  }
};

// Exportación por defecto
export default {
  register,
  login,
  refresh,
  logout,
  me,
  changePassword
};