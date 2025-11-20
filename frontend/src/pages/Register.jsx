import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Container, Row, Col, Card, Form, Button, Alert, InputGroup } from "react-bootstrap";
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthContext";
import "../styles/LoginStyle.css"; // Reutilizamos los mismos estilos

const Register = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        rol: "tutor" // Valor por defecto
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const auth = useAuth();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        // Validaciones
        if (formData.password !== formData.confirmPassword) {
            setError("Las contraseñas no coinciden");
            setIsSubmitting(false);
            return;
        }

        if (formData.password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres");
            setIsSubmitting(false);
            return;
        }

        try {
            if (!auth) throw new Error('Auth no disponible');

            const res = await auth.register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                rol: formData.rol
            });

            if (res.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Registro exitoso',
                    text: 'Tu cuenta ha sido creada correctamente',
                    timer: 1500,
                    showConfirmButton: false
                });
                setTimeout(() => navigate('/login'), 1500);
            } else {
                setError(res.error || 'Error al registrar usuario');
            }
        } catch (error) {
            setError(error.message || 'Error de conexión');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-page">
            <Container>
                <Row className="justify-content-center align-items-center min-vh-100 py-5">
                    <Col md={7} lg={6}>
                        <Card className="login-card shadow-lg border-0">
                            <Card.Body className="p-5">
                                {/* Header */}
                                <div className="text-center mb-4">
                                    <div className="login-icon mb-3">
                                        <i className="bi bi-person-plus-fill"></i>
                                    </div>
                                    <h2 className="fw-bold mb-2">Crear Cuenta</h2>
                                    <p className="text-muted">Regístrate en el Sistema de Tutorías</p>
                                </div>

                                {/* Error Alert */}
                                {error && (
                                    <Alert variant="danger" dismissible onClose={() => setError("")}>
                                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                        {error}
                                    </Alert>
                                )}

                                {/* Form */}
                                <Form onSubmit={handleSubmit}>
                                    {/* Nombre */}
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-semibold">
                                            <i className="bi bi-person me-2"></i>
                                            Nombre Completo
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="name"
                                            placeholder="Juan Pérez"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="form-control-lg"
                                            disabled={isSubmitting}
                                            required
                                        />
                                    </Form.Group>

                                    {/* Email */}
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-semibold">
                                            <i className="bi bi-envelope me-2"></i>
                                            Correo Electrónico
                                        </Form.Label>
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            placeholder="tu@correo.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="form-control-lg"
                                            disabled={isSubmitting}
                                            required
                                        />
                                    </Form.Group>

                                    {/* Rol */}
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-semibold">
                                            <i className="bi bi-briefcase me-2"></i>
                                            Rol
                                        </Form.Label>
                                        <Form.Select
                                            name="rol"
                                            value={formData.rol}
                                            onChange={handleChange}
                                            className="form-control-lg"
                                            disabled={isSubmitting}
                                            required
                                        >
                                            <option value="tutor">Tutor</option>
                                            <option value="coordinacion">Coordinación</option>
                                            <option value="jefeDivision">Jefe de División</option>
                                            <option value="docenteAsesor">Docente Asesor</option>
                                        </Form.Select>
                                    </Form.Group>

                                    {/* Contraseña */}
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-semibold">
                                            <i className="bi bi-lock me-2"></i>
                                            Contraseña
                                        </Form.Label>
                                        <InputGroup>
                                            <Form.Control
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={handleChange}
                                                className="form-control-lg"
                                                disabled={isSubmitting}
                                                required
                                            />
                                            <Button
                                                variant="outline-secondary"
                                                onClick={() => setShowPassword(!showPassword)}
                                                disabled={isSubmitting}
                                            >
                                                <i className={`bi bi-eye${showPassword ? '-slash' : ''}-fill`}></i>
                                            </Button>
                                        </InputGroup>
                                        <Form.Text className="text-muted">
                                            Mínimo 6 caracteres
                                        </Form.Text>
                                    </Form.Group>

                                    {/* Confirmar Contraseña */}
                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-semibold">
                                            <i className="bi bi-lock-fill me-2"></i>
                                            Confirmar Contraseña
                                        </Form.Label>
                                        <InputGroup>
                                            <Form.Control
                                                type={showConfirmPassword ? "text" : "password"}
                                                name="confirmPassword"
                                                placeholder="••••••••"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                className="form-control-lg"
                                                disabled={isSubmitting}
                                                required
                                            />
                                            <Button
                                                variant="outline-secondary"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                disabled={isSubmitting}
                                            >
                                                <i className={`bi bi-eye${showConfirmPassword ? '-slash' : ''}-fill`}></i>
                                            </Button>
                                        </InputGroup>
                                    </Form.Group>

                                    {/* Submit Button */}
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="lg"
                                        className="w-100 mb-3 btn-login"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Creando cuenta...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-person-plus me-2"></i>
                                                Crear Cuenta
                                            </>
                                        )}
                                    </Button>

                                    {/* Login Link */}
                                    <div className="text-center">
                                        <p className="text-muted mb-0">
                                            ¿Ya tienes cuenta?{" "}
                                            <Link to="/login" className="text-decoration-none fw-semibold">
                                                Inicia sesión aquí
                                            </Link>
                                        </p>
                                    </div>
                                </Form>
                            </Card.Body>
                        </Card>

                        {/* Back to Home */}
                        <div className="text-center mt-3">
                            <Link to="/" className="text-white text-decoration-none">
                                <i className="bi bi-arrow-left me-2"></i>
                                Volver al inicio
                            </Link>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default Register;
