import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "bootstrap/dist/css/bootstrap.min.css";
import CanalizacionForm from "./FormularioCanalizaciones";
import { jwtDecode } from 'jwt-decode';

// Importar los componentes de tabs
import AsignarMateriasTab from '../components/tabs/AsignarMateriasTab';
import EditarCalificacionesTab from '../components/tabs/EditarCalificacionesTab';

const AlumnoDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [alumno, setAlumno] = useState(null);
  const [calificaciones, setCalificaciones] = useState([]);
  const [activeTab, setActiveTab] = useState("info");
  const [loading, setLoading] = useState(true);
  const [filtroSemestre, setFiltroSemestre] = useState("");
  const [alertasActivas, setAlertasActivas] = useState([]);
  const [userRole, setUserRole] = useState('');

  const fetchWithAuth = async (url) => {
    const token = localStorage.getItem('token');
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await fetch(url, { headers });
    return res;
  };

  const fetchAlumno = async () => {
    try {
      const res = await fetchWithAuth(`http://localhost:4000/api/alumnos/${id}`);
      
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("No autorizado. Por favor inicia sesión.");
        }
        if (res.status === 404) {
          throw new Error("Alumno no encontrado");
        }
        throw new Error("Error al obtener datos del alumno");
      }
      
      const data = await res.json();
      console.log('Fecha_Nac recibida:', data.Fecha_Nac, typeof data.Fecha_Nac);
      setAlumno(data);
    } catch (error) {
      console.error("Error al cargar alumno:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
        confirmButtonText: "Volver al listado"
      }).then(() => {
        if (error.message.includes("autorizado")) {
          navigate("/login");
        } else {
          navigate("/alumnos");
        }
      });
    }
  };

  const fetchCalificaciones = async () => {
    try {
      const res = await fetchWithAuth(`http://localhost:4000/api/alumnos/${id}/calificaciones`);
      
      if (res.status === 404) {
        setCalificaciones([]);
        return;
      }
      
      if (!res.ok) {
        if (res.status === 401) {
          console.warn("No autorizado para ver calificaciones");
          return;
        }
        throw new Error("Error al cargar calificaciones");
      }
      
      const data = await res.json();
      console.log('📥 DATOS RECIBIDOS DEL BACKEND:');
      console.log('Total de registros:', data.length);
      if (data.length > 0) {
        console.log('Primera calificación:', data[0]);
        console.log('IDs en primera calificación:', {
          id: data[0].id,
          materia_id: data[0].materia_id
        });
      }
      
      setCalificaciones(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando calificaciones:", error);
      setCalificaciones([]);
    }
  };

  const fetchAlertas = async () => {
    try {
      const res = await fetchWithAuth(`http://localhost:4000/api/alertas/alumno/${id}`);
      if (res.ok) {
        const data = await res.json();
        setAlertasActivas(data.filter(a => a.estado === 'activa'));
      }
    } catch (error) {
      console.error('Error cargando alertas:', error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      setUserRole(decoded.rol);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAlumno(), fetchCalificaciones(), fetchAlertas()]);
      setLoading(false);
    };
    
    loadData();
  }, [id]);

  // Calcular estadísticas de calificaciones
  const estadisticas = React.useMemo(() => {
    if (calificaciones.length === 0) return null;
    
    const calificacionesNumericas = calificaciones
      .filter(c => c.calificacion !== 'Sin calificar' && !isNaN(c.calificacion))
      .map(c => parseFloat(c.calificacion));
    
    if (calificacionesNumericas.length === 0) return null;
    
    const promedio = (calificacionesNumericas.reduce((a, b) => a + b, 0) / calificacionesNumericas.length).toFixed(2);
    const aprobadas = calificacionesNumericas.filter(c => c >= 70).length;
    const reprobadas = calificacionesNumericas.filter(c => c < 70).length;
    const maxima = Math.max(...calificacionesNumericas);
    const minima = Math.min(...calificacionesNumericas);
    
    return { promedio, aprobadas, reprobadas, maxima, minima, total: calificacionesNumericas.length };
  }, [calificaciones]);

  // Filtrar calificaciones por semestre
  const calificacionesFiltradas = React.useMemo(() => {
    if (!filtroSemestre) return calificaciones;
    return calificaciones.filter(c => c.periodo.includes(filtroSemestre));
  }, [calificaciones, filtroSemestre]);

  // Obtener semestres únicos
  const semestresUnicos = React.useMemo(() => {
    const semestres = calificaciones
      .map(c => c.periodo.replace('Semestre ', ''))
      .filter(s => s !== 'N/A');
    return [...new Set(semestres)].sort((a, b) => a - b);
  }, [calificaciones]);

  // Función para formatear la fecha
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return "No especificada";

    let fechaStrLimpia = fechaStr.trim();
    if (!fechaStrLimpia.includes('T')) {
      fechaStrLimpia += 'T00:00:00';
    }
    const fecha = new Date(fechaStrLimpia);
    if (isNaN(fecha)) return "Fecha inválida";

    return fecha.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Función para calcular la edad
  const calcularEdad = (fechaStr) => {
    if (!fechaStr) return null;
    let fechaStrLimpia = fechaStr.trim();
    if (!fechaStrLimpia.includes('T')) {
      fechaStrLimpia += 'T00:00:00';
    }
    const nacimiento = new Date(fechaStrLimpia);
    if (isNaN(nacimiento)) return null;
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad >= 0 ? edad : null;
  };

  if (loading) {
    return (
      <div className="container text-center mt-5">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3 fw-bold">Cargando información del alumno...</p>
      </div>
    );
  }

  if (!alumno) {
    return (
      <div className="container text-center mt-5">
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          No se pudo cargar la información del alumno
        </div>
        <button className="btn btn-primary" onClick={() => navigate("/alumnos")}>
          <i className="bi bi-arrow-left me-2"></i>Volver al listado
        </button>
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-5">
      {/* Header con información básica */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => navigate("/alumnos")}
            >
              <i className="bi bi-arrow-left me-2"></i>Volver al listado
            </button>
            <div className="text-end">
              <span className="badge bg-primary fs-6">
                {alumno.Carrera || 'Sin carrera'}
              </span>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                 style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
              {alumno.Nombre.charAt(0)}{alumno.Primer_Ap.charAt(0)}
            </div>
            <h2 className="mb-2">
              {alumno.Nombre} {alumno.Primer_Ap} {alumno.Segundo_Ap || ''}
            </h2>
            <p className="text-muted mb-0">
              <strong>No. Control:</strong> {alumno.Num_Control}
            </p>
          </div>
        </div>
      </div>

      {/* Pestañas */}
      <ul className="nav nav-pills nav-fill mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "info" ? "active" : ""}`}
            onClick={() => setActiveTab("info")}
          >
            <i className="bi bi-person-circle me-2"></i>Información
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "grades" ? "active" : ""}`}
            onClick={() => setActiveTab("grades")}
          >
            <i className="bi bi-journal-text me-2"></i>Calificaciones
            {calificaciones.length > 0 && (
              <span className="badge bg-light text-dark ms-2">{calificaciones.length}</span>
            )}
          </button>
        </li>
        {userRole === 'tutor' && (
          <>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "materias" ? "active" : ""}`}
                onClick={() => setActiveTab("materias")}
              >
                <i className="bi bi-book me-2"></i>Asignar Materias
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "editGrades" ? "active" : ""}`}
                onClick={() => setActiveTab("editGrades")}
              >
                <i className="bi bi-pencil-square me-2"></i>Editar Calificaciones
              </button>
            </li>
          </>
        )}
        {alertasActivas.length > 0 && (
          <div className="alert alert-warning mt-4">
            <h6 className="mb-3"><i className="bi bi-exclamation-triangle me-2"></i>Alertas Activas</h6>
            {alertasActivas.map(alerta => (
              <div key={alerta.id} className="mb-2">
                <span className="badge bg-danger me-2">{alerta.tipo_alerta.replace('_', ' ')}</span>
                {alerta.descripcion}
              </div>
            ))}
          </div>
        )}
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "canal" ? "active" : ""}`}
            onClick={() => setActiveTab("canal")}
          >
            <i className="bi bi-clipboard-pulse me-2"></i>Canalización
          </button>
        </li>
      </ul>

      {/* Contenido de pestañas */}
      <div className="tab-content">
        {/* TAB: Información */}
        {activeTab === "info" && (
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0"><i className="bi bi-info-circle me-2"></i>Información General</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <div className="border rounded p-3 h-100">
                    <h6 className="text-primary mb-3">Datos Personales</h6>
                    <table className="table table-sm table-borderless mb-0">
                      <tbody>
                        <tr>
                          <td className="fw-bold" style={{ width: '40%' }}>Nombre completo:</td>
                          <td>{alumno.Nombre} {alumno.Primer_Ap} {alumno.Segundo_Ap || ''}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold">Fecha de nacimiento:</td>
                          <td>
                            {alumno.Fecha_Nac ? (
                              <>
                                {formatearFecha(alumno.Fecha_Nac)}
                                {calcularEdad(alumno.Fecha_Nac) && (
                                  <span className="text-muted ms-2">({calcularEdad(alumno.Fecha_Nac)} años)</span>
                                )}
                              </>
                            ) : (
                              <span className="text-muted">No especificada</span>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="col-md-6 mb-3">
                  <div className="border rounded p-3 h-100">
                    <h6 className="text-primary mb-3">Datos Académicos</h6>
                    <table className="table table-sm table-borderless mb-0">
                      <tbody>
                        <tr>
                          <td className="fw-bold" style={{ width: '40%' }}>No. Control:</td>
                          <td><span className="badge bg-secondary">{alumno.Num_Control}</span></td>
                        </tr>
                        <tr>
                          <td className="fw-bold">Carrera:</td>
                          <td>{alumno.Carrera || <span className="text-muted">No asignada</span>}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold">Semestre actual:</td>
                          <td>
                            <span className="badge bg-info">
                              {alumno.Semestre ? `${alumno.Semestre}° Semestre` : 'No especificado'}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {estadisticas && (
                <div className="mt-4">
                  <h6 className="text-primary mb-3">Resumen Académico</h6>
                  <div className="row text-center">
                    <div className="col-md-3 mb-3">
                      <div className="border rounded p-3 bg-light">
                        <div className="display-6 text-primary fw-bold">{estadisticas.promedio}</div>
                        <small className="text-muted">Promedio General</small>
                      </div>
                    </div>
                    <div className="col-md-3 mb-3">
                      <div className="border rounded p-3 bg-light">
                        <div className="display-6 text-success fw-bold">{estadisticas.aprobadas}</div>
                        <small className="text-muted">Materias Aprobadas</small>
                      </div>
                    </div>
                    <div className="col-md-3 mb-3">
                      <div className="border rounded p-3 bg-light">
                        <div className="display-6 text-danger fw-bold">{estadisticas.reprobadas}</div>
                        <small className="text-muted">Materias Reprobadas</small>
                      </div>
                    </div>
                    <div className="col-md-3 mb-3">
                      <div className="border rounded p-3 bg-light">
                        <div className="display-6 text-info fw-bold">{estadisticas.total}</div>
                        <small className="text-muted">Total Calificadas</small>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: Asignar Materias */}
        {activeTab === "materias" && (
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="bi bi-book me-2"></i>Asignar Materias
              </h5>
            </div>
            <div className="card-body">
              <AsignarMateriasTab 
                alumnoId={id} 
                alumno={alumno} 
                onMateriasActualizadas={fetchCalificaciones} 
              />
            </div>
          </div>
        )}

        {/* TAB: Calificaciones */}
        {activeTab === "grades" && (
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0"><i className="bi bi-journal-text me-2"></i>Calificaciones</h5>
                {semestresUnicos.length > 0 && (
                  <select 
                    className="form-select form-select-sm" 
                    style={{ width: 'auto' }}
                    value={filtroSemestre}
                    onChange={(e) => setFiltroSemestre(e.target.value)}
                  >
                    <option value="">Todos los semestres</option>
                    {semestresUnicos.map(sem => (
                      <option key={sem} value={sem}>Semestre {sem}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <div className="card-body">
              {calificacionesFiltradas.length > 0 ? (
                <>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>#</th>
                          <th>Materia</th>
                          <th className="text-center">Calificación</th>
                          <th className="text-center">Periodo</th>
                          <th className="text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calificacionesFiltradas.map((c, i) => {
                          const calNum = parseFloat(c.calificacion);
                          const esAprobada = !isNaN(calNum) && calNum >= 70;
                          const esSinCalificar = c.calificacion === 'Sin calificar';
                          
                          return (
                            <tr key={i}>
                              <td className="text-muted">{i + 1}</td>
                              <td className="fw-semibold">{c.materia}</td>
                              <td className="text-center">
                                <span className={`badge fs-6 ${
                                  esSinCalificar ? 'bg-warning text-dark' :
                                  esAprobada ? 'bg-success' : 'bg-danger'
                                }`}>
                                  {c.calificacion}
                                </span>
                              </td>
                              <td className="text-center">
                                <span className="badge bg-secondary">{c.periodo}</span>
                              </td>
                              <td className="text-center">
                                {esSinCalificar ? (
                                  <i className="bi bi-hourglass-split text-warning" title="Pendiente"></i>
                                ) : esAprobada ? (
                                  <i className="bi bi-check-circle-fill text-success" title="Aprobada"></i>
                                ) : (
                                  <i className="bi bi-x-circle-fill text-danger" title="Reprobada"></i>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  {filtroSemestre && (
                    <div className="alert alert-info mb-0 mt-3">
                      <i className="bi bi-info-circle me-2"></i>
                      Mostrando {calificacionesFiltradas.length} materias del Semestre {filtroSemestre}
                    </div>
                  )}
                </>
              ) : (
                <div className="alert alert-info mb-0">
                  <div className="text-center py-4">
                    <i className="bi bi-inbox display-1 text-muted"></i>
                    <h5 className="mt-3">No hay calificaciones registradas</h5>
                    <p className="text-muted mb-0">
                      {filtroSemestre 
                        ? `No se encontraron calificaciones para el Semestre ${filtroSemestre}`
                        : 'Este alumno aún no tiene calificaciones asignadas'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: Editar Calificaciones */}
        {activeTab === "editGrades" && (
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="bi bi-pencil-square me-2"></i>Editar Calificaciones
              </h5>
            </div>
            <div className="card-body">
              <EditarCalificacionesTab 
                calificaciones={calificaciones} 
                alumnoId={id}
                onCalificacionesActualizadas={fetchCalificaciones}
              />
            </div>
          </div>
        )}

        {/* TAB: Canalización */}
        {activeTab === "canal" && (
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="bi bi-clipboard-pulse me-2"></i>
                Canalización del Alumno
              </h5>
            </div>
            <div className="card-body">
              <CanalizacionForm 
                alumno_id={id} 
                nombreAlumno={`${alumno.Nombre} ${alumno.Primer_Ap} ${alumno.Segundo_Ap || ''}`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlumnoDetalle;