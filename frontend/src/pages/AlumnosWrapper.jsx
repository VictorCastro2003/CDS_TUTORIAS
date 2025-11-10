// src/pages/AlumnosWrapper.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import Dashboard from './Dashboard';
import GruposDashboard from './GruposDashboard';

const AlumnosWrapper = () => {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setUserRole(decoded.rol);
    } catch (error) {
      console.error('Token inválido:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  // 🔹 Si estamos en /alumnos (ruta base), redirigir según el rol
  if (location.pathname === '/alumnos') {
    // Tutores ven lista de alumnos
    if (userRole === 'tutor') {
      return <Dashboard />;
    }

    // Coordinación y jefeDivision ven grupos
    if (userRole === 'coordinacion' || userRole === 'jefeDivision') {
      return <GruposDashboard />;
    }
  }

  // 🔹 Para rutas como /alumnos/:id, siempre mostrar Dashboard (detalle del alumno)
  // Esto permite que coordinación y jefeDivision vean el detalle de un alumno
  // cuando hacen clic en "Ver Detalle" desde GruposDashboard
  return <Dashboard />;
};

export default AlumnosWrapper;