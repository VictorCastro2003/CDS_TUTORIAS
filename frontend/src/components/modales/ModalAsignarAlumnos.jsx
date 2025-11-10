import React from 'react';

const ModalAsignarAlumnos = ({
  show,
  onClose,
  alumnosDisponibles,
  alumnosFiltrados,
  searchAlumno,
  setSearchAlumno,
  mostrarTodosAlumnos,
  setMostrarTodosAlumnos,
  onAsignarAlumno
}) => {
  if (!show) return null;

  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal show d-block" tabIndex="-1">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header bg-success text-white">
              <h5 className="modal-title">
                <i className="fas fa-user-plus me-2"></i>
                Asignar Alumnos al Grupo
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
              ></button>
            </div>
            
            <div className="modal-body">
              <div className="mb-3">
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fas fa-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar alumno por nombre o número de control..."
                    value={searchAlumno}
                    onChange={(e) => setSearchAlumno(e.target.value)}
                  />
                  {searchAlumno && (
                    <button 
                      className="btn btn-outline-secondary"
                      onClick={() => setSearchAlumno('')}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
                
                <div className="form-check mt-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="mostrarTodosCheck"
                    checked={mostrarTodosAlumnos}
                    onChange={(e) => setMostrarTodosAlumnos(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="mostrarTodosCheck">
                    <i className="fas fa-filter me-1"></i>
                    Mostrar alumnos de todas las carreras y semestres
                  </label>
                </div>
                
                <small className="text-muted d-block mt-2">
                  Mostrando {alumnosFiltrados.length} de {alumnosDisponibles.length} alumnos disponibles
                  {!mostrarTodosAlumnos && (
                    <span className="badge bg-info ms-2">
                      Filtrado por grupo
                    </span>
                  )}
                </small>
              </div>
              
              {alumnosDisponibles.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-inbox display-4 text-muted"></i>
                  <p className="mt-3 text-muted">
                    No hay alumnos disponibles para este grupo
                  </p>
                  <small className="text-muted">
                    Los alumnos deben tener el mismo semestre y carrera del grupo
                  </small>
                </div>
              ) : alumnosFiltrados.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-search display-4 text-muted"></i>
                  <p className="mt-3 text-muted">
                    No se encontraron alumnos con "{searchAlumno}"
                  </p>
                  <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setSearchAlumno('')}
                  >
                    Limpiar búsqueda
                  </button>
                </div>
              ) : (
                <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table className="table table-hover">
                    <thead className="table-light sticky-top">
                      <tr>
                        <th>Nº Control</th>
                        <th>Nombre</th>
                        <th>Semestre</th>
                        <th className="text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alumnosFiltrados.map(alumno => (
                        <tr key={alumno.id}>
                          <td>
                            <span className="badge bg-secondary">{alumno.Num_Control}</span>
                          </td>
                          <td>{alumno.Nombre} {alumno.Primer_Ap} {alumno.Segundo_Ap}</td>
                          <td>
                            <span className="badge bg-info">{alumno.Semestre}°</span>
                          </td>
                          <td className="text-center">
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => onAsignarAlumno(alumno.id)}
                            >
                              <i className="fas fa-plus-circle me-1"></i>Asignar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

export default ModalAsignarAlumnos;