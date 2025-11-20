import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import './LandingPage.css';

export default function LandingPage() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    // Si ya está autenticado, redirigir al dashboard
    React.useEffect(() => {
        if (token) {
            navigate('/alumnos');
        }
    }, [token, navigate]);

    return (
        <div className="landing-page">
            {/* Hero Section */}
            <section className="hero-section">
                <Container>
                    <Row className="align-items-center min-vh-100">
                        <Col lg={6} className="text-white">
                            <h1 className="display-3 fw-bold mb-4 animate-fade-in">
                                Sistema de Tutorías
                            </h1>
                            <p className="lead mb-4 animate-fade-in-delay-1">
                                Plataforma integral para la gestión de tutorías académicas y canalizaciones psicológicas
                            </p>
                            <div className="d-flex gap-3 animate-fade-in-delay-2">
                                <Button
                                    as={Link}
                                    to="/login"
                                    variant="light"
                                    size="lg"
                                    className="px-5 py-3 fw-semibold"
                                >
                                    Iniciar Sesión
                                </Button>
                                <Button
                                    as={Link}
                                    to="/register"
                                    variant="outline-light"
                                    size="lg"
                                    className="px-5 py-3 fw-semibold"
                                >
                                    Registrarse
                                </Button>
                            </div>
                        </Col>
                        <Col lg={6} className="d-none d-lg-block">
                            <div className="hero-illustration animate-float">
                                <i className="bi bi-mortarboard-fill" style={{ fontSize: '15rem', color: 'rgba(255,255,255,0.2)' }}></i>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Features Section */}
            <section className="features-section py-5">
                <Container>
                    <h2 className="text-center mb-5 fw-bold">Funcionalidades Principales</h2>
                    <Row className="g-4">
                        <Col md={4}>
                            <Card className="feature-card h-100 border-0 shadow-lg">
                                <Card.Body className="text-center p-4">
                                    <div className="feature-icon mb-3">
                                        <i className="bi bi-people-fill"></i>
                                    </div>
                                    <Card.Title className="fw-bold">Gestión de Alumnos</Card.Title>
                                    <Card.Text className="text-muted">
                                        Administra y da seguimiento a todos tus alumnos de manera eficiente
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={4}>
                            <Card className="feature-card h-100 border-0 shadow-lg">
                                <Card.Body className="text-center p-4">
                                    <div className="feature-icon mb-3">
                                        <i className="bi bi-clipboard-check-fill"></i>
                                    </div>
                                    <Card.Title className="fw-bold">Canalizaciones</Card.Title>
                                    <Card.Text className="text-muted">
                                        Sistema completo de canalizaciones académicas y psicológicas
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={4}>
                            <Card className="feature-card h-100 border-0 shadow-lg">
                                <Card.Body className="text-center p-4">
                                    <div className="feature-icon mb-3">
                                        <i className="bi bi-bell-fill"></i>
                                    </div>
                                    <Card.Title className="fw-bold">Notificaciones</Card.Title>
                                    <Card.Text className="text-muted">
                                        Recibe alertas en tiempo real sobre eventos importantes
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={4}>
                            <Card className="feature-card h-100 border-0 shadow-lg">
                                <Card.Body className="text-center p-4">
                                    <div className="feature-icon mb-3">
                                        <i className="bi bi-graph-up-arrow"></i>
                                    </div>
                                    <Card.Title className="fw-bold">Estadísticas</Card.Title>
                                    <Card.Text className="text-muted">
                                        Visualiza métricas y reportes detallados de rendimiento
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={4}>
                            <Card className="feature-card h-100 border-0 shadow-lg">
                                <Card.Body className="text-center p-4">
                                    <div className="feature-icon mb-3">
                                        <i className="bi bi-file-earmark-text-fill"></i>
                                    </div>
                                    <Card.Title className="fw-bold">Reportes</Card.Title>
                                    <Card.Text className="text-muted">
                                        Genera documentos y reportes en formato Word automáticamente
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={4}>
                            <Card className="feature-card h-100 border-0 shadow-lg">
                                <Card.Body className="text-center p-4">
                                    <div className="feature-icon mb-3">
                                        <i className="bi bi-shield-check-fill"></i>
                                    </div>
                                    <Card.Title className="fw-bold">Seguridad</Card.Title>
                                    <Card.Text className="text-muted">
                                        Sistema seguro con autenticación y roles de usuario
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* CTA Section */}
            <section className="cta-section py-5">
                <Container>
                    <Row className="justify-content-center text-center">
                        <Col lg={8}>
                            <h2 className="fw-bold mb-4 text-white">¿Listo para comenzar?</h2>
                            <p className="lead mb-4 text-white-50">
                                Únete a nuestra plataforma y mejora la gestión de tutorías
                            </p>
                            <Button
                                as={Link}
                                to="/register"
                                variant="light"
                                size="lg"
                                className="px-5 py-3 fw-semibold"
                            >
                                Crear Cuenta Ahora
                            </Button>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Footer */}
            <footer className="footer-section py-4 bg-dark text-white-50">
                <Container>
                    <Row>
                        <Col className="text-center">
                            <p className="mb-0">
                                &copy; 2025 Sistema de Tutorías CDS. Todos los derechos reservados.
                            </p>
                        </Col>
                    </Row>
                </Container>
            </footer>
        </div>
    );
}
