import React from 'react';
import Swal from 'sweetalert2';

const ModalCrearGrupo = ({ 
  show, 
  onClose, 
  periodoSeleccionado, 
  carreras, 
  fetchWithAuth, 
  API_BASE, 
  onSuccess 
}) => {
  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    if (!periodoSeleccionado) {
      Swal.fire('Error', 'No hay un periodo seleccionado', 'error');
      return;
    }

    if (!periodoSeleccionado.activo) {
      Swal.fire('Error', 'Solo puedes crear grupos en el periodo activo', 'error');
      return;
    }

    try {
      await fetchWithAuth(`${API_BASE}/grupos`, {
        method: 'POST',
        body: JSON.stringify({
          nombre: formData.get('nombre'),
          semestre: parseInt(formData.get('semestre')),
          carrera: formData.get('carrera'),
          periodo_id: periodoSeleccionado.id
        })
      });
      
      Swal.fire('Éxito', 'Grupo creado correctamente', 'success');
      onClose();
      onSuccess();
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">Crear Nuevo Grupo</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
              ></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-bold">Nombre del Grupo *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="nombre"
                    placeholder="Ej: 7A, 7B, etc."
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Semestre *</label>
                  <select className="form-select" name="semestre" required>
                    <option value="">Selecciona...</option>
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}° Semestre</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Carrera *</label>
                  <select className="form-select" name="carrera" required>
                    <option value="">Selecciona...</option>
                    {carreras.map((carrera, index) => (
                      <option key={index} value={carrera}>
                        {carrera}
                      </option>
                    ))}
                  </select>
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
                <button type="submit" className="btn btn-primary">
                  <i className="fas fa-check-circle me-2"></i>Crear Grupo
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ModalCrearGrupo;