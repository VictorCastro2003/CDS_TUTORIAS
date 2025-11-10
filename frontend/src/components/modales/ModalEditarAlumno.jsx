import React from 'react';
import Swal from 'sweetalert2';

const ModalEditarAlumno = ({ 
  show, 
  onClose, 
  alumno, 
  carreras, 
  fetchWithAuth, 
  API_BASE, 
  onSuccess 
}) => {
  if (!show || !alumno) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      await fetchWithAuth(`${API_BASE}/alumnos/${alumno.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          Num_Control: formData.get('numControl'),
          Nombre: formData.get('nombre'),
          Primer_Ap: formData.get('primerAp'),
          Segundo_Ap: formData.get('segundoAp'),
          Fecha_Nac: formData.get('fechaNac'),
          Carrera: formData.get('carrera'),
          Semestre: parseInt(formData.get('semestre'))
        })
      });
      
      Swal.fire('Éxito', 'Alumno actualizado correctamente', 'success');
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
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header bg-warning text-dark">
              <h5 className="modal-title">
                <i className="fas fa-edit me-2"></i>
                Editar Alumno
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
              ></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Número de Control *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="numControl"
                      defaultValue={alumno.Num_Control}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Nombre(s) *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="nombre"
                      defaultValue={alumno.Nombre}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Primer Apellido *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="primerAp"
                      defaultValue={alumno.Primer_Ap}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Segundo Apellido</label>
                    <input
                      type="text"
                      className="form-control"
                      name="segundoAp"
                      defaultValue={alumno.Segundo_Ap || ''}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Fecha de Nacimiento *</label>
                    <input
                      type="date"
                      className="form-control"
                      name="fechaNac"
                      defaultValue={alumno.Fecha_Nac ? alumno.Fecha_Nac.split('T')[0] : ''}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Semestre *</label>
                    <select 
                      className="form-select" 
                      name="semestre" 
                      defaultValue={alumno.Semestre}
                      required
                    >
                      <option value="">Selecciona...</option>
                      {[...Array(12)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}° Semestre</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12 mb-3">
                    <label className="form-label fw-bold">Carrera *</label>
                    <select 
                      className="form-select" 
                      name="carrera"
                      defaultValue={alumno.Carrera}
                      required
                    >
                      <option value="">Selecciona...</option>
                      {carreras.map((carrera, index) => (
                        <option key={index} value={carrera}>
                          {carrera}
                        </option>
                      ))}
                    </select>
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
                  <i className="fas fa-save me-2"></i>Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ModalEditarAlumno;