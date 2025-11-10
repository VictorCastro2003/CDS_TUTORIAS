import React from 'react';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';

const CustomNavbar = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  // Add null check
  if (!auth) {
    return (
      <Navbar bg="primary" variant="dark" expand="lg" className="shadow-sm">
        <Container fluid>
          <Navbar.Brand as={Link} to="/" className="fw-bold">
            🏫 Sistema ABC
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
    <Navbar bg="primary" variant="dark" expand="lg" className="shadow-sm">
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
          <Nav>
            <NavDropdown title={user?.nombre || 'Usuario'} id="user-dropdown" align="end">
              <NavDropdown.ItemText>
                <small>{user?.email}</small>
              </NavDropdown.ItemText>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={handleLogout}>
                Cerrar Sesión
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default CustomNavbar;