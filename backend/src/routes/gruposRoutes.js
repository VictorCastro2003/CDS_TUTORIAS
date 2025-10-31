// routes/gruposRoutes.js
import express from 'express';
import verifyToken from '../middlewares/verifyToken.js';
import verificarRoles from '../middlewares/autorizarRoles.js';
import { Grupo, Alumno, AlumnoGrupo, Periodo, User } from '../models/index.js';

const router = express.Router();

// ⚠️ IMPORTANTE: Rutas específicas PRIMERO, antes de rutas con :id

// 🚀 TRIGGER PARA CAMBIO DE SEMESTRE (SOLO COORDINACIÓN)
router.post('/avanzar-semestre',
  verifyToken,
  verificarRoles('coordinacion'),
  async (req, res) => {
    try {
      const periodoActivo = await Periodo.findOne({ where: { activo: true } });

      if (!periodoActivo) {
        return res.status(400).json({ error: 'No hay periodo activo' });
      }

      const asignaciones = await AlumnoGrupo.findAll({
        where: { periodo_id: periodoActivo.id },
        include: [
          {
            model: Alumno,
            as: 'alumno'
          },
          {
            model: Grupo,
            as: 'grupo'
          }
        ]
      });

      let actualizados = 0;

      for (const asignacion of asignaciones) {
        const alumno = asignacion.alumno;
        const nuevoSemestre = (alumno.Semestre || 1) + 1;

        if (nuevoSemestre <= 12) {
          await alumno.update({ Semestre: nuevoSemestre });
          actualizados++;
        }
      }

      res.json({ 
        message: `Semestre avanzado para ${actualizados} alumnos`,
        alumnos_actualizados: actualizados
      });
    } catch (error) {
      console.error('Error avanzando semestre:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Cambiar alumno de grupo (SOLO COORDINACIÓN)
router.put('/alumnos/:alumnoId/cambiar-grupo',
  verifyToken,
  verificarRoles('coordinacion'),
  async (req, res) => {
    try {
      const { nuevo_grupo_id } = req.body;
      const alumnoId = req.params.alumnoId;

      const periodoActivo = await Periodo.findOne({ where: { activo: true } });

      const asignacionActual = await AlumnoGrupo.findOne({
        where: { 
          alumno_id: alumnoId,
          periodo_id: periodoActivo.id
        }
      });

      if (!asignacionActual) {
        return res.status(404).json({ 
          error: 'El alumno no está asignado a ningún grupo en el periodo activo' 
        });
      }

      const nuevoGrupo = await Grupo.findByPk(nuevo_grupo_id);
      
      if (!nuevoGrupo || nuevoGrupo.periodo_id !== periodoActivo.id) {
        return res.status(404).json({ error: 'Grupo destino no válido' });
      }

      const alumnosEnNuevoGrupo = await AlumnoGrupo.count({
        where: { grupo_id: nuevo_grupo_id, periodo_id: periodoActivo.id }
      });

      if (alumnosEnNuevoGrupo >= nuevoGrupo.capacidad_maxima) {
        return res.status(400).json({ error: 'El grupo destino está lleno' });
      }

      asignacionActual.grupo_id = nuevo_grupo_id;
      await asignacionActual.save();

      res.json({ message: 'Alumno cambiado de grupo correctamente' });
    } catch (error) {
      console.error('Error cambiando alumno de grupo:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Obtener todos los grupos del periodo activo
router.get('/', verifyToken, async (req, res) => {
  try {
    const periodoActivo = await Periodo.findOne({ where: { activo: true } });
    
    if (!periodoActivo) {
      return res.status(400).json({ error: 'No hay periodo activo' });
    }

    const grupos = await Grupo.findAll({
      where: { periodo_id: periodoActivo.id },
      include: [
        { 
          model: User, 
          as: 'tutor',
          attributes: ['id', 'name']
        },
        {
          model: Periodo,
          as: 'periodo',
          attributes: ['id', 'nombre']
        }
      ],
      order: [['carrera', 'ASC'], ['semestre', 'ASC'], ['nombre', 'ASC']]
    });

    const gruposConConteo = await Promise.all(
      grupos.map(async (grupo) => {
        const conteo = await AlumnoGrupo.count({
          where: { 
            grupo_id: grupo.id,
            periodo_id: periodoActivo.id
          }
        });
        return {
          ...grupo.toJSON(),
          total_alumnos: conteo
        };
      })
    );

    res.json(gruposConConteo);
  } catch (error) {
    console.error('Error obteniendo grupos:', error);
    res.status(500).json({ error: error.message });
  }
});

// Crear grupo (SOLO COORDINACIÓN)
router.post('/', 
  verifyToken, 
  verificarRoles('coordinacion'), 
  async (req, res) => {
    try {
      const { nombre, semestre, carrera, tutor_id, capacidad_maxima } = req.body;

      const periodoActivo = await Periodo.findOne({ where: { activo: true } });
      
      if (!periodoActivo) {
        return res.status(400).json({ error: 'No hay periodo activo' });
      }

      if (tutor_id) {
        const tutor = await User.findOne({ 
          where: { id: tutor_id, rol: 'tutor' } 
        });
        
        if (!tutor) {
          return res.status(404).json({ error: 'Tutor no encontrado' });
        }
      }

      const grupo = await Grupo.create({
        nombre,
        semestre,
        carrera,
        periodo_id: periodoActivo.id,
        tutor_id: tutor_id || null,
        capacidad_maxima: capacidad_maxima || 35
      });

      res.status(201).json(grupo);
    } catch (error) {
      console.error('Error creando grupo:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// ✅ RUTAS CON :id AL FINAL

// Obtener alumnos disponibles para asignar a un grupo
router.get('/:id/alumnos-disponibles',
  verifyToken,
  verificarRoles('coordinacion'),
  async (req, res) => {
    try {
      const grupoId = req.params.id;
      
      const grupo = await Grupo.findByPk(grupoId);
      if (!grupo) {
        return res.status(404).json({ error: 'Grupo no encontrado' });
      }

      // Usar el periodo del grupo para la consulta
      const periodoDelGrupo = await Periodo.findByPk(grupo.periodo_id);
      if (!periodoDelGrupo) {
        return res.status(400).json({ error: 'El periodo del grupo no es válido' });
      }

      const alumnosDisponibles = await Alumno.findAll({
        where: {
          Semestre: grupo.semestre,
          Carrera: grupo.carrera
        },
        include: [{
          model: Grupo,
          as: 'grupos',
          through: {
            where: { periodo_id: periodoDelGrupo.id }
          },
          required: false
        }],
        order: [['Primer_Ap', 'ASC'], ['Nombre', 'ASC']]
      });

      const sinGrupo = alumnosDisponibles.filter(
        alumno => alumno.grupos.length === 0
      );

      res.json(sinGrupo);
    } catch (error) {
      console.error('Error obteniendo alumnos disponibles:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Obtener alumnos de un grupo específico
router.get('/:id/alumnos',
  verifyToken,
  async (req, res) => {
    try {
      const grupoId = req.params.id;
      const { rol, id: userId } = req.user;

      const grupo = await Grupo.findByPk(grupoId);
      
      if (!grupo) {
        return res.status(404).json({ error: 'Grupo no encontrado' });
      }

      if (rol === 'tutor' && grupo.tutor_id !== userId) {
        return res.status(403).json({ 
          error: 'No tienes permiso para ver este grupo' 
        });
      }

      const periodoActivo = await Periodo.findOne({ where: { activo: true } });

      if (!periodoActivo) {
        return res.status(400).json({ error: 'No hay periodo activo' });
      }

      const alumnos = await Alumno.findAll({
        include: [{
          model: Grupo,
          as: 'grupos',
          where: { id: grupoId },
          through: {
            where: { periodo_id: periodoActivo.id },
            attributes: []
          },
          attributes: []
        }],
        order: [['Primer_Ap', 'ASC'], ['Nombre', 'ASC']]
      });

      res.json(alumnos);
    } catch (error) {
      console.error('Error obteniendo alumnos del grupo:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Asignar tutor a un grupo (SOLO COORDINACIÓN)
router.put('/:id/tutor',
  verifyToken,
  verificarRoles('coordinacion'),
  async (req, res) => {
    try {
      const { tutorId } = req.body;
      const grupoId = req.params.id;

      const grupo = await Grupo.findByPk(grupoId);
      
      if (!grupo) {
        return res.status(404).json({ error: 'Grupo no encontrado' });
      }

      const periodoActivo = await Periodo.findOne({ where: { activo: true } });
      if (grupo.periodo_id !== periodoActivo.id) {
        return res.status(403).json({ 
          error: 'No puedes modificar grupos de periodos inactivos' 
        });
      }

      if (tutorId) {
        const tutor = await User.findOne({ 
          where: { id: tutorId, rol: 'tutor' } 
        });
        
        if (!tutor) {
          return res.status(404).json({ error: 'Tutor no encontrado' });
        }
      }

      grupo.tutor_id = tutorId || null;
      await grupo.save();

      res.json({ 
        message: tutorId ? 'Tutor asignado correctamente' : 'Tutor removido correctamente',
        grupo 
      });
    } catch (error) {
      console.error('Error asignando tutor:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Agregar alumno a un grupo (SOLO COORDINACIÓN)
router.post('/:id/alumnos',
  verifyToken,
  verificarRoles('coordinacion'),
  async (req, res) => {
    try {
      const { alumnoId } = req.body;
      const grupoId = req.params.id;

      if (!alumnoId) {
        return res.status(400).json({ error: 'Debes proporcionar un alumno' });
      }

      const grupo = await Grupo.findByPk(grupoId);
      
      if (!grupo) {
        return res.status(404).json({ error: 'Grupo no encontrado' });
      }

      const periodoActivo = await Periodo.findOne({ where: { activo: true } });

      const yaAsignado = await AlumnoGrupo.findOne({
        where: {
          alumno_id: alumnoId,
          periodo_id: periodoActivo.id
        }
      });

      if (yaAsignado) {
        return res.status(400).json({ 
          error: 'El alumno ya está asignado a un grupo en este periodo' 
        });
      }

      await AlumnoGrupo.create({
        alumno_id: alumnoId,
        grupo_id: grupoId,
        periodo_id: periodoActivo.id
      });

      res.status(201).json({ 
        message: 'Alumno asignado correctamente'
      });
    } catch (error) {
      console.error('Error asignando alumno:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Editar grupo (SOLO COORDINACIÓN)
router.put('/:id',
  verifyToken,
  verificarRoles('coordinacion'),
  async (req, res) => {
    try {
      const { nombre, semestre, carrera } = req.body;
      const grupoId = req.params.id;

      const grupo = await Grupo.findByPk(grupoId);
      
      if (!grupo) {
        return res.status(404).json({ error: 'Grupo no encontrado' });
      }

      const periodoActivo = await Periodo.findOne({ where: { activo: true } });
      
      if (grupo.periodo_id !== periodoActivo.id) {
        return res.status(403).json({ 
          error: 'No puedes modificar grupos de periodos inactivos' 
        });
      }

      await grupo.update({ nombre, semestre, carrera });

      res.json({ 
        message: 'Grupo actualizado correctamente', 
        grupo 
      });
    } catch (error) {
      console.error('Error actualizando grupo:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Eliminar grupo (SOLO COORDINACIÓN)
router.delete('/:id',
  verifyToken,
  verificarRoles('coordinacion'),
  async (req, res) => {
    try {
      const grupoId = req.params.id;

      const grupo = await Grupo.findByPk(grupoId);
      
      if (!grupo) {
        return res.status(404).json({ error: 'Grupo no encontrado' });
      }

      const periodoActivo = await Periodo.findOne({ where: { activo: true } });
      
      if (grupo.periodo_id !== periodoActivo.id) {
        return res.status(403).json({ 
          error: 'No puedes eliminar grupos de periodos inactivos' 
        });
      }

      const tieneAlumnos = await AlumnoGrupo.count({
        where: { 
          grupo_id: grupoId,
          periodo_id: periodoActivo.id 
        }
      });

      if (tieneAlumnos > 0) {
        return res.status(400).json({ 
          error: `No puedes eliminar un grupo con ${tieneAlumnos} alumno(s) asignado(s)` 
        });
      }

      await grupo.destroy();

      res.json({ message: 'Grupo eliminado correctamente' });
    } catch (error) {
      console.error('Error eliminando grupo:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Remover alumno de un grupo (SOLO COORDINACIÓN)
router.delete('/:grupoId/alumnos/:alumnoId',
  verifyToken,
  verificarRoles('coordinacion'),
  async (req, res) => {
    try {
      const { grupoId, alumnoId } = req.params;
      
      const periodoActivo = await Periodo.findOne({ where: { activo: true } });

      const eliminado = await AlumnoGrupo.destroy({
        where: {
          grupo_id: grupoId,
          alumno_id: alumnoId,
          periodo_id: periodoActivo.id
        }
      });

      if (eliminado === 0) {
        return res.status(404).json({ 
          error: 'Asignación no encontrada' 
        });
      }

      res.json({ message: 'Alumno removido del grupo correctamente' });
    } catch (error) {
      console.error('Error removiendo alumno:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;