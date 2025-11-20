// src/models/notificacion.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Notificacion = sequelize.define('Notificacion', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    usuario_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: 'ID del usuario que recibe la notificación'
    },
    canalizacion_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID de la canalización relacionada'
    },
    tipo: {
        type: DataTypes.ENUM(
            'nueva_canalizacion',
            'canalizacion_asignada',
            'contrarreferencia_recibida',
            'canalizacion_finalizada',
            'recordatorio'
        ),
        allowNull: false,
        comment: 'Tipo de notificación'
    },
    titulo: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Título de la notificación'
    },
    mensaje: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Mensaje de la notificación'
    },
    leida: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Si la notificación ha sido leída'
    },
    fecha_lectura: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Fecha en que se leyó la notificación'
    },
    prioridad: {
        type: DataTypes.ENUM('baja', 'media', 'alta'),
        defaultValue: 'media',
        comment: 'Prioridad de la notificación'
    },
    url: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'URL a la que redirige la notificación'
    }
}, {
    tableName: 'notificaciones',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default Notificacion;
