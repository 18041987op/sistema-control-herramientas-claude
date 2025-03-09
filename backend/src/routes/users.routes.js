// src/routes/users.routes.js
const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  getUsers,
  getTechnicians 
} = require('../controllers/users.controller');

const { protect, authorize } = require('../middleware/auth.middleware');

// Rutas públicas
router.post('/register', registerUser);
router.post('/login', loginUser);

// Rutas protegidas
router.get('/profile', protect, getUserProfile);
router.get('/technicians', protect, getTechnicians);

// Rutas para administradores
router.get('/', protect, authorize('admin'), getUsers);

module.exports = router;