// src/controllers/workflowController.js
import { Canalizacion, Alumno, User } from "../models/index.js";
import { crearNotificacion } from "./notificacionController.js";

// ============================================
// FLUJO CANALIZACIÓN ACADÉMICA
// ============================================

// 1. Tutor envía canalización a Jefe de División
export const enviarAJefeDivision = async (req, res) => {
    try {
        const { id } = req.params;
        const { jefe_division_id } = req.body;

        const canalizacion = await Canalizacion.findByPk(id, {
            include: [
                { model: Alumno, as: 'alumno' },
                { model: User, as: 'tutor' }
            ]
        });

        if (!canalizacion) {
            return res.status(404).json({ message: "Canalización no encontrada" });
        }

        if (canalizacion.tipo_canalizacion !== 'academica') {
            return res.status(400).json({
                message: "Esta función es solo para canalizaciones académicas"
            });
        }

        // Actualizar canalización
        canalizacion.jefe_division_id = jefe_division_id;
        canalizacion.fecha_envio_jefe = new Date();
        canalizacion.workflow_estado = 'enviada_jefe_division';
        canalizacion.estado = 'en_revision';
        await canalizacion.save();

        // Crear notificación para el jefe de división
        await crearNotificacion(
            jefe_division_id,
            'nueva_canalizacion',
            'Nueva Canalización Académica',
            `El tutor ${canalizacion.tutor.name} ha enviado una canalización académica para el alumno ${canalizacion.alumno.Nombre} ${canalizacion.alumno.Primer_Ap}`,
            canalizacion.id,
            'alta',
            `/canalizaciones/${canalizacion.id}`
        );

        res.json({
            message: "Canalización enviada al Jefe de División",
            canalizacion
        });
    } catch (error) {
        console.error('Error al enviar a jefe de división:', error);
        res.status(500).json({
            message: "Error al enviar canalización",
            error: error.message
        });
    }
};

// 2. Jefe de División asigna a Docente Asesor
export const asignarDocenteAsesor = async (req, res) => {
    try {
        const { id } = req.params;
        const { docente_asesor_id } = req.body;

        const canalizacion = await Canalizacion.findByPk(id, {
            include: [
                { model: Alumno, as: 'alumno' },
                { model: User, as: 'tutor' },
                { model: User, as: 'jefe_division' }
            ]
        });

        if (!canalizacion) {
            return res.status(404).json({ message: "Canalización no encontrada" });
        }

        // Actualizar canalización
        canalizacion.docente_asesor_id = docente_asesor_id;
        canalizacion.fecha_asignacion_docente = new Date();
        canalizacion.workflow_estado = 'asignada_docente';
        await canalizacion.save();

        // Notificar al docente asesor
        await crearNotificacion(
            docente_asesor_id,
            'canalizacion_asignada',
            'Asesoría Académica Asignada',
            `Se te ha asignado una asesoría académica para el alumno ${canalizacion.alumno.Nombre} ${canalizacion.alumno.Primer_Ap}`,
            canalizacion.id,
            'alta',
            `/canalizaciones/${canalizacion.id}`
        );

        // Notificar al tutor
        await crearNotificacion(
            canalizacion.tutor_id,
            'canalizacion_asignada',
            'Docente Asignado',
            `Se ha asignado un docente asesor para la canalización del alumno ${canalizacion.alumno.Nombre} ${canalizacion.alumno.Primer_Ap}`,
            canalizacion.id,
            'media',
            `/canalizaciones/${canalizacion.id}`
        );

        res.json({
            message: "Docente asesor asignado exitosamente",
            canalizacion
        });
    } catch (error) {
        console.error('Error al asignar docente:', error);
        res.status(500).json({
            message: "Error al asignar docente",
            error: error.message
        });
    }
};

