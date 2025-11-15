import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
import "bootstrap/dist/css/bootstrap.min.css";

export default function VistaCanalizaciones({ alumno_id }) {
  const [canalizaciones, setCanalizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroRol, setFiltroRol] = useState(null);

  useEffect(() => {
    obtenerDatosUsuario();
  }, []);

  const obtenerDatosUsuario = () => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      setFiltroRol({
        rol: decoded.rol,
        id: decoded.id,
        division: decoded.division
      });
    }
  };

  useEffect(() => {
    if (filtroRol || alumno_id) {
      cargarCanalizaciones();
    }
  }, [filtroRol, alumno_id]);

  const cargarCanalizaciones = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let url = 'http://localhost:4000/api/canalizaciones';
      
      // Filtrar según el contexto
      if (alumno_id) {
        // Si viene alumno_id, mostrar solo las de ese alumno (vista detalle)
        url += `?alumnoId=${alumno_id}`;
      } else if (filtroRol) {
        // Si no hay alumno_id, filtrar según el rol del usuario
        if (filtroRol.rol === 'tutor') {
          url += `?tutorId=${filtroRol.id}`;
        } else if (filtroRol.rol === 'jefeDivision') {
          url += `?division=${filtroRol.division}`;
        }
        // coordinacion no necesita filtro, ve todas
      }
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setCanalizaciones(response.data);
    } catch (error) {
      console.error("Error al cargar canalizaciones:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las canalizaciones',
      });
    } finally {
      setLoading(false);
    }
  };

  const descargarReporteWord = async (canalizacionId, tipoCanalizacion) => {
    if (tipoCanalizacion !== 'psicologica') {
      Swal.fire({
        icon: 'info',
        title: 'Información',
        text: 'Solo las canalizaciones psicológicas tienen reporte en Word',
      });
      return;
    }

    try {
      Swal.fire({
        title: 'Generando reporte...',
        text: 'Por favor espera',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `http://localhost:4000/api/canalizaciones/${canalizacionId}/report/word`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );

      // Crear enlace de descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Ficha_Canalizacion_${canalizacionId}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      Swal.fire({
        icon: 'success',
        title: '¡Descarga exitosa!',
        text: 'El reporte se ha descargado correctamente',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error("Error al descargar reporte:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'No se pudo generar el reporte',
      });
    }
  };

  const eliminarCanalizacion = async (canalizacionId) => {
    Swal.fire({
      title: '¿Eliminar canalización?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem('token');
          await axios.delete(
            `http://localhost:4000/api/canalizaciones/${canalizacionId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );

          Swal.fire(
            'Eliminado',
            'La canalización ha sido eliminada',
            'success'
          );

          // Recargar la lista
          cargarCanalizaciones();
        } catch (error) {
          console.error("Error al eliminar:", error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo eliminar la canalización',
          });
        }
      }
    });
  };

  const getBadgeColor = (tipo) => {
    const colors = {
      psicologica: 'danger',
      academica: 'primary',
      medica: 'warning',
      otra: 'secondary'
    };
    return colors[tipo] || 'secondary';
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: { color: 'warning', icon: 'clock', text: 'Pendiente' },
      en_revision: { color: 'info', icon: 'eye', text: 'En Revisión' },
      atendida: { color: 'success', icon: 'check-circle', text: 'Atendida' },
      cerrada: { color: 'secondary', icon: 'x-circle', text: 'Cerrada' }
    };
    return badges[estado] || badges.pendiente;
  };

  const getTituloSegunRol = () => {
    if (alumno_id) return 'Canalizaciones del Alumno';
    if (!filtroRol) return 'Canalizaciones Registradas';
    
    switch(filtroRol.rol) {
      case 'tutor':
        return 'Mis Canalizaciones';
      case 'jefeDivision':
        return `Canalizaciones - ${filtroRol.division}`;
      case 'coordinacion':
        return 'Todas las Canalizaciones';
      default:
        return 'Canalizaciones Registradas';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3">Cargando canalizaciones...</p>
      </div>
    );
  }

  if (canalizaciones.length === 0) {
    return (
      <div className="alert alert-info">
        <i className="bi bi-info-circle me-2"></i>
        No hay canalizaciones registradas
      </div>
    );
  }

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-success text-white">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="bi bi-clipboard-check me-2"></i>
            {getTituloSegunRol()}
          </h5>
          <span className="badge bg-light text-dark">
            {canalizaciones.length} registros
          </span>
        </div>
      </div>

      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-light">
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Alumno</th>
                <th>Tutor</th>
                <th>Área</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {canalizaciones.map((can) => {
                const estadoBadge = getEstadoBadge(can.estado);
                return (
                  <tr key={can.id}>
                    <td>
                      <small>
                        {new Date(can.fecha).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </small>
                    </td>
                    <td>
                      <span className={`badge bg-${getBadgeColor(can.tipo_canalizacion)}`}>
                        {can.tipo_canalizacion}
                      </span>
                    </td>
                    <td>
                      {can.alumno ? (
                        <>
                          <div className="fw-semibold">
                            {can.alumno.Nombre} {can.alumno.Primer_Ap}
                          </div>
                          <small className="text-muted">
                            {can.alumno.Num_Control}
                          </small>
                        </>
                      ) : (
                        <span className="text-muted">N/A</span>
                      )}
                    </td>
                    <td>
                      <small>{can.tutor?.name || 'N/A'}</small>
                    </td>
                    <td>
                      <small>{can.area_destino}</small>
                    </td>
                    <td>
                      <span className={`badge bg-${estadoBadge.color}`}>
                        <i className={`bi bi-${estadoBadge.icon} me-1`}></i>
                        {estadoBadge.text}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-2 flex-wrap">
                        {/* Botón detalles */}
                       <button
  className="btn btn-sm btn-primary"
  onClick={() => {
    // ⭐ Formatear tipo de atención
    const tipoAtencionTexto = can.tipo_atencion === 'personal' 
      ? '👤 Solicitud Personal' 
      : can.tipo_atencion === 'tutor' 
        ? '👨‍🏫 Referido por Tutor' 
        : '👨‍🏫 Referido por Docente';
    
    Swal.fire({
      title: 'Detalles de Canalización',
      html: `
        <div class="text-start">
          ${can.tipo_atencion ? `
            <div class="alert alert-info mb-2">
              <strong>📋 Tipo de Atención:</strong><br>
              ${tipoAtencionTexto}
            </div>
          ` : ''}
          
          ${can.nota_derivacion ? `
            <div class="alert alert-secondary mb-2">
              <strong>📝 Nota de Derivación:</strong><br>
              ${can.nota_derivacion}
            </div>
          ` : ''}
          
          <p><strong>Motivo:</strong> ${can.motivo}</p>
          
          ${can.problematica_identificada ? `
            <p><strong>Problemática:</strong> ${can.problematica_identificada}</p>
          ` : ''}
          
          ${can.servicio_solicitado ? `
            <p><strong>Servicio:</strong> ${can.servicio_solicitado}</p>
          ` : ''}
          
          ${can.observaciones ? `
            <p><strong>Observaciones:</strong> ${can.observaciones}</p>
          ` : ''}
        </div>
      `,
      width: 650,
      customClass: {
        htmlContainer: 'text-start'
      }
    });
  }}
>
                          <i className="bi bi-eye me-1"></i>
                          Ver
                        </button>

                        {/* Botón descargar Word (solo psicológicas) */}
                        {can.tipo_canalizacion === 'psicologica' && (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => descargarReporteWord(can.id, can.tipo_canalizacion)}
                          >
                            <i className="bi bi-file-earmark-word me-1"></i>
                            Word
                          </button>
                        )}

                        {/* Botón eliminar */}
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => eliminarCanalizacion(can.id)}
                        >
                          <i className="bi bi-trash me-1"></i>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Leyenda */}
        <div className="mt-3 p-3 bg-light rounded">
          <small className="text-muted">
            <i className="bi bi-info-circle me-2"></i>
            <strong>Nota:</strong> Las canalizaciones psicológicas generan un reporte especial en formato Word.
            Haz clic en el botón <i className="bi bi-file-earmark-word"></i> para descargarlo.
          </small>
        </div>

        {/* Estadísticas rápidas */}
        <div className="row mt-4">
          <div className="col-md-3">
            <div className="card bg-warning text-white">
              <div className="card-body text-center">
                <h3>{canalizaciones.filter(c => c.estado === 'pendiente').length}</h3>
                <small>Pendientes</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-info text-white">
              <div className="card-body text-center">
                <h3>{canalizaciones.filter(c => c.estado === 'en_revision').length}</h3>
                <small>En Revisión</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success text-white">
              <div className="card-body text-center">
                <h3>{canalizaciones.filter(c => c.estado === 'atendida').length}</h3>
                <small>Atendidas</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-secondary text-white">
              <div className="card-body text-center">
                <h3>{canalizaciones.filter(c => c.estado === 'cerrada').length}</h3>
                <small>Cerradas</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}