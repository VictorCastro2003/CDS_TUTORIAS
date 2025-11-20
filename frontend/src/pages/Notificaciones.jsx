import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, ListGroup, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import Swal from 'sweetalert2';
import './Notificaciones.css';

export default function Notificaciones() {
    const [notificaciones, setNotificaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState('todas'); // 'todas', 'no_leidas', 'leidas'
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const decoded = jwtDecode(token);
            setUserId(decoded.id);
        }
        cargarNotificaciones();
    }, [filtro]);

    const cargarNotificaciones = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const decoded = jwtDecode(token);

            let url = `http://localhost:4000/api/notificaciones/usuario/${decoded.id}`;

            if (filtro === 'no_leidas') {
                url += '?leida=false';
            } else if (filtro === 'leidas') {
                url += '?leida=true';
            }

            const response = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setNotificaciones(response.data);
        } catch (error) {
            console.error('Error al cargar notificaciones:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar las notificaciones'
            });
        } finally {
            setLoading(false);
        }
    };

    const marcarComoLeida = async (notifId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `http://localhost:4000/api/notificaciones/${notifId}/leer`,
                {},
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            cargarNotificaciones();
        } catch (error) {
            console.error('Error al marcar como leída:', error);
        }
    };

    const marcarTodasComoLeidas = async () => {
        try {
            const token = localStorage.getItem('token');
            const noLeidas = notificaciones.filter(n => !n.leida);

            for (const notif of noLeidas) {
                await axios.put(
                    `http://localhost:4000/api/notificaciones/${notif.id}/leer`,
                    {},
                    {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }
                );
            }

            Swal.fire({
                icon: 'success',
                title: '¡Listo!',
                text: 'Todas las notificaciones han sido marcadas como leídas',
                timer: 2000,
                showConfirmButton: false
            });

            cargarNotificaciones();
        } catch (error) {
            console.error('Error al marcar todas como leídas:', error);
        }
    };

    const getTipoIcon = (tipo) => {
        const icons = {
            'canalizacion_creada': 'bi-plus-circle-fill text-primary',
            'canalizacion_actualizada': 'bi-arrow-repeat text-info',
            'contrarreferencia_recibida': 'bi-file-earmark-check-fill text-success',
            'asignacion_tutor': 'bi-person-check-fill text-warning',
            'default': 'bi-bell-fill text-secondary'
        };
        return icons[tipo] || icons.default;
    };

    const formatFecha = (fecha) => {
        const date = new Date(fecha);
        const ahora = new Date();
        const diffMs = ahora - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours} h`;
        if (diffDays < 7) return `Hace ${diffDays} días`;

        return date.toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Cargando notificaciones...</p>
            </Container>
        );
    }

    const noLeidas = notificaciones.filter(n => !n.leida).length;

    return (
        <Container className="notificaciones-page py-4">
            <Row className="mb-4">
                <Col>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h2 className="fw-bold mb-1">
                                <i className="bi bi-bell-fill me-2"></i>
                                Notificaciones
                            </h2>
                            <p className="text-muted mb-0">
                                {noLeidas > 0 ? `Tienes ${noLeidas} notificación${noLeidas > 1 ? 'es' : ''} sin leer` : 'No tienes notificaciones sin leer'}
                            </p>
                        </div>
                        {noLeidas > 0 && (
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={marcarTodasComoLeidas}
                            >
                                <i className="bi bi-check-all me-1"></i>
                                Marcar todas como leídas
                            </Button>
                        )}
                    </div>
                </Col>
            </Row>

            {/* Filtros */}
            <Row className="mb-4">
                <Col>
                    <div className="btn-group" role="group">
                        <button
                            type="button"
                            className={`btn ${filtro === 'todas' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setFiltro('todas')}
                        >
                            Todas ({notificaciones.length})
                        </button>
                        <button
                            type="button"
                            className={`btn ${filtro === 'no_leidas' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setFiltro('no_leidas')}
                        >
                            No leídas ({noLeidas})
                        </button>
                        <button
                            type="button"
                            className={`btn ${filtro === 'leidas' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setFiltro('leidas')}
                        >
                            Leídas ({notificaciones.length - noLeidas})
                        </button>
                    </div>
                </Col>
            </Row>

            {/* Lista de Notificaciones */}
            <Row>
                <Col>
                    {notificaciones.length === 0 ? (
                        <Card className="text-center py-5">
                            <Card.Body>
                                <i className="bi bi-inbox" style={{ fontSize: '4rem', color: '#ccc' }}></i>
                                <p className="text-muted mt-3 mb-0">No hay notificaciones para mostrar</p>
                            </Card.Body>
                        </Card>
                    ) : (
                        <ListGroup>
                            {notificaciones.map((notif) => (
                                <ListGroup.Item
                                    key={notif.id}
                                    className={`notificacion-item ${!notif.leida ? 'notificacion-no-leida' : ''}`}
                                    onClick={() => !notif.leida && marcarComoLeida(notif.id)}
                                    style={{ cursor: !notif.leida ? 'pointer' : 'default' }}
                                >
                                    <div className="d-flex align-items-start">
                                        <div className="notificacion-icon me-3">
                                            <i className={`bi ${getTipoIcon(notif.tipo)}`}></i>
                                        </div>
                                        <div className="flex-grow-1">
                                            <div className="d-flex justify-content-between align-items-start mb-1">
                                                <h6 className="mb-1 fw-semibold">
                                                    {notif.titulo}
                                                    {!notif.leida && (
                                                        <Badge bg="primary" className="ms-2">Nueva</Badge>
                                                    )}
                                                </h6>
                                                <small className="text-muted">{formatFecha(notif.fecha_creacion)}</small>
                                            </div>
                                            <p className="mb-0 text-muted">{notif.mensaje}</p>
                                        </div>
                                    </div>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    )}
                </Col>
            </Row>
        </Container>
    );
}
