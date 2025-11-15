import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "bootstrap/dist/css/bootstrap.min.css";

export default function CanalizacionForm({ alumno_id, nombreAlumno }) {
  const [form, setForm] = useState({
    alumno_id: alumno_id || "",
    tutor_id: "",
    tipo_canalizacion: "academica",
    tipo_atencion: "personal",   
    nota_derivacion: "",  
    area_destino: "",
    motivo: "",
    observaciones: "",
    problematica_identificada: "",
    servicio_solicitado: ""
  });

  const [tutores, setTutores] = useState([]);
  const [loadingTutores, setLoadingTutores] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    cargarTutores();
  }, []);

  useEffect(() => {
    setForm(prev => ({ ...prev, alumno_id: alumno_id || "" }));
  }, [alumno_id]);

  const cargarTutores = async () => {
    try {
      setLoadingTutores(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get('http://localhost:4000/api/users/tutores', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setTutores(response.data);
    } catch (error) {
      console.error("Error al cargar tutores:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los tutores disponibles',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    } finally {
      setLoadingTutores(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // Si cambia el tipo, limpiar campos específicos
    if (name === 'tipo_canalizacion') {
      if (value !== 'psicologica') {
        setForm(prev => ({
          ...prev,
          tipo_canalizacion: value,
          problematica_identificada: "",
          servicio_solicitado: ""
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.tutor_id) {
      Swal.fire({
        icon: 'warning',
        title: 'Atención',
        text: 'Debes seleccionar un tutor',
      });
      return;
    }

    // Validar campos específicos para canalización psicológica
    if (form.tipo_canalizacion === 'psicologica') {
      if (!form.problematica_identificada || !form.servicio_solicitado) {
        Swal.fire({
          icon: 'warning',
          title: 'Atención',
          text: 'Para canalizaciones psicológicas debes completar la problemática identificada y el servicio solicitado',
        });
        return;
      }
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      await axios.post('http://localhost:4000/api/canalizaciones', form, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      Swal.fire({
        icon: 'success',
        title: '¡Canalización Registrada!',
        text: 'La canalización se ha guardado correctamente',
        timer: 2000,
        showConfirmButton: false
      });

      // Limpiar formulario
      setForm({
        alumno_id: alumno_id || "",
        tutor_id: "",
        tipo_canalizacion: "academica",
        tipo_atencion: "personal",       
        nota_derivacion: "",  
        area_destino: "",
        motivo: "",
        observaciones: "",
        problematica_identificada: "",
        servicio_solicitado: ""
      });

    } catch (error) {
      console.error("Error al registrar canalización:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'Ocurrió un error al guardar la canalización',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">
          <i className="bi bi-clipboard-plus me-2"></i>
          Registrar Canalización
        </h5>
      </div>

      <div className="card-body">
        {nombreAlumno && (
          <div className="alert alert-info mb-4">
            <i className="bi bi-info-circle me-2"></i>
            <strong>Alumno:</strong> {nombreAlumno}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <input type="hidden" name="alumno_id" value={form.alumno_id} />

            {/* Tipo de Canalización */}
            <div className="col-md-12">
              <label className="form-label fw-semibold">
                <i className="bi bi-tag me-1"></i> 
                Tipo de Canalización <span className="text-danger">*</span>
              </label>
              <select
                name="tipo_canalizacion"
                value={form.tipo_canalizacion}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="academica">Académica</option>
                <option value="psicologica">Psicológica</option>
                <option value="medica">Médica</option>
                <option value="otra">Otra</option>
              </select>
              {form.tipo_canalizacion === 'psicologica' && (
                <small className="text-info d-block mt-1">
                  <i className="bi bi-info-circle me-1"></i>
                  Las canalizaciones psicológicas generan un reporte especial en formato Word
                </small>
              )}
            </div>
{/* ⭐ TIPO DE ATENCIÓN - NUEVO CAMPO */}
<div className="col-md-6">
  <label className="form-label fw-semibold">
    <i className="bi bi-person-check me-1"></i> 
    Tipo de Atención <span className="text-danger">*</span>
  </label>
  <select
    name="tipo_atencion"
    value={form.tipo_atencion}
    onChange={handleChange}
    className="form-select"
    required
  >
    <option value="personal">Solicitud Personal del Alumno</option>
    <option value="tutor">Referido por Tutor</option>
    <option value="docente">Referido por Docente</option>
  </select>
  <small className="text-muted">
    Indica cómo llegó el alumno al servicio
  </small>
</div>

{/* ⭐ NOTA DE DERIVACIÓN - NUEVO CAMPO */}
<div className="col-md-6">
  <label className="form-label fw-semibold">
    <i className="bi bi-info-circle me-1"></i> 
    Nota de Derivación <span className="text-danger">*</span>
  </label>
  <textarea
    name="nota_derivacion"
    value={form.nota_derivacion}
    onChange={handleChange}
    rows="3"
    placeholder="Describe cómo llegó el alumno (ej: 'El tutor Juan Pérez detectó bajo rendimiento')"
    className="form-control"
    required
  ></textarea>
  <small className="text-muted">
    Explica brevemente el origen de la canalización
  </small>
</div>
            {/* Selector de Tutor */}
            <div className="col-md-6">
              <label className="form-label fw-semibold">
                <i className="bi bi-person-badge me-1"></i> 
                Tutor Asignado <span className="text-danger">*</span>
              </label>
              {loadingTutores ? (
                <div className="form-control d-flex align-items-center">
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Cargando tutores...
                </div>
              ) : (
                <select
                  name="tutor_id"
                  value={form.tutor_id}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="">Selecciona un tutor</option>
                  {tutores.map(tutor => (
                    <option key={tutor.id} value={tutor.id}>
                      {tutor.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Área de Destino */}
            <div className="col-md-6">
              <label className="form-label fw-semibold">
                <i className="bi bi-building me-1"></i> 
                Área de Destino <span className="text-danger">*</span>
              </label>
              <select
                name="area_destino"
                value={form.area_destino}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">Selecciona un área</option>
                <option value="Psicología">Psicología</option>
                <option value="Trabajo Social">Trabajo Social</option>
                <option value="Orientación Educativa">Orientación Educativa</option>
                <option value="Departamento Médico">Departamento Médico</option>
                <option value="Coordinación Académica">Coordinación Académica</option>
                <option value="Servicios Escolares">Servicios Escolares</option>
                <option value="Otra">Otra</option>
              </select>
            </div>

            {/* Motivo */}
            <div className="col-12">
              <label className="form-label fw-semibold">
                <i className="bi bi-chat-left-dots me-1"></i> 
                Motivo de Canalización <span className="text-danger">*</span>
              </label>
              <select
                name="motivo"
                value={form.motivo}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">Selecciona un motivo</option>
                <option value="Bajo rendimiento académico">Bajo rendimiento académico</option>
                <option value="Problemas de conducta">Problemas de conducta</option>
                <option value="Problemas emocionales">Problemas emocionales</option>
                <option value="Situación familiar">Situación familiar</option>
                <option value="Problemas de salud">Problemas de salud</option>
                <option value="Dificultades de aprendizaje">Dificultades de aprendizaje</option>
                <option value="Orientación vocacional">Orientación vocacional</option>
                <option value="Otros">Otros</option>
              </select>
            </div>

            {/* CAMPOS ESPECÍFICOS PARA CANALIZACIÓN PSICOLÓGICA */}
            {form.tipo_canalizacion === 'psicologica' && (
              <>
                <div className="col-12">
                  <div className="alert alert-warning">
                    <strong><i className="bi bi-exclamation-triangle me-2"></i>Canalización Psicológica</strong>
                    <p className="mb-0 small">
                      Completa los campos adicionales requeridos para el reporte formal
                    </p>
                  </div>
                </div>

                {/* Problemática Identificada */}
                <div className="col-12">
                  <label className="form-label fw-semibold">
                    <i className="bi bi-clipboard-data me-1"></i> 
                    Problemática Identificada <span className="text-danger">*</span>
                  </label>
                  <textarea
                    name="problematica_identificada"
                    value={form.problematica_identificada}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Ejemplo: Probable problema de dislexia"
                    className="form-control"
                    required={form.tipo_canalizacion === 'psicologica'}
                  ></textarea>
                  <small className="text-muted">
                    Describe la problemática específica identificada en el estudiante
                  </small>
                </div>

                {/* Servicio Solicitado */}
                <div className="col-12">
                  <label className="form-label fw-semibold">
                    <i className="bi bi-gear me-1"></i> 
                    Servicio Solicitado <span className="text-danger">*</span>
                  </label>
                  <textarea
                    name="servicio_solicitado"
                    value={form.servicio_solicitado}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Ejemplo: Generación de diagnóstico por experto, retroalimentación para docentes, apoyo psicológico"
                    className="form-control"
                    required={form.tipo_canalizacion === 'psicologica'}
                  ></textarea>
                  <small className="text-muted">
                    Especifica los servicios que requiere el estudiante del área de psicología
                  </small>
                </div>
              </>
            )}

            {/* Observaciones */}
            <div className="col-12">
              <label className="form-label fw-semibold">
                <i className="bi bi-journal-text me-1"></i> 
                Observaciones {form.tipo_canalizacion === 'psicologica' && <span className="text-danger">*</span>}
              </label>
              <textarea
                name="observaciones"
                value={form.observaciones}
                onChange={handleChange}
                rows="4"
                placeholder="Añade detalles o comentarios relevantes sobre la situación del alumno..."
                className="form-control"
                required={form.tipo_canalizacion === 'psicologica'}
              ></textarea>
              <small className="text-muted">
                {form.tipo_canalizacion === 'psicologica' 
                  ? 'Describe el contexto y situaciones observadas (ejemplo: docentes que sugirieron la atención, dificultades en productos de trabajo o expresión oral)'
                  : 'Describe brevemente la situación que motiva la canalización'
                }
              </small>
            </div>

            {/* Botones */}
            <div className="col-12 d-flex justify-content-end gap-2 mt-3">
             <button
  type="button"
  className="btn btn-outline-secondary"
  onClick={() => {
    setForm({
      alumno_id: alumno_id || "",
      tutor_id: "",
      tipo_canalizacion: "academica",
      tipo_atencion: "personal",       
      nota_derivacion: "",              
      area_destino: "",
      motivo: "",
      observaciones: "",
      problematica_identificada: "",
      servicio_solicitado: ""
    });
  }}
                disabled={submitting}
              >
                <i className="bi bi-x-circle me-2"></i>
                Limpiar
              </button>
              <button
                type="submit"
                className="btn btn-primary px-4"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Guardando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-save me-2"></i>
                    Guardar Canalización
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}