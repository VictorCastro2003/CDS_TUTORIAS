import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal, Form, Alert, Tabs, Tab } from 'react-bootstrap';
import axios from 'axios';
import Swal from 'sweetalert2';
import { jwtDecode } from 'jwt-decode';
import '../styles/DashboardStyle.css';

export default function CanalizacionesWorkflow() {
  const [canalizaciones, setCanalizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');
  const [userDivision, setUserDivision] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedCanalizacion, setSelectedCanalizacion] = useState(null);
  const [docentes, setDocentes] = useState([]);
  const [jefes, setJefes] = useState([]);
  const [activeTab, setActiveTab] = useState('todas');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const decoded = jwtDecode(token);

      setUserRole(decoded.rol);
      setUserId(decoded.id);
      setUserDivision(decoded.division || '');

      // Cargar canalizaciones según el rol
      let url = 'http://localhost:4000/api/canalizaciones';

      if (decoded.rol === 'tutor') {
        url += `?tutorId=${decoded.id}`;
      } else if (decoded.rol === 'jefeDivision') {
        url += `?division=${decoded.division}`;
      }
      // Coordinación ve todas las canalizaciones (sin filtro)

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCanalizaciones(response.data);

      // Cargar usuarios para asignaciones
      const usersResponse = await axios.get('http://localhost:4000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setDocentes(usersResponse.data.filter(u => u.rol === 'docente'));
      setJefes(usersResponse.data.filter(u => u.rol === 'jefeDivision'));

    } catch (error) {
      console.error('Error al cargar datos:', error);
      Swal.fire('Error', 'No se pudieron cargar las canalizaciones', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getWorkflowBadge = (estado) => {
    const badges = {
      creada: { color: 'secondary', text: 'Creada', icon: 'fa-plus-circle' },
      enviada_jefe_division: { color: 'info', text: 'Enviada a Jefe', icon: 'fa-paper-plane' },
      enviada_coordinacion: { color: 'info', text: 'En Coordinación', icon: 'fa-paper-plane' },
      asignada_docente: { color: 'primary', text: 'Asignada a Docente', icon: 'fa-user-check' },
      en_atencion: { color: 'warning', text: 'En Atención', icon: 'fa-hourglass-half' },
      contrarreferencia_generada: { color: 'success', text: 'Contrarreferencia', icon: 'fa-check-circle' },
      finalizada: { color: 'dark', text: 'Finalizada', icon: 'fa-flag-checkered' }
    };
    return badges[estado] || badges.creada;
  };

  const getTipoBadge = (tipo) => {
    const badges = {
      academica: { color: 'primary', icon: 'fa-book' },
      psicologica: { color: 'danger', icon: 'fa-brain' },
      medica: { color: 'warning', icon: 'fa-heartbeat' },
      otra: { color: 'secondary', icon: 'fa-question' }
    };
    return badges[tipo] || badges.otra;
  };

  const handleAccion = (canalizacion, tipo) => {
    setSelectedCanalizacion(canalizacion);
    setModalType(tipo);
    setShowModal(true);
  };

  const ejecutarAccion = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      let url = '';
      let data = {};

      switch (modalType) {
        case 'enviar_jefe':
          url = `http://localhost:4000/api/workflow/${selectedCanalizacion.id}/enviar-jefe-division`;
          data = { jefe_division_id: formData.jefe_division_id };
          break;
        case 'asignar_docente':
          url = `http://localhost:4000/api/workflow/${selectedCanalizacion.id}/asignar-docente`;
          data = { docente_asesor_id: formData.docente_asesor_id };
          break;
        case 'enviar_coordinacion':
          url = `http://localhost:4000/api/workflow/${selectedCanalizacion.id}/enviar-coordinacion`;
          data = { coordinacion_id: formData.coordinacion_id };
          break;
        case 'iniciar_atencion':
          url = `http://localhost:4000/api/workflow/${selectedCanalizacion.id}/iniciar-atencion`;
          data = { psicologo_id: userId };
          break;
        case 'contrarreferencia_academica':
          url = `http://localhost:4000/api/workflow/${selectedCanalizacion.id}/contrarreferencia-academica`;
          data = { contrarreferencia: formData.contrarreferencia, generada_por: userId };
          break;
        case 'contrarreferencia_psicologica':
          url = `http://localhost:4000/api/workflow/${selectedCanalizacion.id}/contrarreferencia-psicologica`;
          data = {
            contrarreferencia: formData.contrarreferencia,
            generada_por: userId,
            jefe_division_id: formData.jefe_division_id
          };
          break;
        default:
          return;
      }

      await axios.post(url, data, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Swal.fire('¡Éxito!', 'Acción realizada correctamente', 'success');
      setShowModal(false);
      cargarDatos();
    } catch (error) {
      console.error('Error al ejecutar acción:', error);
      Swal.fire('Error', error.response?.data?.message || 'No se pudo completar la acción', 'error');
    }
  };

  const renderAcciones = (canalizacion) => {
    const acciones = [];

    // Tutor puede enviar canalizaciones creadas
    if (userRole === 'tutor' && canalizacion.workflow_estado === 'creada') {
      if (canalizacion.tipo_canalizacion === 'academica') {
        acciones.push(
          <Button
            key="enviar_jefe"
            size="sm"
            variant="primary"
            onClick={() => handleAccion(canalizacion, 'enviar_jefe')}
            className="me-1"
          >
            <i className="fas fa-paper-plane me-1"></i>
            Enviar a Jefe
          </Button>
        );
      } else if (canalizacion.tipo_canalizacion === 'psicologica') {
        acciones.push(
          <Button
            key="enviar_coord"
            size="sm"
            variant="danger"
            onClick={() => handleAccion(canalizacion, 'enviar_coordinacion')}
            className="me-1"
          >
            <i className="fas fa-paper-plane me-1"></i>
            Enviar a Coordinación
          </Button>
        );
      }
    }

    // Jefe de División puede asignar docentes
    if (userRole === 'jefeDivision' &&
      canalizacion.workflow_estado === 'enviada_jefe_division' &&
      canalizacion.tipo_canalizacion === 'academica') {
      acciones.push(
        <Button
          key="asignar_doc"
          size="sm"
          variant="success"
          onClick={() => handleAccion(canalizacion, 'asignar_docente')}
          className="me-1"
        >
          <i className="fas fa-user-plus me-1"></i>
          Asignar Docente
        </Button>
      );
    }

    // Coordinación puede iniciar atención psicológica
    if (userRole === 'coordinacion' &&
      canalizacion.workflow_estado === 'enviada_coordinacion' &&
      canalizacion.tipo_canalizacion === 'psicologica') {
      acciones.push(
        <Button
          key="iniciar_atencion"
          size="sm"
          variant="warning"
          onClick={() => handleAccion(canalizacion, 'iniciar_atencion')}
          className="me-1"
        >
          <i className="fas fa-play me-1"></i>
          Iniciar Atención
        </Button>
      );
    }

    // Docente puede generar contrarreferencia académica
    if (userRole === 'docente' &&
      canalizacion.workflow_estado === 'asignada_docente' &&
      canalizacion.docente_asesor_id === userId) {
      acciones.push(
        <Button
          key="contraref_acad"
          size="sm"
          variant="info"
          onClick={() => handleAccion(canalizacion, 'contrarreferencia_academica')}
          className="me-1"
        >
          <i className="fas fa-file-alt me-1"></i>
          Generar Contrarreferencia
        </Button>
      );
    }

    // Coordinación/Psicólogo puede generar contrarreferencia psicológica
    if (userRole === 'coordinacion' &&
      canalizacion.workflow_estado === 'en_atencion' &&
      canalizacion.tipo_canalizacion === 'psicologica') {
      acciones.push(
        <Button
          key="contraref_psic"
          size="sm"
          variant="info"
          onClick={() => handleAccion(canalizacion, 'contrarreferencia_psicologica')}
          className="me-1"
        >
          <i className="fas fa-file-medical me-1"></i>
          Generar Contrarreferencia
        </Button>
      );
    }

    return acciones;
  };

  const filtrarCanalizaciones = () => {
    switch (activeTab) {
      case 'pendientes':
        return canalizaciones.filter(c =>
          c.workflow_estado !== 'finalizada' && c.workflow_estado !== 'contrarreferencia_generada'
        );
      case 'academicas':
        return canalizaciones.filter(c => c.tipo_canalizacion === 'academica');
      case 'psicologicas':
        return canalizaciones.filter(c => c.tipo_canalizacion === 'psicologica');
      case 'finalizadas':
        return canalizaciones.filter(c =>
          c.workflow_estado === 'finalizada' || c.workflow_estado === 'contrarreferencia_generada'
        );
      default:
        return canalizaciones;
    }
  };

  if (loading) {
    return (
      <div className="login-wrapper">
        <div className="login-background"></div>
        <div className="login-container text-center mt-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-3">Cargando canalizaciones...</p>
        </div>
      </div>
    );
  }

  const canalizacionesFiltradas = filtrarCanalizaciones();

  return (
    <div className="login-wrapper">
      <div className="login-background"></div>

      <Container fluid className="login-container expanded-container">
        <div className="login-header text-center mb-4">
          <h2>
            <i className="fas fa-clipboard-list me-2"></i>
            Gestión de Canalizaciones
          </h2>
          <p>Sistema de Workflow Académico y Psicológico</p>
          {userRole === 'jefeDivision' && (
            <Badge bg="info" className="mt-2">
              <i className="fas fa-building me-1"></i>
              División: {userDivision}
            </Badge>
          )}
        </div>

        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-4"
          fill
        >
          <Tab eventKey="todas" title={<span><i className="fas fa-list me-1"></i>Todas ({canalizaciones.length})</span>} />
          <Tab eventKey="pendientes" title={<span><i className="fas fa-clock me-1"></i>Pendientes</span>} />
          <Tab eventKey="academicas" title={<span><i className="fas fa-book me-1"></i>Académicas</span>} />
          <Tab eventKey="psicologicas" title={<span><i className="fas fa-brain me-1"></i>Psicológicas</span>} />
          <Tab eventKey="finalizadas" title={<span><i className="fas fa-check-circle me-1"></i>Finalizadas</span>} />
        </Tabs>

        <Row>
          {canalizacionesFiltradas.length > 0 ? (
            canalizacionesFiltradas.map((canalizacion) => {
              const workflowBadge = getWorkflowBadge(canalizacion.workflow_estado);
              const tipoBadge = getTipoBadge(canalizacion.tipo_canalizacion);

              return (
                <Col key={canalizacion.id} md={6} lg={4} className="mb-4">
                  <Card className="h-100 shadow-sm hover-card">
                    <Card.Header className={`bg-${tipoBadge.color} text-white`}>
                      <div className="d-flex justify-content-between align-items-center">
                        <span>
                          <i className={`fas ${tipoBadge.icon} me-2`}></i>
                          {canalizacion.tipo_canalizacion.toUpperCase()}
                        </span>
                        <Badge bg={workflowBadge.color}>
                          <i className={`fas ${workflowBadge.icon} me-1`}></i>
                          {workflowBadge.text}
                        </Badge>
                      </div>
                    </Card.Header>

                    <Card.Body>
                      <h6 className="mb-3">
                        <i className="fas fa-user me-2"></i>
                        {canalizacion.alumno?.Nombre} {canalizacion.alumno?.Primer_Ap}
                      </h6>

                      <p className="text-muted small mb-2">
                        <i className="fas fa-id-card me-2"></i>
                        {canalizacion.alumno?.Num_Control}
                      </p>

                      <p className="text-muted small mb-2">
                        <i className="fas fa-graduation-cap me-2"></i>
                        {canalizacion.alumno?.Carrera}
                      </p>

                      <p className="text-muted small mb-2">
                        <i className="fas fa-user-tie me-2"></i>
                        Tutor: {canalizacion.tutor?.name}
                      </p>

                      <p className="mb-2">
                        <strong>Motivo:</strong> {canalizacion.motivo?.substring(0, 100)}...
                      </p>

                      <p className="text-muted small">
                        <i className="fas fa-calendar me-2"></i>
                        {new Date(canalizacion.fecha).toLocaleDateString('es-MX')}
                      </p>

                      {canalizacion.contrarreferencia && (
                        <Alert variant="success" className="mt-3 mb-0">
                          <small>
                            <i className="fas fa-check-circle me-1"></i>
                            Contrarreferencia disponible
                          </small>
                        </Alert>
                      )}
                    </Card.Body>

                    <Card.Footer className="bg-light">
                      <div className="d-flex flex-wrap gap-1">
                        {renderAcciones(canalizacion)}
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => {
                            Swal.fire({
                              title: 'Detalles de Canalización',
                              html: `
                                <div class="text-start">
                                  <p><strong>Alumno:</strong> ${canalizacion.alumno?.Nombre} ${canalizacion.alumno?.Primer_Ap}</p>
                                  <p><strong>Tipo:</strong> ${canalizacion.tipo_canalizacion}</p>
                                  <p><strong>Motivo:</strong> ${canalizacion.motivo}</p>
                                  ${canalizacion.contrarreferencia ? `<p><strong>Contrarreferencia:</strong> ${canalizacion.contrarreferencia}</p>` : ''}
                                </div>
                              `,
                              width: 600
                            });
                          }}
                        >
                          <i className="fas fa-eye"></i>
                        </Button>
                      </div>
                    </Card.Footer>
                  </Card>
                </Col>
              );
            })
          ) : (
            <Col>
              <Alert variant="info" className="text-center">
                <i className="fas fa-info-circle me-2"></i>
                No hay canalizaciones en esta categoría
              </Alert>
            </Col>
          )}
        </Row>

        {/* Modal para acciones */}
        <ModalAccion
          show={showModal}
          onHide={() => setShowModal(false)}
          tipo={modalType}
          onSubmit={ejecutarAccion}
          docentes={docentes}
          jefes={jefes}
        />
      </Container>
    </div>
  );
}

