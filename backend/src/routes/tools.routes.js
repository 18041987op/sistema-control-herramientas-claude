// src/routes/tools.routes.js
const express = require('express');
const router = express.Router();
const {
  getTools,
  getTool,
  createTool,
  updateTool,
  deleteTool,
  updateToolStatus
} = require('../controllers/tools.controller');

const { protect, authorize } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(protect);

// Ruta para obtener todas las herramientas y crear una nueva
router
  .route('/')
  .get(getTools)
  .post(authorize('admin'), createTool);

// Ruta para actualizar solo el estado de una herramienta
router.patch('/:id/status', authorize('admin'), updateToolStatus);

// Rutas para una herramienta específica
router
  .route('/:id')
  .get(getTool)
  .put(authorize('admin'), updateTool)
  .delete(authorize('admin'), deleteTool);

module.exports = router;