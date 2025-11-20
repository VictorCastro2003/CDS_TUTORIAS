// src/controllers/notificacionController.js
import { Notificacion, User, Canalizacion, Alumno } from "../models/index.js";

// Crear notificación
export const crearNotificacion = async (usuarioId, tipo, titulo, mensaje, canalizacionId = null, prioridad = 'media', url = null) => {
    try {
        const notificacion = await Notificacion.create({
            usuario_id: usuarioId,
            canalizacion_id: canalizacionId,
            tipo,
            titulo,
            mensaje,
            prioridad,
            url
        });
        return notificacion;
    } catch (error) {
        console.error('Error al crear notificación:', error);
        throw error;
    }
};

// Obtener notificaciones de un usuario
export const obtenerNotificaciones = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const { leida } = req.query;

        let whereClause = { usuario_id: usuarioId };

        if (leida !== undefined) {
            whereClause.leida = leida === 'true';
        }

        const notificaciones = await Notificacion.findAll({
            where: whereClause,
            include: [
                {
                    model: Canalizacion,
                    as: 'canalizacion',
                    include: [
                        {
                            model: Alumno,
                            as: 'alumno',
                            attributes: ['id', 'Nombre', 'Primer_Ap', 'Num_Control']
                        }
                    ]
                }
            ],
            order: [['created_at', 'DESC']],
            limit: 50
        });

        res.json(notificaciones);
    } catch (error) {
        console.error('Error al obtener notificaciones:', error);
        res.status(500).json({
            message: "Error al obtener notificaciones",
            error: error.message
        });
    }
};

// Marcar notificación como leída
export const marcarComoLeida = async (req, res) => {
    try {
        const { id } = req.params;

        const notificacion = await Notificacion.findByPk(id);

        if (!notificacion) {
            return res.status(404).json({ message: "Notificación no encontrada" });
        }

        notificacion.leida = true;
        notificacion.fecha_lectura = new Date();
        await notificacion.save();

        res.json({ message: "Notificación marcada como leída", notificacion });
    } catch (error) {
        console.error('Error al marcar notificación:', error);
        res.status(500).json({
            message: "Error al marcar notificación",
            error: error.message
        });
    }
};

// Marcar todas como leídas
export const marcarTodasComoLeidas = async (req, res) => {
    try {
        const { usuarioId } = req.params;

        await Notificacion.update(
            { leida: true, fecha_lectura: new Date() },
            { where: { usuario_id: usuarioId, leida: false } }
        );

        res.json({ message: "Todas las notificaciones marcadas como leídas" });
    } catch (error) {
        console.error('Error al marcar todas las notificaciones:', error);
        res.status(500).json({
            message: "Error al marcar notificaciones",
            error: error.message
        });
    }
};

// Obtener contador de notificaciones no leídas
export const contarNoLeidas = async (req, res) => {
    try {
        const { usuarioId } = req.params;

        const count = await Notificacion.count({
            where: {
                usuario_id: usuarioId,
                leida: false
            }
        });

        res.json({ count });
    } catch (error) {
        console.error('Error al contar notificaciones:', error);
        res.status(500).json({
            message: "Error al contar notificaciones",
            error: error.message
        });
    }
};

// Eliminar notificación
export const eliminarNotificacion = async (req, res) => {
    try {
        const { id } = req.params;

        const notificacion = await Notificacion.findByPk(id);

        if (!notificacion) {
            return res.status(404).json({ message: "Notificación no encontrada" });
        }

        await notificacion.destroy();

        res.json({ message: "Notificación eliminada" });
    } catch (error) {
        console.error('Error al eliminar notificación:', error);
        res.status(500).json({
            message: "Error al eliminar notificación",
            error: error.message
        });
    }
};
