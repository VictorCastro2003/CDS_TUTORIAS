import express from 'express';
import { 
  getAlumnos, 
  getAlumno, 
  createAlumno, 
  updateAlumno, 
  deleteAlumno 
} from '../controllers/alumnosController.js';
import verifyToken from '../middlewares/verifyToken.js';
import verificarRoles from '../middlewares/autorizarRoles.js';

const router = express.Router();

// ============================================
// RUTAS DE ALUMNOS (BASE)
// ============================================

// Obtener todos los alumnos → coordinación, jefeDivision o tutor (solo sus tutorados)
router.get("/", verifyToken, verificarRoles("coordinacion", "jefeDivision", "tutor"), getAlumnos);

// Obtener un alumno por ID → tutor o coordinación 
router.get("/:id", verifyToken, verificarRoles("tutor", "coordinacion", "jefeDivision"), getAlumno);

// Crear un alumno → solo coordinación o jefeDivision
router.post("/", verifyToken, verificarRoles("coordinacion", "jefeDivision"), createAlumno);

// Actualizar un alumno → coordinación o jefeDivision 
router.put("/:id", verifyToken, verificarRoles("coordinacion", "jefeDivision"), updateAlumno);

// Eliminar un alumno → solo coordinación 
router.delete("/:id", verifyToken, verificarRoles("coordinacion"), deleteAlumno);

// ============================================
// RUTAS DE MATERIAS Y CALIFICACIONES
// ============================================

// Asignar materias a un alumno → solo tutores o coordinación
router.post("/:id/materias", 
  verifyToken, 
  verificarRoles("tutor", "coordinacion"), 
  async (req, res) => {
    try {
      const { materias, semestre } = req.body;
      const alumnoId = req.params.id;

      if (!Array.isArray(materias) || materias.length === 0) {
        return res.status(400).json({ error: 'Debes proporcionar al menos una materia' });
      }

      if (!semestre || semestre < 1 || semestre > 12) {
        return res.status(400).json({ error: 'Semestre inválido (debe ser 1-12)' });
      }

      // Obtener periodo activo
      const Periodo = (await import('../models/Periodo.js')).default;
      const periodoActivo = await Periodo.findOne({ where: { activo: true } });
      
      if (!periodoActivo) {
        return res.status(400).json({ error: 'No hay periodo activo' });
      }

      const AlumnoMateria = (await import('../models/alumnoMateria.js')).default;
      
      // Verificar que no excedan 6 materias por semestre
      const materiasExistentes = await AlumnoMateria.count({
        where: { 
          alumno_id: alumnoId,
          periodo_id: periodoActivo.id,
          semestre: semestre
        }
      });

      if (materiasExistentes + materias.length > 6) {
        return res.status(400).json({ 
          error: `No puedes asignar más de 6 materias por semestre. Ya tiene ${materiasExistentes}` 
        });
      }

      // Crear asignaciones
      const asignaciones = materias.map(materiaId => ({
        alumno_id: alumnoId,
        materia_id: materiaId,
        periodo_id: periodoActivo.id,
        semestre: semestre,
        calificacion: null // Sin calificar inicialmente
      }));

      const resultado = await AlumnoMateria.bulkCreate(asignaciones, {
        ignoreDuplicates: true // Evitar duplicados
      });

      res.status(201).json({ 
        message: 'Materias asignadas correctamente',
        asignadas: resultado.length 
      });
    } catch (error) {
      console.error('Error asignando materias:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Obtener materias de un alumno con calificaciones
router.get("/:id/materias", 
  verifyToken, 
  verificarRoles("tutor", "coordinacion", "jefeDivision"),
  async (req, res) => {
    try {
      const alumnoId = req.params.id;
      const { semestre, periodo_id } = req.query;

      const AlumnoMateria = (await import('../models/alumnoMateria.js')).default;
      const Materia = (await import('../models/Materia.js')).default;
      const Periodo = (await import('../models/Periodo.js')).default;

      const where = { alumno_id: alumnoId };
      
      if (semestre) where.semestre = parseInt(semestre);
      if (periodo_id) where.periodo_id = parseInt(periodo_id);

      const materias = await AlumnoMateria.findAll({
        where,
        include: [
          { 
            model: Materia, 
            as: 'materia',
            attributes: ['id', 'nombre', 'semestre', 'carrera']
          },
          {
            model: Periodo,
            as: 'periodo',
            attributes: ['id', 'nombre']
          }
        ],
        order: [['semestre', 'ASC'], ['materia_id', 'ASC']]
      });

      res.json(materias);
    } catch (error) {
      console.error('Error obteniendo materias:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Actualizar calificación de una materia → SOLO TUTORES
router.put("/:id/materias/:materiaId/calificacion",
  verifyToken,
  verificarRoles("tutor", "coordinacion"), // Coordinación puede editar también
  async (req, res) => {
    try {
      const { calificacion } = req.body;
      const alumnoId = req.params.id;
      const materiaId = req.params.materiaId;

      if (calificacion !== null && (calificacion < 0 || calificacion > 100)) {
        return res.status(400).json({ error: 'La calificación debe estar entre 0 y 100' });
      }

      const AlumnoMateria = (await import('../models/alumnoMateria.js')).default;
      const Periodo = (await import('../models/Periodo.js')).default;
      
      const periodoActivo = await Periodo.findOne({ where: { activo: true } });

      // Si es tutor, verificar que sea su alumno
      if (req.user.rol === 'tutor') {
        const Grupo = (await import('../models/Grupo.js')).default;
        const AlumnoGrupo = (await import('../models/AlumnoGrupo.js')).default;
        
        const esAlumnoTutorado = await AlumnoGrupo.findOne({
          include: [{
            model: Grupo,
            as: 'grupo',
            where: { tutor_id: req.user.id }
          }],
          where: { 
            alumno_id: alumnoId,
            periodo_id: periodoActivo.id
          }
        });

        if (!esAlumnoTutorado) {
          return res.status(403).json({ 
            error: 'No tienes permiso para calificar a este alumno' 
          });
        }
      }

      const registro = await AlumnoMateria.findOne({
        where: {
          alumno_id: alumnoId,
          materia_id: materiaId,
          periodo_id: periodoActivo.id
        }
      });

      if (!registro) {
        return res.status(404).json({ 
          error: 'No se encontró la materia asignada al alumno' 
        });
      }

      registro.calificacion = calificacion;
      await registro.save();

      res.json({ 
        message: 'Calificación actualizada', 
        calificacion: registro.calificacion 
      });
    } catch (error) {
      console.error('Error actualizando calificación:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Eliminar materia asignada → SOLO COORDINACIÓN
router.delete("/:id/materias/:materiaId",
  verifyToken,
  verificarRoles("coordinacion"),
  async (req, res) => {
    try {
      const AlumnoMateria = (await import('../models/alumnoMateria.js')).default;
      const Periodo = (await import('../models/Periodo.js')).default;
      
      const periodoActivo = await Periodo.findOne({ where: { activo: true } });

      const eliminadas = await AlumnoMateria.destroy({
        where: {
          alumno_id: req.params.id,
          materia_id: req.params.materiaId,
          periodo_id: periodoActivo.id
        }
      });

      if (eliminadas === 0) {
        return res.status(404).json({ error: 'Materia no encontrada' });
      }

      res.json({ message: 'Materia eliminada del alumno' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;