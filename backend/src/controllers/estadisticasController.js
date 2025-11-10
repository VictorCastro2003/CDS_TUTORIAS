import { Alumno, Canalizacion, Alerta, Grupo, AlumnoGrupo, Periodo, AlumnoMateria } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

// Estadísticas GENERALES (todas las carreras y grupos)
export const obtenerEstadisticas = async (req, res) => {
  try {
    const { tutorId, division } = req.query;
    const periodoActivo = await Periodo.findOne({ where: { activo: true } });
    
    let whereClauseAlumnos = {};
    let whereClauseCanalizaciones = {};
    let whereClauseAlertas = {};
    
    // Filtros según el rol
    if (division) {
      // Jefe de División
      whereClauseAlumnos.Carrera = division;
      
      // Para canalizaciones y alertas, necesitamos los IDs de alumnos
      const alumnosDivision = await Alumno.findAll({
        where: { Carrera: division },
        attributes: ['id']
      });
      const alumnoIds = alumnosDivision.map(a => a.id);
      
      whereClauseCanalizaciones.alumno_id = { [Op.in]: alumnoIds };
      whereClauseAlertas.alumno_id = { [Op.in]: alumnoIds };
    } else if (tutorId) {
      // Tutor - obtener alumnos de sus grupos
      const gruposTutor = await Grupo.findAll({
        where: { 
          tutor_id: tutorId,
          periodo_id: periodoActivo?.id
        },
        attributes: ['id']
      });
      
      const gruposIds = gruposTutor.map(g => g.id);
      
      if (gruposIds.length > 0) {
        const asignaciones = await AlumnoGrupo.findAll({
          where: { 
            grupo_id: { [Op.in]: gruposIds },
            periodo_id: periodoActivo?.id
          },
          attributes: ['alumno_id']
        });
        
        const alumnoIds = [...new Set(asignaciones.map(a => a.alumno_id))];
        
        if (alumnoIds.length > 0) {
          whereClauseAlumnos.id = { [Op.in]: alumnoIds };
          whereClauseCanalizaciones.alumno_id = { [Op.in]: alumnoIds };
          whereClauseAlertas.alumno_id = { [Op.in]: alumnoIds };
        } else {
          // No tiene alumnos asignados
          return res.json({
            totalAlumnos: 0,
            canalizacionesActivas: 0,
            alumnosEnRiesgo: 0,
            faltasRecientes: 0,
            alumnosPorCarrera: [],
            canalizacionesPorTipo: [],
            alertasActivas: [],
            promedioGeneral: 0,
            periodoActivo
          });
        }
      } else {
        // No tiene grupos asignados
        return res.json({
          totalAlumnos: 0,
          canalizacionesActivas: 0,
          alumnosEnRiesgo: 0,
          faltasRecientes: 0,
          alumnosPorCarrera: [],
          canalizacionesPorTipo: [],
          alertasActivas: [],
          promedioGeneral: 0,
          periodoActivo
        });
      }
    }
    
    // Total de alumnos
    const totalAlumnos = await Alumno.count({ where: whereClauseAlumnos });
    
    // Canalizaciones activas
    const canalizacionesActivas = await Canalizacion.count({
      where: {
        ...whereClauseCanalizaciones,
        estado: { [Op.in]: ['pendiente', 'en seguimiento'] }
      }
    });
    
    // Alumnos por carrera
    const alumnosPorCarrera = await Alumno.findAll({
      where: whereClauseAlumnos,
      attributes: [
        'Carrera',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total']
      ],
      group: ['Carrera']
    });
    
    // Canalizaciones por tipo
    const canalizacionesPorTipo = await Canalizacion.findAll({
      where: whereClauseCanalizaciones,
      attributes: [
        'tipo_canalizacion',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total']
      ],
      group: ['tipo_canalizacion']
    });
    
    // Alertas activas por tipo
    const alertasActivas = await Alerta.findAll({
      where: { 
        ...whereClauseAlertas,
        estado: 'activa' 
      },
      attributes: [
        'tipo_alerta',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total']
      ],
      group: ['tipo_alerta']
    });
    
    // Alumnos en riesgo (con 2+ materias reprobadas)
    let alumnosEnRiesgo = 0;
    if (periodoActivo) {
      const materiasReprobadas = await AlumnoMateria.findAll({
        where: {
          ...(whereClauseAlumnos.id ? { alumno_id: whereClauseAlumnos.id } : {}),
          calificacion: { [Op.lt]: 70 },
          periodo_id: periodoActivo.id
        },
        attributes: [
          'alumno_id',
          [sequelize.fn('COUNT', sequelize.col('id')), 'total']
        ],
        group: ['alumno_id'],
        having: sequelize.literal('COUNT(id) >= 2')
      });
      
      alumnosEnRiesgo = materiasReprobadas.length;
    }
    
    // Faltas recientes (alumnos con alertas de faltas activas)
    const faltasRecientes = await Alerta.count({
      where: {
        ...whereClauseAlertas,
        tipo_alerta: 'faltas',
        estado: 'activa'
      }
    });
    
    // Promedio general
    let promedioGeneral = 0;
    if (periodoActivo) {
      const promedioResult = await AlumnoMateria.findOne({
        where: {
          ...(whereClauseAlumnos.id ? { alumno_id: whereClauseAlumnos.id } : {}),
          periodo_id: periodoActivo.id
        },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('calificacion')), 'promedio']
        ],
        raw: true
      });
      
      promedioGeneral = promedioResult?.promedio 
        ? parseFloat(promedioResult.promedio).toFixed(2) 
        : 0;
    }

    res.json({
      totalAlumnos,
      canalizacionesActivas,
      alumnosEnRiesgo,
      faltasRecientes,
      alumnosPorCarrera,
      canalizacionesPorTipo,
      alertasActivas,
      promedioGeneral,
      periodoActivo
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ 
      message: 'Error al obtener estadísticas',
      error: error.message 
    });
  }
};