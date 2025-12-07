import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import fetchWithAuth from '../utils/fetchWithAuth';

import ModalCrearGrupo from '../components/modales/ModalCrearGrupo';
import ModalEditarGrupo from '../components/modales/ModalEditarGrupo';
import ModalAsignarTutor from '../components/modales/ModalAsignarTutor';
import ModalAsignarAlumnos from '../components/modales/ModalAsignarAlumnos';
import ModalAgregarAlumno from '../components/modales/ModalAgregarAlumno';
import ModalEditarAlumno from '../components/modales/ModalEditarAlumno';
import ModalCerrarPeriodo from '../components/modales/ModalCerrarPeriodo';
import ModalEstadisticas from '../components/modales/ModalEstadisticas';
import ModalCanalizacionesCoordinacion from '../components/modales/ModalCanalizacionesCoordinacion';

const GruposDashboard = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('');
  const [periodos, setPeriodos] = useState([]);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(null);
  const [grupos, setGrupos] = useState([]);
  const [selectedGrupo, setSelectedGrupo] = useState(null);
  const [alumnosGrupo, setAlumnosGrupo] = useState([]);
  const [alumnosDisponibles, setAlumnosDisponibles] = useState([]);
  const [tutores, setTutores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [showModalGrupo, setShowModalGrupo] = useState(false);
  const [showModalAsignarAlumnos, setShowModalAsignarAlumnos] = useState(false);
  const [showModalAsignarTutor, setShowModalAsignarTutor] = useState(false);
  const [showModalEditarGrupo, setShowModalEditarGrupo] = useState(false);
  const [showModalAgregarAlumno, setShowModalAgregarAlumno] = useState(false);
  const [showModalEditarAlumno, setShowModalEditarAlumno] = useState(false);
  const [showModalCerrarPeriodo, setShowModalCerrarPeriodo] = useState(false);
  const [showModalEstadisticas, setShowModalEstadisticas] = useState(false);
  const [showModalCanalizaciones, setShowModalCanalizaciones] = useState(false);
  const [showModalEstadisticasGenerales, setShowModalEstadisticasGenerales] = useState(false);

  const [searchAlumno, setSearchAlumno] = useState('');
  const [grupoEditar, setGrupoEditar] = useState(null);
  const [mostrarTodosAlumnos, setMostrarTodosAlumnos] = useState(false);
  const [alumnoEditar, setAlumnoEditar] = useState(null);
  const [estadisticasGrupo, setEstadisticasGrupo] = useState(null);
  const [loadingEstadisticas, setLoadingEstadisticas] = useState(false);
  const [filtroCanalizaciones, setFiltroCanalizaciones] = useState('todas');

  const token = localStorage.getItem('token');

  // Carreras fijas
  const carreras = [
    "Ingeniería en Sistemas Computacionales",
    "Administración de Empresas",
    "Contaduría",
    "Ingeniería Mecatrónica"
  ];

  // ---------------------------
  // 🔥 FUNCIÓN REQUEST GLOBAL
  // ---------------------------
  const request = async (url, options = {}) => {
    const response = await fetchWithAuth(url, options);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Error en la petición");
    }
    return response.json();
  };

  // ---------------------------
  // CARGA INICIAL
  // ---------------------------
  useEffect(() => {
    if (token) {
      const decoded = jwtDecode(token);
      setUserRole(decoded.rol);
    }
    fetchPeriodos();
  }, []);

  useEffect(() => {
    if (userRole === 'coordinacion') {
      fetchTutores();
    }
  }, [userRole]);

  useEffect(() => {
    if (periodoSeleccionado) {
      fetchGrupos();
    }
  }, [periodoSeleccionado]);

  useEffect(() => {
    if (selectedGrupo && showModalAsignarAlumnos) {
      fetchAlumnosDisponibles(selectedGrupo);
    }
  }, [mostrarTodosAlumnos]);

  // ---------------------------
  // PETICIONES API
  // ---------------------------
  const fetchPeriodos = async () => {
    try {
      const data = await request('/periodos');
      setPeriodos(data);

      const activo = data.find(p => p.activo);
      setPeriodoSeleccionado(activo || data[0]);
    } catch (error) {
      Swal.fire('Error', 'No se pudieron cargar los periodos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchGrupos = async () => {
    if (!periodoSeleccionado) return;

    try {
      setLoading(true);
      const data = await request('/grupos');
      setGrupos(data);
    } catch (error) {
      Swal.fire('Error', 'No se pudieron cargar los grupos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const verEstadisticasGrupo = async (grupoId) => {
    try {
      setLoadingEstadisticas(true);
      setShowModalEstadisticas(true);

      const data = await request(`/grupos/${grupoId}/estadisticas`);
      setEstadisticasGrupo(data);
    } catch (error) {
      Swal.fire('Error', 'No se pudieron cargar las estadísticas', 'error');
      setShowModalEstadisticas(false);
    } finally {
      setLoadingEstadisticas(false);
    }
  };

  const fetchEstadisticasGenerales = async () => {
    try {
      setLoadingEstadisticas(true);
      setShowModalEstadisticasGenerales(true);

      const data = await request('/estadisticas');
      setEstadisticasGrupo(data);
    } catch (error) {
      Swal.fire('Error', 'No se pudieron cargar las estadísticas', 'error');
      setShowModalEstadisticasGenerales(false);
    } finally {
      setLoadingEstadisticas(false);
    }
  };

  const fetchTutores = async () => {
    try {
      const data = await request('/users/tutores');
      setTutores(data);
    } catch (error) {
      console.error('Error al cargar tutores:', error);
    }
  };

  const fetchAlumnosGrupo = async (grupoId) => {
    try {
      const data = await request(`/grupos/${grupoId}/alumnos`);
      setAlumnosGrupo(data);
      setSelectedGrupo(grupoId);
    } catch (error) {
      Swal.fire('Error', 'No se pudieron cargar los alumnos', 'error');
    }
  };

  const fetchAlumnosDisponibles = async (grupoId) => {
    try {
      const grupo = grupos.find(g => g.id === grupoId);
      if (!grupo) return;

      let url = `/grupos/${grupoId}/alumnos-disponibles`;

      if (!mostrarTodosAlumnos) {
        url += `?semestre=${grupo.semestre}&carrera=${encodeURIComponent(grupo.carrera)}`;
      }

      const data = await request(url);
      setAlumnosDisponibles(data);
      setSearchAlumno('');
    } catch (error) {
      Swal.fire('Error', 'No se pudieron cargar los alumnos disponibles', 'error');
    }
  };

  const handleEliminarGrupo = async (grupoId, nombreGrupo) => {
    const result = await Swal.fire({
      title: '¿Eliminar grupo?',
      html: `¿Estás seguro de eliminar el grupo <strong>${nombreGrupo}</strong>? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33'
    });

    if (result.isConfirmed) {
      try {
        await request(`/grupos/${grupoId}`, { method: 'DELETE' });
        Swal.fire('¡Eliminado!', 'El grupo fue eliminado correctamente', 'success');

        fetchGrupos();
        if (selectedGrupo === grupoId) {
          setSelectedGrupo(null);
          setAlumnosGrupo([]);
        }
      } catch (error) {
        Swal.fire('Error', error.message, 'error');
      }
    }
  };

  const abrirModalAsignarAlumnos = async (grupoId) => {
    setSelectedGrupo(grupoId);
    setMostrarTodosAlumnos(false);
    await fetchAlumnosDisponibles(grupoId);
    setShowModalAsignarAlumnos(true);
  };

  const handleAsignarAlumno = async (alumnoId) => {
    try {
      await request(`/grupos/${selectedGrupo}/alumnos`, {
        method: 'POST',
        body: JSON.stringify({ alumnoId })
      });

      Swal.fire('Éxito', 'Alumno asignado correctamente', 'success');
      await fetchAlumnosDisponibles(selectedGrupo);
      await fetchAlumnosGrupo(selectedGrupo);
      fetchGrupos();
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  const handleRemoverAlumno = async (alumnoId, nombreAlumno) => {
    const result = await Swal.fire({
      title: '¿Remover alumno?',
      html: `¿Deseas remover a <strong>${nombreAlumno}</strong> de este grupo?`,
      icon: 'warning',
      confirmButtonText: 'Sí, remover',
      showCancelButton: true
    });

    if (result.isConfirmed) {
      try {
        await request(`/grupos/${selectedGrupo}/alumnos/${alumnoId}`, {
          method: 'DELETE'
        });

        Swal.fire('¡Removido!', 'Alumno removido del grupo', 'success');
        await fetchAlumnosGrupo(selectedGrupo);
        fetchGrupos();
      } catch (error) {
        Swal.fire('Error', error.message, 'error');
      }
    }
  };

  const handleEliminarAlumno = async (alumnoId, nombreAlumno) => {
    const result = await Swal.fire({
      title: '¿Eliminar alumno?',
      html: `¿Eliminar a <strong>${nombreAlumno}</strong> del sistema?`,
      icon: 'warning',
      confirmButtonText: 'Sí, eliminar',
      showCancelButton: true
    });

    if (result.isConfirmed) {
      try {
        await request(`/alumnos/${alumnoId}`, { method: 'DELETE' });
        Swal.fire('¡Eliminado!', 'Alumno eliminado', 'success');

        if (selectedGrupo) fetchAlumnosGrupo(selectedGrupo);
        fetchGrupos();
      } catch (error) {
        Swal.fire('Error', error.message, 'error');
      }
    }
  };

  // FILTRO DE ALUMNOS DISPONIBLES
  const alumnosFiltrados = alumnosDisponibles.filter(alumno =>
    `${alumno.Nombre} ${alumno.Primer_Ap} ${alumno.Segundo_Ap} ${alumno.Num_Control}`
      .toLowerCase()
      .includes(searchAlumno.toLowerCase())
  );

  const esPeriodoActivo = periodoSeleccionado?.activo;
  const puedeModificar = userRole === 'coordinacion' && esPeriodoActivo;

  // LOADER
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // ------------------------------ RENDER UI --------------------------------
  // -------------------------------------------------------------------------
  return (
    <div className="container-fluid py-4">

      {/* HEADER */}
      <div className="row mb-3">
        <div className="col-md-12">
          <h2 className="fw-bold text-white mb-2">
            <i className="fas fa-users me-2"></i>
            Gestión de Grupos {userRole === 'tutor' && '- Mis Tutorados'}
          </h2>
        </div>
      </div>

      {/* SELECTOR DE PERIODO + BOTONES */}
      <div className="row mb-3">
        <div className="col-md-7">
          <div className="card shadow-sm">
            <div className="card-body py-2">
              <div className="row align-items-center">
                <div className="col-md-5">
                  <label className="form-label mb-1 fw-bold small">
                    <i className="fas fa-calendar-alt me-1"></i>Periodo:
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={periodoSeleccionado?.id || ''}
                    onChange={(e) => {
                      const periodo = periodos.find(p => p.id === parseInt(e.target.value));
                      setPeriodoSeleccionado(periodo);
                      setSelectedGrupo(null);
                      setAlumnosGrupo([]);
                    }}
                  >
                    {periodos.map(periodo => (
                      <option key={periodo.id} value={periodo.id}>
                        {periodo.nombre} {periodo.activo && '(Activo)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-7">
                  {periodoSeleccionado && (
                    <div>
                      <small className="text-muted d-block">
                        <i className="fas fa-calendar-check me-1"></i>
                        {new Date(periodoSeleccionado.fecha_inicio).toLocaleDateString()} -
                        {new Date(periodoSeleccionado.fecha_fin).toLocaleDateString()}
                      </small>
                      <span className={`badge ${esPeriodoActivo ? 'bg-success' : 'bg-secondary'} mt-1`}>
                        {esPeriodoActivo ? 'Periodo Activo - Modificable' : 'Periodo Anterior - Solo Lectura'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTONES */}
        <div className="col-md-5">
          <div className="row g-2">
            {puedeModificar && (
              <>
                <div className="col-6">
                  <button className="btn btn-primary btn-sm w-100" onClick={() => setShowModalGrupo(true)}>
                    <i className="fas fa-plus-circle me-1"></i>Crear Grupo
                  </button>
                </div>

                <div className="col-6">
                  <button className="btn btn-success btn-sm w-100" onClick={() => setShowModalAgregarAlumno(true)}>
                    <i className="fas fa-user-plus me-1"></i>Agregar Alumno
                  </button>
                </div>
              </>
            )}

            <div className="col-6">
              <button
                className="btn btn-info btn-sm text-white w-100"
                onClick={() => setShowModalCanalizaciones(true)}
              >
                <i className="fas fa-clipboard-list me-1"></i>
                Canalizaciones
              </button>
            </div>

            <div className="col-6">
              <button
                className="btn btn-warning btn-sm w-100"
                onClick={fetchEstadisticasGenerales}
              >
                <i className="fas fa-chart-pie me-1"></i>
                Estadísticas
              </button>
            </div>

            {puedeModificar && (
              <div className="col-12">
                <button className="btn btn-danger btn-sm w-100" onClick={() => setShowModalCerrarPeriodo(true)}>
                  <i className="fas fa-calendar-times me-1"></i>Cerrar Periodo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LISTA DE GRUPOS */}
      <div className="row">
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="fas fa-layer-group me-2"></i>
                {userRole === 'tutor' ? 'Mis Grupos' : 'Grupos del Periodo'}
              </h5>
            </div>

            <div className="card-body p-0">
              {grupos.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-inbox display-1 text-muted"></i>
                  <p className="mt-3 text-muted">No hay grupos en este periodo</p>
                </div>
              ) : (
                <div className="list-group list-group-flush" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  {grupos.map(grupo => (
                    <div
                      key={grupo.id}
                      className={`list-group-item ${selectedGrupo === grupo.id ? 'active' : ''}`}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div
                          style={{ cursor: 'pointer' }}
                          className="flex-grow-1 me-2"
                          onClick={() => fetchAlumnosGrupo(grupo.id)}
                        >
                          <h6 className="mb-1">
                            {grupo.nombre} - Semestre {grupo.semestre}
                          </h6>
                          <small className={selectedGrupo === grupo.id ? 'text-white-50' : 'text-muted'}>
                            {grupo.carrera}
                          </small>

                          <div className="mt-2">
                            <span className={`badge ${selectedGrupo === grupo.id ? 'bg-light text-primary' : 'bg-primary'}`}>
                              {grupo.total_alumnos || 0} alumnos
                            </span>

                            {grupo.tutor && (
                              <small className={`d-block mt-1 ${selectedGrupo === grupo.id ? 'text-white-50' : 'text-muted'}`}>
                                <i className="fas fa-user-check me-1"></i>
                                {grupo.tutor.name}
                              </small>
                            )}
                          </div>
                        </div>

                        {puedeModificar && (
                          <div className="d-flex flex-column gap-2">
                            <button
                              className="btn btn-success btn-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                verEstadisticasGrupo(grupo.id);
                              }}
                            >
                              <i className="fas fa-chart-bar me-1"></i>
                              Estadísticas
                            </button>

                            <button
                              className="btn btn-warning btn-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setGrupoEditar(grupo);
                                setShowModalEditarGrupo(true);
                              }}
                            >
                              <i className="fas fa-edit me-1"></i>
                              Editar
                            </button>

                            <button
                              className="btn btn-info btn-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setGrupoEditar(grupo);
                                setShowModalAsignarTutor(true);
                              }}
                            >
                              <i className="fas fa-user-plus me-1"></i>
                              Tutor
                            </button>

                            <button
                              className="btn btn-danger btn-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEliminarGrupo(grupo.id, grupo.nombre);
                              }}
                            >
                              <i className="fas fa-trash me-1"></i>
                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LISTA DE ALUMNOS */}
        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-users me-2"></i>
                Alumnos del Grupo
              </h5>

              {selectedGrupo && puedeModificar && (
                <button
                  className="btn btn-sm btn-light"
                  onClick={() => abrirModalAsignarAlumnos(selectedGrupo)}
                >
                  <i className="fas fa-user-plus me-1"></i>
                  Asignar Alumnos
                </button>
              )}
            </div>

            <div className="card-body">
              {!selectedGrupo ? (
                <div className="text-center py-5">
                  <i className="fas fa-arrow-left-circle display-1 text-muted"></i>
                  <p className="mt-3 text-muted">Selecciona un grupo para ver sus alumnos</p>
                </div>
              ) : alumnosGrupo.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-user-times display-1 text-muted"></i>
                  <p className="mt-3 text-muted">Este grupo no tiene alumnos asignados</p>

                  {puedeModificar && (
                    <button
                      className="btn btn-primary mt-3"
                      onClick={() => abrirModalAsignarAlumnos(selectedGrupo)}
                    >
                      <i className="fas fa-user-plus me-2"></i>
                      Asignar Alumnos
                    </button>
                  )}
                </div>
              ) : (
                <div className="table-responsive" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                  <table className="table table-hover">
                    <thead className="table-light sticky-top">
                      <tr>
                        <th>#</th>
                        <th>Nº Control</th>
                        <th>Nombre Completo</th>
                        <th>Carrera</th>
                        <th>Semestre</th>
                        <th className="text-center">Acciones</th>
                      </tr>
                    </thead>

                    <tbody>
                      {alumnosGrupo.map((alumno, index) => (
                        <tr key={alumno.id}>
                          <td>{index + 1}</td>
                          <td>
                            <span className="badge bg-secondary">{alumno.Num_Control}</span>
                          </td>
                          <td className="fw-semibold">
                            {alumno.Nombre} {alumno.Primer_Ap} {alumno.Segundo_Ap}
                          </td>
                          <td>
                            <small className="text-muted">{alumno.Carrera}</small>
                          </td>
                          <td>
                            <span className="badge bg-info">{alumno.Semestre}°</span>
                          </td>

                          <td>
                            <div className="d-flex gap-2 justify-content-center flex-wrap">
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => navigate(`/alumnos/${alumno.id}`)}
                              >
                                <i className="fas fa-eye me-1"></i>
                                Ver
                              </button>

                              {puedeModificar && (
                                <>
                                  <button
                                    className="btn btn-warning btn-sm"
                                    onClick={() => {
                                      setAlumnoEditar(alumno);
                                      setShowModalEditarAlumno(true);
                                    }}
                                  >
                                    <i className="fas fa-edit me-1"></i>
                                    Editar
                                  </button>

                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleEliminarAlumno(
                                      alumno.id,
                                      `${alumno.Nombre} ${alumno.Primer_Ap} ${alumno.Segundo_Ap}`
                                    )}
                                  >
                                    <i className="fas fa-trash me-1"></i>
                                    Eliminar
                                  </button>

                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleRemoverAlumno(
                                      alumno.id,
                                      `${alumno.Nombre} ${alumno.Primer_Ap}`
                                    )}
                                  >
                                    <i className="fas fa-user-minus me-1"></i>
                                    Remover
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>

                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------- MODALES ------------------------- */}

      <ModalCrearGrupo
        show={showModalGrupo}
        onClose={() => setShowModalGrupo(false)}
        periodoSeleccionado={periodoSeleccionado}
        carreras={carreras}
        fetchWithAuth={request}
        onSuccess={fetchGrupos}
      />

      <ModalEditarGrupo
        show={showModalEditarGrupo}
        onClose={() => {
          setShowModalEditarGrupo(false);
          setGrupoEditar(null);
        }}
        grupo={grupoEditar}
        carreras={carreras}
        fetchWithAuth={request}
        onSuccess={fetchGrupos}
      />

      <ModalAsignarTutor
        show={showModalAsignarTutor}
        onClose={() => {
          setShowModalAsignarTutor(false);
          setGrupoEditar(null);
        }}
        grupo={grupoEditar}
        tutores={tutores}
        fetchWithAuth={request}
        onSuccess={fetchGrupos}
      />

      <ModalAsignarAlumnos
        show={showModalAsignarAlumnos}
        onClose={() => {
          setShowModalAsignarAlumnos(false);
          setSearchAlumno('');
        }}
        alumnosDisponibles={alumnosDisponibles}
        alumnosFiltrados={alumnosFiltrados}
        searchAlumno={searchAlumno}
        setSearchAlumno={setSearchAlumno}
        mostrarTodosAlumnos={mostrarTodosAlumnos}
        setMostrarTodosAlumnos={setMostrarTodosAlumnos}
        onAsignarAlumno={handleAsignarAlumno}
      />

      <ModalAgregarAlumno
        show={showModalAgregarAlumno}
        onClose={() => setShowModalAgregarAlumno(false)}
        carreras={carreras}
        fetchWithAuth={request}
      />

      <ModalEditarAlumno
        show={showModalEditarAlumno}
        onClose={() => {
          setShowModalEditarAlumno(false);
          setAlumnoEditar(null);
        }}
        alumno={alumnoEditar}
        carreras={carreras}
        fetchWithAuth={request}
        onSuccess={() => {
          if (selectedGrupo) fetchAlumnosGrupo(selectedGrupo);
        }}
      />

      <ModalCerrarPeriodo
        show={showModalCerrarPeriodo}
        onClose={() => setShowModalCerrarPeriodo(false)}
        periodoSeleccionado={periodoSeleccionado}
        grupos={grupos}
        fetchWithAuth={request}
        onSuccess={async (nuevoPeriodo) => {
          await fetchPeriodos();
          setPeriodoSeleccionado(nuevoPeriodo);
        }}
      />

      <ModalEstadisticas
        show={showModalEstadisticas}
        onClose={() => {
          setShowModalEstadisticas(false);
          setEstadisticasGrupo(null);
        }}
        estadisticas={estadisticasGrupo}
        loading={loadingEstadisticas}
        grupoSeleccionado={grupos.find(g => g.id === selectedGrupo)}
      />

      <ModalCanalizacionesCoordinacion
        show={showModalCanalizaciones}
        onClose={() => setShowModalCanalizaciones(false)}
        grupos={grupos}
        fetchWithAuth={request}
      />

      <ModalEstadisticas
        show={showModalEstadisticasGenerales}
        onClose={() => {
          setShowModalEstadisticasGenerales(false);
          setEstadisticasGrupo(null);
        }}
        estadisticas={estadisticasGrupo}
        loading={loadingEstadisticas}
        esVistaGeneral={true}
      />

    </div>
  );
};

export default GruposDashboard;


