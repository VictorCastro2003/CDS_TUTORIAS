// models/index.js
import sequelize from "../config/database.js";
import Alumno from "./Alumno.js";
import Materia from "./Materia.js";
import AlumnoMateria from "./alumnoMateria.js";
import User from "./user.js";
import Grupo from "./Grupo.js";
import AlumnoGrupo from "./alumnoGrupo.js";
import Periodo from "./Periodo.js";
import Canalizacion from "./canalizacion.js"; 
import Alerta from "./alerta.js";
import Asistencia from "./asistencia.js";

// ============================================
// RELACIONES ALUMNO - MATERIA
// ============================================
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

// Relaciones directas para AlumnoMateria (necesarias para includes)
AlumnoMateria.belongsTo(Materia, {
  foreignKey: 'materia_id',
  as: 'materia'
});

AlumnoMateria.belongsTo(Alumno, {
  foreignKey: 'alumno_id',
  as: 'alumno'
});

AlumnoMateria.belongsTo(Periodo, {
  foreignKey: 'periodo_id',
  as: 'periodo'
});

// ============================================
// RELACIONES ALUMNO - GRUPO
// ============================================
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

// Relaciones directas para AlumnoGrupo
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

Alumno.hasMany(AlumnoGrupo, {
  foreignKey: 'alumno_id', 
  as: 'alumnoGrupos'
});

// ============================================
// RELACIONES GRUPO - TUTOR - PERIODO
// ============================================
Grupo.belongsTo(User, {
  foreignKey: 'tutor_id',
  as: 'tutor'
});

User.hasMany(Grupo, {
  foreignKey: 'tutor_id',
  as: 'grupos_tutoreados'
});

Grupo.belongsTo(Periodo, {
  foreignKey: 'periodo_id',
  as: 'periodo'
});

Periodo.hasMany(Grupo, {
  foreignKey: 'periodo_id',
  as: 'grupos'
});

// ============================================
// RELACIONES CANALIZACION
// ============================================
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

// ============================================
// RELACIONES ALERTAS
// ============================================
Alerta.belongsTo(Alumno, { 
  foreignKey: 'alumno_id', 
  as: 'alumno' 
});

Alerta.belongsTo(User, { 
  foreignKey: 'generada_por', 
  as: 'generador' 
});

Alumno.hasMany(Alerta, { 
  foreignKey: 'alumno_id', 
  as: 'alertas' 
});

User.hasMany(Alerta, { 
  foreignKey: 'generada_por', 
  as: 'alertas_generadas' 
});

// ============================================
// RELACIONES ASISTENCIAS
// ============================================
Asistencia.belongsTo(Alumno, { 
  foreignKey: 'alumno_id', 
  as: 'alumno' 
});

Asistencia.belongsTo(User, { 
  foreignKey: 'registrada_por', 
  as: 'registrador' 
});

Alumno.hasMany(Asistencia, { 
  foreignKey: 'alumno_id', 
  as: 'asistencias' 
});

// ============================================
// EXPORTACIONES
// ============================================
export { 
  sequelize, 
  Alumno, 
  Materia, 
  AlumnoMateria, 
  User, 
  Grupo, 
  AlumnoGrupo,
  Periodo,
  Canalizacion, 
  Alerta,
  Asistencia
};