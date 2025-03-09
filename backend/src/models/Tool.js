// src/models/Tool.js
const mongoose = require('mongoose');

const ToolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor ingrese el nombre de la herramienta'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Por favor seleccione una categoría'],
    enum: [
      'diagnostico', 
      'electricidad', 
      'mecanica', 
      'aire_acondicionado', 
      'neumaticos', 
      'otros'
    ]
  },
  serialNumber: {
    type: String,
    required: [true, 'Por favor ingrese un número de serie'],
    unique: true,
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Por favor ingrese la ubicación en el taller'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['available', 'borrowed', 'maintenance', 'damaged'],
    default: 'available'
  },
  imageUrl: {
    type: String,
    default: 'no-photo.jpg'
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastMaintenance: {
    type: Date
  },
  nextMaintenance: {
    type: Date
  }
});

// Índice para búsquedas más rápidas por nombre y categoría
ToolSchema.index({ name: 'text', category: 'text' });

module.exports = mongoose.model('Tool', ToolSchema);