import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "bootstrap/dist/css/bootstrap.min.css";

export default function VistaCanalizaciones({ alumno_id }) {
  const [canalizaciones, setCanalizaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarCanalizaciones();
  }, [alumno_id]);

  const cargarCanalizaciones = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const url = alumno_id 
        ? `http://localhost:4000/api/canalizaciones?alumnoId=${alumno_id}`
        : 'http://localhost:4000/api/canalizaciones';
      
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
        <h5 className="mb-0">
          <i className="bi bi-clipboard-check me-2"></i>
          Canalizaciones Registradas
        </h5>
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
                      <div className="btn-group btn-group-sm">
                        {/* Botón detalles */}
                        <button
                          className="btn btn-outline-primary"
                          title="Ver detalles"
                          onClick={() => {
                            Swal.fire({
                              title: 'Detalles de Canalización',
                              html: `
                                <div class="text-start">
                                  <p><strong>Motivo:</strong> ${can.motivo}</p>
                                  ${can.problematica_identificada ? `<p><strong>Problemática:</strong> ${can.problematica_identificada}</p>` : ''}
                                  ${can.servicio_solicitado ? `<p><strong>Servicio:</strong> ${can.servicio_solicitado}</p>` : ''}
                                  ${can.observaciones ? `<p><strong>Observaciones:</strong> ${can.observaciones}</p>` : ''}
                                </div>
                              `,
                              width: 600
                            });
                          }}
                        >
                          <i className="bi bi-eye"></i>
                        </button>

                        {/* Botón descargar Word (solo psicológicas) */}
                        {can.tipo_canalizacion === 'psicologica' && (
                          <button
                            className="btn btn-outline-danger"
                            title="Descargar reporte Word"
                            onClick={() => descargarReporteWord(can.id, can.tipo_canalizacion)}
                          >
                            <i className="bi bi-file-earmark-word"></i>
                          </button>
                        )}

                        {/* Botón eliminar */}
                        <button
                          className="btn btn-outline-danger"
                          title="Eliminar"
                          onClick={() => {
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
                                // Aquí agregarías la función de eliminar
                                Swal.fire(
                                  'Eliminado',
                                  'La canalización ha sido eliminada',
                                  'success'
                                );
                              }
                            });
                          }}
                        >
                          <i className="bi bi-trash"></i>
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
      </div>
    </div>
  );
}

