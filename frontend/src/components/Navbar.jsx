import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import './Navbar.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';

const CustomNavbar = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  // Add null check
  if (!auth || !auth.user) {
    return (
      <Navbar bg="primary" variant="dark" expand="lg" className="shadow-sm custom-navbar">
        <Container fluid>
          <Navbar.Brand as={Link} to="/" className="fw-bold text-white">
            🏫 Plataforma de Tutorías
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/login">Iniciar Sesión</Nav.Link>
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

  return (
    <Navbar bg="primary" variant="dark" expand="lg" className="shadow-sm custom-navbar">
      <Container fluid>
        <Navbar.Brand as={Link} to="/" className="fw-bold">
          🏫 Sistema ABC
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Dashboard</Nav.Link>
            <Nav.Link as={Link} to="/alumnos">Alumnos</Nav.Link>
            <Nav.Link as={Link} to="/grupos">Grupos</Nav.Link>
            <Nav.Link as={Link} to="/canalizaciones">Canalizaciones</Nav.Link>
            <Nav.Link as={Link} to="/reportes">Reportes</Nav.Link>
          </Nav>
          <Nav className="d-flex align-items-center">
            <div className="user-badge me-3">
              <div className="avatar">{(user?.name || user?.nombre || 'U')[0]}</div>
              <div className="d-none d-sm-block text-white ps-2">
                <div className="user-name">{user?.name || user?.nombre || 'Usuario'}</div>
                <small className="text-white-50">{user?.rol || ''}</small>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>Cerrar Sesión</button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default CustomNavbar;