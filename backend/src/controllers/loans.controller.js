// src/controllers/loans.controller.js
const Loan = require('../models/Loan');
const Tool = require('../models/Tool');

// @desc    Obtener todos los préstamos
// @route   GET /api/loans
// @access  Private
exports.getLoans = async (req, res) => {
  try {
    // Filtrar préstamos por técnico si el usuario no es admin
    let query = {};
    
    if (req.user.role !== 'admin') {
      query.technician = req.user._id;
    }
    
    // Agregar filtros adicionales desde req.query
    const { status, tool } = req.query;
    
    if (status) {
      query.status = status;
    }
    
    if (tool) {
      query.tool = tool;
    }
    
    // Ejecutar consulta con población de relaciones
    const loans = await Loan.find(query)
      .populate({
        path: 'tool',
        select: 'name category serialNumber'
      })
      .populate({
        path: 'technician',
        select: 'name email'
      })
      .sort('-borrowedAt');
    
    res.status(200).json({
      success: true,
      count: loans.length,
      data: loans
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener préstamos',
      error: error.message
    });
  }
};

// @desc    Obtener un préstamo específico
// @route   GET /api/loans/:id
// @access  Private
exports.getLoan = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate({
        path: 'tool',
        select: 'name category serialNumber imageUrl location'
      })
      .populate({
        path: 'technician',
        select: 'name email'
      });
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Préstamo no encontrado'
      });
    }
    
    // Verificar que el usuario sea admin o el técnico que pidió la herramienta
    if (req.user.role !== 'admin' && loan.technician._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para ver este préstamo'
      });
    }
    
    res.status(200).json({
      success: true,
      data: loan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener el préstamo',
      error: error.message
    });
  }
};

// @desc    Crear un nuevo préstamo
// @route   POST /api/loans
// @access  Private
exports.createLoan = async (req, res) => {
  try {
    // Verificar si se proporcionó el ID de la herramienta
    if (!req.body.tool) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere el ID de la herramienta'
      });
    }

    // Verificar si se proporcionó el propósito
    if (!req.body.purpose) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere especificar el propósito del préstamo'
      });
    }

    // Verificar si la herramienta existe
    const tool = await Tool.findById(req.body.tool);
    
    if (!tool) {
      return res.status(404).json({
        success: false,
        message: 'Herramienta no encontrada'
      });
    }
    
    // Verificar que la herramienta esté disponible
    if (tool.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: `La herramienta no está disponible, estado actual: ${tool.status}`
      });
    }
    
    // Preparar datos del préstamo (sin returnCondition)
    const loanData = {
      tool: req.body.tool,
      technician: req.user._id,
      purpose: req.body.purpose,
      vehicle: req.body.vehicle || '',
      expectedReturn: req.body.expectedReturn || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    };
    
    console.log('Datos del préstamo a crear:', loanData);

    // Crear el préstamo
    const loan = await Loan.create(loanData);
    
    // Actualizar estado de la herramienta a 'borrowed'
    await Tool.findByIdAndUpdate(req.body.tool, { status: 'borrowed' });
    
    // Cargar los detalles completos del préstamo para la respuesta
    const populatedLoan = await Loan.findById(loan._id)
      .populate({
        path: 'tool',
        select: 'name category serialNumber'
      })
      .populate({
        path: 'technician',
        select: 'name email'
      });
    
    res.status(201).json({
      success: true,
      data: populatedLoan
    });
  } catch (error) {
    console.error('Error al crear préstamo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear préstamo',
      error: error.message
    });
  }
};

// @desc    Devolver una herramienta
// @route   PUT /api/loans/:id/return
// @access  Private
exports.returnTool = async (req, res) => {
  try {
    let loan = await Loan.findById(req.params.id);
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Préstamo no encontrado'
      });
    }
    
    // Verificar que el usuario sea admin o el técnico que pidió la herramienta
    if (req.user.role !== 'admin' && loan.technician.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para devolver esta herramienta'
      });
    }
    
    // Verificar que el préstamo esté activo
    if (loan.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Esta herramienta ya ha sido devuelta'
      });
    }
    
    // Actualizar préstamo
    loan.actualReturn = Date.now();
    loan.status = 'returned';
    
    // Si hay información de la condición en la devolución
    if (req.body.returnCondition) {
      loan.returnCondition = {
        ...req.body.returnCondition,
        reportedAt: Date.now()
      };
    }
    
    await loan.save();
    
    // Actualizar estado de la herramienta
    let newToolStatus = 'available';
    
    // Si la herramienta está dañada, cambiar estado y notificar
    if (loan.returnCondition && 
        (loan.returnCondition.status === 'damaged' || loan.returnCondition.hasDamage)) {
      newToolStatus = 'damaged';
      
      // Cargar información completa para la notificación
      const fullLoan = await Loan.findById(loan._id)
        .populate('tool')
        .populate('technician');
      
      // Importar servicio de notificaciones
      const notificationService = require('../utils/notification.util');
      
      // Crear notificación para administradores
      await notificationService.createDamageNotification(fullLoan);
    }
    
    await Tool.findByIdAndUpdate(loan.tool, { status: newToolStatus });
    
    res.status(200).json({
      success: true,
      data: loan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al devolver la herramienta',
      error: error.message
    });
  }
};

