// src/models/Notification.js
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Por favor ingrese un título para la notificación'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Por favor ingrese un mensaje'],
    trim: true
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'alert', 'success'],
    default: 'info'
  },
  read: {
    type: Boolean,
    default: false
  },
  relatedTo: {
    model: {
      type: String,
      enum: ['Tool', 'Loan', 'User'],
      required: false
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: false
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: false
  }
});

// Crear índices para las consultas frecuentes
NotificationSchema.index({ recipient: 1, read: 1 });
NotificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);