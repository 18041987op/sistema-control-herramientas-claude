// src/utils/notification.util.js
const Notification = require('../models/Notification');
const User = require('../models/User');
const Loan = require('../models/Loan');
const Tool = require('../models/Tool');

// Crear una notificación para un usuario específico
exports.createNotification = async (userId, title, message, options = {}) => {
  try {
    const notification = await Notification.create({
      recipient: userId,
      title,
      message,
      type: options.type || 'info',
      relatedTo: options.relatedTo || null,
      expiresAt: options.expiresAt || null
    });
    
    return { success: true, notification };
  } catch (error) {
    console.error('Error al crear notificación:', error);
    return { success: false, error };
  }
};

// Crear notificación para todos los administradores
exports.notifyAllAdmins = async (title, message, options = {}) => {
  try {
    // Encontrar todos los administradores
    const admins = await User.find({ role: 'admin' });
    
    if (!admins || admins.length === 0) {
      return { success: false, message: 'No se encontraron administradores' };
    }
    
    // Crear notificación para cada administrador
    const notifications = [];
    for (const admin of admins) {
      const notification = await Notification.create({
        recipient: admin._id,
        title,
        message,
        type: options.type || 'info',
        relatedTo: options.relatedTo || null,
        expiresAt: options.expiresAt || null
      });
      
      notifications.push(notification);
    }
    
    return { success: true, count: notifications.length };
  } catch (error) {
    console.error('Error al notificar a administradores:', error);
    return { success: false, error };
  }
};

// Crear notificación de herramienta no devuelta
exports.createOverdueNotification = async (loan) => {
  try {
    // Notificación para el técnico
    await Notification.create({
      recipient: loan.technician,
      title: 'Herramienta con devolución pendiente',
      message: `La herramienta ${loan.tool.name} (${loan.tool.serialNumber}) debe ser devuelta lo antes posible. Fue prestada el ${new Date(loan.borrowedAt).toLocaleDateString()}.`,
      type: 'warning',
      relatedTo: {
        model: 'Loan',
        id: loan._id
      }
    });
    
    // Notificación para administradores
    await this.notifyAllAdmins(
      'Herramienta no devuelta a tiempo',
      `El técnico ${loan.technician.name} no ha devuelto la herramienta ${loan.tool.name} (${loan.tool.serialNumber}). Fue prestada el ${new Date(loan.borrowedAt).toLocaleDateString()}.`,
      { 
        type: 'alert',
        relatedTo: {
          model: 'Loan',
          id: loan._id
        }
      }
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error al crear notificación de retraso:', error);
    return { success: false, error };
  }
};

// Crear notificación de daño en herramienta
exports.createDamageNotification = async (loan) => {
  // Solo notificar a administradores
  return await this.notifyAllAdmins(
    'Herramienta dañada reportada',
    `El técnico ${loan.technician.name} ha reportado un daño en la herramienta ${loan.tool.name} (${loan.tool.serialNumber}). Descripción: ${loan.returnCondition.damageDescription}`,
    { 
      type: 'alert',
      relatedTo: {
        model: 'Tool',
        id: loan.tool._id
      }
    }
  );
};

// Verificar préstamos vencidos y generar notificaciones
exports.checkOverdueLoans = async () => {
  try {
    const today = new Date();
    
    // Buscar préstamos activos con fecha de devolución vencida
    const overdueLoans = await Loan.find({
      status: 'active',
      expectedReturn: { $lt: today }
    }).populate('tool').populate('technician');
    
    if (!overdueLoans || overdueLoans.length === 0) {
      return { success: true, message: 'No hay préstamos vencidos' };
    }
    
    // Generar notificaciones para cada préstamo vencido
    let count = 0;
    for (const loan of overdueLoans) {
      // Verificar si ya existe una notificación para este préstamo
      const existingNotification = await Notification.findOne({
        'relatedTo.model': 'Loan',
        'relatedTo.id': loan._id,
        type: 'warning',
        read: false
      });
      
      // Si no existe notificación, crearla
      if (!existingNotification) {
        await this.createOverdueNotification(loan);
        count++;
      }
    }
    
    return { success: true, processed: count };
  } catch (error) {
    console.error('Error al verificar préstamos vencidos:', error);
    return { success: false, error };
  }
};

// Programar verificación diaria de préstamos vencidos
exports.scheduleOverdueCheck = () => {
  // Verificar cada día a las 8:00 AM
  const checkTime = new Date();
  checkTime.setHours(8, 0, 0, 0);
  
  let timeUntilCheck = checkTime.getTime() - Date.now();
  
  // Si ya pasó la hora de hoy, programar para mañana
  if (timeUntilCheck < 0) {
    timeUntilCheck += 24 * 60 * 60 * 1000;
  }
  
  // Programar primera verificación
  setTimeout(async () => {
    console.log('Ejecutando verificación programada de préstamos vencidos...');
    await this.checkOverdueLoans();
    
    // Programar subsecuentes verificaciones diarias
    setInterval(async () => {
      console.log('Ejecutando verificación diaria de préstamos vencidos...');
      await this.checkOverdueLoans();
    }, 24 * 60 * 60 * 1000);
  }, timeUntilCheck);
  
  console.log(`Verificación de préstamos vencidos programada. Primera ejecución en ${Math.round(timeUntilCheck / 1000 / 60)} minutos.`);
};