// @desc    Obtener herramientas prestadas al usuario actual
// @route   GET /api/loans/my-tools
// @access  Private
exports.getMyTools = async (req, res) => {
  try {
    const loans = await Loan.find({
      technician: req.user._id,
      status: 'active'
    }).populate({
      path: 'tool',
      select: 'name category imageUrl serialNumber location'
    });
    
    res.status(200).json({
      success: true,
      count: loans.length,
      data: loans
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener herramientas del usuario',
      error: error.message
    });
  }
};

// @desc    Actualizar un préstamo (para administradores)
// @route   PUT /api/loans/:id
// @access  Private/Admin
exports.updateLoan = async (req, res) => {
  try {
    let loan = await Loan.findById(req.params.id);
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Préstamo no encontrado'
      });
    }
    
    loan = await Loan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: loan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar préstamo',
      error: error.message
    });
  }
};

// @desc    Transferir una herramienta a otro técnico
// @route   PUT /api/loans/:id/transfer
// @access  Private
exports.transferTool = async (req, res) => {
  try {
    // Encontrar el préstamo activo para esta herramienta
    const loanId = req.params.id;
    let loan = await Loan.findById(loanId);
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Préstamo no encontrado'
      });
    }
    
    // Verificar que el préstamo esté activo
    if (loan.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Esta herramienta no está en préstamo activo'
      });
    }
    
    // Obtener datos del cuerpo de la petición
    const { targetTechnician, purpose, vehicle, expectedReturn, notes } = req.body;
    
    // Validaciones
    if (!targetTechnician) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere especificar el técnico destino'
      });
    }
    
    if (!purpose) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere especificar el propósito del préstamo'
      });
    }
    
    // Verificar que el técnico destino sea diferente al técnico actual
    if (loan.technician.toString() === targetTechnician) {
      return res.status(400).json({
        success: false,
        message: 'No puedes transferir una herramienta al mismo técnico que la tiene actualmente'
      });
    }
    
    // Guardar el técnico anterior (que tenía la herramienta)
    const previousTechnician = loan.technician;
    
    // 1. Actualizar estado del préstamo actual a 'transferred'
    loan.status = 'transferred';
    loan.actualReturn = Date.now();
    loan.transferHistory.push({
      fromTechnician: previousTechnician,
      toTechnician: targetTechnician,
      transferredAt: Date.now(),
      initiatedBy: req.user._id,
      notes: notes || 'Transferencia entre técnicos'
    });
    
    await loan.save();
    
    // 2. Crear un nuevo préstamo para el técnico destino
    const newLoan = await Loan.create({
      tool: loan.tool,
      technician: targetTechnician,
      borrowedAt: Date.now(),
      expectedReturn: expectedReturn || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      purpose: purpose,
      vehicle: vehicle || '',
      status: 'active',
      notes: `Transferido desde préstamo ${loan._id}. Solicitado por: ${req.user.name}`
    });
    
    // Obtener información detallada para notificaciones y respuesta
    const User = require('../models/User');
    const previousUser = await User.findById(previousTechnician);
    const targetUser = await User.findById(targetTechnician);
    const requestingUser = await User.findById(req.user._id);
    
    // Obtener detalles de la herramienta
    const toolDetails = await Tool.findById(loan.tool).select('name serialNumber');
    
    // Crear notificaciones
    const notificationService = require('../utils/notification.util');
    
    // 1. Notificar al técnico que tenía la herramienta
    if (previousTechnician.toString() !== req.user._id.toString()) {
      await notificationService.createNotification(
        previousTechnician,
        'Herramienta transferida',
        `Tu herramienta "${toolDetails.name}" ha sido transferida a ${targetUser.name}. Transferencia solicitada por ${requestingUser.name}.`,
        {
          type: 'info',
          relatedTo: {
            model: 'Loan',
            id: newLoan._id
          }
        }
      );
    }
    
    // 2. Notificar al técnico que recibe la herramienta (si no es quien solicitó la transferencia)
    if (targetTechnician.toString() !== req.user._id.toString()) {
      await notificationService.createNotification(
        targetTechnician,
        'Herramienta asignada',
        `Se te ha asignado la herramienta "${toolDetails.name}" que estaba en posesión de ${previousUser.name}. Transferencia solicitada por ${requestingUser.name}.`,
        {
          type: 'info',
          relatedTo: {
            model: 'Loan',
            id: newLoan._id
          }
        }
      );
    }
    
    // 3. Notificar a administradores
    await notificationService.notifyAllAdmins(
      'Transferencia de herramienta',
      `La herramienta "${toolDetails.name}" (${toolDetails.serialNumber}) ha sido transferida de ${previousUser.name} a ${targetUser.name}. Transferencia solicitada por ${requestingUser.name}.`,
      {
        type: 'info',
        relatedTo: {
          model: 'Loan',
          id: newLoan._id
        }
      }
    );
    
    // Obtener los detalles completos del nuevo préstamo para la respuesta
    const populatedNewLoan = await Loan.findById(newLoan._id)
      .populate({
        path: 'tool',
        select: 'name category serialNumber'
      })
      .populate({
        path: 'technician',
        select: 'name email'
      });
    
    res.status(200).json({
      success: true,
      message: 'Herramienta transferida exitosamente',
      data: populatedNewLoan
    });
  } catch (error) {
    console.error('Error en transferTool:', error);
    res.status(500).json({
      success: false,
      message: 'Error al transferir la herramienta',
      error: error.message
    });
  }
};