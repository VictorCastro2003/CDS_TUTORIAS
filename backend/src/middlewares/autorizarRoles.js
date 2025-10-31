// middlewares/autorizarRoles.js
const autorizarRoles = (...rolesPermitidos) => {
  return (req, res, next) => {
    const userRole = req.user?.rol || req.user?.role;

    if (!userRole) {
      return res.status(403).json({ message: "No se encontró rol en el token" });
    }

    if (!rolesPermitidos.includes(userRole)) {
      return res.status(403).json({ message: "Acceso denegado: rol no autorizado" });
    }

    next();
  };
};

export default autorizarRoles;