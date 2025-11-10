// routes/periodosRoutes.js
import express from 'express';
import verifyToken from '../middlewares/verifyToken.js';
import verificarRoles from '../middlewares/autorizarRoles.js';
import { Periodo, Grupo } from '../models/index.js';
import { Op } from 'sequelize';

const router = express.Router();

// 📌 Obtener todos los periodos (Ordenados por fecha más reciente)
router.get('/', verifyToken, async (req, res) => {
  try {
    const periodos = await Periodo.findAll({
      order: [['fecha_inicio', 'DESC']]
    });
    res.json(periodos);
  } catch (error) {
    console.error('Error obteniendo periodos:', error);
    res.status(500).json({ error: error.message });
  }
});

// 📌 Obtener periodo activo
router.get('/activo', verifyToken, async (req, res) => {
  try {
    const periodoActivo = await Periodo.findOne({ 
      where: { activo: true } 
    });
    
    if (!periodoActivo) {
      return res.status(404).json({ message: 'No hay periodo activo' });
    }
    
    res.json(periodoActivo);
  } catch (error) {
    console.error('Error obteniendo periodo activo:', error);
    res.status(500).json({ error: error.message });
  }
});

// 📌 Crear periodo (SOLO COORDINACIÓN)
router.post('/', 
  verifyToken, 
  verificarRoles('coordinacion'), 
  async (req, res) => {
    try {
      const { nombre, fecha_inicio, fecha_fin, activo } = req.body;

      // Validar que el nombre no esté vacío
      if (!nombre || !fecha_inicio || !fecha_fin) {
        return res.status(400).json({ 
          error: 'Nombre, fecha de inicio y fecha de fin son requeridos' 
        });
      }

      // Validar fechas
      if (new Date(fecha_inicio) >= new Date(fecha_fin)) {
        return res.status(400).json({ 
          error: 'La fecha de inicio debe ser anterior a la fecha de fin' 
        });
      }

      // Si se marca como activo, desactivar los demás
      if (activo) {
        await Periodo.update(
          { activo: false },
          { where: { activo: true } }
        );
      }

      const periodo = await Periodo.create({
        nombre,
        fecha_inicio,
        fecha_fin,
        activo: activo || false
      });

      res.status(201).json(periodo);
    } catch (error) {
      console.error('Error creando periodo:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// 📌 Activar un periodo (SOLO COORDINACIÓN)
router.put('/:id/activar',
  verifyToken,
  verificarRoles('coordinacion'),
  async (req, res) => {
    try {
      const periodoId = req.params.id;

      const periodo = await Periodo.findByPk(periodoId);
      
      if (!periodo) {
        return res.status(404).json({ error: 'Periodo no encontrado' });
      }

      // Desactivar todos los periodos
      await Periodo.update(
        { activo: false },
        { where: { activo: true } }
      );

      // Activar el seleccionado
      periodo.activo = true;
      await periodo.save();

      res.json({ 
        message: 'Periodo activado correctamente',
        periodo 
      });
    } catch (error) {
      console.error('Error activando periodo:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// 📌 Actualizar periodo (SOLO COORDINACIÓN)
router.put('/:id',
  verifyToken,
  verificarRoles('coordinacion'),
  async (req, res) => {
    try {
      const periodoId = req.params.id;
      const { nombre, fecha_inicio, fecha_fin } = req.body;

      const periodo = await Periodo.findByPk(periodoId);
      
      if (!periodo) {
        return res.status(404).json({ error: 'Periodo no encontrado' });
      }

      // Validar que no sea periodo activo con grupos
      if (periodo.activo) {
        const tieneGrupos = await Grupo.count({ 
          where: { periodo_id: periodoId } 
        });
        
        if (tieneGrupos > 0) {
          return res.status(403).json({ 
            error: 'No puedes modificar un periodo activo con grupos asignados' 
          });
        }
      }

      if (fecha_inicio && fecha_fin) {
        if (new Date(fecha_inicio) >= new Date(fecha_fin)) {
          return res.status(400).json({ 
            error: 'La fecha de inicio debe ser anterior a la fecha de fin' 
          });
        }
      }

      await periodo.update({
        nombre: nombre || periodo.nombre,
        fecha_inicio: fecha_inicio || periodo.fecha_inicio,
        fecha_fin: fecha_fin || periodo.fecha_fin
      });

      res.json(periodo);
    } catch (error) {
      console.error('Error actualizando periodo:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// 📌 Eliminar periodo (SOLO COORDINACIÓN)
router.delete('/:id',
  verifyToken,
  verificarRoles('coordinacion'),
  async (req, res) => {
    try {
      const periodoId = req.params.id;

      const periodo = await Periodo.findByPk(periodoId);
      
      if (!periodo) {
        return res.status(404).json({ error: 'Periodo no encontrado' });
      }

      // No permitir eliminar periodo activo
      if (periodo.activo) {
        return res.status(403).json({ 
          error: 'No puedes eliminar el periodo activo' 
        });
      }

      // Verificar si tiene grupos asociados
      const tieneGrupos = await Grupo.count({ 
        where: { periodo_id: periodoId } 
      });

      if (tieneGrupos > 0) {
        return res.status(403).json({ 
          error: 'No puedes eliminar un periodo con grupos asociados' 
        });
      }

      await periodo.destroy();

      res.json({ message: 'Periodo eliminado correctamente' });
    } catch (error) {
      console.error('Error eliminando periodo:', error);
      res.status(500).json({ error: error.message });
    }
  }
);
router.post('/:id/cerrar-periodo',
  verifyToken,
  verificarRoles('coordinacion'),
  async (req, res) => {
    try {
      const periodoActualId = req.params.id;
      const { nombre_nuevo_periodo, fecha_inicio, fecha_fin } = req.body;

      // 1. Obtener periodo actual
      const periodoActual = await Periodo.findByPk(periodoActualId);
      
      if (!periodoActual.activo) {
        return res.status(400).json({ error: 'Este periodo ya está cerrado' });
      }

      // 2. Avanzar semestre de TODOS los alumnos asignados
      const asignaciones = await AlumnoGrupo.findAll({
        where: { periodo_id: periodoActualId },
        include: [{ model: Alumno, as: 'alumno' }]
      });

      let alumnosAvanzados = 0;
      for (const asignacion of asignaciones) {
        const alumno = asignacion.alumno;
        const nuevoSemestre = alumno.Semestre + 1;
        
        if (nuevoSemestre <= 12) {
          await alumno.update({ Semestre: nuevoSemestre });
          alumnosAvanzados++;
        }
      }

      // 3. Desactivar periodo actual
      periodoActual.activo = false;
      await periodoActual.save();

      // 4. Crear y activar nuevo periodo
      const nuevoPeriodo = await Periodo.create({
        nombre: nombre_nuevo_periodo,
        fecha_inicio,
        fecha_fin,
        activo: true
      });

      res.json({
        message: `Periodo cerrado. ${alumnosAvanzados} alumnos avanzaron de semestre`,
        periodo_cerrado: periodoActual,
        periodo_nuevo: nuevoPeriodo
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;