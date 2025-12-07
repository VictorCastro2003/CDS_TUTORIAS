import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    // Configurar base URL
    axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://98.80.218.98:4000/api';

    if (token && userData) {
      setUser(JSON.parse(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    setLoading(false);
  }, []);

  // ==========================================
  // INTERCEPTOR: Auto-renovación de tokens
  // ==========================================
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Si el token expiró (403/401) y NO hemos reintentado
        if (
          (error.response?.status === 403 || error.response?.status === 401) && 
          !originalRequest._retry &&
          originalRequest.url !== '/auth/login' // No reintentar en login
        ) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            
            if (!refreshToken) {
              throw new Error('No refresh token disponible');
            }

            console.log('🔄 Access token expirado, renovando...');

            // Llamar a /refresh
            const { data } = await axios.post('/auth/refresh', { refreshToken });
            
            // Guardar nuevo access token
            localStorage.setItem('token', data.accessToken || data.token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken || data.token}`;

            console.log('✅ Token renovado correctamente');

            // Reintentar request original con nuevo token
            originalRequest.headers.Authorization = `Bearer ${data.accessToken || data.token}`;
            return axios(originalRequest);
          } catch (refreshError) {
            console.error('❌ Error al renovar token:', refreshError.message);
            
            // Si el refresh falló, hacer logout
            logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  // ==========================================
  // LOGIN - Con rememberMe
  // ==========================================
  const login = async (name, password, rememberMe = false) => {
    try {
      // 🔍 DEBUG: Ver qué se envía
      console.log('📤 Enviando al backend:', { name, password: '***', rememberMe });

      const { data } = await axios.post('/auth/login', { 
        name, 
        password,
        rememberMe  // ← Asegúrate que se envíe
      });

      console.log('📥 Respuesta del backend:', {
        hasAccessToken: !!data.accessToken,
        hasToken: !!data.token,
        hasRefreshToken: !!data.refreshToken,
        expiresIn: data.expiresIn
      });

      const { token, accessToken, refreshToken, user: usuario, expiresIn } = data;

      // Guardar ambos tokens
      const finalAccessToken = accessToken || token;
      localStorage.setItem('token', finalAccessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(usuario));

      axios.defaults.headers.common['Authorization'] = `Bearer ${finalAccessToken}`;
      setUser(usuario);

      console.log(`✅ Login exitoso. Sesión válida por: ${expiresIn}`);
      console.log('💾 Tokens guardados en localStorage');

      return { success: true, user: usuario, token: finalAccessToken };
    } catch (error) {
      const err = error.response?.data?.message || error.message || 'Error de conexión';
      console.error('❌ Error en login:', err);
      console.error('📋 Detalles del error:', error.response?.data);
      return { success: false, error: err };
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================
  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        // Notificar al backend (no falla si hay error)
        await axios.post('/auth/logout', { refreshToken }).catch((err) => {
          console.warn('⚠️ Error al notificar logout al backend:', err.message);
        });
      }
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      // Limpiar todo del localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      delete axios.defaults.headers.common['Authorization'];
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