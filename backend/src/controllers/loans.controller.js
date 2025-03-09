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


// exports.createLoan = async (req, res) => {
//   try {
//     // Verificar si se proporcionó el ID de la herramienta
//     if (!req.body.tool) {
//       return res.status(400).json({
//         success: false,
//         message: 'Se requiere el ID de la herramienta'
//       });
//     }

//     // Verificar si se proporcionó el propósito
//     if (!req.body.purpose) {
//       return res.status(400).json({
//         success: false,
//         message: 'Se requiere especificar el propósito del préstamo'
//       });
//     }

//     // Verificar que la fecha esperada de devolución es válida
//     if (!req.body.expectedReturn) {
//       // Si no se proporciona, establecer a 3 días en el futuro por defecto
//       const threeVaysFromNow = new Date();
//       threeVaysFromNow.setDate(threeVaysFromNow.getDate() + 3);
//       req.body.expectedReturn = threeVaysFromNow;
//     }

//     // Verificar si la herramienta existe
//     const tool = await Tool.findById(req.body.tool);
    
//     if (!tool) {
//       return res.status(404).json({
//         success: false,
//         message: 'Herramienta no encontrada'
//       });
//     }
    
//     // Verificar que la herramienta esté disponible
//     if (tool.status !== 'available') {
//       return res.status(400).json({
//         success: false,
//         message: `La herramienta no está disponible, estado actual: ${tool.status}`
//       });
//     }
    
//     // Agregar técnico al préstamo
//     req.body.technician = req.user._id;
    
//     console.log('Datos del préstamo a crear:', req.body);

//     // Crear el préstamo
//     const loan = await Loan.create(req.body);
    
//     // Actualizar estado de la herramienta a 'borrowed'
//     await Tool.findByIdAndUpdate(req.body.tool, { status: 'borrowed' });
    
//     // Cargar los detalles completos del préstamo para la respuesta
//     const populatedLoan = await Loan.findById(loan._id)
//       .populate({
//         path: 'tool',
//         select: 'name category serialNumber'
//       })
//       .populate({
//         path: 'technician',
//         select: 'name email'
//       });
    
//     res.status(201).json({
//       success: true,
//       data: populatedLoan
//     });
//   } catch (error) {
//     console.error('Error al crear préstamo:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error al crear préstamo',
//       error: error.message
//     });
//   }
// };

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
    let loan = await Loan.findById(req.params.id);
    
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
    
    // Obtener el ID del técnico destino (ahora viene en el cuerpo de la solicitud)
    const { targetTechnician, purpose, vehicle, expectedReturn, notes } = req.body;
    
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
    
    // Guardar referencia al técnico anterior
    const previousTechnician = loan.technician;
    
    // Actualizar registro de transferencia
    loan.transferHistory.push({
      fromTechnician: previousTechnician,
      toTechnician: targetTechnician,
      transferredAt: Date.now(),
      notes: notes || 'Transferencia entre técnicos'
    });
    
    // Actualizar el técnico asignado
    loan.technician = targetTechnician;
    
    // Actualizar propósito y vehículo si se proporcionan
    if (purpose) loan.purpose = purpose;
    if (vehicle) loan.vehicle = vehicle;
    
    // Actualizar fecha de devolución esperada si se proporciona
    if (expectedReturn) {
      loan.expectedReturn = expectedReturn;
    } else {
      // Si no se especifica, establecer por defecto a 3 días desde ahora
      loan.expectedReturn = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    }
    
    // Guardar los cambios
    await loan.save();
    
    // Obtener detalles completos para la respuesta
    const updatedLoan = await Loan.findById(loan._id)
      .populate({
        path: 'tool',
        select: 'name category serialNumber'
      })
      .populate({
        path: 'technician',
        select: 'name email'
      })
      .populate({
        path: 'transferHistory.fromTechnician',
        select: 'name email'
      })
      .populate({
        path: 'transferHistory.toTechnician',
        select: 'name email'
      });
    
    // Buscar información del técnico destino para la notificación
    const User = require('../models/User');
    const targetUser = await User.findById(targetTechnician);
    
    // Crear notificación para el técnico anterior
    const notificationService = require('../utils/notification.util');
    await notificationService.createNotification(
      previousTechnician,
      'Herramienta transferida',
      `La herramienta "${updatedLoan.tool.name}" ha sido transferida a ${targetUser.name}.`,
      {
        type: 'info',
        relatedTo: {
          model: 'Loan',
          id: loan._id
        }
      }
    );
    
    // Crear notificación para el técnico destino
    await notificationService.createNotification(
      targetTechnician,
      'Herramienta recibida',
      `Se te ha transferido la herramienta "${updatedLoan.tool.name}".`,
      {
        type: 'info',
        relatedTo: {
          model: 'Loan',
          id: loan._id
        }
      }
    );
    
    res.status(200).json({
      success: true,
      message: 'Herramienta transferida exitosamente',
      data: updatedLoan
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