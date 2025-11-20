// src/controllers/contrarreferenciaController.js
import { Contrarreferencia, Canalizacion, Alumno, User } from "../models/index.js";
import { crearNotificacion } from "./notificacionController.js";
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Crear contrarreferencia (adaptado a la estructura real de BD)
export const crearContrarreferencia = async (req, res) => {
    try {
        const { canalizacion_id, generada_por, tipo, contenido, recomendaciones } = req.body;

        // Verificar que la canalización existe
        const canalizacion = await Canalizacion.findByPk(canalizacion_id, {
            include: [
                { model: Alumno, as: 'alumno' },
                { model: User, as: 'tutor' }
            ]
        });

        if (!canalizacion) {
            return res.status(404).json({ message: "Canalización no encontrada" });
        }

        // ✅ Crear con los campos correctos de la BD
        const contrarreferencia = await Contrarreferencia.create({
            canalizacion_id,
            respondida_por: generada_por,  // ✅ Cambio de nombre
            tipo_respuesta: tipo,           // ✅ Cambio de nombre
            descripcion_atencion: contenido,
            recomendaciones: recomendaciones || null,
            acciones_realizadas: null,
            fecha_atencion: new Date(),
            estado: 'completada',
            observaciones: null
        });

        // Actualizar la canalización
        canalizacion.workflow_estado = 'contrarreferencia_generada';
        canalizacion.estado = 'atendida';
        canalizacion.fecha_contrarreferencia = new Date();
        await canalizacion.save();

        console.log(`📋 Contrarreferencia ${tipo} creada para canalización ${canalizacion_id}`);

        // 🔔 FLUJO DE NOTIFICACIONES SEGÚN EL TIPO
        if (tipo === 'academica') {
            // Notificar al jefe de división
            if (canalizacion.jefe_division_id) {
                await crearNotificacion(
                    canalizacion.jefe_division_id,
                    'contrarreferencia_recibida',
                    'Contrarreferencia Académica Generada',
                    `El docente asesor ha generado la contrarreferencia para el alumno ${canalizacion.alumno.Nombre} ${canalizacion.alumno.Primer_Ap}`,
                    canalizacion.id,
                    'alta',
                    `/canalizaciones/${canalizacion.id}`
                );
            }

            // Notificar a coordinación
            const coordinadores = await User.findAll({ where: { rol: 'coordinacion' } });
            for (const coordinador of coordinadores) {
                await crearNotificacion(
                    coordinador.id,
                    'contrarreferencia_recibida',
                    'Contrarreferencia Académica - Copia',
                    `Se ha generado una contrarreferencia académica para el alumno ${canalizacion.alumno.Nombre} ${canalizacion.alumno.Primer_Ap}`,
                    canalizacion.id,
                    'media',
                    `/canalizaciones/${canalizacion.id}`
                );
            }

            // Notificar al tutor
            await crearNotificacion(
                canalizacion.tutor_id,
                'contrarreferencia_recibida',
                'Contrarreferencia Académica Recibida',
                `Se ha generado la contrarreferencia académica para tu alumno ${canalizacion.alumno.Nombre} ${canalizacion.alumno.Primer_Ap}`,
                canalizacion.id,
                'alta',
                `/canalizaciones/${canalizacion.id}`
            );

        } else if (tipo === 'psicologica') {
            // Notificar al jefe de división
            const jefeDivision = await User.findOne({
                where: {
                    rol: 'jefeDivision',
                    division: canalizacion.alumno.Carrera
                }
            });

            if (jefeDivision) {
                await crearNotificacion(
                    jefeDivision.id,
                    'contrarreferencia_recibida',
                    'Contrarreferencia Psicológica',
                    `Se ha generado una contrarreferencia psicológica para el alumno ${canalizacion.alumno.Nombre} ${canalizacion.alumno.Primer_Ap}`,
                    canalizacion.id,
                    'alta',
                    `/canalizaciones/${canalizacion.id}`
                );
            }

            // Notificar al tutor
            await crearNotificacion(
                canalizacion.tutor_id,
                'contrarreferencia_recibida',
                'Contrarreferencia Psicológica Recibida',
                `Se ha generado la contrarreferencia psicológica para tu alumno ${canalizacion.alumno.Nombre} ${canalizacion.alumno.Primer_Ap}`,
                canalizacion.id,
                'alta',
                `/canalizaciones/${canalizacion.id}`
            );
        }

        res.status(201).json({
            message: "Contrarreferencia creada y enviada exitosamente",
            contrarreferencia
        });
    } catch (error) {
        console.error('Error al crear contrarreferencia:', error);
        res.status(500).json({
            message: "Error al crear contrarreferencia",
            error: error.message
        });
    }
};

// ✅ Obtener contrarreferencias de una canalización
export const obtenerContrarreferencias = async (req, res) => {
    try {
        const { canalizacionId } = req.params;

        const contrarreferencias = await Contrarreferencia.findAll({
            where: { canalizacion_id: canalizacionId },
            include: [
                {
                    model: User,
                    as: 'generador',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: Canalizacion,
                    as: 'canalizacion',
                    include: [
                        {
                            model: Alumno,
                            as: 'alumno',
                            attributes: ['id', 'Num_Control', 'Nombre', 'Primer_Ap', 'Segundo_Ap']
                        }
                    ]
                }
            ],
            order: [['fecha_atencion', 'DESC']]
        });

        res.json(contrarreferencias);
    } catch (error) {
        console.error('Error al obtener contrarreferencias:', error);
        res.status(500).json({
            message: "Error al obtener contrarreferencias",
            error: error.message
        });
    }
};

