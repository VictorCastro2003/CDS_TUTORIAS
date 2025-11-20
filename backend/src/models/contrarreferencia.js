// src/models/contrarreferencia.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Contrarreferencia = sequelize.define('Contrarreferencia', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    canalizacion_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID de la canalización asociada'
    },
    respondida_por: {  // ✅ Cambio: era 'generada_por'
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: 'ID del usuario que respondió la contrarreferencia'
    },
    tipo_respuesta: {  // ✅ Cambio: era 'tipo'
        type: DataTypes.ENUM('academica', 'psicologica'),
        allowNull: false,
        comment: 'Tipo de contrarreferencia'
    },
    descripcion_atencion: {  // ✅ Nuevo campo
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Descripción de la atención brindada'
    },
    acciones_realizadas: {  // ✅ Nuevo campo
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Acciones específicas realizadas con el estudiante'
    },
    recomendaciones: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Recomendaciones para el tutor o seguimiento'
    },
    fecha_atencion: {  // ✅ Nuevo campo
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'Fecha en que se atendió al estudiante'
    },
    estado: {  // ✅ Cambio en valores ENUM
        type: DataTypes.ENUM('pendiente', 'completada'),
        defaultValue: 'completada',
        comment: 'Estado de la contrarreferencia'
    },
    observaciones: {  // ✅ Nuevo campo
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Observaciones adicionales'
    }
}, {
    tableName: 'contrarreferencias',
    timestamps: false  // ✅ La tabla no tiene created_at/updated_at
});

export default Contrarreferencia;