// src/controllers/notifications.controller.js
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Obtener notificaciones para el usuario actual
// @route   GET /api/notifications
// @access  Private
exports.getMyNotifications = async (req, res) => {
  try {
    // Filtrar por usuario actual y ordenar por más recientes primero
    const notifications = await Notification.find({ 
      recipient: req.user._id 
    }).sort('-createdAt');
    
    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener notificaciones',
      error: error.message
    });
  }
};

// @desc    Obtener cantidad de notificaciones no leídas
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      recipient: req.user._id,
      read: false
    });
    
    res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener conteo de notificaciones',
      error: error.message
    });
  }
};

// @desc    Marcar notificación como leída
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    let notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }
    
    // Verificar que la notificación pertenece al usuario
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para acceder a esta notificación'
      });
    }
    
    notification.read = true;
    await notification.save();
    
    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al marcar notificación como leída',
      error: error.message
    });
  }
};

// @desc    Marcar todas las notificaciones como leídas
// @route   PUT /api/notifications/mark-all-read
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al marcar todas las notificaciones como leídas',
      error: error.message
    });
  }
};

// @desc    Eliminar una notificación
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }
    
    // Verificar que la notificación pertenece al usuario
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para eliminar esta notificación'
      });
    }
    
    await notification.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar notificación',
      error: error.message
    });
  }
};

// @desc    Eliminar todas las notificaciones leídas
// @route   DELETE /api/notifications/read
// @access  Private
exports.deleteAllRead = async (req, res) => {
  try {
    await Notification.deleteMany({ 
      recipient: req.user._id,
      read: true
    });
    
    res.status(200).json({
      success: true,
      message: 'Todas las notificaciones leídas han sido eliminadas'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar notificaciones',
      error: error.message
    });
  }
};