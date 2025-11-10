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

      console.log('📝 Asignando materias:', { alumnoId, materias, semestre });

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
        calificacion: null
      }));

      const resultado = await AlumnoMateria.bulkCreate(asignaciones, {
        ignoreDuplicates: true
      });

      console.log('✅ Materias asignadas:', resultado.length);

      res.status(201).json({ 
        message: 'Materias asignadas correctamente',
        asignadas: resultado.length 
      });
    } catch (error) {
      console.error('❌ Error asignando materias:', error);
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

// 🔧 RUTA CORREGIDA: Actualizar calificación
// 🔧 ENDPOINT PUT: Actualizar calificación
// Reemplaza COMPLETAMENTE el endpoint existente con este código
router.put("/:id/materias/:alumnoMateriaId/calificacion",
  verifyToken,
  verificarRoles("tutor", "coordinacion"),
  async (req, res) => {
    try {
      const { calificacion } = req.body;
      const alumnoId = parseInt(req.params.id);
      const alumnoMateriaId = parseInt(req.params.alumnoMateriaId);

      console.log('📝 Actualizando calificación:', { 
        alumnoId, 
        alumnoMateriaId, 
        calificacion,
        userRole: req.user.rol,
        tipos: {
          alumnoId: typeof alumnoId,
          alumnoMateriaId: typeof alumnoMateriaId
        }
      });

      // Validar calificación
      if (calificacion !== null && (calificacion < 0 || calificacion > 100)) {
        return res.status(400).json({ error: 'La calificación debe estar entre 0 y 100' });
      }

      const AlumnoMateria = (await import('../models/alumnoMateria.js')).default;
      const Periodo = (await import('../models/Periodo.js')).default;
      
      const periodoActivo = await Periodo.findOne({ where: { activo: true } });

      if (!periodoActivo) {
        return res.status(400).json({ error: 'No hay periodo activo' });
      }

      console.log('📅 Periodo activo encontrado:', periodoActivo.id);

      // Si es tutor, verificar que sea su alumno
      if (req.user.rol === 'tutor') {
        const Grupo = (await import('../models/Grupo.js')).default;
        const AlumnoGrupo = (await import('../models/alumnoGrupo.js')).default;
        
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
          console.log('⚠️ Tutor no autorizado para este alumno');
          return res.status(403).json({ 
            error: 'No tienes permiso para calificar a este alumno' 
          });
        }
        console.log('✅ Tutor autorizado');
      }

      // BUSCAR REGISTRO - SIN verificar periodo_id
      console.log('🔍 Buscando registro con:', { id: alumnoMateriaId, alumno_id: alumnoId });
      
      const registro = await AlumnoMateria.findOne({
        where: {
          id: alumnoMateriaId,
          alumno_id: alumnoId
        }
      });

      if (!registro) {
        console.log('❌ NO SE ENCONTRÓ el registro');
        
        // Debug: Buscar TODOS los registros del alumno
        const todosRegistros = await AlumnoMateria.findAll({
          where: { alumno_id: alumnoId },
          attributes: ['id', 'alumno_id', 'materia_id', 'periodo_id', 'calificacion']
        });
        
        console.log('🔍 Registros existentes para alumno', alumnoId, ':', 
          todosRegistros.map(r => ({ id: r.id, materia: r.materia_id, periodo: r.periodo_id }))
        );
        
        return res.status(404).json({ 
          error: 'No se encontró la materia asignada al alumno' 
        });
      }

      console.log('✅ Registro ENCONTRADO:', {
        id: registro.id,
        alumno_id: registro.alumno_id,
        materia_id: registro.materia_id,
        periodo_id: registro.periodo_id,
        calificacion_anterior: registro.calificacion
      });

      // Actualizar
      registro.calificacion = calificacion;
      await registro.save();

      console.log('✅ Calificación actualizada exitosamente a:', calificacion);

      res.json({ 
        message: 'Calificación actualizada', 
        calificacion: registro.calificacion 
      });

    } catch (error) {
      console.error('❌ ERROR COMPLETO:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Eliminar materia asignada → SOLO COORDINACIÓN
router.delete("/:id/materias/:alumnoMateriaId",
  verifyToken,
  verificarRoles("coordinacion"),
  async (req, res) => {
    try {
      const AlumnoMateria = (await import('../models/alumnoMateria.js')).default;
      const Periodo = (await import('../models/Periodo.js')).default;
      
      const periodoActivo = await Periodo.findOne({ where: { activo: true } });

      const eliminadas = await AlumnoMateria.destroy({
        where: {
          id: req.params.alumnoMateriaId,  // Buscar por ID de alumno_materia
          alumno_id: req.params.id,
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

// Obtener calificaciones formateadas de un alumno
// 📊 ENDPOINT ESPECÍFICO: Obtener calificaciones con IDs correctos
router.get("/:id/calificaciones", 
  verifyToken, 
  verificarRoles("tutor", "coordinacion", "jefeDivision"),
  async (req, res) => {
    try {
      const alumnoId = req.params.id;
      
      console.log('========== INICIO CONSULTA CALIFICACIONES ==========');
      console.log('1. ID del alumno recibido:', alumnoId);

      const AlumnoMateria = (await import('../models/alumnoMateria.js')).default;
      const Materia = (await import('../models/Materia.js')).default;
      const Periodo = (await import('../models/Periodo.js')).default;

      // Obtener TODAS las relaciones alumno-materia
      const relaciones = await AlumnoMateria.findAll({
        where: { alumno_id: alumnoId },
        include: [
          { 
            model: Materia, 
            as: 'materia',
            attributes: ['id', 'nombre', 'semestre', 'carrera'],
            required: false
          },
          {
            model: Periodo,
            as: 'periodo',
            attributes: ['id', 'nombre'],
            required: false
          }
        ],
        order: [['semestre', 'ASC']],
        raw: false // ✅ MUY IMPORTANTE: obtener instancias de Sequelize
      });

      console.log('2. Total de relaciones encontradas:', relaciones.length);
      
      if (relaciones.length === 0) {
        return res.status(404).json({ 
          error: 'No se encontraron materias asignadas' 
        });
      }

      // Mapear con el ID correcto
      const calificaciones = relaciones.map(rel => {
        console.log('Procesando relación:', {
          alumno_materia_id: rel.id,
          materia_id: rel.materia_id,
          materia_nombre: rel.materia?.nombre
        });

        return {
          id: rel.id, // ✅ Este es el ID de alumno_materia
          materia_id: rel.materia_id, // El ID de la materia (para referencia)
          materia: rel.materia?.nombre || 'Sin nombre',
          calificacion: rel.calificacion ?? 'Sin calificar',
          periodo: rel.periodo?.nombre || `Semestre ${rel.semestre || 'N/A'}`,
          semestre: rel.semestre
        };
      });

      console.log('3. Primera calificación procesada:', calificaciones[0]);
      console.log('========== FIN CONSULTA CALIFICACIONES ==========');

      res.json(calificaciones);
    } catch (error) {
      console.error('❌ ERROR en consulta de calificaciones:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;