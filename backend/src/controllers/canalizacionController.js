// src/controllers/canalizacionController.js
import { Canalizacion, Alumno, User, AlumnoGrupo } from "../models/index.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear canalización
export const crearCanalizacion = async (req, res) => {
  try {
    console.log('Datos recibidos:', req.body);
    
    const canalizacion = await Canalizacion.create(req.body);
    res.status(201).json({ 
      message: "Canalización registrada", 
      canalizacion 
    });
  } catch (error) {
    console.error('Error al crear canalización:', error);
    res.status(500).json({ 
      message: "Error al crear canalización", 
      error: error.message 
    });
  }
};

export const obtenerCanalizaciones = async (req, res) => {
  try {
    // ⚠️ FALTA: Agregar grupoId y carrera a la desestructuración
    const { alumnoId, tutorId, division, grupoId, carrera } = req.query;
    
    let whereClause = {};
    let includeAlumno = {
      model: Alumno, 
      as: "alumno",
      attributes: ['id', 'Num_Control', 'Nombre', 'Primer_Ap', 'Segundo_Ap', 'Semestre', 'Carrera']
    };
    
    // Filtrar por alumno específico
    if (alumnoId) {
      whereClause.alumno_id = alumnoId;
    }
    
    // Filtrar por tutor (para rol tutor)
    if (tutorId) {
      whereClause.tutor_id = tutorId;
    }
    
    // Filtrar por división (para jefe de división)
    if (division) {
      includeAlumno.where = { Carrera: division };
    }
    
    // ⚠️ FALTA: Agregar filtro por GRUPO
    if (grupoId) {
      // Primero, necesitas importar el modelo AlumnoGrupo al inicio del archivo
      const { AlumnoGrupo } = await import('../models/index.js');
      
      // Obtener IDs de alumnos del grupo
      const alumnosGrupo = await AlumnoGrupo.findAll({
        where: { grupo_id: grupoId },
        attributes: ['alumno_id']
      });
      
      const alumnoIds = alumnosGrupo.map(ag => ag.alumno_id);
      
      if (alumnoIds.length > 0) {
        whereClause.alumno_id = alumnoIds;
      } else {
        // Si no hay alumnos en el grupo, devolver array vacío
        return res.json([]);
      }
    }
    
    // ⚠️ FALTA: Agregar filtro por CARRERA
    if (carrera && !division) { // Evitar conflicto si ya hay filtro por división
      includeAlumno.where = { Carrera: carrera };
    }
    
    const canalizaciones = await Canalizacion.findAll({
      where: whereClause,
      include: [
        includeAlumno,
        { 
          model: User, 
          as: "tutor",
          attributes: ['id', 'name']
        },
      ],
      order: [['fecha', 'DESC']]
    });
    
    res.json(canalizaciones);
  } catch (error) {
    console.error('Error al obtener canalizaciones:', error);
    res.status(500).json({ 
      message: "Error al obtener canalizaciones", 
      error: error.message 
    });
  }
};

// Calcular edad
const calcularEdad = (fechaNac) => {
  if (!fechaNac) return 'N/A';
  const hoy = new Date();
  const nacimiento = new Date(fechaNac);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return edad;
};

