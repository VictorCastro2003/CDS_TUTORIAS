// models/index.js
import sequelize from "../config/database.js";
import Alumno from "./Alumno.js";
import Materia from "./Materia.js";
import AlumnoMateria from "./alumnoMateria.js";
import User from "./user.js";
import Grupo from "./Grupo.js";
import AlumnoGrupo from "./alumnoGrupo.js";
import Periodo from "./Periodo.js";
import Canalizacion from "./canalizacion.js"; // ✅ AGREGAR ESTA LÍNEA

// Relaciones Alumno-Materia
Alumno.belongsToMany(Materia, {
  through: AlumnoMateria,
  foreignKey: 'alumno_id',
  otherKey: 'materia_id'
});

Materia.belongsToMany(Alumno, {
  through: AlumnoMateria,
  foreignKey: 'materia_id',
  otherKey: 'alumno_id'
});

// Relaciones para Grupos
Alumno.belongsToMany(Grupo, {
  through: AlumnoGrupo,
  foreignKey: 'alumno_id',
  otherKey: 'grupo_id',
  as: 'grupos'
});

Grupo.belongsToMany(Alumno, {
  through: AlumnoGrupo,
  foreignKey: 'grupo_id',
  otherKey: 'alumno_id',
  as: 'alumnos'
});

// Relación Grupo-Tutor
Grupo.belongsTo(User, {
  foreignKey: 'tutor_id',
  as: 'tutor'
});

User.hasMany(Grupo, {
  foreignKey: 'tutor_id',
  as: 'grupos_tutoreados'
});

// Relación Grupo-Periodo
Grupo.belongsTo(Periodo, {
  foreignKey: 'periodo_id',
  as: 'periodo'
});

Periodo.hasMany(Grupo, {
  foreignKey: 'periodo_id',
  as: 'grupos'
});

// Relación AlumnoGrupo directa
AlumnoGrupo.belongsTo(Alumno, {
  foreignKey: 'alumno_id',
  as: 'alumno'
});

AlumnoGrupo.belongsTo(Grupo, {
  foreignKey: 'grupo_id',
  as: 'grupo'
});

AlumnoGrupo.belongsTo(Periodo, {
  foreignKey: 'periodo_id',
  as: 'periodo'
});

// ✅ Relaciones Canalizacion
Canalizacion.belongsTo(Alumno, { 
  foreignKey: 'alumno_id', 
  as: 'alumno' 
});

Canalizacion.belongsTo(User, { 
  foreignKey: 'tutor_id', 
  as: 'tutor' 
});

Alumno.hasMany(Canalizacion, {
  foreignKey: 'alumno_id',
  as: 'canalizaciones'
});

User.hasMany(Canalizacion, {
  foreignKey: 'tutor_id',
  as: 'canalizaciones'
});

// ✅ AGREGAR Canalizacion AL EXPORT
export { 
  sequelize, 
  Alumno, 
  Materia, 
  AlumnoMateria, 
  User, 
  Grupo, 
  AlumnoGrupo,
  Periodo,
  Canalizacion  // ✅ AGREGAR ESTA LÍNEA
};