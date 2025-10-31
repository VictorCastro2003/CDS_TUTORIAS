// src/models/ReporteCanalizacion.js
module.exports = (sequelize, DataTypes) => {
  const ReporteCanalizacion = sequelize.define('ReporteCanalizacion', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    canalizacion_id: { type: DataTypes.INTEGER, allowNull: false },
    tipo_atencion: { type: DataTypes.STRING(100), allowNull: false },
    nota_derivacion: { type: DataTypes.STRING(255), allowNull: true },
    observaciones: { type: DataTypes.TEXT, allowNull: true },
  }, {
    tableName: 'reporte_canalizaciones',
    timestamps: false,
  });

  ReporteCanalizacion.associate = (models) => {
    ReporteCanalizacion.belongsTo(models.Canalizacion, {
      foreignKey: 'canalizacion_id',
      as: 'canalizacion',
    });
  };

  return ReporteCanalizacion;
};
