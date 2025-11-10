import React from 'react';
import Swal from 'sweetalert2';

const ModalAsignarTutor = ({ 
  show, 
  onClose, 
  grupo, 
  tutores, 
  fetchWithAuth, 
  API_BASE, 
  onSuccess 
}) => {
  if (!show || !grupo) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const tutorId = formData.get('tutorId');

    try {
      await fetchWithAuth(`${API_BASE}/grupos/${grupo.id}/tutor`, {
        method: 'PUT',
        body: JSON.stringify({ tutorId: tutorId || null })
      });
      
      Swal.fire('Éxito', tutorId ? 'Tutor asignado correctamente' : 'Tutor removido correctamente', 'success');
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
            <div className="modal-header bg-info text-white">
              <h5 className="modal-title">Asignar Tutor al Grupo</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
              ></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-bold">Grupo</label>
                  <input
                    type="text"
                    className="form-control"
                    value={`${grupo.nombre} - ${grupo.carrera}`}
                    disabled
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Tutor</label>
                  <select 
                    className="form-select" 
                    name="tutorId"
                    defaultValue={grupo.tutor_id || ''}
                  >
                    <option value="">Sin tutor asignado</option>
                    {tutores.map(tutor => (
                      <option key={tutor.id} value={tutor.id}>
                        {tutor.name}
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
                <button type="submit" className="btn btn-info">
                  <i className="fas fa-check-circle me-2"></i>Asignar Tutor
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ModalAsignarTutor;