export const generarReporteWord = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 Generando reporte Word para canalización:', id); // Debug
    
    const canalizacion = await Canalizacion.findByPk(id, {
      include: [
        { 
          model: Alumno, 
          as: 'alumno',
          attributes: ['Num_Control', 'Nombre', 'Primer_Ap', 'Segundo_Ap', 'Semestre', 'Carrera', 'Fecha_Nac']
        },
        { 
          model: User, 
          as: 'tutor',
          attributes: ['name']
        }
      ]
    });

    if (!canalizacion) {
      return res.status(404).json({ error: 'Canalización no encontrada' });
    }

    console.log('✅ Canalización encontrada:', canalizacion.id);

    // Verificar que sea canalización psicológica
    if (canalizacion.tipo_canalizacion !== 'psicologica') {
      return res.status(400).json({ 
        error: 'Esta canalización no es de tipo psicológica. Use otro formato de reporte.' 
      });
    }

    // Cargar plantilla
    const templatePath = path.join(__dirname, '../templates/ficha_canalizacion_psicologica.docx');
    
    console.log('📁 Buscando plantilla en:', templatePath); // Debug
    
    if (!fs.existsSync(templatePath)) {
      console.error('❌ Plantilla NO encontrada en:', templatePath);
      return res.status(500).json({ 
        error: 'Plantilla no encontrada',
        details: `Por favor, coloca el archivo ficha_canalizacion_psicologica.docx en: ${path.join(__dirname, '../templates/')}`,
        path: templatePath
      });
    }

    console.log('✅ Plantilla encontrada');

    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Preparar datos para la plantilla
    const nombreCompleto = `${canalizacion.alumno.Nombre} ${canalizacion.alumno.Primer_Ap} ${canalizacion.alumno.Segundo_Ap || ''}`.trim();
    
    console.log('📝 Renderizando datos...'); // Debug
    
    doc.render({
      fecha: new Date(canalizacion.fecha).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      nombreAlumno: nombreCompleto,
      numeroControl: canalizacion.alumno.Num_Control,
      semestre: `${canalizacion.alumno.Semestre}°`,
      edad: calcularEdad(canalizacion.alumno.Fecha_Nac),
      nombreTutor: canalizacion.tutor.name,
      carrera: canalizacion.alumno.Carrera,
      problematica: canalizacion.problematica_identificada || canalizacion.motivo,
      servicioSolicitado: canalizacion.servicio_solicitado || 'No especificado',
      observaciones: canalizacion.observaciones || 'Sin observaciones adicionales'
    });

    const buf = doc.getZip().generate({ type: 'nodebuffer' });

    console.log('✅ Reporte generado exitosamente');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=Ficha_Canalizacion_Psicologica_${canalizacion.alumno.Num_Control}.docx`);
    res.send(buf);
    
  } catch (error) {
    console.error('❌ Error generando reporte Word:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Error al generar reporte', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
// Eliminar canalización
export const eliminarCanalizacion = async (req, res) => {
  try {
    const { id } = req.params;
    
    const canalizacion = await Canalizacion.findByPk(id);
    
    if (!canalizacion) {
      return res.status(404).json({ 
        message: "Canalización no encontrada" 
      });
    }
    
    await canalizacion.destroy();
    
    res.json({ 
      message: "Canalización eliminada exitosamente" 
    });
  } catch (error) {
    console.error('Error al eliminar canalización:', error);
    res.status(500).json({ 
      message: "Error al eliminar canalización", 
      error: error.message 
    });
  }
};

// Generar reporte PDF general
export const generarReportePDF = async (req, res) => {
  try {
    const canalizaciones = await Canalizacion.findAll({
      include: [
        { model: Alumno, as: "alumno" },
        { model: User, as: "tutor" }
      ],
      order: [['fecha', 'DESC']]
    });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=reporte_canalizaciones.pdf");
    doc.pipe(res);

    // Título
    doc.fontSize(18).text("Reporte de Canalizaciones", { align: "center" });
    doc.moveDown();
    doc.fontSize(10).text(`Generado: ${new Date().toLocaleDateString('es-MX')}`, { align: "center" });
    doc.moveDown(2);

    // Contenido
    canalizaciones.forEach((c, i) => {
      doc.fontSize(12).text(`${i + 1}. ${c.tipo_canalizacion.toUpperCase()}`, { underline: true });
      doc.fontSize(10);
      doc.text(`   Alumno: ${c.alumno?.Nombre || "N/A"} ${c.alumno?.Primer_Ap || ""}`);
      doc.text(`   Tutor: ${c.tutor?.name || "N/A"}`);
      doc.text(`   Área: ${c.area_destino}`);
      doc.text(`   Motivo: ${c.motivo}`);
      doc.text(`   Estado: ${c.estado}`);
      doc.text(`   Fecha: ${new Date(c.fecha).toLocaleDateString('es-MX')}`);
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({ message: "Error al generar PDF", error: error.message });
  }
};

export const generarReporteExcel = async (req, res) => {
  try {
    const canalizaciones = await Canalizacion.findAll({
      include: [
        { model: Alumno, as: "alumno" },
        { model: User, as: "tutor" }
      ],
      order: [['fecha', 'DESC']]
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Canalizaciones");

    // ⭐ AGREGAR COLUMNAS NUEVAS
    sheet.columns = [
      { header: "Tipo", key: "tipo", width: 15 },
      { header: "Tipo Atención", key: "tipo_atencion", width: 18 },  // NUEVO
      { header: "Alumno", key: "alumno", width: 30 },
      { header: "No. Control", key: "num_control", width: 15 },
      { header: "Tutor", key: "tutor", width: 25 },
      { header: "Área destino", key: "area_destino", width: 20 },
      { header: "Motivo", key: "motivo", width: 35 },
      { header: "Nota Derivación", key: "nota_derivacion", width: 40 }, // NUEVO
      { header: "Estado", key: "estado", width: 15 },
      { header: "Fecha", key: "fecha", width: 15 },
    ];

    // Estilo de encabezado
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };

    // ⭐ AGREGAR DATOS NUEVOS
    canalizaciones.forEach((c) => {
      sheet.addRow({
        tipo: c.tipo_canalizacion,
        tipo_atencion: c.tipo_atencion === 'personal' ? 'Personal' : 
                       c.tipo_atencion === 'tutor' ? 'Por Tutor' : 
                       'Por Docente',  // NUEVO
        alumno: `${c.alumno?.Nombre || ""} ${c.alumno?.Primer_Ap || ""}`,
        num_control: c.alumno?.Num_Control || "N/A",
        tutor: c.tutor?.name || "N/A",
        area_destino: c.area_destino,
        motivo: c.motivo,
        nota_derivacion: c.nota_derivacion || "Sin información", // NUEVO
        estado: c.estado,
        fecha: new Date(c.fecha).toLocaleDateString('es-MX'),
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=canalizaciones.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generando Excel:', error);
    res.status(500).json({ message: "Error al generar Excel", error: error.message });
  }
};