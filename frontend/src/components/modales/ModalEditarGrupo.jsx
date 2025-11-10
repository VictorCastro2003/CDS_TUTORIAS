import React from 'react';
import Swal from 'sweetalert2';

const ModalEditarGrupo = ({ 
  show, 
  onClose, 
  grupo, 
  carreras, 
  fetchWithAuth, 
  API_BASE, 
  onSuccess 
}) => {
  if (!show || !grupo) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      await fetchWithAuth(`${API_BASE}/grupos/${grupo.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          nombre: formData.get('nombre'),
          semestre: parseInt(formData.get('semestre')),
          carrera: formData.get('carrera')
        })
      });
      
      Swal.fire('Éxito', 'Grupo actualizado correctamente', 'success');
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
            <div className="modal-header bg-warning text-dark">
              <h5 className="modal-title">Editar Grupo</h5>
              <button
                type="button"
                className="btn-close"
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
                    defaultValue={grupo.nombre}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Semestre *</label>
                  <select 
                    className="form-select" 
                    name="semestre" 
                    defaultValue={grupo.semestre}
                    required
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}° Semestre</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Carrera *</label>
                  <select 
                    className="form-select" 
                    name="carrera"
                    defaultValue={grupo.carrera}
                    required
                  >
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
                <button type="submit" className="btn btn-warning">
                  <i className="fas fa-check-circle me-2"></i>Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ModalEditarGrupo;