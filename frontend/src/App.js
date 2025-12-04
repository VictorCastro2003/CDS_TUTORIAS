// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from './pages/Register';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Navbar from "./components/Navbar";
import AlumnosWrapper from "./pages/AlumnosWrapper";
import Canalizacion from "./pages/PaginaCanalizacion";
import AlumnoDetalle from "./pages/AlumnoDetalle.jsx";
import GruposDashboard from "./pages/GruposDashboard.jsx";
import ListaCanalizacion from "./pages/ListaCanalizacion";
import LandingPage from "./pages/LandingPage"; // 🏠 Landing Page
import Notificaciones from "./pages/Notificaciones"; // 🔔 Notificaciones

function App() {

  return (
    <Router>
      <Navbar />

      <Routes>
        {/* 🏠 Landing Page como ruta principal */}
        <Route path="/" element={<LandingPage />} />

        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />

        {/* ✨ RUTA INTELIGENTE QUE DECIDE QUÉ MOSTRAR */}
        <Route path="/alumnos" element={<AlumnosWrapper />} />
        <Route path="/alumnos/:id" element={<AlumnoDetalle />} />
        <Route path="/grupos" element={<GruposDashboard />} />

        {/* Rutas de canalizaciones */}
        <Route path="/canalizacion" element={<Canalizacion />} />
        <Route path="/canalizaciones" element={<ListaCanalizacion />} />

        {/* 🔔 Ruta de notificaciones */}
        <Route path="/notificaciones" element={<Notificaciones />} />
      </Routes>
    </Router>
  );
}

export default App;