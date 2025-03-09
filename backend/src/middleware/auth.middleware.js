// src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware para proteger rutas
exports.protect = async (req, res, next) => {
  let token;

  try {
    // Verificar si existe el token en los headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Obtener token del header
      token = req.headers.authorization.split(' ')[1];
    }

    // Verificar si el token existe
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No está autorizado para acceder a esta ruta'
      });
    }

    // Imprimir token para depuración (opcional)
    console.log('Token recibido:', token);

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decodificado:', decoded);

    // Buscar usuario por el ID que está en el token
    const user = await User.findById(decoded.id);
    
    // Verificar que el usuario exista
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado con este token'
      });
    }

    // Agregar el usuario a la solicitud
    req.user = user;
    console.log('Usuario autenticado:', { id: user._id, name: user.name, role: user.role });

    next();
  } catch (err) {
    console.error('Error en middleware de autenticación:', err);
    return res.status(401).json({
      success: false,
      message: 'No está autorizado para acceder a esta ruta',
      error: err.message
    });
  }
};

// Middleware para verificar roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `El rol ${req.user.role} no está autorizado para acceder a esta ruta`
      });
    }
    next();
  };
};