// Componente Modal para las acciones
function ModalAccion({ show, onHide, tipo, onSubmit, docentes, jefes }) {
  const [formData, setFormData] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const renderFormContent = () => {
    switch (tipo) {
      case 'enviar_jefe':
        return (
          <Form.Group>
            <Form.Label>Seleccionar Jefe de División</Form.Label>
            <Form.Select
              required
              onChange={(e) => setFormData({ ...formData, jefe_division_id: e.target.value })}
            >
              <option value="">Seleccione...</option>
              {jefes.map(jefe => (
                <option key={jefe.id} value={jefe.id}>{jefe.name} - {jefe.division}</option>
              ))}
            </Form.Select>
          </Form.Group>
        );

      case 'asignar_docente':
        return (
          <Form.Group>
            <Form.Label>Seleccionar Docente Asesor</Form.Label>
            <Form.Select
              required
              onChange={(e) => setFormData({ ...formData, docente_asesor_id: e.target.value })}
            >
              <option value="">Seleccione...</option>
              {docentes.map(docente => (
                <option key={docente.id} value={docente.id}>{docente.name}</option>
              ))}
            </Form.Select>
          </Form.Group>
        );

      case 'enviar_coordinacion':
        return (
          <Form.Group>
            <Form.Label>Seleccionar Coordinador</Form.Label>
            <Form.Select
              required
              onChange={(e) => setFormData({ ...formData, coordinacion_id: e.target.value })}
            >
              <option value="">Seleccione...</option>
              {/* Aquí deberías cargar los coordinadores */}
              <option value="1">Coordinación de Tutorías</option>
            </Form.Select>
          </Form.Group>
        );

      case 'contrarreferencia_academica':
      case 'contrarreferencia_psicologica':
        return (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Contrarreferencia</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                required
                placeholder="Escriba la contrarreferencia detallada..."
                onChange={(e) => setFormData({ ...formData, contrarreferencia: e.target.value })}
              />
            </Form.Group>
            {tipo === 'contrarreferencia_psicologica' && (
              <Form.Group>
                <Form.Label>Enviar copia a Jefe de División</Form.Label>
                <Form.Select
                  required
                  onChange={(e) => setFormData({ ...formData, jefe_division_id: e.target.value })}
                >
                  <option value="">Seleccione...</option>
                  {jefes.map(jefe => (
                    <option key={jefe.id} value={jefe.id}>{jefe.name} - {jefe.division}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}
          </>
        );

      default:
        return <p>Confirme la acción</p>;
    }
  };

  const getTitulo = () => {
    const titulos = {
      enviar_jefe: 'Enviar a Jefe de División',
      asignar_docente: 'Asignar Docente Asesor',
      enviar_coordinacion: 'Enviar a Coordinación',
      iniciar_atencion: 'Iniciar Atención Psicológica',
      contrarreferencia_academica: 'Generar Contrarreferencia Académica',
      contrarreferencia_psicologica: 'Generar Contrarreferencia Psicológica'
    };
    return titulos[tipo] || 'Acción';
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{getTitulo()}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {renderFormContent()}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit">
            Confirmar
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
