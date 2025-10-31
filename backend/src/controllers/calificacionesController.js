import { Alumno, Materia, AlumnoMateria } from "../models/index.js";
import { Op } from 'sequelize';

export const getCalificacionesByAlumno = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('========== INICIO CONSULTA CALIFICACIONES ==========');
    console.log('1. ID del alumno recibido:', id);

    // Paso 1: Verificar que el alumno existe
    const alumno = await Alumno.findByPk(id);
    
    if (!alumno) {
      console.log('❌ Alumno no encontrado con ID:', id);
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    console.log('✅ Alumno encontrado:', {
      id: alumno.id,
      nombre: alumno.Nombre,
      numControl: alumno.Num_Control
    });

    // Paso 2: Buscar las relaciones en la tabla AlumnoMateria
    // Probar con ambos: id y Num_Control
    let relacionesAlumnoMateria = await AlumnoMateria.findAll({
      where: {
        alumno_id: alumno.Num_Control
      }
    });

    console.log('2. Relaciones encontradas con Num_Control:', relacionesAlumnoMateria.length);

    // Si no encuentra con Num_Control, intentar con id
    if (relacionesAlumnoMateria.length === 0) {
      console.log('   Intentando con alumno.id...');
      relacionesAlumnoMateria = await AlumnoMateria.findAll({
        where: {
          alumno_id: alumno.id
        }
      });
      console.log('   Relaciones encontradas con id:', relacionesAlumnoMateria.length);
    }

    if (relacionesAlumnoMateria.length === 0) {
      console.log('ℹ️ No hay materias asignadas a este alumno');
      console.log('========== FIN CONSULTA (SIN MATERIAS) ==========');
      return res.json([]);
    }

    console.log('3. Primera relación (ejemplo):', {
      alumno_id: relacionesAlumnoMateria[0].alumno_id,
      materia_id: relacionesAlumnoMateria[0].materia_id,
      semestre: relacionesAlumnoMateria[0].semestre,
      calificacion: relacionesAlumnoMateria[0].calificacion
    });

    // Paso 3: Obtener los IDs de las materias
    const materiaIds = relacionesAlumnoMateria.map(rel => rel.materia_id);
    console.log('4. IDs de materias a buscar:', materiaIds);

    // Paso 4: Buscar las materias
    const materias = await Materia.findAll({
      where: {
        id: {
          [Op.in]: materiaIds
        }
      }
    });

    console.log('5. Materias encontradas:', materias.length);
    
    if (materias.length === 0) {
      console.log('⚠️ No se encontraron materias en la tabla Materia');
      console.log('========== FIN CONSULTA (ERROR DATOS) ==========');
      return res.json([]);
    }

    console.log('6. Primera materia (ejemplo):', {
      id: materias[0].id,
      nombre: materias[0].nombre
    });

    // Paso 5: Combinar los datos
    const calificaciones = materias.map(materia => {
      const relacion = relacionesAlumnoMateria.find(
        rel => rel.materia_id === materia.id
      );

      return {
        id: materia.id,
        materia: materia.nombre,
        calificacion: relacion?.calificacion || 'Sin calificar',
        periodo: `Semestre ${relacion?.semestre || 'N/A'}`
      };
    });

    console.log('7. Total de calificaciones procesadas:', calificaciones.length);
    console.log('8. Primera calificación (ejemplo):', calificaciones[0]);
    console.log('========== FIN CONSULTA (ÉXITO) ==========');

    res.json(calificaciones);

  } catch (error) {
    console.error('========== ERROR EN getCalificacionesByAlumno ==========');
    console.error('Tipo de error:', error.name);
    console.error('Mensaje:', error.message);
    console.error('Stack completo:', error.stack);
    console.error('========== FIN ERROR ==========');
    
    res.status(500).json({ 
      error: 'Error del servidor', 
      detalle: error.message,
      tipo: error.name
    });
  }
};