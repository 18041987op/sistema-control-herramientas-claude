// src/routes/notifications.routes.js
const express = require('express');
const router = express.Router();
const {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead
} = require('../controllers/notifications.controller');

const { protect } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(protect);

// Ruta para obtener notificaciones y conteo de no leídas
router.get('/', getMyNotifications);
router.get('/unread-count', getUnreadCount);

// Rutas para marcar como leídas
router.put('/:id/read', markAsRead);
router.put('/mark-all-read', markAllAsRead);

// Rutas para eliminar notificaciones
router.delete('/:id', deleteNotification);
router.delete('/read', deleteAllRead);

module.exports = router;