import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

const AsignarMateriasTab = ({ alumnoId, alumno, onMateriasActualizadas }) => {
  const [materiasDisponibles, setMateriasDisponibles] = useState([]);
  const [materiasSeleccionadas, setMateriasSeleccionadas] = useState([]);
  const [semestreAsignacion, setSemestreAsignacion] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMaterias, setLoadingMaterias] = useState(true);

  useEffect(() => {
    cargarMateriasDisponibles();
  }, [alumno.Carrera]);

  const cargarMateriasDisponibles = async () => {
    try {
      setLoadingMaterias(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:4000/api/materias?carrera=${alumno.Carrera}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setMateriasDisponibles(data);
      }
    } catch (error) {
      console.error('Error cargando materias:', error);
      Swal.fire('Error', 'No se pudieron cargar las materias disponibles', 'error');
    } finally {
      setLoadingMaterias(false);
    }
  };

  // Filtrar materias por semestre seleccionado
  const materiasFiltradas = React.useMemo(() => {
    if (!semestreAsignacion) return [];
    return materiasDisponibles.filter(
      materia => materia.semestre === parseInt(semestreAsignacion)
    );
  }, [materiasDisponibles, semestreAsignacion]);

  const toggleMateria = (materiaId) => {
    setMateriasSeleccionadas(prev => 
      prev.includes(materiaId) 
        ? prev.filter(id => id !== materiaId)
        : prev.length < 6 
          ? [...prev, materiaId]
          : prev
    );
  };

  const handleAsignar = async () => {
    if (materiasSeleccionadas.length === 0) {
      Swal.fire('Atención', 'Selecciona al menos una materia', 'warning');
      return;
    }

    if (!semestreAsignacion || semestreAsignacion < 1 || semestreAsignacion > 12) {
      Swal.fire('Atención', 'Selecciona un semestre válido (1-12)', 'warning');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:4000/api/alumnos/${alumnoId}/materias`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          materias: materiasSeleccionadas,
          semestre: parseInt(semestreAsignacion)
        })
      });

      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Materias Asignadas',
          text: `Se asignaron ${materiasSeleccionadas.length} materias al semestre ${semestreAsignacion}`,
          timer: 2000
        });
        setMateriasSeleccionadas([]);
        setSemestreAsignacion('');
        onMateriasActualizadas();
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Error al asignar materias');
      }
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loadingMaterias) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="row mb-4">
        <div className="col-md-6">
          <label className="form-label fw-bold">Semestre a asignar:</label>
          <select 
            className="form-select"
            value={semestreAsignacion}
            onChange={(e) => setSemestreAsignacion(e.target.value)}
          >
            <option value="">Selecciona un semestre</option>
            {[...Array(12)].map((_, i) => (
              <option key={i + 1} value={i + 1}>Semestre {i + 1}</option>
            ))}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label fw-bold">Materias seleccionadas:</label>
          <div className="alert alert-info mb-0">
            <strong>{materiasSeleccionadas.length}</strong> de 6 máximo
          </div>
        </div>
      </div>

      {!semestreAsignacion ? (
        <div className="alert alert-info">
          <i className="bi bi-info-circle me-2"></i>
          Selecciona un semestre para ver las materias disponibles
        </div>
      ) : materiasFiltradas.length > 0 ? (
        <div className="row g-3 mb-4">
          {materiasFiltradas.map(materia => (
            <div key={materia.id} className="col-md-6">
              <div 
                className={`card h-100 ${materiasSeleccionadas.includes(materia.id) ? 'border-primary bg-light' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => toggleMateria(materia.id)}
              >
                <div className="card-body d-flex align-items-center">
                  <input 
                    type="checkbox"
                    className="form-check-input me-3"
                    checked={materiasSeleccionadas.includes(materia.id)}
                    onChange={() => {}}
                    style={{ width: '20px', height: '20px' }}
                  />
                  <div className="flex-grow-1">
                    <h6 className="mb-1">{materia.nombre}</h6>
                    <small className="text-muted">
                      <i className="bi bi-bookmark me-1"></i>
                      Semestre {materia.semestre}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-warning">
          <i className="bi bi-exclamation-triangle me-2"></i>
          No hay materias disponibles para el semestre {semestreAsignacion} de la carrera {alumno.Carrera}
        </div>
      )}

      <div className="d-flex justify-content-end gap-2">
        <button 
          className="btn btn-secondary"
          onClick={() => {
            setMateriasSeleccionadas([]);
            setSemestreAsignacion('');
          }}
          disabled={loading}
        >
          <i className="bi bi-x-circle me-2"></i>Limpiar
        </button>
        <button 
          className="btn btn-primary"
          onClick={handleAsignar}
          disabled={loading || materiasSeleccionadas.length === 0 || !semestreAsignacion}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              Asignando...
            </>
          ) : (
            <>
              <i className="bi bi-check-circle me-2"></i>
              Asignar Materias
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AsignarMateriasTab;