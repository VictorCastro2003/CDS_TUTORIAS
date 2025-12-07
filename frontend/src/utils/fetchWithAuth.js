// src/utils/fetchWithAuth.js

const API_URL = process.env.REACT_APP_API_URL || 'http://98.80.218.98:4000/api';

// Control de refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Función para refrescar el token
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    throw new Error('No refresh token disponible');
  }

  console.log('🔄 Renovando access token...');

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refreshToken })
  });

  if (!response.ok) {
    throw new Error('Error al renovar token');
  }

  const data = await response.json();
  const newToken = data.accessToken || data.token;

  if (!newToken) {
    throw new Error('No se recibió token del servidor');
  }

  localStorage.setItem('token', newToken);
  console.log('✅ Token renovado correctamente');

  return newToken;
};

// Función para hacer logout
const handleLogout = () => {
  console.log('🚪 Sesión expirada, redirigiendo a login...');
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  
  setTimeout(() => {
    window.location.href = '/login';
  }, 100);
};

/**
 * Wrapper de fetch con auto-renovación de token
 * Uso: igual que fetch normal
 * 
 * @example
 * const response = await fetchWithAuth('/alumnos');
 * const data = await response.json();
 */
const fetchWithAuth = async (url, options = {}) => {
  // Construir URL completa si es relativa
  const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
  
  // Obtener token del localStorage
  const token = localStorage.getItem('token');
  
  // Agregar headers por defecto
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };

  // Merge de headers
  const finalOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };

  console.log(`📤 ${options.method || 'GET'} ${url}`);

  try {
    // Hacer el request
    let response = await fetch(fullUrl, finalOptions);

    // Si es 401/403 y NO es un endpoint de auth
    if (
      (response.status === 401 || response.status === 403) &&
      !url.includes('/auth/login') &&
      !url.includes('/auth/refresh') &&
      !url.includes('/auth/register')
    ) {
      console.log('🔍 Token expirado, intentando renovar...');

      // Si ya se está renovando, esperar en la cola
      if (isRefreshing) {
        console.log('⏳ Esperando renovación en progreso...');
        const newToken = await new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });

        // Reintentar con nuevo token
        finalOptions.headers.Authorization = `Bearer ${newToken}`;
        response = await fetch(fullUrl, finalOptions);
        return response;
      }

      // Marcar que estamos renovando
      isRefreshing = true;

      try {
        // Renovar token
        const newToken = await refreshAccessToken();

        // Procesar cola de requests pendientes
        processQueue(null, newToken);

        // Reintentar request original con nuevo token
        finalOptions.headers.Authorization = `Bearer ${newToken}`;
        response = await fetch(fullUrl, finalOptions);

        return response;
      } catch (refreshError) {
        console.error('❌ Error al renovar token:', refreshError.message);
        
        // Procesar cola con error
        processQueue(refreshError, null);
        
        // Hacer logout
        handleLogout();
        
        throw refreshError;
      } finally {
        isRefreshing = false;
      }
    }

    return response;
  } catch (error) {
    console.error('❌ Error en request:', error.message);
    throw error;
  }
};

export default fetchWithAuth;