// 3. Docente genera contrarreferencia (académica)
export const generarContrarreferenciaAcademica = async (req, res) => {
    try {
        const { id } = req.params;
        const { contrarreferencia, generada_por } = req.body;

        const canalizacion = await Canalizacion.findByPk(id, {
            include: [
                { model: Alumno, as: 'alumno' },
                { model: User, as: 'tutor' },
                { model: User, as: 'jefe_division' }
            ]
        });

        if (!canalizacion) {
            return res.status(404).json({ message: "Canalización no encontrada" });
        }

        // Actualizar canalización
        canalizacion.contrarreferencia = contrarreferencia;
        canalizacion.fecha_contrarreferencia = new Date();
        canalizacion.generada_por = generada_por;
        canalizacion.workflow_estado = 'contrarreferencia_generada';
        canalizacion.estado = 'atendida';
        await canalizacion.save();

        // Notificar al jefe de división
        if (canalizacion.jefe_division_id) {
            await crearNotificacion(
                canalizacion.jefe_division_id,
                'contrarreferencia_recibida',
                'Contrarreferencia Generada',
                `Se ha generado la contrarreferencia para el alumno ${canalizacion.alumno.Nombre} ${canalizacion.alumno.Primer_Ap}`,
                canalizacion.id,
                'alta',
                `/canalizaciones/${canalizacion.id}`
            );
        }

        // Notificar al tutor
        await crearNotificacion(
            canalizacion.tutor_id,
            'contrarreferencia_recibida',
            'Contrarreferencia Recibida',
            `Se ha generado la contrarreferencia para tu alumno ${canalizacion.alumno.Nombre} ${canalizacion.alumno.Primer_Ap}`,
            canalizacion.id,
            'alta',
            `/canalizaciones/${canalizacion.id}`
        );

        res.json({
            message: "Contrarreferencia generada exitosamente",
            canalizacion
        });
    } catch (error) {
        console.error('Error al generar contrarreferencia:', error);
        res.status(500).json({
            message: "Error al generar contrarreferencia",
            error: error.message
        });
    }
};

// ============================================
// FLUJO CANALIZACIÓN PSICOLÓGICA
// ============================================

// 1. Tutor envía canalización a Coordinación
export const enviarACoordinacion = async (req, res) => {
    try {
        const { id } = req.params;
        const { coordinacion_id } = req.body;

        const canalizacion = await Canalizacion.findByPk(id, {
            include: [
                { model: Alumno, as: 'alumno' },
                { model: User, as: 'tutor' }
            ]
        });

        if (!canalizacion) {
            return res.status(404).json({ message: "Canalización no encontrada" });
        }

        if (canalizacion.tipo_canalizacion !== 'psicologica') {
            return res.status(400).json({
                message: "Esta función es solo para canalizaciones psicológicas"
            });
        }

        // Actualizar canalización
        canalizacion.coordinacion_id = coordinacion_id;
        canalizacion.fecha_envio_coordinacion = new Date();
        canalizacion.workflow_estado = 'enviada_coordinacion';
        canalizacion.estado = 'en_revision';
        await canalizacion.save();

        // Crear notificación para coordinación
        await crearNotificacion(
            coordinacion_id,
            'nueva_canalizacion',
            'Nueva Canalización Psicológica',
            `El tutor ${canalizacion.tutor.name} ha enviado una canalización psicológica para el alumno ${canalizacion.alumno.Nombre} ${canalizacion.alumno.Primer_Ap}`,
            canalizacion.id,
            'alta',
            `/canalizaciones/${canalizacion.id}`
        );

        res.json({
            message: "Canalización enviada a Coordinación",
            canalizacion
        });
    } catch (error) {
        console.error('Error al enviar a coordinación:', error);
        res.status(500).json({
            message: "Error al enviar canalización",
            error: error.message
        });
    }
};

// 2. Coordinación inicia atención psicológica
export const iniciarAtencionPsicologica = async (req, res) => {
    try {
        const { id } = req.params;
        const { psicologo_id } = req.body;

        const canalizacion = await Canalizacion.findByPk(id, {
            include: [
                { model: Alumno, as: 'alumno' },
                { model: User, as: 'tutor' }
            ]
        });

        if (!canalizacion) {
            return res.status(404).json({ message: "Canalización no encontrada" });
        }

        // Actualizar canalización
        canalizacion.psicologo_id = psicologo_id;
        canalizacion.fecha_inicio_atencion = new Date();
        canalizacion.workflow_estado = 'en_atencion';
        await canalizacion.save();

        // Notificar al tutor
        await crearNotificacion(
            canalizacion.tutor_id,
            'canalizacion_asignada',
            'Atención Psicológica Iniciada',
            `Se ha iniciado la atención psicológica para el alumno ${canalizacion.alumno.Nombre} ${canalizacion.alumno.Primer_Ap}`,
            canalizacion.id,
            'media',
            `/canalizaciones/${canalizacion.id}`
        );

        res.json({
            message: "Atención psicológica iniciada",
            canalizacion
        });
    } catch (error) {
        console.error('Error al iniciar atención:', error);
        res.status(500).json({
            message: "Error al iniciar atención",
            error: error.message
        });
    }
};

