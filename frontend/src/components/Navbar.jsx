import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Badge, Dropdown } from 'react-bootstrap';
import './Navbar.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import axios from 'axios';

const CustomNavbar = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [notificacionesCount, setNotificacionesCount] = useState(0);
  const [notificaciones, setNotificaciones] = useState([]);

  useEffect(() => {
    if (auth?.user?.id) {
      cargarNotificaciones();
      // Actualizar cada 30 segundos
      const interval = setInterval(cargarNotificaciones, 30000);
      return () => clearInterval(interval);
    }
  }, [auth?.user?.id]);

  const cargarNotificaciones = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !auth?.user?.id) return;

      const response = await axios.get(
        `http://98.80.218.98:4000/api/notificaciones/usuario/${auth.user.id}?leida=false`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setNotificaciones(response.data.slice(0, 5)); // Solo las primeras 5
      setNotificacionesCount(response.data.length);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    }
  };

  const marcarComoLeida = async (notifId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://98.80.218.98:4000/api/notificaciones/${notifId}/leer`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      cargarNotificaciones();
    } catch (error) {
      console.error('Error al marcar notificación:', error);
    }
  };

  // Add null check
  if (!auth || !auth.user) {
    return (
      <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm custom-navbar">
        <Container fluid>
          <Navbar.Brand as={Link} to="/" className="fw-bold text-white">
            <i className="fas fa-graduation-cap me-2"></i>
            Sistema de Tutorías CDS
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/login" className="text-white">
                <i className="fas fa-sign-in-alt me-1"></i>
                Iniciar Sesión
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    );
  }

  const { user, logout } = auth;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRolBadgeColor = (rol) => {
    const colors = {
      coordinacion: 'primary',
      jefeDivision: 'info',
      tutor: 'success',
      docente: 'warning',
      direccion: 'danger'
    };
    return colors[rol] || 'secondary';
  };

  const getRolLabel = (rol) => {
    const labels = {
      coordinacion: 'Coordinación',
      jefeDivision: 'Jefe de División',
      tutor: 'Tutor',
      docente: 'Docente',
      direccion: 'Dirección'
    };
    return labels[rol] || rol;
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm custom-navbar">
      <Container fluid>
        <Navbar.Brand as={Link} to="/" className="fw-bold">
          <i className="fas fa-graduation-cap me-2"></i>
          Sistema de Tutorías CDS
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">
              <i className="fas fa-home me-1"></i>
              Dashboard
            </Nav.Link>

            {user.rol !== 'coordinacion' && (
              <Nav.Link as={Link} to="/alumnos">
                <i className="fas fa-users me-1"></i>
                Alumnos
              </Nav.Link>
            )}

            {(user.rol === 'coordinacion' || user.rol === 'jefeDivision') && (
              <Nav.Link as={Link} to="/grupos">
                <i className="fas fa-layer-group me-1"></i>
                Grupos
              </Nav.Link>
            )}

            <Nav.Link as={Link} to="/canalizaciones">
              <i className="fas fa-clipboard-list me-1"></i>
              Canalizaciones
              {notificacionesCount > 0 && (
                <Badge bg="danger" className="ms-1">{notificacionesCount}</Badge>
              )}
            </Nav.Link>
          </Nav>

          <Nav className="d-flex align-items-center">
            {/* Notificaciones */}
            <Dropdown align="end" className="me-3">
              <Dropdown.Toggle variant="dark" id="dropdown-notificaciones" className="position-relative">
                <i className="fas fa-bell"></i>
                {notificacionesCount > 0 && (
                  <Badge
                    bg="danger"
                    className="position-absolute top-0 start-100 translate-middle"
                    style={{ fontSize: '0.6rem' }}
                  >
                    {notificacionesCount}
                  </Badge>
                )}
              </Dropdown.Toggle>

              <Dropdown.Menu style={{ minWidth: '350px', maxHeight: '400px', overflowY: 'auto' }}>
                <Dropdown.Header>
                  <strong>Notificaciones</strong>
                  {notificacionesCount > 0 && (
                    <Badge bg="danger" className="ms-2">{notificacionesCount}</Badge>
                  )}
                </Dropdown.Header>

                {notificaciones.length > 0 ? (
                  notificaciones.map((notif) => (
                    <Dropdown.Item
                      key={notif.id}
                      onClick={() => {
                        marcarComoLeida(notif.id);
                        if (notif.url) navigate(notif.url);
                      }}
                      className="border-bottom"
                    >
                      <div className="d-flex align-items-start">
                        <div className="flex-grow-1">
                          <strong className="d-block">{notif.titulo}</strong>
                          <small className="text-muted">{notif.mensaje}</small>
                          <br />
                          <small className="text-muted">
                            <i className="fas fa-clock me-1"></i>
                            {new Date(notif.created_at).toLocaleString('es-MX')}
                          </small>
                        </div>
                        {notif.prioridad === 'alta' && (
                          <Badge bg="danger" className="ms-2">!</Badge>
                        )}
                      </div>
                    </Dropdown.Item>
                  ))
                ) : (
                  <Dropdown.Item disabled>
                    <div className="text-center text-muted py-3">
                      <i className="fas fa-check-circle fa-2x mb-2"></i>
                      <p className="mb-0">No hay notificaciones nuevas</p>
                    </div>
                  </Dropdown.Item>
                )}

                {notificaciones.length > 0 && (
                  <Dropdown.Divider />
                )}
                <Dropdown.Item as={Link} to="/notificaciones" className="text-center text-primary">
                  Ver todas las notificaciones
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            {/* Usuario */}
            <div className="user-badge me-3">
              <div className="avatar bg-primary">
                {(user?.name || user?.nombre || 'U')[0].toUpperCase()}
              </div>
              <div className="d-none d-sm-block text-white ps-2">
                <div className="user-name">{user?.name || user?.nombre || 'Usuario'}</div>
                <Badge bg={getRolBadgeColor(user?.rol)} className="mt-1">
                  {getRolLabel(user?.rol)}
                </Badge>
                {user?.division && (
                  <small className="d-block text-white-50">
                    <i className="fas fa-building me-1"></i>
                    {user.division}
                  </small>
                )}
              </div>
            </div>

            <button className="logout-btn btn btn-outline-light" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt me-1"></i>
              Cerrar Sesión
            </button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default CustomNavbar;