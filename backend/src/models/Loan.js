// src/models/Loan.js
const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema({
  tool: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tool',
    required: true
  },
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  borrowedAt: {
    type: Date,
    default: Date.now
  },
  expectedReturn: {
    type: Date,
    required: [true, 'Por favor ingrese la fecha estimada de devolución']
  },
  actualReturn: {
    type: Date,
    default: null  // Null hasta que se devuelva la herramienta
  },
  status: {
    type: String,
    enum: ['active', 'returned', 'overdue', 'transferred'],
    default: 'active'
  },
  purpose: {
    type: String,
    required: [true, 'Por favor ingrese el propósito del préstamo'],
    trim: true
  },
  vehicle: {
    type: String,
    trim: true
  },
  returnCondition: {
    status: {
      type: String,
      enum: ['good', 'damaged', 'incomplete', null],
      default: null  // Null hasta que se devuelva o undefined  // undefined sí es permitido
    },
    hasDamage: {
      type: Boolean,
      default: false
    },
    damageDescription: {
      type: String,
      trim: true
    },
    reportedAt: {
      type: Date
    }
  },
  transferHistory: [{
    fromTechnician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    toTechnician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    transferredAt: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  notes: {
    type: String,
    trim: true
  }
});

// Crear índices para búsquedas frecuentes
LoanSchema.index({ technician: 1, status: 1 });
LoanSchema.index({ tool: 1, status: 1 });
LoanSchema.index({ borrowedAt: -1 });  // Para ordenar por fecha descendente

module.exports = mongoose.model('Loan', LoanSchema);