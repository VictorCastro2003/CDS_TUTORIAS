import React from 'react';
import Swal from 'sweetalert2';

const ModalCerrarPeriodo = ({ 
  show, 
  onClose, 
  periodoSeleccionado, 
  grupos, 
  fetchWithAuth, 
  API_BASE, 
  onSuccess 
}) => {
  if (!show || !periodoSeleccionado) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const fechaInicio = formData.get('fecha_inicio');
    const fechaFin = formData.get('fecha_fin');
    
    if (new Date(fechaInicio) >= new Date(fechaFin)) {
      Swal.fire('Error', 'La fecha de inicio debe ser anterior a la fecha de fin', 'error');
      return;
    }

    const result = await Swal.fire({
      title: '¿Estás completamente seguro?',
      html: `
        Se cerrará <strong>${periodoSeleccionado.nombre}</strong> y se creará:<br/>
        <strong>${formData.get('nombre')}</strong><br/><br/>
        Todos los alumnos avanzarán de semestre.
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar periodo',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#f0ad4e'
    });

    if (!result.isConfirmed) return;

    try {
      const data = await fetchWithAuth(`${API_BASE}/periodos/${periodoSeleccionado.id}/cerrar-periodo`, {
        method: 'POST',
        body: JSON.stringify({
          nombre_nuevo_periodo: formData.get('nombre'),
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin
        })
      });
      
      Swal.fire({
        icon: 'success',
        title: '¡Periodo cerrado!',
        html: `
          <strong>${data.message}</strong><br/><br/>
          Nuevo periodo: <strong>${data.periodo_nuevo.nombre}</strong>
        `,
        confirmButtonText: 'Entendido'
      });
      
      onClose();
      onSuccess(data.periodo_nuevo);
      
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal show d-block" tabIndex="-1">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header bg-warning text-dark">
              <h5 className="modal-title">
                <i className="fas fa-calendar-times me-2"></i>
                Cerrar Periodo y Avanzar Semestre
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
              ></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="alert alert-warning">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <strong>¡Atención!</strong> Esta acción:
                  <ul className="mb-0 mt-2">
                    <li>Cerrará el periodo actual: <strong>{periodoSeleccionado.nombre}</strong></li>
                    <li>Avanzará automáticamente el semestre de todos los alumnos asignados</li>
                    <li>Creará un nuevo periodo activo</li>
                    <li>Esta acción no se puede deshacer</li>
                  </ul>
                </div>

                <h6 className="fw-bold mt-4 mb-3">Datos del Nuevo Periodo</h6>
                
                <div className="mb-3">
                  <label className="form-label fw-bold">Nombre del Nuevo Periodo *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="nombre"
                    placeholder="Ej: Julio - Diciembre 2025"
                    required
                  />
                  <small className="text-muted">
                    Sugerencia: Incluye el rango de fechas o el ciclo escolar
                  </small>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Fecha de Inicio *</label>
                    <input
                      type="date"
                      className="form-control"
                      name="fecha_inicio"
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Fecha de Fin *</label>
                    <input
                      type="date"
                      className="form-control"
                      name="fecha_fin"
                      required
                    />
                  </div>
                </div>

                <div className="alert alert-info mt-3">
                  <i className="fas fa-info-circle me-2"></i>
                  <strong>Resumen de alumnos a avanzar:</strong>
                  <div className="mt-2">
                    Total de grupos en este periodo: <strong>{grupos.length}</strong><br/>
                    Los alumnos de semestres 1-11 avanzarán automáticamente al siguiente semestre
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-warning">
                  <i className="fas fa-check-circle me-2"></i>
                  Confirmar Cierre y Crear Nuevo Periodo
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ModalCerrarPeriodo;