// ✅ Marcar contrarreferencia como enviada (FUNCIÓN AGREGADA)
export const marcarComoEnviada = async (req, res) => {
    try {
        const { id } = req.params;
        const { destinatario } = req.body;

        const contrarreferencia = await Contrarreferencia.findByPk(id);

        if (!contrarreferencia) {
            return res.status(404).json({ message: "Contrarreferencia no encontrada" });
        }

        // Nota: Esta tabla no tiene campos de envío, solo actualizar estado
        contrarreferencia.estado = 'completada';
        if (contrarreferencia.observaciones) {
            contrarreferencia.observaciones += `\nEnviada a ${destinatario} el ${new Date().toISOString()}`;
        } else {
            contrarreferencia.observaciones = `Enviada a ${destinatario} el ${new Date().toISOString()}`;
        }

        await contrarreferencia.save();

        res.json({
            message: "Contrarreferencia marcada como enviada",
            contrarreferencia
        });
    } catch (error) {
        console.error('Error al marcar contrarreferencia:', error);
        res.status(500).json({
            message: "Error al marcar contrarreferencia",
            error: error.message
        });
    }
};

// ✅ Obtener todas las contrarreferencias (con filtros)
export const obtenerTodasContrarreferencias = async (req, res) => {
    try {
        const { tipo, generada_por, estado } = req.query;

        let whereClause = {};

        if (tipo) whereClause.tipo_respuesta = tipo;
        if (generada_por) whereClause.respondida_por = generada_por;
        if (estado) whereClause.estado = estado;

        const contrarreferencias = await Contrarreferencia.findAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'generador',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: Canalizacion,
                    as: 'canalizacion',
                    include: [
                        {
                            model: Alumno,
                            as: 'alumno',
                            attributes: ['id', 'Num_Control', 'Nombre', 'Primer_Ap', 'Segundo_Ap', 'Carrera']
                        },
                        {
                            model: User,
                            as: 'tutor',
                            attributes: ['id', 'name']
                        }
                    ]
                }
            ],
            order: [['fecha_atencion', 'DESC']]
        });

        res.json(contrarreferencias);
    } catch (error) {
        console.error('Error al obtener contrarreferencias:', error);
        res.status(500).json({
            message: "Error al obtener contrarreferencias",
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

// ✅ Generar documento Word (adaptado)
export const generarDocumentoContrarreferencia = async (req, res) => {
    try {
        const { id } = req.params;

        console.log('📄 Generando documento de contrarreferencia:', id);

        const contrarreferencia = await Contrarreferencia.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'generador',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: Canalizacion,
                    as: 'canalizacion',
                    include: [
                        {
                            model: Alumno,
                            as: 'alumno',
                            attributes: ['id', 'Num_Control', 'Nombre', 'Primer_Ap', 'Segundo_Ap', 'Carrera', 'Semestre', 'Fecha_Nac']
                        },
                        {
                            model: User,
                            as: 'tutor',
                            attributes: ['id', 'name']
                        }
                    ]
                }
            ]
        });

        if (!contrarreferencia) {
            return res.status(404).json({ error: 'Contrarreferencia no encontrada' });
        }

        console.log('✅ Contrarreferencia encontrada:', contrarreferencia.id);

        const templateName = contrarreferencia.tipo_respuesta === 'academica'
            ? 'contrarreferencia_academica.docx'
            : 'contrarreferencia_psicologica.docx';

        const templatePath = path.join(__dirname, '../templates', templateName);

        console.log('📁 Buscando plantilla en:', templatePath);

        if (!fs.existsSync(templatePath)) {
            console.error('❌ Plantilla NO encontrada en:', templatePath);
            return res.status(500).json({
                error: 'Plantilla no encontrada',
                details: `Por favor, coloca el archivo ${templateName} en: ${path.join(__dirname, '../templates/')}`
            });
        }

        console.log('✅ Plantilla encontrada');

        const content = fs.readFileSync(templatePath, 'binary');
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        const alumno = contrarreferencia.canalizacion.alumno;
        const nombreCompleto = `${alumno.Nombre} ${alumno.Primer_Ap} ${alumno.Segundo_Ap || ''}`.trim();

        console.log('📝 Renderizando datos...');

        doc.render({
            nombreAlumno: nombreCompleto,
            numeroControl: alumno.Num_Control,
            carrera: alumno.Carrera,
            semestre: `${alumno.Semestre}°`,
            edad: calcularEdad(alumno.Fecha_Nac),
            fecha: new Date(contrarreferencia.fecha_atencion).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }),
            tipoContrarreferencia: contrarreferencia.tipo_respuesta === 'academica' ? 'Académica' : 'Psicológica',
            contenido: contrarreferencia.descripcion_atencion,
            accionesRealizadas: contrarreferencia.acciones_realizadas || 'N/A',
            recomendaciones: contrarreferencia.recomendaciones || 'Sin recomendaciones adicionales',
            observaciones: contrarreferencia.observaciones || 'Sin observaciones',
            nombreGenerador: contrarreferencia.generador.name,
            nombreTutor: contrarreferencia.canalizacion.tutor.name,
        });

        const buf = doc.getZip().generate({ type: 'nodebuffer' });

        console.log('✅ Documento generado exitosamente');

        const tipoTexto = contrarreferencia.tipo_respuesta === 'academica' ? 'Academica' : 'Psicologica';
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename=Contrarreferencia_${tipoTexto}_${alumno.Num_Control}.docx`);
        res.send(buf);

    } catch (error) {
        console.error('❌ Error generando documento:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({
            error: 'Error al generar documento',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};