// 3. Psicólogo genera contrarreferencia
export const generarContrareferenciaPsicologica = async (req, res) => {
    try {
        const { id } = req.params;
        const { contrarreferencia, generada_por, jefe_division_id } = req.body;

        const canalizacion = await Canalizacion.findByPk(id, {
            include: [
                { model: Alumno, as: 'alumno' },
                { model: User, as: 'tutor' }
            ]
        });

        if (!canalizacion) {
            return res.status(404).json({ message: "Canalización no encontrada" });
        }

        // Actualizar canalización
        canalizacion.contrarreferencia = contrarreferencia;
        canalizacion.fecha_contrarreferencia = new Date();
        canalizacion.generada_por = generada_por;
        canalizacion.jefe_division_id = jefe_division_id; // Para enviar copia
        canalizacion.workflow_estado = 'contrarreferencia_generada';
        canalizacion.estado = 'atendida';
        await canalizacion.save();

        // Notificar al jefe de división
        if (jefe_division_id) {
            await crearNotificacion(
                jefe_division_id,
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

        res.json({
            message: "Contrarreferencia psicológica generada exitosamente",
            canalizacion
        });
    } catch (error) {
        console.error('Error al generar contrarreferencia:', error);
        res.status(500).json({
            message: "Error al generar contrarreferencia",
            error: error.message
        });
    }
};

// ============================================
// FUNCIONES GENERALES
// ============================================

// Finalizar canalización
export const finalizarCanalizacion = async (req, res) => {
    try {
        const { id } = req.params;

        const canalizacion = await Canalizacion.findByPk(id);

        if (!canalizacion) {
            return res.status(404).json({ message: "Canalización no encontrada" });
        }

        canalizacion.workflow_estado = 'finalizada';
        canalizacion.estado = 'cerrada';
        await canalizacion.save();

        res.json({
            message: "Canalización finalizada",
            canalizacion
        });
    } catch (error) {
        console.error('Error al finalizar canalización:', error);
        res.status(500).json({
            message: "Error al finalizar canalización",
            error: error.message
        });
    }
};

// Obtener historial de workflow
export const obtenerHistorialWorkflow = async (req, res) => {
    try {
        const { id } = req.params;

        const canalizacion = await Canalizacion.findByPk(id, {
            include: [
                { model: Alumno, as: 'alumno' },
                { model: User, as: 'tutor' },
                { model: User, as: 'jefe_division' },
                { model: User, as: 'docente_asesor' },
                { model: User, as: 'coordinacion' },
                { model: User, as: 'psicologo' }
            ]
        });

        if (!canalizacion) {
            return res.status(404).json({ message: "Canalización no encontrada" });
        }

        // Construir historial basado en las fechas
        const historial = [];

        historial.push({
            paso: 1,
            accion: 'Canalización creada',
            responsable: canalizacion.tutor?.name,
            fecha: canalizacion.created_at,
            estado: 'creada'
        });

        if (canalizacion.tipo_canalizacion === 'academica') {
            if (canalizacion.fecha_envio_jefe) {
                historial.push({
                    paso: 2,
                    accion: 'Enviada a Jefe de División',
                    responsable: canalizacion.jefe_division?.name,
                    fecha: canalizacion.fecha_envio_jefe,
                    estado: 'enviada_jefe_division'
                });
            }

            if (canalizacion.fecha_asignacion_docente) {
                historial.push({
                    paso: 3,
                    accion: 'Asignada a Docente Asesor',
                    responsable: canalizacion.docente_asesor?.name,
                    fecha: canalizacion.fecha_asignacion_docente,
                    estado: 'asignada_docente'
                });
            }
        } else if (canalizacion.tipo_canalizacion === 'psicologica') {
            if (canalizacion.fecha_envio_coordinacion) {
                historial.push({
                    paso: 2,
                    accion: 'Enviada a Coordinación',
                    responsable: canalizacion.coordinacion?.name,
                    fecha: canalizacion.fecha_envio_coordinacion,
                    estado: 'enviada_coordinacion'
                });
            }

            if (canalizacion.fecha_inicio_atencion) {
                historial.push({
                    paso: 3,
                    accion: 'Atención Psicológica Iniciada',
                    responsable: canalizacion.psicologo?.name || canalizacion.coordinacion?.name,
                    fecha: canalizacion.fecha_inicio_atencion,
                    estado: 'en_atencion'
                });
            }
        }

        if (canalizacion.fecha_contrarreferencia) {
            historial.push({
                paso: historial.length + 1,
                accion: 'Contrarreferencia Generada',
                responsable: 'Sistema',
                fecha: canalizacion.fecha_contrarreferencia,
                estado: 'contrarreferencia_generada'
            });
        }

        if (canalizacion.workflow_estado === 'finalizada') {
            historial.push({
                paso: historial.length + 1,
                accion: 'Canalización Finalizada',
                responsable: 'Sistema',
                fecha: canalizacion.updated_at,
                estado: 'finalizada'
            });
        }

        res.json({
            canalizacion,
            historial
        });
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({
            message: "Error al obtener historial",
            error: error.message
        });
    }
};
