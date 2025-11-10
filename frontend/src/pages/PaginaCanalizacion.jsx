import React, { useState } from 'react';
import CanalizacionForm from '../pages/FormularioCanalizaciones';
import CanalizacionList from '../pages/ListaCanalizacion';

export default function CanalizacionPage() {
  const [reload, setReload] = useState(false);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gestión de Canalizaciones</h1>
      <CanalizacionForm onCreated={() => setReload(!reload)} />
      <CanalizacionList key={reload} />
    </div>
  );
}
