// src/controllers/tools.controller.js
const Tool = require('../models/Tool');
// // Cuando se consulta la lista de herramientas
// query = Tool.find(JSON.parse(queryStr));

// @desc    Obtener todas las herramientas
// @route   GET /api/tools
// @access  Private
exports.getTools = async (req, res) => {
  try {
    // Construir el query
    let query;
    
    // Copiar req.query
    const reqQuery = { ...req.query };
    
    // Campos que se excluyen al filtrar
    const removeFields = ['select', 'sort', 'page', 'limit'];
    
    // Eliminar campos excluidos de reqQuery
    removeFields.forEach(param => delete reqQuery[param]);
    
    // Crear string de consulta
    let queryStr = JSON.stringify(reqQuery);
    
    // Crear operadores de consulta ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    
    // Encontrar herramientas que coinciden con el query
    query = Tool.find(JSON.parse(queryStr));
    
    // Seleccionar campos específicos
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }
    
    // Ordenar
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }
    
    // Paginación
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Tool.countDocuments(JSON.parse(queryStr));
    
    query = query.skip(startIndex).limit(limit);
    
    // Ejecutar consulta
    const tools = await query;
    
    // Objeto de paginación
    const pagination = {};
    
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    // Obtener información sobre quién tiene prestada cada herramienta
    const Loan = require('../models/Loan');

    const toolsWithLoanInfo = await Promise.all(tools.map(async (tool) => {
      if (tool.status === 'borrowed') {
        const activeLoan = await Loan.findOne({ 
          tool: tool._id, 
          status: 'active' 
        }).populate({
          path: 'technician',
          select: 'name email'
        });
        
        // Convertir a objeto para poder añadir propiedades
        const toolObj = tool.toObject();
        if (activeLoan) {
          toolObj.currentLoan = {
            id: activeLoan._id,
            technician: activeLoan.technician
          };
        }
        return toolObj;
      }
      return tool;
    }));

    // Reemplazar tools por toolsWithLoanInfo en la respuesta
    return res.status(200).json({
      success: true,
      count: toolsWithLoanInfo.length,
      pagination,
      data: toolsWithLoanInfo
    });
    
    // res.status(200).json({
    //   success: true,
    //   count: tools.length,
    //   pagination,
    //   data: tools
    // });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener herramientas',
      error: error.message
    });
  }
};

// @desc    Obtener una herramienta específica
// @route   GET /api/tools/:id
// @access  Private
exports.getTool = async (req, res) => {
  try {
    const tool = await Tool.findById(req.params.id);
    
    if (!tool) {
      return res.status(404).json({
        success: false,
        message: 'Herramienta no encontrada'
      });
    }
    
    res.status(200).json({
      success: true,
      data: tool
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener la herramienta',
      error: error.message
    });
  }
};

// @desc    Crear una nueva herramienta
// @route   POST /api/tools
// @access  Private/Admin
exports.createTool = async (req, res) => {
  try {
    // Agregar el usuario que crea la herramienta
    req.body.addedBy = req.user._id;
    
    const tool = await Tool.create(req.body);
    
    res.status(201).json({
      success: true,
      data: tool
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al crear herramienta',
      error: error.message
    });
  }
};

// @desc    Actualizar una herramienta
// @route   PUT /api/tools/:id
// @access  Private/Admin
exports.updateTool = async (req, res) => {
  try {
    let tool = await Tool.findById(req.params.id);
    
    if (!tool) {
      return res.status(404).json({
        success: false,
        message: 'Herramienta no encontrada'
      });
    }
    
    tool = await Tool.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: tool
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar herramienta',
      error: error.message
    });
  }
};

// @desc    Eliminar una herramienta
// @route   DELETE /api/tools/:id
// @access  Private/Admin
exports.deleteTool = async (req, res) => {
  try {
    const tool = await Tool.findById(req.params.id);
    
    if (!tool) {
      return res.status(404).json({
        success: false,
        message: 'Herramienta no encontrada'
      });
    }
    
    await tool.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar herramienta',
      error: error.message
    });
  }
};

// @desc    Actualizar solo el estado de una herramienta
// @route   PATCH /api/tools/:id/status
// @access  Private/Admin
exports.updateToolStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere especificar el nuevo estado'
      });
    }
    
    // Validar que el estado sea uno de los valores permitidos
    const validStates = ['available', 'borrowed', 'maintenance', 'damaged'];
    if (!validStates.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Estado no válido. Debe ser uno de: ${validStates.join(', ')}`
      });
    }
    
    // Buscar la herramienta
    let tool = await Tool.findById(req.params.id);
    
    if (!tool) {
      return res.status(404).json({
        success: false,
        message: 'Herramienta no encontrada'
      });
    }
    
    // Si la herramienta está prestada y se intenta cambiar a disponible,
    // verificar si hay préstamos activos
    if (tool.status === 'borrowed' && status === 'available') {
      const Loan = require('../models/Loan');
      const activeLoan = await Loan.findOne({ 
        tool: tool._id, 
        status: 'active' 
      });
      
      if (activeLoan) {
        return res.status(400).json({
          success: false,
          message: 'No se puede cambiar el estado a disponible porque la herramienta está prestada actualmente'
        });
      }
    }
    
    // Actualizar el estado
    tool.status = status;
    
    // Si se marca como disponible después de mantenimiento, actualizar lastMaintenance
    if (status === 'available' && (tool.status === 'maintenance' || tool.status === 'damaged')) {
      tool.lastMaintenance = Date.now();
    }
    
    await tool.save();
    
    res.status(200).json({
      success: true,
      data: tool
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado de la herramienta',
      error: error.message
    });
  }
};