// src/utils/email.util.js
const nodemailer = require('nodemailer');

// Función para enviar emails
const sendEmail = async (options) => {
  // Crear un transporter (en desarrollo usamos ethereal para pruebas)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT || 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });

  // Opciones del email
  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  };

  // Enviar el email
  const info = await transporter.sendMail(mailOptions);

  console.log('Email enviado: %s', info.messageId);
};

// Notificar a técnico de herramienta pendiente de devolución
exports.sendReturnReminder = async (user, loan) => {
  try {
    const message = `
      Hola ${user.name},
      
      Este es un recordatorio de que la herramienta "${loan.tool.name}" 
      que solicitaste el ${new Date(loan.borrowedAt).toLocaleDateString()} 
      está pendiente de devolución.
      
      Por favor devuelve la herramienta lo antes posible.
      
      Gracias,
      Sistema de Control de Herramientas
    `;

    await sendEmail({
      email: user.email,
      subject: 'Recordatorio de Devolución de Herramienta',
      message,
      html: message.replace(/\n/g, '<br />')
    });

    return true;
  } catch (error) {
    console.error('Error enviando recordatorio:', error);
    return false;
  }
};

// Notificar a administrador de herramienta dañada
exports.sendDamageAlert = async (admin, loan, technician) => {
  try {
    const message = `
      Hola ${admin.name},
      
      El técnico ${technician.name} ha reportado un problema 
      con la herramienta "${loan.tool.name}" (ID: ${loan.tool._id}).
      
      Descripción del problema: ${loan.returnCondition.damageDescription}
      
      Esta herramienta ha sido marcada como dañada en el sistema.
      
      Sistema de Control de Herramientas
    `;

    await sendEmail({
      email: admin.email,
      subject: 'Alerta: Herramienta Dañada Reportada',
      message,
      html: message.replace(/\n/g, '<br />')
    });

    return true;
  } catch (error) {
    console.error('Error enviando alerta de daño:', error);
    return false;
  }
};

// Enviar reporte semanal a administradores
exports.sendWeeklyReport = async (admin, reportData) => {
  try {
    const message = `
      Hola ${admin.name},
      
      Adjunto el reporte semanal del sistema de control de herramientas.
      
      Resumen:
      - Total de préstamos esta semana: ${reportData.totalLoans}
      - Herramientas más solicitadas: ${reportData.topTools.join(', ')}
      - Herramientas dañadas: ${reportData.damagedTools.length}
      
      Para ver el reporte completo, por favor inicia sesión en el sistema.
      
      Sistema de Control de Herramientas
    `;

    await sendEmail({
      email: admin.email,
      subject: 'Reporte Semanal - Sistema de Control de Herramientas',
      message,
      html: message.replace(/\n/g, '<br />')
    });

    return true;
  } catch (error) {
    console.error('Error enviando reporte semanal:', error);
    return false;
  }
};