import express from 'express';
import * as canalizacionController from '../controllers/canalizacionController.js';

const router = express.Router();

router.post('/', canalizacionController.crearCanalizacion);
router.get('/', canalizacionController.obtenerCanalizaciones);
router.get('/report/pdf', canalizacionController.generarReportePDF);
router.get('/report/excel', canalizacionController.generarReporteExcel);
router.get('/:id/report/word', canalizacionController.generarReporteWord);
// En canalizacionesRoutes.js
router.delete('/:id', canalizacionController.eliminarCanalizacion);

// En canalizacionController.js
export const eliminarCanalizacion = async (req, res) => {
  try {
    const { id } = req.params;
    const canalizacion = await Canalizacion.findByPk(id);
    
    if (!canalizacion) {
      return res.status(404).json({ message: "Canalización no encontrada" });
    }
    
    await canalizacion.destroy();
    res.json({ message: "Canalización eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar", error: error.message });
  }
};
export default router;