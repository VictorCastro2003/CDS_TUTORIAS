import React from 'react';

const ModalEstadisticas = ({
  show,
  onClose,
  estadisticas,
  loading,
  grupoSeleccionado
}) => {
  if (!show) return null;

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
                          <h3 className="mb-0">{estadisticas.total_alumnos}</h3>
                          <small className="text-muted">Total de Alumnos</small>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-md-3">
                      <div className="card border-danger">
                        <div className="card-body text-center">
                          <i className="fas fa-exclamation-triangle display-4 text-danger mb-2"></i>
                          <h3 className="mb-0">{estadisticas.alumnos_riesgo}</h3>
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
                          <h3 className="mb-0">{estadisticas.total_canalizaciones}</h3>
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

                  {estadisticas.total_canalizaciones > 0 && (
                    <div className="alert alert-info">
                      <i className="fas fa-info-circle me-2"></i>
                      Se han realizado {estadisticas.total_canalizaciones} canalización(es) para alumnos de este grupo.
                    </div>
                  )}

                  {estadisticas.alumnos_riesgo === 0 && estadisticas.total_alumnos > 0 && (
                    <div className="alert alert-success">
                      <i className="fas fa-check-circle me-2"></i>
                      <strong>¡Excelente!</strong> Ningún alumno tiene 2 o más materias reprobadas.
                    </div>
                  )}

                  {/* Información adicional */}
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
                            <strong>Grupo:</strong> {grupoSeleccionado?.nombre}
                          </p>
                          <p className="mb-2">
                            <strong>Semestre:</strong> {grupoSeleccionado?.semestre}°
                          </p>
                        </div>
                        <div className="col-md-6">
                          <p className="mb-2">
                            <strong>Carrera:</strong> {grupoSeleccionado?.carrera}
                          </p>
                          <p className="mb-2">
                            <strong>Tutor:</strong> {grupoSeleccionado?.tutor?.name || 'Sin asignar'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

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