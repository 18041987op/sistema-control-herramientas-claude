// src/controllers/users.controller.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generar token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Registrar un nuevo usuario
// @route   POST /api/users/register
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Verificar si el usuario ya existe
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya existe'
      });
    }

    // Crear usuario
    const user = await User.create({
      name,
      email,
      password,
      role
    });

    if (user) {
      res.status(201).json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token: generateToken(user._id)
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: error.message
    });
  }
};

// @desc    Autenticar usuario y generar token
// @route   POST /api/users/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verificar que se ingresen email y password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor ingrese email y contraseña'
      });
    }

    // Buscar usuario por email e incluir la contraseña
    const user = await User.findOne({ email }).select('+password');

    // Verificar si existe el usuario
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar si la contraseña coincide
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Si todo es correcto, enviar token
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message
    });
  }
};

// @desc    Obtener perfil de usuario actual
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.status(200).json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      error: error.message
    });
  }
};

// @desc    Obtener todos los usuarios (solo admin)
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message
    });
  }
};

// @desc    Obtener todos los técnicos
// @route   GET /api/users/technicians
// @access  Private
exports.getTechnicians = async (req, res) => {
  try {
    const technicians = await User.find({ role: 'technician' })
      .select('_id name email');
    
    res.status(200).json({
      success: true,
      count: technicians.length,
      data: technicians
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener lista de técnicos',
      error: error.message
    });
  }
};