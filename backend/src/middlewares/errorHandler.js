// src/middlewares/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ 
    message: err.message || 'Server error', 
    details: err.details || null 
  });
};

export default errorHandler;