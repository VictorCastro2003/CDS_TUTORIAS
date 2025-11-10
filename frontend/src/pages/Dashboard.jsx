import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/LoginStyle.css";
import "../styles/DashboardStyle.css";

const DashboardMejorado = () => {
  const navigate = useNavigate();
  
  const [alumnos, setAlumnos] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    totalAlumnos: 0,
    canalizacionesActivas: 0,
    alumnosEnRiesgo: 0,
    faltasRecientes: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [userRole, setUserRole] = useState("");
  const [userDivision, setUserDivision] = useState("");
  const [userId, setUserId] = useState("");
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [alertasMap, setAlertasMap] = useState({});
  const [canalizacionesMap, setCanalizacionesMap] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        Swal.fire("Error", "No se encontró token de autenticación", "error");
        setLoading(false);
        return;
      }

      const decoded = jwtDecode(token);
      
      console.log("Usuario decodificado:", decoded); // Debug
      
      // Bloquear coordinación
      if (decoded.rol === 'coordinacion') {
        navigate('/grupos-dashboard');
        return;
      }

      setUserRole(decoded.rol || "");
      setUserDivision(decoded.division || "");
      setUserId(decoded.id || "");

      // Obtener alumnos
      const resAlumnos = await fetch("http://localhost:4000/api/alumnos", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!resAlumnos.ok) throw new Error(`Error ${resAlumnos.status}`);
      let data = await resAlumnos.json();

      console.log("Alumnos recibidos del backend:", data.length); // Debug

      // Filtrar por división si es jefe de división
      if (decoded.rol === "jefeDivision" && decoded.division) {
        data = data.filter(alumno => alumno.Carrera === decoded.division);
        console.log("Alumnos después de filtrar por división:", data.length); // Debug
      }

      // Filtrar por tutor si es tutor - SOLO si existe el campo tutor_id
      if (decoded.rol === "tutor" && decoded.id) {
        // Verificar si los alumnos tienen el campo tutor_id
        if (data.length > 0 && data[0].tutor_id !== undefined) {
          data = data.filter(alumno => alumno.tutor_id === decoded.id);
          console.log("Alumnos después de filtrar por tutor:", data.length); // Debug
        } else {
          console.warn("⚠️ El campo 'tutor_id' no existe en la tabla alumnos. Mostrando todos los alumnos.");
          // Si no existe tutor_id, mostramos todos los alumnos por ahora
        }
      }

      setAlumnos(Array.isArray(data) ? data : []);

      // Obtener estadísticas reales
      let queryParams = '';
      if (decoded.rol === 'jefeDivision' && decoded.division) {
        queryParams = `?division=${decoded.division}`;
      } else if (decoded.rol === 'tutor' && decoded.id) {
        queryParams = `?tutorId=${decoded.id}`;
      }
      
      const resEstadisticas = await fetch(`http://localhost:4000/api/estadisticas${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (resEstadisticas.ok) {
        const stats = await resEstadisticas.json();
        setEstadisticas(stats);
        console.log("Estadísticas recibidas:", stats); // Debug
      } else {
        console.error("Error al obtener estadísticas:", resEstadisticas.status);
      }

      // Obtener alertas y canalizaciones reales (solo para los primeros 20 alumnos para evitar muchas peticiones)
      const alumnosParaAlertas = data.slice(0, 20);
      const alertasTemp = {};
      const canalizacionesTemp = {};
      
      for (const alumno of alumnosParaAlertas) {
        try {
          // Obtener alertas del alumno
          const resAlertas = await fetch(`http://localhost:4000/api/alertas/alumno/${alumno.id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          
          if (resAlertas.ok) {
            const alertas = await resAlertas.json();
            const alertasActivas = alertas.filter(a => a.estado === 'activa');
            if (alertasActivas.length > 0) {
              alertasTemp[alumno.id] = alertasActivas;
            }
          }

          // Obtener canalizaciones del alumno
          const resCanalizaciones = await fetch(`http://localhost:4000/api/canalizaciones?alumnoId=${alumno.id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          
          if (resCanalizaciones.ok) {
            const canalizaciones = await resCanalizaciones.json();
            const canalizacionesActivas = canalizaciones.filter(
              c => c.estado === 'pendiente' || c.estado === 'en seguimiento'
            );
            if (canalizacionesActivas.length > 0) {
              canalizacionesTemp[alumno.id] = canalizacionesActivas;
            }
          }
        } catch (error) {
          console.error(`Error al obtener datos del alumno ${alumno.id}:`, error);
        }
      }
      
      setAlertasMap(alertasTemp);
      setCanalizacionesMap(canalizacionesTemp);

    } catch (error) {
      console.error("Error al obtener datos:", error);
      Swal.fire("Error", "No se pudieron cargar los datos", "error");
      setAlumnos([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrado (solo búsqueda general)
  const filteredAlumnos = alumnos.filter((alumno) => {
    return Object.values(alumno).some((value) =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Ordenamiento
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedAlumnos = [...filteredAlumnos].sort((a, b) => {
    if (!sortColumn) return 0;
    const valueA = a[sortColumn]?.toString().toLowerCase() || "";
    const valueB = b[sortColumn]?.toString().toLowerCase() || "";
    return sortDirection === "asc"
      ? valueA.localeCompare(valueB)
      : valueB.localeCompare(valueA);
  });

  // Paginación
  const totalPages = Math.ceil(sortedAlumnos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAlumnos = sortedAlumnos.slice(startIndex, endIndex);

  const goToPage = (page) => setCurrentPage(page);
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading) {
    return (
      <div className="login-wrapper">
        <div className="login-background"></div>
        <div className="login-container text-center mt-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-3">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrapper">
      <div className="login-background"></div>

      <div className="login-container expanded-container">
        <div className="login-header text-center mb-4">
          <h2>
            <i className="fas fa-chart-line me-2"></i>
            Dashboard de Tutorías
          </h2>
          <p>Panel de control y seguimiento de estudiantes</p>
          {userRole === "jefeDivision" && (
            <div className="badge bg-info text-dark mt-2">
              <i className="fas fa-building me-1"></i>
              División: {userDivision}
            </div>
          )}
          {userRole === "tutor" && (
            <div className="badge bg-success text-dark mt-2">
              <i className="fas fa-user-tie me-1"></i>
              Mis Alumnos Tutorados
            </div>
          )}
        </div>

        {/* Tarjetas de Estadísticas */}
        <div className="row mb-4 g-3">
          <div className="col-md-3">
            <div className="card stat-card bg-primary text-white shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="card-subtitle mb-2 opacity-75">Total Alumnos</h6>
                    <h2 className="card-title mb-0">{estadisticas.totalAlumnos}</h2>
                  </div>
                  <div className="stat-icon">
                    <i className="fas fa-users fa-3x opacity-50"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card stat-card bg-info text-white shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="card-subtitle mb-2 opacity-75">Canalizaciones Activas</h6>
                    <h2 className="card-title mb-0">{estadisticas.canalizacionesActivas}</h2>
                  </div>
                  <div className="stat-icon">
                    <i className="fas fa-clipboard-list fa-3x opacity-50"></i>
                  </div>
                </div>
                <small className="opacity-75">En seguimiento</small>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card stat-card bg-warning text-white shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="card-subtitle mb-2 opacity-75">Alumnos en Riesgo</h6>
                    <h2 className="card-title mb-0">{estadisticas.alumnosEnRiesgo}</h2>
                  </div>
                  <div className="stat-icon">
                    <i className="fas fa-exclamation-triangle fa-3x opacity-50"></i>
                  </div>
                </div>
                <small className="opacity-75">Requieren atención</small>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card stat-card bg-danger text-white shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="card-subtitle mb-2 opacity-75">Faltas Recientes</h6>
                    <h2 className="card-title mb-0">{estadisticas.faltasRecientes}</h2>
                  </div>
                  <div className="stat-icon">
                    <i className="fas fa-calendar-times fa-3x opacity-50"></i>
                  </div>
                </div>
                <small className="opacity-75">4+ días consecutivos</small>
              </div>
            </div>
          </div>
        </div>
{/* Agregar después de las tarjetas de estadísticas, antes de los filtros */}
<div className="row mb-4">
  <div className="col-12">
    <button
      className="btn btn-success btn-lg w-100"
      onClick={() => navigate('/canalizaciones')}
    >
      <i className="fas fa-clipboard-list me-2"></i>
      Ver Mis Canalizaciones
      {estadisticas.canalizacionesActivas > 0 && (
        <span className="badge bg-danger ms-2">
          {estadisticas.canalizacionesActivas}
        </span>
      )}
    </button>
  </div>
</div>
        <div className="login-form expanded-form">
          {/* Filtros simplificados - solo búsqueda */}
          <div className="card mb-4 shadow-sm">
            <div className="card-header bg-dark text-white">
              <i className="fas fa-search me-2"></i>
              Búsqueda de Alumnos
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-12">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar por nombre, número de control, carrera..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {searchTerm && (
                <div className="mt-3">
                  <small className="text-muted">
                    <i className="fas fa-info-circle me-1"></i>
                    Mostrando {filteredAlumnos.length} de {alumnos.length} alumnos
                  </small>
                </div>
              )}
            </div>
          </div>

          {/* Barra superior con items por página */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="text-white mb-0">
              <i className="fas fa-table me-2"></i>
              Listado de Alumnos
            </h5>
            <div className="items-per-page-selector">
              <label htmlFor="itemsPerPage" className="text-white me-2">
                Mostrar:
              </label>
              <select
                id="itemsPerPage"
                className="form-select form-select-sm"
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                style={{ width: "80px" }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Tabla */}
          <div className="table-container">
            <table className="table table-striped table-bordered custom-table">
              <thead className="table-dark">
                <tr>
                  <th onClick={() => handleSort("Num_Control")} style={{ cursor: "pointer" }}>
                    N° Control{" "}
                    {sortColumn === "Num_Control" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th onClick={() => handleSort("Nombre")} style={{ cursor: "pointer" }}>
                    Nombre{" "}
                    {sortColumn === "Nombre" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th onClick={() => handleSort("Primer_Ap")} style={{ cursor: "pointer" }}>
                    Apellidos{" "}
                    {sortColumn === "Primer_Ap" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th onClick={() => handleSort("Carrera")} style={{ cursor: "pointer" }}>
                    Carrera{" "}
                    {sortColumn === "Carrera" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th onClick={() => handleSort("Semestre")} style={{ cursor: "pointer" }} className="text-center">
                    Semestre{" "}
                    {sortColumn === "Semestre" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="text-center">Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {currentAlumnos.length > 0 ? (
                  currentAlumnos.map((alumno) => {
                    // Usar alertas y canalizaciones reales
                    const tieneAlerta = alertasMap[alumno.id] && alertasMap[alumno.id].length > 0;
                    const tieneCanalizacion = canalizacionesMap[alumno.id] && canalizacionesMap[alumno.id].length > 0;
                    
                    return (
                      <tr key={alumno.id}>
                        <td className="text-center">{alumno.Num_Control}</td>
                        <td>{alumno.Nombre}</td>
                        <td>{alumno.Primer_Ap} {alumno.Segundo_Ap}</td>
                        <td>
                          <small>{alumno.Carrera}</small>
                        </td>
                        <td className="text-center">
                          <span className="badge bg-secondary">{alumno.Semestre}°</span>
                        </td>
                        <td className="text-center">
                          {tieneAlerta && (
                            <span className="badge bg-danger me-1" title="Alumno en riesgo">
                              <i className="fas fa-exclamation-triangle"></i> Riesgo
                            </span>
                          )}
                          {tieneCanalizacion && (
                            <span className="badge bg-info" title="Canalización activa">
                              <i className="fas fa-clipboard-check"></i> Canalizado
                            </span>
                          )}
                          {!tieneAlerta && !tieneCanalizacion && (
                            <span className="badge bg-success">
                              <i className="fas fa-check-circle"></i> Normal
                            </span>
                          )}
                        </td>
                        <td className="text-center">
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              if (!alumno.id) {
                                Swal.fire("Error", "El alumno no tiene un ID válido", "error");
                                return;
                              }
                              navigate(`/alumnos/${alumno.id}`);
                            }}
                          >
                            <i className="fas fa-eye me-1"></i> Ver Detalles
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      {searchTerm
                        ? "No se encontraron alumnos con los filtros aplicados"
                        : "No hay alumnos registrados"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-4">
              <div className="text-white">
                Mostrando {startIndex + 1} a {Math.min(endIndex, sortedAlumnos.length)} de {sortedAlumnos.length} alumnos
              </div>
              
              <nav>
                <ul className="pagination mb-0">
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => goToPage(1)}
                      disabled={currentPage === 1}
                    >
                      ««
                    </button>
                  </li>
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      «
                    </button>
                  </li>
                  
                  {getPageNumbers().map((page) => (
                    <li
                      key={page}
                      className={`page-item ${currentPage === page ? "active" : ""}`}
                    >
                      <button className="page-link" onClick={() => goToPage(page)}>
                        {page}
                      </button>
                    </li>
                  ))}
                  
                  <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      »
                    </button>
                  </li>
                  <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => goToPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      »»
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardMejorado;