import { Alerta, Alumno, User, Grupo, AlumnoGrupo, Periodo } from '../models/index.js';
import { Op } from 'sequelize';

// Obtener todas las alertas (con filtros opcionales)
export const obtenerTodasAlertas = async (req, res) => {
  try {
    const { estado, tipo, grupoId } = req.query;
    const { rol, id: userId } = req.user;
    
    const where = {};
    
    // Filtros opcionales
    if (estado) where.estado = estado;
    if (tipo) where.tipo_alerta = tipo;
    
    // Si es tutor, solo ver alertas de sus alumnos
    let alumnoIds = [];
    if (rol === 'tutor') {
      const periodoActivo = await Periodo.findOne({ where: { activo: true } });
      
      const gruposTutor = await Grupo.findAll({
        where: { 
          tutor_id: userId,
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
        
        alumnoIds = [...new Set(asignaciones.map(a => a.alumno_id))];
      }
      
      if (alumnoIds.length === 0) {
        return res.json([]);
      }
      
      where.alumno_id = { [Op.in]: alumnoIds };
    }
    
    // Filtro por grupo específico (para coordinación o vista filtrada)
    if (grupoId) {
      const periodoActivo = await Periodo.findOne({ where: { activo: true } });
      
      const asignaciones = await AlumnoGrupo.findAll({
        where: { 
          grupo_id: grupoId,
          periodo_id: periodoActivo?.id
        },
        attributes: ['alumno_id']
      });
      
      const grupoAlumnoIds = asignaciones.map(a => a.alumno_id);
      
      if (where.alumno_id) {
        // Si ya hay filtro de tutor, hacer intersección
        where.alumno_id = { 
          [Op.in]: alumnoIds.filter(id => grupoAlumnoIds.includes(id))
        };
      } else {
        where.alumno_id = { [Op.in]: grupoAlumnoIds };
      }
    }
    
    const alertas = await Alerta.findAll({
      where,
      include: [
        { 
          model: Alumno, 
          as: 'alumno',
          attributes: ['id', 'Num_Control', 'Nombre', 'Primer_Ap', 'Segundo_Ap', 'Carrera', 'Semestre']
        },
        { 
          model: User, 
          as: 'generador',
          attributes: ['id', 'name', 'rol']
        }
      ],
      order: [
        ['estado', 'ASC'], // Activas primero
        ['fecha_alerta', 'DESC']
      ]
    });
    
    res.json(alertas);
  } catch (error) {
    console.error('Error obteniendo alertas:', error);
    res.status(500).json({ 
      message: 'Error al obtener alertas', 
      error: error.message 
    });
  }
};

export const obtenerAlertasAlumno = async (req, res) => {
  try {
    const { alumnoId } = req.params;
    const { estado } = req.query;
    
    const where = { alumno_id: alumnoId };
    if (estado) where.estado = estado;
    
    const alertas = await Alerta.findAll({
      where,
      include: [
        {
          model: User,
          as: 'generador',
          attributes: ['id', 'name', 'rol']
        }
      ],
      order: [['fecha_alerta', 'DESC']]
    });

    res.json(alertas);
  } catch (error) {
    console.error('Error al obtener alertas:', error);
    res.status(500).json({ error: 'Error al obtener alertas' });
  }
};

export const crearAlerta = async (req, res) => {
  try {
    const { 
      alumno_id, 
      tipo_alerta, 
      descripcion, 
      dias_faltas, 
      materias_reprobadas 
    } = req.body;
    
    const { id: userId } = req.user;
    
    const alerta = await Alerta.create({
      alumno_id,
      tipo_alerta,
      descripcion,
      generada_por: userId,
      dias_faltas: dias_faltas || 0,
      materias_reprobadas: materias_reprobadas || 0,
      estado: 'activa'
    });
    
    res.status(201).json({
      message: 'Alerta creada correctamente',
      alerta
    });
  } catch (error) {
    console.error('Error al crear alerta:', error);
    res.status(500).json({ error: 'Error al crear alerta' });
  }
};

export const actualizarEstadoAlerta = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    
    if (!['activa', 'atendida', 'cerrada'].includes(estado)) {
      return res.status(400).json({ 
        error: 'Estado inválido. Use: activa, atendida o cerrada' 
      });
    }
    
    const alerta = await Alerta.findByPk(id);
    if (!alerta) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }
    
    alerta.estado = estado;
    await alerta.save();
    
    res.json({
      message: 'Estado de alerta actualizado',
      alerta
    });
  } catch (error) {
    console.error('Error al actualizar alerta:', error);
    res.status(500).json({ error: 'Error al actualizar alerta' });
  }
};