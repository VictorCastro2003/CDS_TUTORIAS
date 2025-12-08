import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  // ==========================================
  // LOGIN
  // ==========================================
  const login = async (name, password, rememberMe = false) => {
    try {
      console.log('📤 Enviando al backend:', { name, password: '***', rememberMe });

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, password, rememberMe })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error en login');
      }

      const data = await response.json();

      console.log('📥 Respuesta del backend:', {
        hasAccessToken: !!data.accessToken,
        hasToken: !!data.token,
        hasRefreshToken: !!data.refreshToken,
        expiresIn: data.expiresIn
      });

      const { token, accessToken, refreshToken, user: usuario, expiresIn } = data;

      // Guardar tokens
      const finalAccessToken = accessToken || token;
      localStorage.setItem('token', finalAccessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(usuario));

      setUser(usuario);

      console.log(`✅ Login exitoso. Sesión válida por: ${expiresIn}`);
      console.log('💾 Tokens guardados en localStorage');

      return { success: true, user: usuario, token: finalAccessToken };
    } catch (error) {
      console.error('❌ Error en login:', error.message);
      return { success: false, error: error.message };
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================
  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ refreshToken })
        }).catch((err) => {
          console.warn('⚠️ Error al notificar logout al backend:', err.message);
        });
      }
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      setUser(null);
      
      console.log('🚪 Logout completado');
    }
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};