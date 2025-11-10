import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { loginUser } from "../utils/api";
import '../styles/LoginStyle.css';

const Login = ({ setToken }) => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success' o 'error'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setMessageType("");
    
    try {
      const data = await loginUser(name, password);
    if (data.token) {
  setToken(data.token);
  localStorage.setItem("token", data.token); // ✅ guarda el token
  setMessage("✅ Inicio de sesión exitoso. Redirigiendo...");
  setMessageType("success");
        
        // Redirigir después de 1.5 segundos
        setTimeout(() => {
          navigate("/alumnos");
        }, 1500);
      } else {
        setMessage("❌ " + (data.message || "Credenciales incorrectas"));
        setMessageType("error");
      }
    } catch (error) {
      setMessage("❌ Error de conexión. Intenta nuevamente.");
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-background"></div>
      
      <div className="login-container">
        <div className="login-header">
          <h2>Bienvenido de vuelta</h2>
          <p>Ingresa tus credenciales para continuar</p>
        </div>

        {message && (
          <div className={`login-message ${messageType}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="name">Usuario</label>
            <input
              type="text"
              id="name"
              placeholder="Tu nombre de usuario"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-options">
            <div className="remember-me">
              <input type="checkbox" id="remember" disabled={isSubmitting} />
              <label htmlFor="remember">Recordar sesión</label>
            </div>
            <a href="#" className="forgot-password">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Iniciando sesión...
              </>
            ) : (
              "Ingresar"
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>
            ¿No tienes una cuenta?{" "}
            <a href="/registro" className="register-link">
              Regístrate aquí
            </a>
          </p>
          <a href="/" className="btn-volver">
            ← Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;