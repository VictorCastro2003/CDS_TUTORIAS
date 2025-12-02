// models/index.js
import sequelize from "../config/database.js";
import Alumno from "./alerta.js";
import Materia from "./materia.js";
import AlumnoMateria from "./alumnoMateria.js";
import User from "./user.js";
import Grupo from "./grupo.js";
import AlumnoGrupo from "./alumnoGrupo.js";
import Periodo from "./periodo.js";
import Canalizacion from "./canalizacion.js";
import Alerta from "./alerta.js";
import Asistencia from "./asistencia.js";
import Notificacion from "./notificacion.js";
import Contrarreferencia from "./contrarreferencia.js";

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

// Relaciones para el workflow de canalizaciones
Canalizacion.belongsTo(User, {
  foreignKey: 'jefe_division_id',
  as: 'jefe_division'
});

Canalizacion.belongsTo(User, {
  foreignKey: 'docente_asesor_id',
  as: 'docente_asesor'
});

Canalizacion.belongsTo(User, {
  foreignKey: 'coordinacion_id',
  as: 'coordinacion'
});

Canalizacion.belongsTo(User, {
  foreignKey: 'psicologo_id',
  as: 'psicologo'
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
// RELACIONES NOTIFICACIONES
// ============================================
Notificacion.belongsTo(User, {
  foreignKey: 'usuario_id',
  as: 'usuario'
});

Notificacion.belongsTo(Canalizacion, {
  foreignKey: 'canalizacion_id',
  as: 'canalizacion'
});

User.hasMany(Notificacion, {
  foreignKey: 'usuario_id',
  as: 'notificaciones'
});

Canalizacion.hasMany(Notificacion, {
  foreignKey: 'canalizacion_id',
  as: 'notificaciones'
});


// ============================================
// RELACIONES CONTRARREFERENCIAS (CORREGIDAS)
// ============================================
// ✅ Cambia 'generada_por' por 'respondida_por'

Contrarreferencia.belongsTo(Canalizacion, {
  foreignKey: 'canalizacion_id',
  as: 'canalizacion'
});

Contrarreferencia.belongsTo(User, {
  foreignKey: 'respondida_por',  // ✅ CAMBIO AQUÍ
  as: 'generador'
});

Canalizacion.hasMany(Contrarreferencia, {
  foreignKey: 'canalizacion_id',
  as: 'contrarreferencias'
});

User.hasMany(Contrarreferencia, {
  foreignKey: 'respondida_por',  // ✅ CAMBIO AQUÍ
  as: 'contrarreferencias_generadas'
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
  Asistencia,
  Notificacion,
  Contrarreferencia
};