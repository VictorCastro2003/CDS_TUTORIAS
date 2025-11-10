import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

const EditarCalificacionesTab = ({ calificaciones, alumnoId, onCalificacionesActualizadas }) => {
  const [calificacionesEditables, setCalificacionesEditables] = useState([]);
  const [cambiosPendientes, setCambiosPendientes] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCalificacionesEditables(
      calificaciones.map(c => ({
        ...c,
        calificacionOriginal: c.calificacion
      }))
    );
    setCambiosPendientes({});
  }, [calificaciones]);

  const handleCalificacionChange = (index, nuevaCalificacion) => {
    const calificacion = calificacionesEditables[index];
    const valor = nuevaCalificacion === '' ? null : parseInt(nuevaCalificacion);

    setCalificacionesEditables(prev => {
      const nuevas = [...prev];
      nuevas[index] = { ...nuevas[index], calificacion: valor || 'Sin calificar' };
      return nuevas;
    });

    if (valor !== null && (valor < 0 || valor > 100)) {
      return;
    }

    setCambiosPendientes(prev => ({
      ...prev,
      [calificacion.id]: valor
    }));
  };

  const handleGuardarCambios = async () => {
    if (Object.keys(cambiosPendientes).length === 0) {
      Swal.fire('Información', 'No hay cambios pendientes', 'info');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const promises = Object.entries(cambiosPendientes).map(([alumnoMateriaId, calificacion]) => {
        const url = `http://localhost:4000/api/alumnos/${alumnoId}/materias/${alumnoMateriaId}/calificacion`;
        console.log('📤 Enviando a:', url, { calificacion });
        
        return fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ calificacion })
        });
      });

      const resultados = await Promise.all(promises);
      
      const errores = [];
      for (let i = 0; i < resultados.length; i++) {
        const res = resultados[i];
        if (!res.ok) {
          const error = await res.json();
          errores.push(error.error || `Error en actualización ${i + 1}`);
        }
      }

      if (errores.length > 0) {
        throw new Error(errores.join(', '));
      }

      Swal.fire({
        icon: 'success',
        title: 'Calificaciones Actualizadas',
        text: `Se actualizaron ${Object.keys(cambiosPendientes).length} calificaciones`,
        timer: 2000
      });
      
      setCambiosPendientes({});
      onCalificacionesActualizadas();
      
    } catch (error) {
      console.error('❌ Error:', error);
      Swal.fire('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (calificaciones.length === 0) {
    return (
      <div className="alert alert-info">
        <div className="text-center py-4">
          <i className="bi bi-inbox display-1 text-muted"></i>
          <h5 className="mt-3">No hay materias asignadas</h5>
          <p className="text-muted mb-0">
            Primero debes asignar materias al alumno en la pestaña "Asignar Materias"
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {Object.keys(cambiosPendientes).length > 0 && (
        <div className="alert alert-warning mb-4">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Tienes <strong>{Object.keys(cambiosPendientes).length}</strong> cambio(s) pendiente(s) por guardar
        </div>
      )}

      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th style={{ width: '5%' }}>#</th>
              <th style={{ width: '40%' }}>Materia</th>
              <th className="text-center" style={{ width: '15%' }}>Periodo</th>
              <th className="text-center" style={{ width: '20%' }}>Calificación</th>
              <th className="text-center" style={{ width: '20%' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {calificacionesEditables.map((c, index) => {
              const calNum = typeof c.calificacion === 'number' ? c.calificacion : null;
              const tieneCambios = cambiosPendientes.hasOwnProperty(c.id);
              
              return (
                <tr key={c.id} className={tieneCambios ? 'table-warning' : ''}>
                  <td className="text-muted">{index + 1}</td>
                  <td className="fw-semibold">
                    {c.materia}
                    <small className="text-muted d-block">
                      Registro ID: {c.id} | Materia ID: {c.materia_id}
                    </small>
                  </td>
                  <td className="text-center">
                    <span className="badge bg-secondary">{c.periodo}</span>
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-control text-center"
                      min="0"
                      max="100"
                      value={calNum !== null ? calNum : ''}
                      onChange={(e) => handleCalificacionChange(index, e.target.value)}
                      placeholder="Sin calificar"
                    />
                  </td>
                  <td className="text-center">
                    {calNum === null ? (
                      <span className="badge bg-warning text-dark">Sin calificar</span>
                    ) : calNum >= 70 ? (
                      <span className="badge bg-success">
                        <i className="bi bi-check-circle me-1"></i>Aprobada
                      </span>
                    ) : (
                      <span className="badge bg-danger">
                        <i className="bi bi-x-circle me-1"></i>Reprobada
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-end gap-2 mt-4">
        <button 
          className="btn btn-secondary"
          onClick={() => {
            setCalificacionesEditables(
              calificaciones.map(c => ({
                ...c,
                calificacionOriginal: c.calificacion
              }))
            );
            setCambiosPendientes({});
          }}
          disabled={loading || Object.keys(cambiosPendientes).length === 0}
        >
          <i className="bi bi-arrow-counterclockwise me-2"></i>Deshacer Cambios
        </button>
        <button 
          className="btn btn-primary"
          onClick={handleGuardarCambios}
          disabled={loading || Object.keys(cambiosPendientes).length === 0}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              Guardando...
            </>
          ) : (
            <>
              <i className="bi bi-save me-2"></i>
              Guardar Cambios ({Object.keys(cambiosPendientes).length})
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default EditarCalificacionesTab;