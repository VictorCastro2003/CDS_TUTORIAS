// src/controllers/notificacionController.js
import { Notificacion } from "../models/index.js";

// Obtener notificaciones de un usuario
export const obtenerNotificaciones = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const { leida } = req.query;

        console.log('📬 Obteniendo notificaciones:', { usuarioId, leida });

        let whereClause = { usuario_id: usuarioId };

        if (leida !== undefined) {
            whereClause.leida = leida === 'true';
        }

        // 🔧 Consulta SIMPLIFICADA sin includes problemáticos
        const notificaciones = await Notificacion.findAll({
            where: whereClause,
            order: [['id', 'DESC']], // Usar 'id' en lugar de 'created_at'
            limit: 50,
            raw: true // Devolver objetos planos
        });

        console.log(`✅ Se encontraron ${notificaciones.length} notificaciones`);
        res.json(notificaciones);

    } catch (error) {
        console.error('❌ Error al obtener notificaciones:', error);
        res.status(500).json({
            message: "Error al obtener notificaciones",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Contar no leídas
export const contarNoLeidas = async (req, res) => {
    try {
        const { usuarioId } = req.params;

        console.log('🔢 Contando notificaciones no leídas para usuario:', usuarioId);

        const count = await Notificacion.count({
            where: {
                usuario_id: usuarioId,
                leida: false
            }
        });

        console.log(`✅ Total no leídas: ${count}`);
        res.json({ count });

    } catch (error) {
        console.error('❌ Error al contar notificaciones:', error);
        res.status(500).json({
            message: "Error al contar notificaciones",
            error: error.message
        });
    }
};

// Marcar como leída
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

        res.json({ message: "Notificación marcada como leída" });
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

        const [updated] = await Notificacion.update(
            { 
                leida: true, 
                fecha_lectura: new Date() 
            },
            { 
                where: { 
                    usuario_id: usuarioId, 
                    leida: false 
                } 
            }
        );

        res.json({ 
            message: "Todas las notificaciones marcadas como leídas",
            actualizadas: updated
        });
    } catch (error) {
        console.error('Error al marcar todas las notificaciones:', error);
        res.status(500).json({
            message: "Error al marcar notificaciones",
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

// Mantén tu función crearNotificacion
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