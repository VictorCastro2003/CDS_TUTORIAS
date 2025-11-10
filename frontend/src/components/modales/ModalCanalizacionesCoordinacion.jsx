import React, { useState } from 'react';
import { Modal } from 'react-bootstrap';
import VistaCanalizaciones from '../../pages/ListaCanalizacion';

const ModalCanalizacionesCoordinacion = ({ show, onClose, grupos, fetchWithAuth, API_BASE }) => {
  const [filtro, setFiltro] = useState('todas');
  const [grupoSeleccionado, setGrupoSeleccionado] = useState('');
  const [carreraSeleccionada, setCarreraSeleccionada] = useState('');
  
  const carreras = [...new Set(grupos.map(g => g.carrera))];

  return (
    <Modal show={show} onHide={onClose} size="xl">
      <Modal.Header closeButton className="bg-info text-white">
        <Modal.Title>
          <i className="fas fa-clipboard-list me-2"></i>
          Canalizaciones - Vista Coordinación
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {/* Filtros */}
        <div className="card mb-3">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label fw-bold">Filtrar por:</label>
                <select 
                  className="form-select"
                  value={filtro}
                  onChange={(e) => {
                    setFiltro(e.target.value);
                    setGrupoSeleccionado('');
                    setCarreraSeleccionada('');
                  }}
                >
                  <option value="todas">Todas las canalizaciones</option>
                  <option value="grupo">Por grupo específico</option>
                  <option value="carrera">Por carrera</option>
                </select>
              </div>
              
              {filtro === 'grupo' && (
                <div className="col-md-4">
                  <label className="form-label fw-bold">Seleccionar grupo:</label>
                  <select 
                    className="form-select"
                    value={grupoSeleccionado}
                    onChange={(e) => setGrupoSeleccionado(e.target.value)}
                  >
                    <option value="">Selecciona un grupo</option>
                    {grupos.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.nombre} - {g.carrera}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {filtro === 'carrera' && (
                <div className="col-md-4">
                  <label className="form-label fw-bold">Seleccionar carrera:</label>
                  <select 
                    className="form-select"
                    value={carreraSeleccionada}
                    onChange={(e) => setCarreraSeleccionada(e.target.value)}
                  >
                    <option value="">Selecciona una carrera</option>
                    {carreras.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Lista de canalizaciones - reutilizar componente existente */}
        <VistaCanalizaciones 
          filtroPersonalizado={{
            tipo: filtro,
            grupoId: grupoSeleccionado,
            carrera: carreraSeleccionada
          }}
        />
      </Modal.Body>
    </Modal>
  );
};

export default ModalCanalizacionesCoordinacion;