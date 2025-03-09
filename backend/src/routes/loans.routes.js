// src/routes/loans.routes.js
const express = require('express');
const router = express.Router();
const {
  getLoans,
  getLoan,
  createLoan,
  returnTool,
  getMyTools,
  updateLoan,
  transferTool
} = require('../controllers/loans.controller');

const { protect, authorize } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(protect);

// Ruta para ver las herramientas del usuario actual
router.get('/my-tools', getMyTools);

// Rutas para todos los préstamos
router
  .route('/')
  .get(getLoans)
  .post(createLoan);

// Rutas para un préstamo específico
router
  .route('/:id')
  .get(getLoan)
  .put(authorize('admin'), updateLoan);

// Ruta para devolver una herramienta
router.put('/:id/return', returnTool);

// Ruta para transferir una herramienta a otro técnico
// Importante: No tiene el middleware authorize('admin')
router.put('/:id/transfer', transferTool);

module.exports = router;