import { Alumno, Materia } from "../models/index.js";

// alumnosController.js
export const getAlumnos = async (req, res) => {
  try {
    const { rol, id: userId } = req.user;
    
    console.log('📋 getAlumnos - Usuario:', { rol, userId });
    
    let alumnos;
    
    if (rol === 'tutor') {
      // Tutor solo ve sus alumnos tutorados del periodo activo
      const Periodo = (await import('../models/periodo.js')).default;
      const sequelize = (await import('../config/database.js')).default;
      
      const periodoActivo = await Periodo.findOne({ where: { activo: true } });
      
      if (!periodoActivo) {
        console.log('⚠️ No hay periodo activo');
        return res.json([]);
      }

      console.log('📅 Periodo activo:', periodoActivo.id);

      // ✅ CONSULTA MEJORADA - Solo alumnos del periodo activo
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

      console.log(`✅ Alumnos tutorados encontrados: ${alumnos.length}`);
    } else {
      // Coordinación y jefeDivision ven todos
      console.log('👥 Obteniendo todos los alumnos (coordinación/jefeDivision)');
      
      // ✅ USAR RAW QUERY para evitar problemas con Sequelize
      const sequelize = (await import('../config/database.js')).default;
      
      alumnos = await sequelize.query(`
        SELECT * FROM alumnos
        ORDER BY Primer_Ap ASC, Nombre ASC
      `, {
        type: sequelize.QueryTypes.SELECT
      });

      console.log(`✅ Total alumnos encontrados: ${alumnos.length}`);
    }
    
    res.json(alumnos);
  } catch (error) {
    console.error('❌ Error obteniendo alumnos:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const getAlumno = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    console.log(`🔍 Buscando alumno con ID: ${id}`);
    
    // ✅ SIMPLIFICAR - Sin includes problemáticos
    const alumno = await Alumno.findByPk(id, {
      raw: true // Devolver objeto plano
    });

    if (!alumno) {
      console.log(`❌ Alumno con ID ${id} no encontrado`);
      return res.status(404).json({ message: "Alumno no encontrado" });
    }

    console.log(`✅ Alumno encontrado: ${alumno.Nombre} ${alumno.Primer_Ap}`);
    res.json(alumno);
    
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
