import { Alumno, Materia, AlumnoMateria } from "../models/index.js";

export const form = async (req, res) => {
  try {
    const { id } = req.params;
    const alumno = await Alumno.findByPk(id);
    
    if (!alumno) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    const materias = await Materia.findAll({
      where: {
        carrera: alumno.Carrera
      }
    });

    res.render('asignar_materias', { alumno, materias });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const asignar = async (req, res) => {
  try {
    const { id } = req.params;
    const { materias, semestre } = req.body;

    // Validación
    if (!materias || !Array.isArray(materias) || materias.length > 6) {
      return res.status(400).json({ 
        error: 'Se requieren materias (máximo 6)' 
      });
    }

    if (!semestre || semestre < 1 || semestre > 12) {
      return res.status(400).json({ 
        error: 'Semestre debe estar entre 1 y 12' 
      });
    }

    const alumno = await Alumno.findByPk(id);
    if (!alumno) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    // Asignar materias con semestre usando el modelo AlumnoMateria
    for (const materiaId of materias) {
      await AlumnoMateria.findOrCreate({
        where: {
          alumno_id: alumno.Num_Control,
          materia_id: materiaId
        },
        defaults: {
          semestre: parseInt(semestre),
          calificacion: null
        }
      });
    }

    res.redirect(`/alumnos/${alumno.Num_Control}`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const filtrarMaterias = async (req, res) => {
  try {
    const { id } = req.params;
    const { semestre } = req.query;

    const alumno = await Alumno.findByPk(id, {
      include: [{
        model: Materia,
        through: {
          attributes: ['semestre', 'calificacion']
        }
      }]
    });

    if (!alumno) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    let materiasFiltradas = alumno.Materias;
    
    if (semestre) {
      materiasFiltradas = alumno.Materias.filter(materia => 
        materia.AlumnoMateria.semestre == semestre
      );
    }

    res.json({
      html: await renderPartial('partials/tabla_materias', { materiasFiltradas })
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Función auxiliar para renderizar partials
const renderPartial = async (view, data) => {
  // Implementa según tu motor de plantillas (EJS, Handlebars, etc.)
  return ''; 
};
export const actualizarCalificacion = async (req, res) => {
  try {
    const { id, materiaId } = req.params;
    const { calificacion } = req.body;

    const registro = await AlumnoMateria.findOne({
      where: {
        alumno_id: id,
        materia_id: materiaId
      }
    });

    if (!registro) {
      return res.status(404).json({ error: 'Materia no asignada' });
    }

    await registro.update({ calificacion });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};




