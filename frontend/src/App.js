// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Register from './pages/Register';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Navbar from "./components/Navbar";
import AlumnosWrapper from "./pages/AlumnosWrapper"; 
import Canalizacion from "./pages/PaginaCanalizacion";
import AlumnoDetalle from "./pages/AlumnoDetalle.jsx";
import GruposDashboard from "./pages/GruposDashboard.jsx";
import ListaCanalizacion from "./pages/ListaCanalizacion"; // ⬅️ AGREGAR IMPORT

function App() {

  return (
    <Router>
      <Navbar />
      <nav>
        <Link to="/register">Register</Link> | 
        <Link to="/login">Login</Link> | 
        <Link to="/profile">Profile</Link>
      </nav>
      <Routes>
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
      </Routes>
    </Router>
  );
}

export default App;