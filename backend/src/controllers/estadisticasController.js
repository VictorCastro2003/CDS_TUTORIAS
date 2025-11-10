import { Alumno, Canalizacion, Alerta, Grupo, AlumnoGrupo, Periodo, AlumnoMateria } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

// Estadísticas GENERALES (todas las carreras y grupos)
export const obtenerEstadisticas = async (req, res) => {
  try {
    const periodoActivo = await Periodo.findOne({ where: { activo: true } });
    
    // Total de alumnos en el sistema
    const totalAlumnos = await Alumno.count();
    
    // Alumnos por carrera
    const alumnosPorCarrera = await Alumno.findAll({
      attributes: [
        'Carrera',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total']
      ],
      group: ['Carrera']
    });
    
    // Canalizaciones por tipo
    const canalizacionesPorTipo = await Canalizacion.findAll({
      attributes: [
        'tipo_canalizacion',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total']
      ],
      group: ['tipo_canalizacion']
    });
    
    // Alertas activas por tipo
    const alertasActivas = await Alerta.findAll({
      where: { estado: 'activa' },
      attributes: [
        'tipo_alerta',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total']
      ],
      group: ['tipo_alerta']
    });
    
    // Promedios generales
    let promedioGeneral = 0;
    
    if (periodoActivo) {
      const promedioResult = await AlumnoMateria.findOne({
        where: { periodo_id: periodoActivo.id },
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