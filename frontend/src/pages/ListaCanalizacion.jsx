import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
import "bootstrap/dist/css/bootstrap.min.css";

export default function VistaCanalizaciones({ alumno_id }) {
  const [canalizaciones, setCanalizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroRol, setFiltroRol] = useState(null);
  const [contrarreferencias, setContrarreferencias] = useState({});
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState(null);

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
      setUserRole(decoded.rol);
      setUserId(decoded.id);
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

      // Cargar contrareferencias para cada canalización
      await cargarTodasContrareferencias(response.data);
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

  const cargarTodasContrareferencias = async (canalizacionesList) => {
    try {
      const token = localStorage.getItem('token');
      const contrareferenciasMap = {};

      for (const can of canalizacionesList) {
        try {
          const response = await axios.get(
            `http://localhost:4000/api/contrarreferencias/canalizacion/${can.id}`,
            {
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );
          contrareferenciasMap[can.id] = response.data;
        } catch (error) {
          contrareferenciasMap[can.id] = [];
        }
      }

      setContrarreferencias(contrareferenciasMap);
    } catch (error) {
      console.error("Error al cargar contrareferencias:", error);
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

  // 🆕 Crear contrarreferencia
  const crearContrarreferencia = async (canalizacion) => {
    const { value: formValues } = await Swal.fire({
      title: `Crear Contrarreferencia ${canalizacion.tipo_canalizacion === 'academica' ? 'Académica' : 'Psicológica'}`,
      html: `
        <div class="text-start">
          <p><strong>Alumno:</strong> ${canalizacion.alumno?.Nombre} ${canalizacion.alumno?.Primer_Ap}</p>
          <p><strong>Tipo:</strong> ${canalizacion.tipo_canalizacion}</p>
          <hr>
          <div class="mb-3">
            <label class="form-label fw-bold">Contenido de la Contrarreferencia *</label>
            <textarea 
              id="contenido" 
              class="form-control" 
              rows="5" 
              placeholder="Describe el seguimiento, resultados de la asesoría/atención..."
              required
            ></textarea>
          </div>
          <div class="mb-3">
            <label class="form-label fw-bold">Recomendaciones</label>
            <textarea 
              id="recomendaciones" 
              class="form-control" 
              rows="3" 
              placeholder="Recomendaciones adicionales..."
            ></textarea>
          </div>
        </div>
      `,
      width: 700,
      showCancelButton: true,
      confirmButtonText: 'Crear Contrarreferencia',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      preConfirm: () => {
        const contenido = document.getElementById('contenido').value;
        const recomendaciones = document.getElementById('recomendaciones').value;

        if (!contenido) {
          Swal.showValidationMessage('El contenido es obligatorio');
          return false;
        }

        return { contenido, recomendaciones };
      }
    });

    if (formValues) {
      try {
        Swal.fire({
          title: 'Creando contrarreferencia...',
          allowOutsideClick: false,
          didOpen: () => { Swal.showLoading(); }
        });

        const token = localStorage.getItem('token');

        await axios.post(
          'http://localhost:4000/api/contrarreferencias',
          {
            canalizacion_id: canalizacion.id,
            generada_por: userId,
            tipo: canalizacion.tipo_canalizacion,
            contenido: formValues.contenido,
            recomendaciones: formValues.recomendaciones
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        Swal.fire({
          icon: 'success',
          title: '¡Contrarreferencia Creada!',
          html: `
            <p>La contrarreferencia ha sido creada y enviada automáticamente a:</p>
            <ul class="text-start">
              ${canalizacion.tipo_canalizacion === 'academica' ? `
                <li>✅ Jefe de División</li>
                <li>✅ Coordinación de Tutorías</li>
                <li>✅ Tutor</li>
              ` : `
                <li>✅ Jefe de División</li>
                <li>✅ Tutor</li>
              `}
            </ul>
          `,
          confirmButtonColor: '#28a745'
        });

        await cargarCanalizaciones();

      } catch (error) {
        console.error("Error al crear contrarreferencia:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.data?.message || 'No se pudo crear la contrarreferencia',
        });
      }
    }
  };

  // ✅ Función actualizada para ver contrarreferencias
  const verContrarreferencias = async (canalizacion) => {
    const contras = contrarreferencias[canalizacion.id] || [];

    if (contras.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin Contrarreferencias',
        text: 'Esta canalización aún no tiene contrarreferencias',
      });
      return;
    }

    const contrasHTML = contras.map((contra, index) => `
    <div class="card mb-3 text-start">
      <div class="card-header bg-${contra.tipo_respuesta === 'academica' ? 'primary' : 'danger'} text-white">
        <strong>Contrarreferencia ${contra.tipo_respuesta === 'academica' ? 'Académica' : 'Psicológica'} #${index + 1}</strong>
        <br>
        <small>Atendida el ${new Date(contra.fecha_atencion).toLocaleDateString('es-MX')}</small>
        <span class="badge bg-light text-dark ms-2">${contra.estado}</span>
      </div>
      <div class="card-body">
        <p><strong>Respondida por:</strong> ${contra.generador?.name || 'N/A'}</p>
        
        <p><strong>Descripción de la Atención:</strong></p>
        <p class="text-muted">${contra.descripcion_atencion}</p>
        
        ${contra.acciones_realizadas ? `
          <p><strong>Acciones Realizadas:</strong></p>
          <p class="text-muted">${contra.acciones_realizadas}</p>
        ` : ''}
        
        ${contra.recomendaciones ? `
          <p><strong>Recomendaciones:</strong></p>
          <p class="text-muted">${contra.recomendaciones}</p>
        ` : ''}
        
        ${contra.observaciones ? `
          <p><strong>Observaciones:</strong></p>
          <p class="text-muted">${contra.observaciones}</p>
        ` : ''}
      </div>
    </div>
  `).join('');

    Swal.fire({
      title: 'Contrarreferencias',
      html: `
      <div style="max-height: 500px; overflow-y: auto;">
        ${contrasHTML}
      </div>
    `,
      width: 800,
      showCloseButton: true,
      showConfirmButton: false
    });
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

    switch (filtroRol.rol) {
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
                <th>Contrarref.</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {canalizaciones.map((can) => {
                const estadoBadge = getEstadoBadge(can.estado);
                const numContras = (contrarreferencias[can.id] || []).length;

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
                    <td className="text-center">
                      {numContras > 0 ? (
                        <span
                          className="badge bg-success"
                          style={{ cursor: 'pointer' }}
                          onClick={() => verContrarreferencias(can)}
                          title="Ver contrareferencias"
                        >
                          {numContras} <i className="bi bi-eye"></i>
                        </span>
                      ) : (
                        <span className="badge bg-secondary">0</span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-2 flex-wrap">
                        {/* Botón detalles */}
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => {
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

                        {/* 🆕 Botón crear contrarreferencia */}
                        <button
                          className="btn btn-sm btn-success"
                          title="Crear Contrarreferencia"
                          onClick={() => crearContrarreferencia(can)}
                        >
                          <i className="bi bi-file-earmark-plus me-1"></i>
                          Contrarreferencia
                        </button>

                        {/* 🆕 Botón ver contrareferencias */}
                        {numContras > 0 && (
                          <button
                            className="btn btn-sm btn-info"
                            title="Ver Contrareferencias"
                            onClick={() => verContrarreferencias(can)}
                          >
                            <i className="bi bi-list-check me-1"></i> {numContras}
                          </button>
                        )}

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
            <strong>Nota:</strong>
            <ul className="mb-0 mt-2">
              <li>Usa <i className="bi bi-file-earmark-plus"></i> para crear una contrarreferencia</li>
              <li>Usa <i className="bi bi-list-check"></i> para ver las contrareferencias existentes</li>
              <li>Las canalizaciones psicológicas tienen reporte Word <i className="bi bi-file-earmark-word"></i></li>
            </ul>
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