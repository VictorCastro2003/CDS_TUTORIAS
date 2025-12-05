import { Alumno, Materia } from "../models/index.js";

// alumnosController.js
export const getAlumnos = async (req, res) => {
  try {
    const { rol, id: userId } = req.user;
    
    let alumnos;
    
    if (rol === 'tutor') {
      // Tutor solo ve sus alumnos tutorados del periodo activo
      const Periodo = (await import('../models/periodo.js')).default;
      const sequelize = (await import('../config/database.js')).default;
      
      const periodoActivo = await Periodo.findOne({ where: { activo: true } });
      
      if (!periodoActivo) {
        return res.json([]);
      }

      // ✨ CONSULTA MEJORADA - Solo alumnos del periodo activo
      alumnos = await sequelize.query(`
        SELECT DISTINCT a.*, g.nombre as nombre_grupo, g.semestre as semestre_grupo
        FROM alumnos a
        INNER JOIN alumnos_grupos ag ON a.id = ag.alumno_id
        INNER JOIN grupos g ON ag.grupo_id = g.id
        WHERE g.tutor_id = :tutorId 
        AND ag.periodo_id = :periodoId
        ORDER BY a.Primer_Ap, a.Nombre
      `, {
        replacements: { tutorId: userId, periodoId: periodoActivo.id },
        type: sequelize.QueryTypes.SELECT
      });
    } else {
      // Coordinación y jefeDivision ven todos
      alumnos = await Alumno.findAll({
        order: [['Primer_Ap', 'ASC'], ['Nombre', 'ASC']]
      });
    }
    
    res.json(alumnos);
  } catch (error) {
    console.error('Error obteniendo alumnos:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getAlumno = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    console.log(`🔍 Buscando alumno con ID: ${id}`);
    const alumno = await Alumno.findByPk(id, {
      include: [{
        model: Materia,
        through: { attributes: ['semestre', 'calificacion'] }
      }]
    });

    if (!alumno) {
      console.log(`❌ Alumno con ID ${id} no encontrado`);
      return res.status(404).json({ message: "Alumno no encontrado" });
    }

    console.log(`✅ Alumno encontrado: ${alumno.Nombre} ${alumno.Primer_Ap} (ID: ${alumno.id})`);
    res.json(alumno.toJSON());
  } catch (err) {
    console.error("❌ Error en getAlumno:", err);
    res.status(500).json({ message: err.message });
  }
};

// 🧩 VALIDAR fecha de nacimiento
const validarFechaNacimiento = (fecha) => {
  if (!fecha) return true; // permitir nula
  const year = parseInt(fecha.split('-')[0]);
  const currentYear = new Date().getFullYear();
  return !isNaN(year) && year >= 1900 && year <= currentYear;
};

export const createAlumno = async (req, res) => {
  try {
    console.log("📝 Creando alumno con datos:", req.body);

    // ✅ Validar fecha antes de crear
    if (!validarFechaNacimiento(req.body.Fecha_Nac)) {
      return res.status(400).json({ message: "Fecha de nacimiento inválida" });
    }

    const alumno = await Alumno.create(req.body);
    console.log(`✅ Alumno creado con ID: ${alumno.id}`);
    res.status(201).json(alumno.toJSON());
  } catch (err) {
    console.error("❌ Error en createAlumno:", err);
    res.status(500).json({ message: err.message });
  }
};

export const updateAlumno = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const alumno = await Alumno.findByPk(id);
    if (!alumno) {
      return res.status(404).json({ message: "Alumno no encontrado" });
    }

    // ✅ Validar fecha antes de actualizar
    if (req.body.Fecha_Nac && !validarFechaNacimiento(req.body.Fecha_Nac)) {
      return res.status(400).json({ message: "Fecha de nacimiento inválida" });
    }

    await alumno.update(req.body);
    console.log(`✅ Alumno ${id} actualizado correctamente`);
    res.json(alumno.toJSON());
  } catch (err) {
    console.error("❌ Error en updateAlumno:", err);
    res.status(500).json({ message: err.message });
  }
};

export const deleteAlumno = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const alumno = await Alumno.findByPk(id);
    if (!alumno) {
      return res.status(404).json({ message: "Alumno no encontrado" });
    }

    await alumno.destroy();
    console.log(`🗑️ Alumno ${id} eliminado correctamente`);
    res.json({ message: "Alumno eliminado" });
  } catch (err) {
    console.error("❌ Error en deleteAlumno:", err);
    res.status(500).json({ message: err.message });
  }
};
