// alumnosController.js
import { Alumno, Materia } from "../models/index.js";

export const getAlumnos = async (req, res) => {
  try {
    const { rol, id: userId } = req.user;
    
    console.log('📋 getAlumnos - Usuario:', { rol, userId });
    
    let alumnos;
    const sequelize = (await import('../config/database.js')).default;
    
    if (rol === 'tutor') {
      // ✅ TUTOR: Obtener alumnos de sus grupos del periodo activo
      const Periodo = (await import('../models/periodo.js')).default;
      
      const periodoActivo = await Periodo.findOne({ where: { activo: true } });
      
      if (!periodoActivo) {
        console.log('⚠️ No hay periodo activo');
        return res.json([]);
      }

      console.log('📅 Periodo activo:', periodoActivo.id);

      // ✅ CONSULTA CORRECTA: Alumnos → AlumnoGrupo → Grupo → Tutor
      alumnos = await sequelize.query(`
        SELECT DISTINCT 
          a.id,
          a.Num_Control,
          a.Nombre,
          a.Primer_Ap,
          a.Segundo_Ap,
          a.Fecha_Nac,
          a.Semestre,
          a.Carrera,
          g.nombre as nombre_grupo, 
          g.semestre as semestre_grupo
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
      
    } else if (rol === 'jefeDivision') {
      // ✅ JEFE DE DIVISIÓN: Solo alumnos de su carrera
      const { division } = req.user;
      
      console.log('🏢 Obteniendo alumnos de división:', division);
      
      alumnos = await sequelize.query(`
        SELECT 
          id,
          Num_Control,
          Nombre,
          Primer_Ap,
          Segundo_Ap,
          Fecha_Nac,
          Semestre,
          Carrera
        FROM alumnos
        WHERE Carrera = :carrera
        ORDER BY Primer_Ap ASC, Nombre ASC
      `, {
        replacements: { carrera: division },
        type: sequelize.QueryTypes.SELECT
      });

      console.log(`✅ Alumnos de división ${division} encontrados: ${alumnos.length}`);
      
    } else {
      // ✅ COORDINACIÓN: Todos los alumnos
      console.log('👥 Obteniendo todos los alumnos (coordinación)');
      
      alumnos = await sequelize.query(`
        SELECT 
          id,
          Num_Control,
          Nombre,
          Primer_Ap,
          Segundo_Ap,
          Fecha_Nac,
          Semestre,
          Carrera
        FROM alumnos
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
    
    const alumno = await Alumno.findByPk(id, {
      raw: true
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
  if (!fecha) return true;
  const year = parseInt(fecha.split('-')[0]);
  const currentYear = new Date().getFullYear();
  return !isNaN(year) && year >= 1900 && year <= currentYear;
};

export const createAlumno = async (req, res) => {
  try {
    console.log("📝 Creando alumno con datos:", req.body);

    if (!validarFechaNacimiento(req.body.Fecha_Nac)) {
      return res.status(400).json({ message: "Fecha de nacimiento inválida" });
    }

    const alumno = await Alumno.create(req.body);
    console.log(`✅ Alumno creado con ID: ${alumno.id}`);
    
    res.status(201).json(alumno.get({ plain: true }));
    
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

    if (req.body.Fecha_Nac && !validarFechaNacimiento(req.body.Fecha_Nac)) {
      return res.status(400).json({ message: "Fecha de nacimiento inválida" });
    }

    await alumno.update(req.body);
    console.log(`✅ Alumno ${id} actualizado correctamente`);
    
    res.json(alumno.get({ plain: true }));
    
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