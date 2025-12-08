import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";

// ==========================================
// FUNCIÓN AUXILIAR: Generar par de tokens
// ==========================================
const generateTokens = (user, rememberMe = false) => {
  console.log('\n' + '='.repeat(60));
  console.log('🎟️  GENERANDO TOKENS');
  console.log('='.repeat(60));
  console.log('👤 Usuario:', user.name);
  console.log('🔐 RememberMe:', rememberMe);

  // Access Token: siempre corto (15 segundos para pruebas)
  const accessToken = jwt.sign(
    {
      id: user.id,
      name: user.name,
      rol: user.rol
    },
    process.env.JWT_SECRET,
    { expiresIn: '30s' }  // ⏰ 15 SEGUNDOS para pruebas
  );

  // Decodificar para ver cuándo expira
  const accessDecoded = jwt.decode(accessToken);
  const accessExpiresAt = new Date(accessDecoded.exp * 1000);
  
  console.log('✅ Access Token generado:');
  console.log('   ⏰ Duración: 15 segundos');
  console.log('   📅 Expira a las:', accessExpiresAt.toLocaleTimeString());

  // Refresh Token: varía según "recordar sesión"
  const refreshExpiresIn = rememberMe ? '30d' : '7d';
  
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

  // Decodificar para ver cuándo expira
  const refreshDecoded = jwt.decode(refreshToken);
  const refreshExpiresAt = new Date(refreshDecoded.exp * 1000);
  
  console.log('✅ Refresh Token generado:');
  console.log('   ⏰ Duración:', refreshExpiresIn);
  console.log('   📅 Expira el:', refreshExpiresAt.toLocaleDateString(), 'a las', refreshExpiresAt.toLocaleTimeString());
  console.log('='.repeat(60) + '\n');

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
// LOGIN - Con debugging detallado
// ==========================================
export const login = async (req, res) => {
  try {
    const { name, password, rememberMe } = req.body;

    console.log('\n' + '🔵'.repeat(30));
    console.log('🔐 LOGIN REQUEST');
    console.log('🔵'.repeat(30));
    console.log('📋 Body recibido:');
    console.log('   - Usuario:', name);
    console.log('   - Contraseña: ***');
    console.log('   - RememberMe:', rememberMe);
    console.log('   - RememberMe type:', typeof rememberMe);
    console.log('🔵'.repeat(30) + '\n');

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
    console.log('\n');

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

    console.log('\n' + '🔄'.repeat(30));
    console.log('🔄 REFRESH TOKEN REQUEST');
    console.log('🔄'.repeat(30));
    console.log('⏰ Hora actual:', new Date().toLocaleTimeString());

    if (!refreshToken) {
      console.log('❌ No se recibió refresh token');
      return res.status(401).json({ message: 'Refresh token requerido' });
    }

    console.log('✅ Refresh token recibido');

    // Verificar refresh token
    const decoded = jwt.verify(
      refreshToken, 
      process.env.REFRESH_SECRET || process.env.JWT_SECRET
    );

    console.log('📋 Refresh token decodificado:');
    console.log('   - User ID:', decoded.id);
    console.log('   - Type:', decoded.type);
    console.log('   - Expira:', new Date(decoded.exp * 1000).toLocaleString());

    if (decoded.type !== 'refresh') {
      console.log('❌ Token no es de tipo refresh');
      return res.status(403).json({ message: 'Token inválido' });
    }

    // Validar que el usuario existe y la versión coincide
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'rol', 'name', 'passwordChangedAt']
    });

    if (!user) {
      console.log('❌ Usuario no encontrado');
      return res.status(403).json({ message: 'Usuario no existe' });
    }

    console.log('✅ Usuario encontrado:', user.name);

    // Verificar si cambió la contraseña
    const userVersion = user.passwordChangedAt 
      ? new Date(user.passwordChangedAt).getTime() 
      : 0;
    
    if (decoded.version < userVersion) {
      console.log('❌ Contraseña fue cambiada, token inválido');
      return res.status(403).json({ 
        message: 'Token inválido: contraseña fue cambiada. Inicia sesión nuevamente.' 
      });
    }

    console.log('✅ Versión del token válida');

    // Generar SOLO nuevo access token
    const newAccessToken = jwt.sign(
      {
        id: user.id,
        name: user.name,
        rol: user.rol
      },
      process.env.JWT_SECRET,
      { expiresIn: '15s' }  // 15 SEGUNDOS para pruebas
    );

    const newDecoded = jwt.decode(newAccessToken);
    const newExpiresAt = new Date(newDecoded.exp * 1000);

    console.log('✅ NUEVO Access Token generado:');
    console.log('   ⏰ Duración: 15 segundos');
    console.log('   📅 Expira a las:', newExpiresAt.toLocaleTimeString());
    console.log('🔄'.repeat(30) + '\n');

    res.json({ 
      accessToken: newAccessToken,
      token: newAccessToken // Para compatibilidad
    });
  } catch (error) {
    console.error('\n❌ ERROR EN REFRESH:');
    console.error('   Tipo:', error.name);
    console.error('   Mensaje:', error.message);
    console.log('\n');
    
    if (error.name === 'TokenExpiredError') {
      console.log('⏰ Refresh token EXPIRADO');
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
  console.log('\n🚪 LOGOUT REQUEST');
  console.log('⏰ Hora:', new Date().toLocaleTimeString());
  console.log('');
  
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