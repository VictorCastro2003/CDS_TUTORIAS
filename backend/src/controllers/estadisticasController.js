import { Alumno, Canalizacion, Alerta, Grupo, AlumnoGrupo, Periodo } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

export const obtenerEstadisticas = async (req, res) => {
  try {
    const { division, tutorId } = req.query;
    
    // Obtener periodo activo
    const periodoActivo = await Periodo.findOne({ where: { activo: true } });
    if (!periodoActivo) {
      return res.json({
        totalAlumnos: 0,
        canalizacionesActivas: 0,
        alumnosEnRiesgo: 0,
        faltasRecientes: 0
      });
    }

    let whereAlumno = {};
    let includeAlumnoGrupo = null;

    // 🔹 FILTROS POR ROL
    if (tutorId) {
      // TUTOR: Solo sus grupos del periodo activo
      includeAlumnoGrupo = {
        model: AlumnoGrupo,
        as: 'alumnoGrupos', // Necesitas definir esta relación en models/index.js
        required: true,
        where: { periodo_id: periodoActivo.id },
        include: [{
          model: Grupo,
          as: 'grupo',
          required: true,
          where: { tutor_id: tutorId }
        }]
      };
    } else if (division) {
      // JEFE DIVISIÓN: Solo su carrera
      whereAlumno.Carrera = division;
    }
    // COORDINACIÓN: No filtra nada (todos los alumnos)

    // 📊 ESTADÍSTICAS
    const totalAlumnos = await Alumno.count({
      where: whereAlumno,
      ...(includeAlumnoGrupo && { include: [includeAlumnoGrupo], distinct: true })
    });

    // Canalizaciones activas
    const canalizacionesActivas = await Canalizacion.count({
      include: [{
        model: Alumno,
        as: 'alumno',
        where: whereAlumno,
        required: true,
        ...(includeAlumnoGrupo && { include: [includeAlumnoGrupo] })
      }],
      where: {
        estado: { [Op.in]: ['pendiente', 'en seguimiento'] }
      },
      distinct: true
    });

    // Alumnos en riesgo (alertas activas)
    const alumnosEnRiesgo = await Alerta.count({
      include: [{
        model: Alumno,
        as: 'alumno',
        where: whereAlumno,
        required: true,
        ...(includeAlumnoGrupo && { include: [includeAlumnoGrupo] })
      }],
      where: {
        estado: 'activa',
        tipo_alerta: { [Op.in]: ['faltas_consecutivas', 'materias_reprobadas', 'riesgo_vital'] }
      },
      distinct: true,
      col: 'alumno_id'
    });

    // Faltas recientes (4+ días)
    const faltasRecientes = await Alerta.count({
      include: [{
        model: Alumno,
        as: 'alumno',
        where: whereAlumno,
        required: true,
        ...(includeAlumnoGrupo && { include: [includeAlumnoGrupo] })
      }],
      where: {
        estado: 'activa',
        tipo_alerta: 'faltas_consecutivas',
        dias_faltas: { [Op.gte]: 4 }
      },
      distinct: true
    });

    res.json({
      totalAlumnos,
      canalizacionesActivas,
      alumnosEnRiesgo,
      faltasRecientes
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};