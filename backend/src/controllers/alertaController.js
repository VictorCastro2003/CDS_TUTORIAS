import { Alerta, Alumno, User } from '../models/index.js';

export const obtenerAlertasAlumno = async (req, res) => {
  try {
    const { alumnoId } = req.params;
    
    const alertas = await Alerta.findAll({
      where: { alumno_id: alumnoId },
      include: [
        {
          model: User,
          as: 'generador',
          attributes: ['id', 'name']
        }
      ],
      order: [['fecha_alerta', 'DESC']]
    });

    res.json(alertas);
  } catch (error) {
    console.error('Error al obtener alertas:', error);
    res.status(500).json({ error: 'Error al obtener alertas' });
  }
};

export const crearAlerta = async (req, res) => {
  try {
    const alerta = await Alerta.create(req.body);
    res.status(201).json(alerta);
  } catch (error) {
    console.error('Error al crear alerta:', error);
    res.status(500).json({ error: 'Error al crear alerta' });
  }
};

export const actualizarEstadoAlerta = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    
    const alerta = await Alerta.findByPk(id);
    if (!alerta) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }
    
    alerta.estado = estado;
    await alerta.save();
    
    res.json(alerta);
  } catch (error) {
    console.error('Error al actualizar alerta:', error);
    res.status(500).json({ error: 'Error al actualizar alerta' });
  }
};