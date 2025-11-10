import React from 'react';

const ModalEstadisticas = ({
  show,
  onClose,
  estadisticas,
  loading,
  grupoSeleccionado,
  esVistaGeneral = false
}) => {
  if (!show) return null;

  // Vista de Estadísticas GENERALES del sistema
  if (esVistaGeneral) {
    const totalCanalizaciones = estadisticas?.canalizacionesPorTipo?.reduce(
      (sum, c) => sum + parseInt(c.total || 0), 0
    ) || 0;

    const totalAlertas = estadisticas?.alertasActivas?.reduce(
      (sum, a) => sum + parseInt(a.total || 0), 0
    ) || 0;

    return (
      <>
        <div className="modal-backdrop fade show"></div>
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-warning text-dark">
                <h5 className="modal-title">
                  <i className="fas fa-chart-pie me-2"></i>
                  Estadísticas Generales del Sistema
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={onClose}
                ></button>
              </div>
              
              <div className="modal-body">
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-warning" role="status">
                      <span className="visually-hidden">Cargando estadísticas...</span>
                    </div>
                    <p className="mt-3 text-muted">Cargando estadísticas...</p>
                  </div>
                ) : estadisticas ? (
                  <>
                    {/* Tarjetas de Resumen General */}
                    <div className="row mb-4">
                      <div className="col-md-3">
                        <div className="card border-primary">
                          <div className="card-body text-center">
                            <i className="fas fa-users display-4 text-primary mb-2"></i>
                            <h3 className="mb-0">{estadisticas.totalAlumnos || 0}</h3>
                            <small className="text-muted">Total de Alumnos</small>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-md-3">
                        <div className="card border-warning">
                          <div className="card-body text-center">
                            <i className="fas fa-user-nurse display-4 text-warning mb-2"></i>
                            <h3 className="mb-0">{totalCanalizaciones}</h3>
                            <small className="text-muted">Total Canalizaciones</small>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-md-3">
                        <div className="card border-danger">
                          <div className="card-body text-center">
                            <i className="fas fa-exclamation-triangle display-4 text-danger mb-2"></i>
                            <h3 className="mb-0">{totalAlertas}</h3>
                            <small className="text-muted">Alertas Activas</small>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-md-3">
                        <div className="card border-info">
                          <div className="card-body text-center">
                            <i className="fas fa-chart-line display-4 text-info mb-2"></i>
                            <h3 className="mb-0">{estadisticas.promedioGeneral || 0}</h3>
                            <small className="text-muted">Promedio General</small>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Alumnos por Carrera */}
                    {estadisticas.alumnosPorCarrera?.length > 0 && (
                      <div className="card mb-3">
                        <div className="card-header bg-light">
                          <h6 className="mb-0">
                            <i className="fas fa-graduation-cap me-2"></i>
                            Distribución por Carrera
                          </h6>
                        </div>
                        <div className="card-body">
                          <div className="row">
                            {estadisticas.alumnosPorCarrera.map((carrera, index) => (
                              <div key={index} className="col-md-6 mb-2">
                                <div className="d-flex justify-content-between align-items-center">
                                  <span className="text-truncate me-2">
                                    <i className="fas fa-book me-1"></i>
                                    {carrera.Carrera}
                                  </span>
                                  <span className="badge bg-primary">{carrera.total} alumnos</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Canalizaciones por Tipo */}
                    {estadisticas.canalizacionesPorTipo?.length > 0 && (
                      <div className="card mb-3">
                        <div className="card-header bg-light">
                          <h6 className="mb-0">
                            <i className="fas fa-clipboard-list me-2"></i>
                            Canalizaciones por Tipo
                          </h6>
                        </div>
                        <div className="card-body">
                          <div className="row">
                            {estadisticas.canalizacionesPorTipo.map((tipo, index) => (
                              <div key={index} className="col-md-4 mb-2">
                                <div className="d-flex justify-content-between align-items-center">
                                  <span className="text-capitalize">
                                    <i className="fas fa-check-circle me-1"></i>
                                    {tipo.tipo_canalizacion}
                                  </span>
                                  <span className="badge bg-warning text-dark">{tipo.total}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Alertas Activas por Tipo */}
                    {estadisticas.alertasActivas?.length > 0 && (
                      <div className="card mb-3">
                        <div className="card-header bg-light">
                          <h6 className="mb-0">
                            <i className="fas fa-bell me-2"></i>
                            Alertas Activas por Tipo
                          </h6>
                        </div>
                        <div className="card-body">
                          <div className="row">
                            {estadisticas.alertasActivas.map((alerta, index) => (
                              <div key={index} className="col-md-4 mb-2">
                                <div className="d-flex justify-content-between align-items-center">
                                  <span className="text-capitalize">
                                    <i className="fas fa-exclamation-circle me-1"></i>
                                    {alerta.tipo_alerta}
                                  </span>
                                  <span className="badge bg-danger">{alerta.total}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Información del Periodo */}
                    {estadisticas.periodoActivo && (
                      <div className="alert alert-info">
                        <i className="fas fa-calendar-alt me-2"></i>
                        <strong>Periodo Activo:</strong> {estadisticas.periodoActivo.nombre}
                        <br />
                        <small>
                          {new Date(estadisticas.periodoActivo.fecha_inicio).toLocaleDateString()} - 
                          {new Date(estadisticas.periodoActivo.fecha_fin).toLocaleDateString()}
                        </small>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-5">
                    <i className="fas fa-chart-bar display-1 text-muted"></i>
                    <p className="mt-3 text-muted">No se pudieron cargar las estadísticas</p>
                  </div>
                )}
              </div>
              
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Vista de Estadísticas de GRUPO específico
  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal show d-block" tabIndex="-1">
        <div className="modal-dialog modal-xl modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header bg-success text-white">
              <h5 className="modal-title">
                <i className="fas fa-chart-bar me-2"></i>
                Estadísticas del Grupo
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
              ></button>
            </div>
            
            <div className="modal-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-success" role="status">
                    <span className="visually-hidden">Cargando estadísticas...</span>
                  </div>
                  <p className="mt-3 text-muted">Cargando estadísticas...</p>
                </div>
              ) : estadisticas ? (
                <>
                  {/* Tarjetas de Resumen */}
                  <div className="row mb-4">
                    <div className="col-md-3">
                      <div className="card border-primary">
                        <div className="card-body text-center">
                          <i className="fas fa-users display-4 text-primary mb-2"></i>
                          <h3 className="mb-0">{estadisticas.total_alumnos || 0}</h3>
                          <small className="text-muted">Total de Alumnos</small>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-md-3">
                      <div className="card border-danger">
                        <div className="card-body text-center">
                          <i className="fas fa-exclamation-triangle display-4 text-danger mb-2"></i>
                          <h3 className="mb-0">{estadisticas.alumnos_riesgo || 0}</h3>
                          <small className="text-muted">Alumnos en Riesgo</small>
                          <br/>
                          <small className="text-muted">(2+ materias reprobadas)</small>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-md-3">
                      <div className="card border-warning">
                        <div className="card-body text-center">
                          <i className="fas fa-user-nurse display-4 text-warning mb-2"></i>
                          <h3 className="mb-0">{estadisticas.canalizaciones?.total || 0}</h3>
                          <small className="text-muted">Canalizaciones</small>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-md-3">
                      <div className="card border-info">
                        <div className="card-body text-center">
                          <i className="fas fa-percentage display-4 text-info mb-2"></i>
                          <h3 className="mb-0">
                            {estadisticas.total_alumnos > 0 
                              ? ((estadisticas.alumnos_riesgo / estadisticas.total_alumnos) * 100).toFixed(1)
                              : 0}%
                          </h3>
                          <small className="text-muted">Porcentaje en Riesgo</small>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Alertas según estadísticas */}
                  {estadisticas.alumnos_riesgo > 0 && (
                    <div className="alert alert-warning">
                      <i className="fas fa-exclamation-circle me-2"></i>
                      <strong>Atención:</strong> Hay {estadisticas.alumnos_riesgo} alumno(s) con 2 o más materias reprobadas que requieren atención.
                    </div>
                  )}

                  {estadisticas.canalizaciones?.total > 0 && (
                    <div className="alert alert-info">
                      <i className="fas fa-info-circle me-2"></i>
                      Se han realizado {estadisticas.canalizaciones.total} canalización(es) para alumnos de este grupo.
                    </div>
                  )}

                  {estadisticas.alumnos_riesgo === 0 && estadisticas.total_alumnos > 0 && (
                    <div className="alert alert-success">
                      <i className="fas fa-check-circle me-2"></i>
                      <strong>¡Excelente!</strong> Ningún alumno tiene 2 o más materias reprobadas.
                    </div>
                  )}

                  {/* Información del Grupo */}
                  <div className="card mt-3">
                    <div className="card-header bg-light">
                      <h6 className="mb-0">
                        <i className="fas fa-info-circle me-2"></i>
                        Información del Grupo
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-6">
                          <p className="mb-2">
                            <strong>Grupo:</strong> {estadisticas.grupo?.nombre || grupoSeleccionado?.nombre}
                          </p>
                          <p className="mb-2">
                            <strong>Semestre:</strong> {estadisticas.grupo?.semestre || grupoSeleccionado?.semestre}°
                          </p>
                        </div>
                        <div className="col-md-6">
                          <p className="mb-2">
                            <strong>Carrera:</strong> {estadisticas.grupo?.carrera || grupoSeleccionado?.carrera}
                          </p>
                          <p className="mb-2">
                            <strong>Tutor:</strong> {estadisticas.grupo?.tutor || grupoSeleccionado?.tutor?.name || 'Sin asignar'}
                          </p>
                        </div>
                      </div>
                      
                      {estadisticas.promedio_grupo && (
                        <div className="mt-3">
                          <p className="mb-0">
                            <strong>Promedio del Grupo:</strong> 
                            <span className={`ms-2 badge ${
                              estadisticas.promedio_grupo >= 80 ? 'bg-success' :
                              estadisticas.promedio_grupo >= 70 ? 'bg-warning' : 'bg-danger'
                            }`}>
                              {estadisticas.promedio_grupo}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Canalizaciones por Tipo */}
                  {estadisticas.canalizaciones?.por_tipo?.length > 0 && (
                    <div className="card mt-3">
                      <div className="card-header bg-light">
                        <h6 className="mb-0">
                          <i className="fas fa-clipboard-list me-2"></i>
                          Canalizaciones por Tipo
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          {estadisticas.canalizaciones.por_tipo.map((tipo, index) => (
                            <div key={index} className="col-md-4 mb-2">
                              <div className="d-flex justify-content-between align-items-center">
                                <span className="text-capitalize">
                                  <i className="fas fa-check-circle me-1"></i>
                                  {tipo.tipo_canalizacion}
                                </span>
                                <span className="badge bg-warning text-dark">{tipo.total}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Alertas por Tipo */}
                  {estadisticas.alertas?.por_tipo?.length > 0 && (
                    <div className="card mt-3">
                      <div className="card-header bg-light">
                        <h6 className="mb-0">
                          <i className="fas fa-bell me-2"></i>
                          Alertas Activas por Tipo
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          {estadisticas.alertas.por_tipo.map((alerta, index) => (
                            <div key={index} className="col-md-4 mb-2">
                              <div className="d-flex justify-content-between align-items-center">
                                <span className="text-capitalize">
                                  <i className="fas fa-exclamation-circle me-1"></i>
                                  {alerta.tipo_alerta}
                                </span>
                                <span className="badge bg-danger">{alerta.total}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recomendaciones */}
                  {estadisticas.alumnos_riesgo > 3 && (
                    <div className="alert alert-danger mt-3">
                      <h6 className="alert-heading">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        Recomendaciones
                      </h6>
                      <ul className="mb-0">
                        <li>Programar sesiones de tutoría grupal para identificar problemáticas comunes</li>
                        <li>Revisar estrategias de enseñanza y evaluación</li>
                        <li>Considerar canalización a servicios de apoyo académico</li>
                        <li>Contactar a padres/tutores de los alumnos en riesgo</li>
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-5">
                  <i className="fas fa-chart-bar display-1 text-muted"></i>
                  <p className="mt-3 text-muted">No se pudieron cargar las estadísticas</p>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ModalEstadisticas;