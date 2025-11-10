import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import errorHandler from './middlewares/errorHandler.js';
import routes from './routes/index.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ✅ UNA SOLA LÍNEA PARA TODAS LAS RUTAS
app.use('/api', routes);

// Ruta de prueba de salud (fuera de /api)
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend funcionando' });
});


// Error handler (debe ir al final)
app.use(errorHandler);

export default app;